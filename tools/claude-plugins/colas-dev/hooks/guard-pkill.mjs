// Blokerer bredt pkill/killall mod dev-servere.
// Memory: feedback_never_pkill_dev_server — bredt `pkill -f vite`/`node` dræber
// Carstens kørende dev-server ("appen går ned"). Dræb i stedet specifikt PID via
// `lsof -ti:<port>` eller `kill <pid>`.
import { readFileSync } from 'node:fs';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const cmd = input?.tool_input?.command ?? '';

const broadPkill = /\b(pkill|killall)\b[^|&;]*\b(vite|node|esbuild|expo|storybook|next)\b/i.test(cmd);
const killByPgrep = /\bkill\b[^|&;]*\$\(\s*pgrep[^)]*\b(vite|node|expo)\b/i.test(cmd);

if (broadPkill || killByPgrep) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        'Blokeret: bredt pkill/killall mod vite/node/expo dræber den kørende dev-server ("appen går ned"). ' +
        'Find i stedet det specifikke PID for porten — fx `lsof -ti:5174` — og dræb kun det med `kill <pid>`.'
    }
  }));
}
process.exit(0);
