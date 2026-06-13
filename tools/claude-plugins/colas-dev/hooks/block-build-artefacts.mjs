// Blokerer manuelle edits af genererede filer / build-artefakter.
// Disse skal ændres ved kilden, ikke i output.
import { readFileSync } from 'node:fs';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const fp = input?.tool_input?.file_path ?? input?.tool_input?.filePath ?? '';

const blocked = [
  /\/dist\//,
  /\/build\//,
  /\/node_modules\//,
  /\/\.expo\//,
  /\/\.next\//,
  /\/coverage\//,
  /\/ios\/(build|Pods)\//,
  /\/android\/(build|\.gradle|app\/build)\//,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)pnpm-lock\.yaml$/
];

if (fp && blocked.some((re) => re.test(fp))) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `Blokeret: ${fp} er et build-artefakt / genereret fil og må ikke redigeres manuelt. ` +
        'Ret kilden (komponent, config, eller package.json) i stedet — artefaktet regenereres.'
    }
  }));
}
process.exit(0);
