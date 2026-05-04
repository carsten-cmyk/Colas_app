# Formand — Web Frontend

React + Vite web-applikation til formænd på asfaltprojekter.

## Formål

Formanden koordinerer biler og tons på pladsen. Denne app erstatter manuelle
telefon- og papir-processer med én samlet oversigt over planlægning, eksekvering og evaluering.

Brugere: Ole Jensen (formand), Henrik Thor (projektleder), Lars-Henrik Andersen (distriktschef).

## Start

```bash
npm install
cp .env.example .env.local   # Udfyld Supabase-nøgler
npm run dev                   # port 5174
npm run storybook             # port 6007
```

## Scripts

```bash
npm run dev           # Dev-server
npm run build         # Produktionsbuild
npm run storybook     # Komponent-dokumentation
npm run test          # Kør alle tests
npm run test:watch    # Tests i watch-mode
npm run test:coverage # Coverage-rapport
npm run lint          # ESLint (0 warnings)
npm run typecheck     # TypeScript
npm run format        # Prettier
```

## Mappestruktur

```
src/
├── components/
│   ├── ui/           # Atomare komponenter — knapper, kort, badges
│   └── layout/       # TopBar, BottomTabBar
├── pages/            # En fil per route
├── hooks/            # Data-hooks — returnerer { data, loading, error }
├── mocks/            # Mock-data med TODO-kommentarer
├── types/            # TypeScript interfaces
├── utils/            # Pure utility functions
├── test/             # setup.ts
└── prototypes/       # UX-eksperimenter — importeres aldrig i produktion
```

## Design system

Tokens: `tailwind.config.ts` — frosne, ingen ændringer uden godkendelse.
Reference: `../../.claude/docs/core/DESIGN_SYSTEM.md`

## Screens (sprint 1)

- `/` → Dagsoversigt (ikke bygget endnu)
- `/ordre/:id` → Ordre-detalje med Planlægning / Udførsel / Evaluering (prototype klar)

Se `../../Docs/Formand/PRD.md` for fuld spec.

## Datamodel

Se `../../Docs/Formand/ARCHITECTURE.md`.
Typer: `src/types/` + `../../shared/types/`

## Mock → Supabase

Al data er mock indtil videre. Alle mock-punkter er markeret:
```ts
// TODO: Erstat med Supabase når klar
```

Supabase-swap sker ved at opdatere hooks i `src/hooks/` — ingen komponent-ændringer.
