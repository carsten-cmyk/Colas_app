# Claude Code Instructions — Colas Transport Apps

## Monorepo-struktur

```
Colas/
├── apps/
│   ├── chauffeur/     # Expo/React Native — MOBIL APP (eneste native app)
│   ├── formand/       # React/Vite — web frontend for formænd
│   ├── vognmand/      # React/Vite — web frontend for vognmænd (kommer)
│   ├── fabrik/        # React/Vite — web frontend for fabrik (kommer)
│   └── kunde/         # React/Vite — web frontend for kunder (kommer)
├── shared/
│   ├── components/    # Delte UI-komponenter på tværs af web-frontends
│   ├── utils/         # Delte utilities
│   └── types/         # Fælles TypeScript-typer — SINGLE SOURCE OF TRUTH
├── Docs/
│   ├── Formand/       # PRD, CONTEXT, REVIEW_SPEC, SCREENS, ARCHITECTURE, SPEC-filer
│   └── Chauffør/      # PRD, REVIEW_SPEC_1, STRUCTURE, COMPONENT_SPEC, SPEC-filer
└── .claude/
    ├── commands/      # Custom slash-kommandoer: /review /new-component /new-page /new-hook /audit-tokens /status
    └── docs/          # Projektdokumentation
```

---

## Workflow-guide

Se `.claude/WORKFLOW.md` — komplet guide til hvad du skriver og kører i hver situation.
Se `.claude/STARTUP.md` — hvad du paster efter /clear.

---

## Læs altid ved session start

1. `.claude/docs/PROJECT_STATUS.md` ⭐⭐⭐ — hvad er gjort, hvad er næste — OPDATER ALTID
2. `Docs/Formand/CONTEXT.md` ⭐⭐⭐ — forretningskontekst, PLAN-systemet, nøglepersoner — GÆLDER ALLE APPS
3. `.claude/docs/core/DESIGN_SYSTEM.md` ⭐⭐ — Colas tokens og copy-paste patterns
4. `.claude/docs/OFFLINE_STRATEGY.md` ⭐ — offline, cache og fallback-regler
5. Relevant app's PRD: `Docs/Formand/PRD.md` eller `Docs/Chauffør/PRD.md`
6. Relevant app's REVIEW_SPEC: `Docs/Formand/REVIEW_SPEC.md` eller `Docs/Chauffør/REVIEW_SPEC_1.md`

---

## Tilgængelige slash-kommandoer

| Kommando | Brug |
|---|---|
| `/review [fil]` | Kør REVIEW_SPEC på en komponent eller side |
| `/new-component [Navn] [app]` | Scaffold komponent + story + test |
| `/new-page [Navn] [app] [route]` | Scaffold side + hook + route |
| `/new-hook [useNavn] [app]` | Scaffold data-hook + test |
| `/audit-tokens [mappe]` | Find hardcodede værdier |
| `/status` | Vis projekt-status |

---

## Ufravigelige regler — ALLE apps

### Data & Mock
- Mock-data altid i `src/mocks/` — aldrig inline i komponenter
- `// TODO: Erstat med Supabase når klar` ved ALLE mock-punkter
- Typer altid i `src/types/` — aldrig lokalt defineret i komponenter
- Data-logik altid i `src/hooks/` — aldrig i JSX

### Styling
- **Ingen hardcodede værdier** — farver, spacing, font sizes fra tokens kun
- Web: Tailwind-klasser fra `tailwind.config.ts`
- Mobil: StyleSheet.create() med værdier fra `tokens.ts`
- Inline `style={}` kun ved genuint dynamiske værdier

### Komponenter
- Props interface altid eksporteret: `[KomponentNavn]Props`
- Ingen `any` types — TypeScript strict mode
- JSDoc på ikke-oplagte props
- Loading og error states altid implementeret
- Touch targets minimum 44×44px

### Testing
- Alle komponenter i `src/components/` har `.test.tsx`
- Alle hooks i `src/hooks/` har `.test.ts`
- Kør `npm run test` inden commit
- Coverage-mål: 80% lines/functions, 70% branches

### Offline & Fejlhåndtering
- Alle data-hooks returnerer `{ data, loading, error }`
- `useOnlineStatus()` + `<OfflineBanner />` i alle web-apps
- Vis altid cached data ved netafbrud — crash aldrig
- Se `.claude/docs/OFFLINE_STRATEGY.md` for patterns

### Prototyper
- Prototyper i `src/prototypes/` — må ALDRIG importeres i produktionskode
- Lempeligere regler gælder i `src/prototypes/`

