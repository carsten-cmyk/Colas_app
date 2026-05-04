# Colas Transport Apps

Monorepo for Colas Danmark A/S transport applikationer.
Koordinerer formænd, vognmænd, chauffører og fabrikker på asfaltprojekter.

## Arkitektur

```
┌─────────────────────────────────────────────────────┐
│                   Supabase (fælles DB)               │
└────────┬──────────┬──────────┬──────────┬───────────┘
         │          │          │          │
    Formand     Vognmand    Fabrik     Chauffør
    React/Vite  React/Vite  React/Vite  Expo/RN
    Netlify     Netlify     Netlify     App Store
```

| App | Platform | Bruger | Status |
|---|---|---|---|
| `apps/chauffeur` | iOS + Android (Expo) | Chauffør | Aktiv udvikling |
| `apps/formand` | Web (React + Vite) | Formand | Sprint 1 |
| `apps/vognmand` | Web (React + Vite) | Vognmand | Planlagt |
| `apps/fabrik` | Web (React + Vite) | Fabrik | Planlagt |
| `apps/kunde` | Web (React + Vite) | Kunde | Planlagt |

Delte typer: `shared/types/` — single source of truth for alle apps.

## Kom i gang

### Krav

- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`) — kun til chauffeur-appen

### Installation

```bash
git clone <repo>
cd Colas
npm install
cd apps/formand && npm install
cd ../chauffeur && npm install
```

### Miljøvariabler

```bash
cp apps/formand/.env.example apps/formand/.env.local
# Udfyld Supabase-nøgler
```

### Start

```bash
# Formand (web) — port 5174
npm run formand:dev

# Formand Storybook — port 6007
npm run formand:storybook

# Chauffør (mobil)
npm run chauffeur:start
```

## Udvikling

Se `.claude/WORKFLOW.md` for komplet guide til:
- Session start efter /clear
- Prototype vs. produktionskode
- Kommando-workflow: /review → /cleanup → /test
- Terminal-scripts

### Quality gates — kør inden commit

```bash
npm run formand:typecheck   # TypeScript
npm run formand:lint        # ESLint (0 warnings)
npm run formand:test        # Vitest
```

CI kører automatisk ved PR — se `.github/workflows/ci.yml`.

## Mappestruktur

```
Colas/
├── apps/
│   ├── chauffeur/          # Expo/React Native
│   │   └── src/
│   │       ├── components/ # ui/, layout/, screens/, messages/
│   │       ├── hooks/      # Data-hooks
│   │       ├── mocks/      # Mock-data (→ Supabase)
│   │       ├── types/      # App-specifikke typer
│   │       └── prototypes/ # UX-eksperimenter — aldrig i produktion
│   └── formand/            # React + Vite
│       └── src/
│           ├── components/ # ui/, layout/
│           ├── pages/      # En fil per route
│           ├── hooks/      # Data-hooks
│           ├── mocks/      # Mock-data (→ Supabase)
│           ├── types/      # App-specifikke typer
│           └── prototypes/ # UX-eksperimenter — aldrig i produktion
├── shared/
│   └── types/              # Fælles typer på tværs af alle apps
├── Docs/
│   ├── Formand/            # PRD, CONTEXT, REVIEW_SPEC, SCREENS, ARCHITECTURE
│   └── Chauffør/           # PRD, REVIEW_SPEC, STRUCTURE, SPEC-filer
└── .claude/
    ├── commands/           # Slash-kommandoer til Claude Code
    ├── docs/               # Design system, offline-strategi, projekt-status
    ├── WORKFLOW.md         # Udviklingsworkflow
    └── STARTUP.md          # Session-start prompt
```

## Design system

Alle apps deler ét design system:
- **Web:** `apps/formand/tailwind.config.ts`
- **Mobil:** `apps/chauffeur/src/config/theme.js`
- **Reference:** `.claude/docs/core/DESIGN_SYSTEM.md`

Tokens er **frosne** — ingen nye farver eller spacing uden eksplicit godkendelse.

## Tech stack

| Teknologi | Formål |
|---|---|
| React 18 + TypeScript | Web frontends |
| Vite 5 | Build tool (web) |
| Tailwind CSS 3 | Styling (web) |
| Expo / React Native | Mobil app |
| Vitest + Testing Library | Unit + integration tests |
| Storybook 8 | Komponent-dokumentation |
| ESLint + jsx-a11y | Linting inkl. WCAG |
| Prettier | Formatering |
| Supabase | Database + auth + realtime |
| Netlify | Web deployment |

## Bidrag

Se `CONTRIBUTING.md` for PR-workflow og kodestandarder.
