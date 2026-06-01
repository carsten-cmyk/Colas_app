# Colas Fabrik

Web-app til fabrikkens daglige drift — modtagelse af bestillinger, produktionsplan, læsning af biler.

## Stack
React 18 + TypeScript (strict) + Vite + Tailwind + Storybook + Vitest. Samme design system som Formand, Vognmand og Chauffeur.

## Kør lokalt
```bash
# fra repo-rod
npm run fabrik:dev          # http://localhost:5177
npm run fabrik:storybook    # http://localhost:6008
npm run fabrik:test
```

## Mappestruktur
```
src/
├── components/    # ui/ + layout/
├── pages/
├── hooks/         # data-hooks med { data, loading, error }
├── mocks/         # mock-data — TODO: erstat med Supabase
├── types/
├── utils/
└── prototypes/    # eksperimenter — aldrig i produktion
```

## Regler
Tokens er frosne — se `apps/fabrik/tailwind.config.ts` og `.claude/docs/core/DESIGN_SYSTEM.md`.
Ingen hardcodede farver/spacings — heller ikke i prototyper.
