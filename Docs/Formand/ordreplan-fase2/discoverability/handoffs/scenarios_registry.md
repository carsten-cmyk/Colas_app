---
section: ordreplan-fase2/discoverability
component: scenarios_registry
spec: .claude/handoffs/ordreplan-fase2/discoverability/SPEC_scenarios_registry.md
builder_session: 2026-07-01-1030
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — scenarios.ts (Scenarie-registry)

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget `scenarios.ts`. Læses af reviewer.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: DISC-R1-001
    description: "ScenarioId = 'A' | 'B' | 'C' type-alias eksporteret"
  - id: DISC-R1-002
    description: "Scenario interface med ALLE felter præcis som SPEC-typen (products, resources, vognmandBekraeftelser, vognmandMaterielBekraeftelse, materielEnheder, transportPlaner, samleordre, sendtTilVognmandDates, korselPlanlagtIds, korselOrders, startRaekkefoelge, startTider, defaultPlanDate, demoDvaleDag)"
  - id: DISC-R1-003
    description: "SCENARIOS: Record<ScenarioId, Scenario> = { A, B, C } eksporteret"
  - id: DISC-R1-004
    description: "DEFAULT_SCENARIO_ID: ScenarioId = 'B' eksporteret"
  - id: DISC-R1-005
    description: "Spor B refererer INITIAL_* direkte — ingen duplikering, bagudkompatibel"
  - id: DISC-R1-006
    description: "Spor A — samleordre m. 2 børn (1212400 Skovvej + 1212401 Havnegade), beide vognmandBekraeftet:true + materielBekraeftet:true (krav c)"
  - id: DISC-R1-007
    description: "Spor A — 1 akkord-bil m. multilæs (49.2t, pre_fordeling: anchor 30t + barn2 19.2t) + 1 time-bil m. timer fordelt på børn (multilæs-time-fordeling via pre_fordeling)"
  - id: DISC-R1-008
    description: "Spor A — 2 etaper: etape0 april (2026-04-14..16) + etape1 september (2026-09-07..08) — hverdags-gap garanterer clusterEtaper splitter korrekt"
  - id: DISC-R1-009
    description: "Spor A — startdatoen (2026-04-14) initierer alle 3 bestillinger: sendtTilVognmandDates + korselPlanlagtIds seeded fra a-d2-1 + A_TRANSPORT_PLANER a-r1:0 sendt+bekræftet + A_PRODUCTS days starter 2026-04-14"
  - id: DISC-R1-010
    description: "Spor A — demoDvaleDag: null (ingen dvale-injektion)"
  - id: DISC-R1-011
    description: "Spor B — korselOrders inline-seed kopieret 1:1 fra OrdrePlanScreen useState (d2-1/d2-2/d2-3)"
  - id: DISC-R1-012
    description: "Spor B — startRaekkefoelge + startTider kopieret 1:1 fra OrdrePlanScreen useState"
  - id: DISC-R1-013
    description: "Spor B — sendtTilVognmandDates + korselPlanlagtIds kopieret 1:1 fra OrdrePlanScreen useState"
  - id: DISC-R1-014
    description: "Spor B — demoDvaleDag: '2026-05-04' (global DEMO_DVALE_DAG bevaret)"
  - id: DISC-R1-015
    description: "Spor C — samleordre m. 2 børn (1212500 Ringgaden + 1212501 Boulevarden), beide vognmandBekraeftet:true + materielBekraeftet:true (krav c)"
  - id: DISC-R1-016
    description: "Spor C — ekstrabestilling: c-d1-1 (2026-06-08) har ekstraTons: { tons: 8, bekraeftetAf: 'fabrik', tidspunkt: '2026-06-08T08:15:00+02:00' } → EkstraBestillingBox synlig ved default-dato"
  - id: DISC-R1-017
    description: "Spor C — 2 etaper: etape0 juni (2026-06-08..10) + etape1 november (2026-11-09..10)"
  - id: DISC-R1-018
    description: "Spor C — startdatoen (2026-06-08) initierer alle 3 bestillinger analogt med Spor A"
  - id: DISC-R1-019
    description: "blankTransportPlan(resourceId, etapeId) factory-funktion intern — forhindrer copy-paste-fejl i de mange 'ikke-planlagt'-objekter"
  - id: DISC-R1-020
    description: "TODO-kommentarer med 'PLAN/Oracle' (ikke 'Supabase') i ALLE seed-punkter"
  - id: DISC-R1-021
    description: "Ingen any-types, ingen JSX, ingen hooks — ren data-fil"
  - id: DISC-R1-022
    description: "DEMO_TRANSPORT_PLANER importeret fra etape.ts (korrekt kilde — ikke mocks.ts)"
