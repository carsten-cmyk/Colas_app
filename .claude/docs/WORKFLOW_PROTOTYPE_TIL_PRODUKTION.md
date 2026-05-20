# Workflow — Fra prototype til produktion

**Formål:** Sikre at hver sektion bygges som en *vertical slice* (fra DB til UI), med tidlig afklaring af cross-app effekter, så vi ikke refaktorerer i sektion N+1 fordi vi misser noget i sektion N.

**Princip:** Kvalitet > hastighed. Hellere flere tokens og længere planlægning end at bygge noget der skal rives op.

---

## Faser i overblik

```
┌────────────────────────────────────────────────────────────────────┐
│ FASE 0 — Prototype-godkendelse                                     │
│ UX/forretning låst, design tokens på plads                         │
└────────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ FASE 1 — Fundament (én gang før første sektion)                    │
│ Supabase-skema · Shared types · Auth/RLS · Cross-cutting beslutninger │
└────────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ FASE 2 — Vertical slice per sektion (gentages per sektion)        │
│ Section Kickoff → SPECs → Build → Review → Test → Hand-off        │
└────────────────────────────────────────────────────────────────────┘
```

---

## Fase 0 — Prototype-godkendelse

**Forudsætning før vi går videre:**
- [ ] UX/forretningslogik er bekræftet med kunde
- [ ] Design tokens er låst (farver + Gotham-font — se [project-design-system-v2](.claude/projects/.../memory/))
- [ ] Token-violations renset fra prototype (`/token-check`)
- [ ] Cross-cutting beslutninger er afklaret (se nedenfor)

---

## Fase 1 — Fundament

**Disse skal være på plads FØR vi rører første sektion.** Sker én gang.

### 1.1 — Cross-cutting beslutninger

Disse skal afklares før DB-skemaet låses, fordi de påvirker tabel-struktur og typer i hele monorepoet:

| Emne | Status | Ansvar |
|---|---|---|
| **Status-vokabular** — alle statusser på dansk (fx `ankommet`, `planlagt`) eller dansk/engelsk mix? Lås før DB-skema | 🟡 Afventer kunde-afklaring | Carsten |
| **Datoformat** — ISO `yyyy-mm-dd` internt, men kunder taler "uge 18, mandag". Hvordan vises og hvor konverteres? | 🟡 Afventer kunde-afklaring | Carsten |
| **Multi-produkt-på-bil** — påvirker vejebilag, disponering, chauffør-tasks, timeregistrering. Se `Docs/Formand/AFKLARING_Multi-produkt_og_Vejekort.md` | 🟡 Afventer kunde-svar | Carsten |
| **Vejekort/Danvægt-integration** — NFC? Backup? Real-time vejning? Se samme afklaringsdok | 🟡 Afventer kunde-svar | Carsten |
| **Timeregistrerings-model** — én chauffør/én tur/én ordre, eller splits ved multi-produkt? | 🟡 Bundet til multi-produkt-afklaring | Carsten |
| **Auth/RLS-model** — hvem ser hvad? (formand→sine ordrer, vognmand→sine aftaler, fabrik→sine vejebilag) | 🟡 Ikke startet | Team |

### 1.2 — Supabase-skema

Implementeres KUN for cross-cutting tabeller i fase 1 (sektion-specifikke kommer i fase 2):

- `ordrer` — kerne-entitet, refereret fra alt
- `vognmaend`, `chauffoerer`, `materiel`, `udlaeggere` — stamdata
- `recepter` — recept-katalog (densitet, kg_per_m2, min_temperatur)
- `plan_vejebilag` — vejesedler fra fabrik/PLAN
- `task_timestamps` — GPS/chauffør-app data
- `dagsoverblik_registreringer` — formandens faktisk-input
- RLS-policies pr. tabel

### 1.3 — Shared types

- `shared/types/` skal afspejle Supabase-skemaet 1:1
- Generér via `supabase gen types typescript` hvor muligt
- Alle apps importerer fra `shared/types/` — ingen lokale duplikater

### 1.4 — Auth

- Supabase Auth + custom claims for rolle (formand/vognmand/chauffør/fabrik)
- RLS-policies baseret på rolle + scope (egne ordrer/aftaler)

**Quality gate fase 1:** Ingen sektion må starte uden cross-cutting beslutninger låst og skema deployet til staging.

---

## Fase 2 — Vertical slice per sektion

Hver sektion gennemløber denne sekvens:

### 2.1 — Section Kickoff (arkitekt)

