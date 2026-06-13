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
5. `.claude/docs/WORKFLOW_PROTOTYPE_TIL_PRODUKTION.md` — fra prototype til produktion, vertical slices, quality gates
6. `.claude/sections/` — aktive sektioner og deres lifecycle-status

Tilføj ved specifik app:
- Formand/Vognmand: `Docs/Formand/PRD.md` + `Docs/Formand/REVIEW_SPEC.md`
- Chauffeur app: `Docs/Chauffør/PRD.md` + `Docs/Chauffør/REVIEW_SPEC_1.md`

**Ved start af ny produktions-sektion** (efter prototype-godkendelse): Interviewer starter ALTID først — producerer section-manifest, opdaterer DATA_FIELDS, drafter kickoff + validation contract. Architect tager først over når contract er signed.

---

## Slash-kommandoer

| Kommando | Agent | Hvad sker der |
|---|---|---|
| `/interview [sektion] [app]` | interviewer | Komponent-scoping → datafelter → kickoff → validation contract draft |
| `/develop-screen [skærm] [app]` | architect | Analysér → plan → SPEC-filer → parallel build → issues *(kræver signed contract)* |
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
| `interviewer` | Opus | Scoper sektion, mapper datafelter, drafter kickoff + validation contract |
| `architect` | Opus | Planlægger build-rounds, skriver SPEC-filer mod signed contract, opdaterer FUNCTIONAL_FLOWS |
| `builder` | Sonnet | Bygger én komponent fra SPEC — kopierer fra prototype, skriver handoff-fil |
| `reviewer` | Sonnet | Read-only kode-review mod REVIEW_SPEC + handoff |
| `test-writer` | Haiku | Tests efter review er godkendt |
| `cleanup-agent` | Sonnet | Token-violations + dead code + flyt logik |
| `git-agent` | Haiku | Commit på eksplicit bruger-request via /git |

**Delegation-flow (vertical slice):**
```
/interview → interviewer  (manifest + DATA_FIELDS + kickoff + contract DRAFT)
           ↓ Carsten signer contract → FROZEN
/develop-screen → architect (build-rounds + SPECs mod contract)
                → Round 1: types + hooks + mocks (parallelt, gate: grøn)
                → Round 2: atomic presentere (parallelt, gate: grøn)
                → Round 3: komplekse presentere (parallelt, gate: grøn)
                → Round 4: container
                → reviewer × N (læser handoff + kode)
                → præsenter issues
```

**Vigtige regler:**
- Builder må IKKE committe uden handoff-fil i `.claude/handoffs/`
- Architect må IKKE skrive SPECs uden signed contract
- Builder kopierer fra prototype hvor muligt — rewrite kun ved bevidst afvigelse (dokumenteres i handoff)
- Container/Presenter-pattern: kun container importerer hooks. Presentere får props ind, sender callbacks ud.

**Komponent-genbrug — OBLIGATORISK FØR build:**
1. **Architect SKAL** først tjekke `.claude/docs/COMPONENT_REGISTRY.md` for kanoniske komponenter
2. **Architect SKAL** dernæst grep'e på tværs af alle apps efter samme UI-mønster:
   ```bash
   grep -rln "[pattern-keyword]" apps/*/src/ shared/components/
   ```
3. Hvis 2+ apps har samme mønster → flyt til `shared/components/` FØR ny brug tilføjes
4. Builder må IKKE bygge en ny komponent hvis en kanonisk version findes — wrap eller udvid eksisterende i stedet
5. Når ny shared komponent bygges, opdatér ALTID `COMPONENT_REGISTRY.md` i samme PR

---

## Claude Code Plugin — `colas-dev`

Repoet leverer et plugin der **håndhæver** reglerne nedenfor mekanisk via hooks (i stedet for kun at stole på modellen). Ligger i `tools/claude-plugins/`.

**Installation (engangs pr. maskine):**
```bash
claude plugin marketplace add /Users/<dig>/Documents/Colas/tools/claude-plugins
claude plugin install colas-dev@ootb-claude-plugins
```
Eller interaktivt: `/plugin marketplace add ...` → `/plugin install colas-dev@ootb-claude-plugins`.

**Hooks:**
- `guard-pkill` — blokerer bredt `pkill`/`killall` mod vite/node/expo (beskytter dev-serveren)
- `block-build-artefacts` — blokerer edits af `dist/`, `build/`, `node_modules/`, native build-output, lockfiles
- `guard-tokens` — kræver bekræftelse før edits af `tailwind.config.ts`, `tokens.ts`, `DESIGN_SYSTEM.md` (frosne)
- `lint-before-commit` — kører `npm run lint:all` ved `git commit` (advarer; `COLAS_LINT_BLOCKING=1` for at blokere)

Detaljer + genbrug på andre klientprojekter: `tools/claude-plugins/colas-dev/README.md`.

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

### Responsive Design — web-apps

Audit 2026-06-10 fandt 428+ hardcodede px-værdier + 0 breakpoints i chauffeur-web. Disse regler skal forhindre samme drift i andre apps.

**Ingen hardcodede px-værdier i layout:**

```tsx
// ALDRIG
style={{ paddingTop: 67, fontSize: 12 }}
className="text-[14px]"

// ALTID
className="pt-md text-xs"
```

`w-[Npx]`/`h-[Npx]` kun til bevidste fixed komponenter (fx FAB, ProductBoxV2-grid) — IKKE til layout-containers eller wrappers.

**Breakpoints — påkrævet på apps med mobile use case (chauffeur-web, PWA):**
- `xs: 320px` — iPhone SE
- `sm: 375px` — iPhone 12/13/14
- `md: 430px` — iPhone Pro Max
- `lg: 768px` — iPad / fullscreen
- `xl: 1024px+` — desktop

Mobile-first: skriv default for `xs`, brug `sm:`/`md:`/`lg:` til at udvide. Tailwind-config skal udvides hvis breakpoints mangler.

**Safe areas — påkrævet for PWA på telefon:**

```tsx
// ALDRIG hardcodet for notch/dynamic island
style={{ paddingTop: 59 }}

// ALTID
className="pt-[env(safe-area-inset-top,0)]"
className="pb-[env(safe-area-inset-bottom,0)]"
```

`index.html` SKAL have `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` — `viewport-fit=cover` er obligatorisk for at safe-areas virker.

**iPhone-ramme på desktop (chauffeur-web):**
- Vises KUN på `lg:` (≥768px) — på mobile/iPad fullscreen
- Brug `useViewport()`-hook eller `@media (max-width: 768px)` til at skjule
- Aldrig hardcodede ramme-dimensioner — brug aspect-ratio

**Touch targets ≥ 44×44 — uden undtagelse.** Inkluderer close-knapper, klikbare badges, små icons. Brug `min-h-touch min-w-touch`-tokens (skal tilføjes hvis manglende).

**Test-matrix før produktion:**

| Device | Bredde | Mål |
|---|---|---|
| iPhone SE | 375×667 | Touch targets + font legibility |
| iPhone 14 | 393×852 | Default-design fungerer |
| iPhone Pro Max | 430×932 | Layout udnytter bredde |
| iPad Mini | 768×1024 | Fullscreen (ikke i ramme) |
| Desktop | 1280×800+ | iPhone-ramme vises centreret |

**Desktop-only apps (formand, vognmand):** Fixed pixel-værdier i grid-celler er OK fordi viewport altid er stort. Men touch targets + safe-areas gælder stadig hvis app'en åbnes på tablet.

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
