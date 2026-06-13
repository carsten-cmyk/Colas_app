// Kører lint før en git commit (DSVT Epic 2: "run npm run lint before agent commits").
//
// Standard: ADVARENDE (non-blocking) — passer til prototype/mock-fasen, hvor lint
// ikke altid er grøn. Surfacer fejl til agenten uden at stoppe commit.
// Sæt env COLAS_LINT_BLOCKING=1 for at gøre den BLOKERENDE (anbefalet når I går i
// produktion og CI-gaten skal betyde noget).
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const cmd = input?.tool_input?.command ?? '';
const cwd = input?.cwd || process.cwd();

if (!/\bgit\s+commit\b/.test(cmd)) process.exit(0);

// Find et lint-script — afbryd pænt hvis intet findes (gør hook'en portabel).
let hasLint = false;
try {
  const pkg = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8'));
  hasLint = Boolean(pkg.scripts && (pkg.scripts['lint:all'] || pkg.scripts.lint));
} catch { process.exit(0); }
if (!hasLint) process.exit(0);

const lintCmd = (() => {
  try {
    const pkg = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8'));
    return pkg.scripts['lint:all'] ? 'npm run lint:all' : 'npm run lint';
  } catch { return 'npm run lint'; }
})();

const blocking = process.env.COLAS_LINT_BLOCKING === '1';

try {
  execSync(lintCmd, { cwd, stdio: 'pipe' });
  process.exit(0);
} catch (e) {
  const out = ((e.stdout?.toString() || '') + (e.stderr?.toString() || '')).slice(-1500);
  const reason = `Lint (${lintCmd}) fejlede før commit:\n${out}`;
  if (blocking) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason + '\nRet lint-fejlene før commit (COLAS_LINT_BLOCKING=1 er sat).'
      }
    }));
    process.exit(0);
  }
  // Non-blocking: advar via stderr, lad commit fortsætte.
  console.error('[colas-dev] ADVARSEL — ' + reason);
  process.exit(0);
}
