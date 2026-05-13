# Claude Code Instructions — Colas Transport Apps

## Monorepo-struktur

```
Colas/
├── apps/
│   ├── chauffeur/       # Expo/React Native — iOS/Android app til chauffører
│   ├── chauffeur-web/   # React/Vite — web-prototype af chauffeur-app (iPhone-ramme)
│   ├── formand/         # React/Vite — web-app til formænd (LIVE)
│   ├── vognmand/        # React/Vite — web-app til vognmænd (LIVE)
│   ├── fabrik/          # React/Vite — kommende
│   └── kunde/           # React/Vite — kommende
├── shared/
│   ├── components/      # Delte UI-komponenter på tværs af web-apps
│   ├── utils/           # Delte utilities
│   └── types/           # Fælles TypeScript-typer — SINGLE SOURCE OF TRUTH
├── Docs/
│   ├── Formand/         # PRD, CONTEXT, REVIEW_SPEC, SCREENS, ARCHITECTURE, SPEC-filer
│   └── Chauffør/        # PRD, REVIEW_SPEC_1, STRUCTURE, COMPONENT_SPEC, SPEC-filer
└── .claude/
    ├── agents/          # Specialiserede sub-agenter
    ├── commands/        # Slash-kommandoer
    └── docs/            # Projektdokumentation
```

---

## Læs altid ved session start

1. `.claude/docs/PROJECT_STATUS.md` — hvad er gjort, hvad er næste
2. `Docs/Formand/CONTEXT.md` — forretningskontekst, PLAN-systemet, nøglepersoner
3. `.claude/docs/FUNCTIONAL_FLOWS.md` — cross-app komponent-flows
4. `.claude/docs/core/DESIGN_SYSTEM.md` — tokens og patterns

Tilføj ved specifik app:
- Formand/Vognmand: `Docs/Formand/PRD.md` + `Docs/Formand/REVIEW_SPEC.md`
- Chauffeur app: `Docs/Chauffør/PRD.md` + `Docs/Chauffør/REVIEW_SPEC_1.md`

---

## Slash-kommandoer

| Kommando | Agent | Hvad sker der |
|---|---|---|
| `/develop-screen [skærm] [app]` | architect | Analysér → plan → SPEC-filer → parallel build → issues |
| `/review [fil]` | reviewer | Review mod REVIEW_SPEC — read-only, issue-liste |
| `/cleanup [fil]` | cleanup-agent | Dead code + token-violations + flyt logik/mock/typer |
| `/token-check [mappe]` | cleanup-agent | Scan for token-violations — rapporter, ret ikke |
| `/test [fil]` | test-writer | Tests efter review er godkendt |
| `/git` | git-agent | Manuel commit — aldrig auto — altid på brugers initiativ |
| `/new-component [Navn] [app]` | builder | Scaffold komponent + story fra spec |
| `/new-page [Navn] [app] [route]` | builder | Scaffold side + hook + route |
| `/status` | — | Vis projekt-status |

---

## Agenter

Se `.claude/agents/` for fulde agent-definitioner.

| Agent | Model | Rolle |
|---|---|---|
| `architect` | Opus | Planlægger, nedbryder skærme, skriver SPEC-filer, opdaterer FUNCTIONAL_FLOWS |
| `builder` | Sonnet | Bygger én komponent fra SPEC — aldrig uden SPEC |
| `reviewer` | Sonnet | Read-only review — returnerer issue-liste |
| `test-writer` | Haiku | Tests efter review er godkendt |
| `cleanup-agent` | Sonnet | Token-violations + dead code + flyt logik |
| `git-agent` | Haiku | Commit på eksplicit bruger-request via /git |

**Delegation-flow:**
```
/develop-screen → architect (plan + SPECs)
                → builder × N (parallelt)
                → reviewer × N (parallelt)
                → præsenter issues
```

---

## Ufravigelige regler — ALLE apps

### Design tokens — ingen undtagelser, heller ikke i prototyper

```tsx
// ALDRIG — overalt, altid
style={{ color: '#0B3950' }}     // brug text-deep-teal
style={{ padding: 16 }}          // brug p-sm
className="bg-[#FEEE32]"         // brug bg-yellow
className="text-[14px]"          // brug text-sm
```

Web: Tailwind-klasser fra `apps/formand/tailwind.config.ts`
Mobil: StyleSheet.create() med værdier fra `apps/chauffeur/src/styles/tokens.ts`
Inline `style={}` kun ved genuint runtime-beregnede værdier (fx `width: progress * 100 + '%'`)

### Data & Mock
- Mock-data i `src/mocks/` — aldrig inline i komponenter
- `// TODO: Erstat med Supabase når klar` ved ALLE mock-punkter
- Typer i `src/types/` — aldrig lokalt i komponenter
- Data-logik i `src/hooks/` — aldrig i JSX