Architect-agenten kører `/develop-screen [sektion] [app]` og udfylder `SECTION_KICKOFF_TEMPLATE.md` (kopieres til `Docs/[App]/KICKOFF_[Sektion].md`). Udfyldelsen skal ske **før** SPEC-decomposition.

**Templaten tvinger arkitekt til at svare på:**
- Data læses fra hvilke tabeller? Skrives til hvilke?
- Hvilke andre apps berøres af denne sektions data?
- Realtime, polling eller statisk?
- Offline-opførsel?
- Status-overgange (state machine)?
- Mock-data der fjernes?
- Edge cases + happy paths
- Definition of Done

**Output:** Udfyldt KICKOFF-dok + plan med komponent-decomposition.

### 2.2 — Godkendelse

Carsten reviewer KICKOFF + plan. Approve eller justér før SPECs skrives.

### 2.3 — SPEC-files

Architect splitter i SPEC_*.md per komponent. Hver SPEC matcher visual pattern inventory (se [feedback-visual-pattern-matching](.claude/projects/.../memory/)).

### 2.4 — Build (parallel)

Builder-agenter bygger komponenter ud fra SPECs (parallelt hvor muligt).

### 2.5 — Review

Reviewer-agent kører mod REVIEW_SPEC + DESIGN_SYSTEM. Returnerer issue-liste.

### 2.6 — Cleanup + tests

`/cleanup` for CRITICAL issues, `/test` når review er ren.

### 2.7 — Hand-off

Sektion er klar når **alle** quality gates er grønne:

- [ ] Lint + typecheck + tests = 0 fejl
- [ ] Coverage ≥ 80% lines/functions, 70% branches
- [ ] Ingen token-violations (`/token-check` ren)
- [ ] **Ingen Montserrat hardcoded** — alle font-klasser går via `font-poppins`/`font-inter`-alias (production-gate, se [feedback-design-tokens-no-deviation](.claude/projects/.../memory/))
- [ ] Alle `// TODO: Erstat med Supabase`-markører er fjernet (eller eksplicit udskudt med begrundelse)
- [ ] FUNCTIONAL_FLOWS.md er opdateret hvis nye cross-app flows er identificeret
- [ ] Offline-opførsel testet og dokumenteret
- [ ] Loading + error states implementeret
- [ ] WCAG-tjek: kontrast, touch targets 44×44, aria-labels
- [ ] Demo med kunde gennemført

---

## Sektion-rækkefølge — følg dataflowet

Producenter før konsumenter. Foreslået rækkefølge (formand-domain):

| # | Sektion | App | Producerer for | Status |
|---|---|---|---|---|
| 1 | Ordregrundlag (fra PLAN) | formand | alle | Mock i dag |
| 2 | **Dagsfordeling** | formand | vognmand | Mock — første rigtige sektion |
| 3 | Disponering | vognmand | chauffør | Prototype i gang |
| 4 | Chauffør-opgaver | chauffør | vejebilag, timestamps | Mock |
| 5 | Vejesedler/Dagsoverblik | formand | afregning | Mock |
| 6 | Afregning/Godkendelse | formand | færdig ordre | Mock |
| 7 | Returlæs | tværgående | — | Afventer kunde-input |

**Logik:** Vognmandens disponering kan ikke bygges færdig før dagsfordelingen er låst, fordi disponeringen henter dagstons fra formandens plan. Samme princip ned ad listen.

---

## Anti-patterns — undgå disse

- **Vandret slicing** ("vi bygger alle hooks, så alle komponenter, så alle pages") — vi mister sammenhæng og kan ikke demo'e undervejs
- **Skipping cross-app analyse** — at bygge formandens dagsfordeling uden at tjekke hvad vognmand forventer = refaktorering
- **Mock-data i produktion** — alle `// TODO: Erstat med Supabase` skal væk før hand-off (eller eksplicit udskudt)
- **Direkte Supabase-kald i komponenter** — alt går via hooks i `src/hooks/`
- **Tokens-violations** — også selvom det er "midlertidigt" (det er det aldrig)

---

## Reference

- Cross-app flows: [`FUNCTIONAL_FLOWS.md`](./FUNCTIONAL_FLOWS.md)
- Design system: [`core/DESIGN_SYSTEM.md`](./core/DESIGN_SYSTEM.md)
- Section kickoff template: [`SECTION_KICKOFF_TEMPLATE.md`](./SECTION_KICKOFF_TEMPLATE.md)
- Multi-produkt afklaring: [`Docs/Formand/AFKLARING_Multi-produkt_og_Vejekort.md`](../../Docs/Formand/AFKLARING_Multi-produkt_og_Vejekort.md)