```

---

## Not implemented

```yaml
accept_skip:
  - id: DISC-R1-N/A
    reason: "Ingen accept-kriterier udestår for Round 1 (scenarios.ts). useScenario-hook + OrdrePlanScreen-wiring er Round 2 per INDEX.md"
```

---

## Assumptions

- `underlaegsType` i `SamleordreChild.forundersoegelseDetails` tillader kun `'asfalt' | 'beton' | 'grus' | null` (ikke `'fraeset'`) — opdaget ved typecheck. Spor C's anchor-ordre seedes med `'asfalt'` i stedet. Hvis `'fraeset'` er en ønsket type, skal det tilføjes til `SamleordreChild`-interface'et i `types.ts`.

- Spor A/C benytter fælles `resourceId`-præfiks (`a-r*` / `c-r*`) for at holde transport-planer adskilt fra Spor B's `r1`/`r2`/`r3`. Dette er nødvendigt fordi `transportPlaner`-record er keyed på `transportKey(resourceId, etapeId)` — fælles IDs ville kollidere ved simultant demo-skift.

- `demoDvaleDag` i Spor A og C er sat til `null`. Dvale-gap eksisterer i begge spor (3-4 måneder), men useScenario-hook (Round 2) og wiring (Round 2) skal afgøre om de autonomt injicerer en dvale-dag baseret på etape-gap, eller om `demoDvaleDag` skal beregnes dynamisk. Nullet her er defensivt.

- `korselPlanlagtIds` i Spor A/C refererer kun til `a-d2-*`/`c-d2-*` day-IDs (SMA 11S-produktet som i B's original). GAB I-dagene (`a-d1-*`/`c-d1-*`) er ikke seeded som planlagt-IDs — dette matcher B's pattern hvor kun p2 (SMA 11S) er forudfyldt med kørsel.

- Vognmand-bekræftelser er IKKE tilknyttet GAB I-dagene (`a-d1-*` / `c-d1-*`) — disse er kun produktdage uden separate bil-bestillinger i prototypen. Dette matcher eksisterende mønster i INITIAL_VOGNMAND_BEKRAEFTELSER.

---

## Known issues

- Ingen kendte issues. Typecheck og import-struktur er verificeret.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/scenarios.ts

modified:
  (ingen — INITIAL_* i mocks.ts er urørte)
```

---

## Prototype-fidelity

**Type:** Ny data-fil, ikke en komponent-ekstraktion. Ingen prototype-JSX involveret.

**Spor B seeds kopieret 1:1 fra OrdrePlanScreen:**
- `sendtTilVognmandDates`: L107 → `['2026-03-16', '2026-03-17']`
- `korselPlanlagtIds`: L118 → `['d2-1', 'd2-2']`
- `korselOrders`: L120-133 → identisk struktur
- `startRaekkefoelge`: L136-138 → `{ 'd2-1': ['6 Aks', '7 Aks', null] }`
- `startTider`: L154-156 → `{ 'd2-1': ['06:39', '06:54', null] }`
- `defaultPlanDate`: L76 → `'2026-03-17'`
- `demoDvaleDag`: L259 → `'2026-05-04'`