### Komponenter
- Props interface altid eksporteret: `[KomponentNavn]Props`
- Ingen `any` types
- JSDoc på ikke-oplagte props
- Loading og error states altid implementeret
- Touch targets minimum 44×44px

### Testing
- Kald først `/review` — kald derefter `/test`
- Kør `npm run [app]:test` + `npm run [app]:lint` + `npm run [app]:typecheck` inden commit
- Coverage-mål: 80% lines/functions, 70% branches

### Offline & Fejlhåndtering
- Alle data-hooks returnerer `{ data, loading, error }`
- `useOnlineStatus()` + `<OfflineBanner />` i alle web-apps
- Vis altid cached data ved netafbrud

### Prototyper (`src/prototypes/`)
- Tokens er **obligatoriske** — ingen hardcodede værdier selv i prototyper
- Inline typer, inline mock-data og logik i JSX er OK
- Ingen tests eller stories kræves
- Må ALDRIG importeres i produktionskode

---

## Feature-workflow

### Ny skærm eller feature
```
1. /develop-screen [skærm] [app]
   → Architect præsenterer plan
   → Du godkender (eller justerer)
   → Builders kører, reviewer kører
   → Du ser issues

2. /cleanup [fil]   ← for CRITICAL issues
3. /review [fil]    ← bekræft cleanup
4. /test [fil]      ← når review er OK

5. /git             ← når du er klar (ikke efter hver komponent)
```

### Prototype cleanup
```
1. /token-check [mappe]   ← find violations
2. /cleanup [fil]          ← ret én fil ad gangen
3. /review [fil]           ← bekræft
```

**Start aldrig at kode uden plan fra architect!**

---

## Git-flow

```
feature/[app]-[feature-navn]
         ↓ PR → Netlify preview
       main → Netlify live
```

Commit altid med korrekt prefix:
```
feat(formand): add VognmandBekraeftelseBadge
feat(chauffeur): add AnkomstFabrikScreen
fix(vognmand): token violation in DisponeringsView
test(formand): add OrderCard tests
docs: update FUNCTIONAL_FLOWS with driver assignment
```

`/git` — aldrig auto, aldrig push uden eksplicit godkendelse.

---

## Web-apps (Formand, Vognmand, Chauffeur-web, Fabrik, Kunde)

**Stack:** React 18 + TypeScript (strict) + Vite + Tailwind CSS + Storybook + Vitest
**Database:** Fælles Supabase (når klar — alt er mock nu)
**Typer:** `shared/types/` — single source of truth
**Design:** `.claude/docs/core/DESIGN_SYSTEM.md`
**Flows:** `.claude/docs/FUNCTIONAL_FLOWS.md`

```bash
npm run formand:dev          # port 5174
npm run vognmand:dev         # port 5175
npm run chauffeur-web:dev    # port 5176
npm run formand:storybook    # port 6007
npm run formand:test
npm run formand:lint
```

### Mappestruktur (per web-app)
```
src/
├── components/
│   ├── ui/            # Atomar UI — knapper, kort, badges
│   └── layout/        # TopBar, BottomTabBar, AppShell
├── pages/             # En fil per route
├── hooks/             # Data-hooks
├── mocks/             # Mock-data med TODO-kommentarer
├── types/             # TypeScript interfaces
├── utils/             # Pure utility functions
└── prototypes/        # Eksperimenter — aldrig i produktion
```

---

## Chauffeur App (Expo/React Native)

**Stack:** React Native + Expo + TypeScript
**Docs:** `Docs/Chauffør/PRD.md` + `Docs/Chauffør/REVIEW_SPEC_1.md`

- Navigation: state-based i App.js
- Styling: StyleSheet.create() + tokens fra `src/styles/tokens.ts`
- Safe areas: `useSafeAreaInsets()` — aldrig hardcodet padding
- Outdoor: min. 14px font, høj kontrast, 44×44px touch targets

### Byggede komponenter (genbyg ikke)
| Komponent | Placering |
|---|---|
| StatCard, OrderMetrics | src/components/ui/ |
| ContactCard, InfoCard, LocationCard, ActionButton | src/components/ui/ |
| BottomTabBar, TaskSheet | src/components/layout/ |
| TaskSwiper | src/components/screens/task/ |

---

## Design system — UFRAVIGELIG

Alle apps deler ét design system. Tokens er frosne.
- Web: `apps/formand/tailwind.config.ts`
- Mobil: `apps/chauffeur/src/styles/tokens.ts`
- Reference: `.claude/docs/core/DESIGN_SYSTEM.md`

Prototyper og HTML-designs er UX-reference — aldrig design-spec.
Konflikt → tokens vinder altid.
