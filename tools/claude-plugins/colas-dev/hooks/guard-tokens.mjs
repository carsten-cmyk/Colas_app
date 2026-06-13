// Kræver bekræftelse før edits af FROSNE design-tokens.
// CLAUDE.md: "Design system — UFRAVIGELIG. Tokens er frosne." + memory
// feedback_design_tokens_no_deviation. Hård blokering er for stift (man skal
// nogle gange tilføje en token), så vi tvinger en bevidst bekræftelse via "ask".
import { readFileSync } from 'node:fs';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const fp = input?.tool_input?.file_path ?? input?.tool_input?.filePath ?? '';

const tokenFiles = [
  /tailwind\.config\.(ts|js|cjs|mjs)$/,
  /apps\/chauffeur\/src\/styles\/tokens\.ts$/,
  /\/core\/DESIGN_SYSTEM\.md$/
];

if (fp && tokenFiles.some((re) => re.test(fp))) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        `Design-tokens er FROSNE (CLAUDE.md). Du er ved at ændre ${fp}. ` +
        'Bekræft KUN hvis du bevidst tilføjer/justerer en token — ellers afbryd og brug en eksisterende token.'
    }
  }));
}
process.exit(0);