**Spor A + C:** Nye literals bygget analogt med Spor B's mønster.

**Bevidste afvigelser:**
1. `DEMO_TRANSPORT_PLANER` importeret fra `etape.ts` (ikke `mocks.ts`) — korrekt kilde ifølge etape.ts-definitionen.
2. `underlaegsType: 'fraeset'` ændret til `'asfalt'` — type-system tillader ikke `'fraeset'` i `SamleordreChild.forundersoegelseDetails` (se Assumptions).

---

## API exports

```typescript
export type ScenarioId = 'A' | 'B' | 'C'

export interface Scenario {
  id: ScenarioId
  label: string
  beskrivelse: string
  products: MockProduct[]
  resources: MockResource[]
  vognmandBekraeftelser: Record<string, VognmandBekraeftelse>
  vognmandMaterielBekraeftelse: VognmandMaterielBekraeftelse
  materielEnheder: MaterielEnhed[]
  transportPlaner: Record<string, MaterielTransportPlan>
  samleordre: SamleordreContext | null
  sendtTilVognmandDates: string[]
  korselPlanlagtIds: string[]
  korselOrders: Record<string, VehicleOrder[]>
  startRaekkefoelge: Record<string, [string | null, string | null, string | null]>
  startTider: Record<string, [string | null, string | null, string | null]>
  defaultPlanDate: string
  demoDvaleDag: string | null
}

export const SCENARIOS: Record<ScenarioId, Scenario>
export const DEFAULT_SCENARIO_ID: ScenarioId  // = 'B'
```

Intern (ikke-eksporteret):
- `blankTransportPlan(resourceId: string, etapeId: number): MaterielTransportPlan`

---

## Tokens / patterns brugt

Ren data-fil — ingen Tailwind-klasser, ingen styling. Token-regler ikke relevante.

---

## Tests skrevet (hvis test-writer kørt)

Ingen — prototype-fase, SPEC specificerer ingen tests for denne fil.

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — grøn (0 errors)
- [x] Lint: ikke kørt (data-fil uden JSX — lint-regler rammer ikke)
- [x] Handoff udfyldt (denne fil)
- [x] INITIAL_* i mocks.ts bevaret urørt
- [x] Klar til useScenario-hook (Round 1, fil #2)

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-07-01 10:45
  acceptkriterier_implementeret: 22 af 22 (DISC-R1-001..022)
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: false  # Data-fil, ikke komponent-ekstraktion
  bevidste_afvigelser_count: 2  # (1) DEMO_TRANSPORT_PLANER import-kilde, (2) underlaegsType 'fraeset'→'asfalt'
  manuel_testning_udfoert:
    - "Typecheck: npm run formand:typecheck — 0 errors (verificeret)"
    - "Import-struktur: INITIAL_* refereret, ikke duplikeret — bekræftet via grep"
    - "Spor B bagudkompatibilitet: alle inline-seeds fra OrdrePlanScreen L76-156 kopieret 1:1"
    - "Spor A multilæs: pre_fordeling summer korrekt (akkord: 30+19.2=49.2t; time: 20+15=35t)"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "underlaegsType: 'fraeset' er ikke i SamleordreChild-typen — enten skal typen udvides eller seeden justeres. Valgt at sætte 'asfalt' for nu."
    - "Spor A/C: demoDvaleDag=null — hvis useScenario (Round 2) forventer en eksplicit dvale-dag-værdi (ikke auto-beregnet) skal disse sættes. Afventer SPEC_useScenario_hook.md §demoDvaleDag-håndtering."
    - "korselPlanlagtIds i A/C refererer kun SMA 11S-dage (a-d2-*/c-d2-*) — GAB I-dage er IKKE seeded som planlagte. Bekræft at dette er det ønskede demo-billede."
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** `useScenario.ts` (Round 1, fil #2) — importerer `SCENARIOS`/`ScenarioId` herfra.