---

## Feature-workflow — ALTID følg dette

1. **Plan** — læs PRD + REVIEW_SPEC, lav todo-liste, få godkendelse
2. **Byg** — brug `/new-component` eller `/new-page` til scaffold
3. **Test** — `npm run test` + `npm run lint` + `npm run typecheck`
4. **Review** — kør `/review [fil]` på alt der er bygget
5. **Commit** — opdater PROJECT_STATUS.md, commit med korrekt prefix

**Start aldrig at kode uden plan og godkendelse!**

---

## Web frontends (Formand, Vognmand, Fabrik, Kunde)

**Stack:** React 18 + TypeScript (strict) + Vite + Tailwind CSS + Storybook + Vitest
**Database:** Fælles Supabase — alle frontends læser/skriver til samme DB
**Typer:** `shared/types/` — single source of truth, importér herfra, ikke fra `src/types/`
**Design system:** `.claude/docs/core/DESIGN_SYSTEM.md` — Colas tokens
**Docs:** `Docs/Formand/PRD.md` + `Docs/Formand/REVIEW_SPEC.md` ← AUTORITATIV SPEC
**Kontekst:** `Docs/Formand/CONTEXT.md` — Colas-forretning, PLAN-system, roller, nøglepersoner
**Arkitektur:** `Docs/Formand/ARCHITECTURE.md` — komplet datamodel og systemflow
**Screens:** `Docs/Formand/SCREENS.md` — UX/feature-reference (ikke design-spec)

### Start
```bash
npm run formand:dev        # port 5174
npm run formand:storybook  # port 6007
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
├── hooks/             # Data-hooks — useOrders, useDriverTasks osv.
├── mocks/             # Mock-data med TODO-kommentarer
├── types/             # TypeScript interfaces
├── utils/             # Pure utility functions
├── test/              # setup.ts — ingen test-filer her
└── prototypes/        # Eksperimenter — aldrig i produktion
```

### Storybook
- Alle komponenter i `src/components/` kræver en `.stories.tsx`
- CSF3 format: `satisfies Meta<typeof KomponentNavn>`
- Dækker: default, alle varianter, edge cases (tom, lang tekst, loading, error)

### WCAG 2.1 AA
- Min. 4.5:1 kontrastratio på brødtekst
- Tab-navigation — alle elementer nåbare med tastatur
- `aria-label` på alle ikoner med funktion
- `aria-live` på dynamiske statusændringer

---

## Chauffør App (Expo/React Native)

**Stack:** React Native + Expo Pro + TypeScript
**Test:** Expo Go → TestFlight → App Store
**Docs:** `Docs/Chauffør/PRD.md` + `Docs/Chauffør/REVIEW_SPEC_1.md` + `Docs/Chauffør/STRUCTURE.md`

### Regler
- Navigation: state-based i App.js (ingen Expo Router endnu — se STRUCTURE.md ved migration)
- Styling: StyleSheet.create() + tokens fra `src/styles/tokens.ts`
- Safe areas: `useSafeAreaInsets()` — aldrig hardcodet padding
- GPS: `expo-location`, Kamera: `expo-camera`
- Outdoor-display: min. 14px font, høj kontrast, 44×44px touch targets

### Byggede komponenter (genbyg ikke)
| Komponent | Placering |
|---|---|
| StatCard, OrderMetrics | src/components/ui/ |
| ContactCard, InfoCard, LocationCard, ActionButton | src/components/ui/ |
| BottomTabBar, TaskSheet | src/components/layout/ |
| TaskSwiper | src/components/screens/task/ |

---

## Commit Messages

```
feat(formand): add DriverCard component
feat(chauffeur): add LocationCard component
fix(formand): correct touch target on ActionButton
fix: offline banner not showing on iOS
test(formand): add useOrders hook tests
refactor: extract shared utility to shared/utils
docs: update PROJECT_STATUS with completed tasks
```

---

## Design system — UFRAVIGELIG BESLUTNING

Alle Colas-apps deler ét design system.
- **Web:** `apps/formand/tailwind.config.ts` — tokens er frosne
- **Mobil:** `apps/chauffeur/src/styles/tokens.ts` — tokens er frosne
- **Reference:** `.claude/docs/core/DESIGN_SYSTEM.md`

HTML-prototyper og eksterne designs er **UX/feature-reference** — aldrig design-spec.
Hvis der er konflikt → **vores tokens vinder**.
