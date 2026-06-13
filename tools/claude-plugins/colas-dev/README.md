# colas-dev

Claude Code-plugin der **håndhæver** de ufravigelige regler fra `CLAUDE.md` mekanisk — i stedet for at stole på at modellen husker dem hver gang.

## Hvad det indeholder

Fire `PreToolUse`-hooks:

| Hook | Trigger | Effekt |
|---|---|---|
| `guard-pkill` | `Bash` med bredt `pkill`/`killall` mod vite/node/expo | **Blokerer** — beskytter den kørende dev-server |
| `block-build-artefacts` | `Edit`/`Write` af `dist/`, `build/`, `node_modules/`, `ios/build`, `android/build`, lockfiles m.fl. | **Blokerer** — genererede filer redigeres ved kilden |
| `guard-tokens` | `Edit`/`Write` af `tailwind.config.ts`, `tokens.ts`, `DESIGN_SYSTEM.md` | **Beder om bekræftelse** — tokens er frosne |
| `lint-before-commit` | `Bash` med `git commit` | Kører `npm run lint:all` — **advarer** (sæt `COLAS_LINT_BLOCKING=1` for at blokere) |

## Installation (for nye teammedlemmer)

Fra et hvilket som helst sted:

```bash
# 1. Tilføj marketplace (engangs) — lokal sti nu, git-repo senere
claude plugin marketplace add /Users/<dig>/Documents/Colas/tools/claude-plugins

# 2. Installér plugin
claude plugin install colas-dev@ootb-claude-plugins
```

Eller interaktivt i en session: `/plugin marketplace add ...` → `/plugin install colas-dev@ootb-claude-plugins`.

## Genbrug på andre klientprojekter

Mekanismen er klient-agnostisk. For at løfte den til fx et DSVT-projekt:

1. Push `tools/claude-plugins/` til sit eget git-repo (fx `ootb/claude-plugins`).
2. Tilføj en ny plugin-mappe (`dsvt-dev/`) ved siden af `colas-dev/` med klient-specifikke hooks.
3. Registrér den i `.claude-plugin/marketplace.json`.
4. Teammedlemmer: `claude plugin marketplace add ootb/claude-plugins`.

De generiske hooks (`guard-pkill`, `block-build-artefacts`, `lint-before-commit`) virker uændret; kun `guard-tokens`-stierne skal tilpasses pr. klient.

## Sentry (senere — når I går i produktion)

Sentry-MCP giver ikke mening før der er en deployet build der indsamler fejl. Når I går live, tilføj til repoets `.mcp.json`:

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server@latest"],
      "env": { "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}" }
    }
  }
}
```

Det er fundamentet for et evt. fremtidigt "crash → draft-PR"-agent-flow (DSVT Epic 10).

## Udvikling

Hooks er rene Node-scripts (ingen `jq`-afhængighed — alle target-repos har Node). Test en hook lokalt:

```bash
echo '{"tool_input":{"command":"pkill -f vite"}}' | node hooks/guard-pkill.mjs
```

Tom output = handlingen tillades. JSON med `permissionDecision` = blokering/bekræftelse.
