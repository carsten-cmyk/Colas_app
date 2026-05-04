# Bidragsguide — Colas Transport Apps

## Kom i gang

```bash
git clone <repo>
cd Colas
npm install
cd apps/formand && npm install
cd ../chauffeur && npm install
cp apps/formand/.env.example apps/formand/.env.local
```

## Branching

```
main        — produktion, altid stabil
develop     — integration branch
feat/[navn] — nye features
fix/[navn]  — bugfixes
```

Opret altid branch fra `develop`:
```bash
git checkout develop
git pull
git checkout -b feat/driver-card
```

## Commit-format

```
feat(formand): add DriverCard component
fix(chauffeur): correct touch target on ActionButton
test(formand): add useOrders hook tests
refactor: extract shared utility to shared/utils
docs: update PROJECT_STATUS
chore: upgrade vitest to 4.x
```

Format: `type(scope): beskrivelse` — scope er app-navn eller tomt ved monorepo-ændringer.

## Workflow per komponent

1. Læs spec fra `Docs/[App]/[Komponent]_SPEC.md`
2. Byg — brug `/new-component` til scaffold
3. Review — `/review [fil]`
4. Cleanup — `/cleanup [fil]` hvis nødvendigt
5. Test — `/test [fil]`
6. Kør quality gates (se nedenfor)
7. PR mod `develop`

Se `.claude/WORKFLOW.md` for fuld detaljer.

## Quality gates — kør inden PR

```bash
npm run formand:typecheck   # Ingen TypeScript-fejl
npm run formand:lint        # 0 ESLint warnings
npm run formand:test        # Alle tests grønne
```

CI kører automatisk de samme checks ved PR.

## PR-regler

- Brug PR-template (`.github/pull_request_template.md`)
- Alle punkter i checklisten skal være afkrydset
- Mindst én godkendelse inden merge
- CI skal være grøn

## Design system

Tokens er **frosne**. Ingen nye farver eller spacing uden eksplicit aftale.

- Web: `apps/formand/tailwind.config.ts`
- Mobil: `apps/chauffeur/src/config/theme.js`
- Reference: `.claude/docs/core/DESIGN_SYSTEM.md`

## Prototype vs. produktion

Prototyper lever i `src/prototypes/` og må **aldrig** importeres i produktionskode.
Brug `/upgrade-prototype` når en prototype er klar til at blive rigtig kode.

## Spørgsmål

Kontakt tech lead eller se `.claude/docs/` for arkitektur og beslutninger.
