---
section: asfaltbestilling
app: formand
tab: planlaegning
current_phase: dev
owner: Carsten
created: 2026-05-25
last_updated: 2026-05-26
---

# Section Manifest — Asfaltbestilling

> **Hvad denne fil ER:** Lifecycle-tracker for Asfaltbestilling-sektionen på Formand's Planlægning-tab. Single index over alle artefakter.
> **Hvad denne fil IKKE er:** Forretnings-scope (kickoff), datafelter (`DATA_FIELDS.md`), UX-flows (`asfaltbestilling/FLOWS.md`) eller accept-kriterier (`asfaltbestilling/CONTRACT.md`).

---

## Status

| Phase | Status | Dato | Notes |
|---|---|---|---|
| Prototype | klar-til-dev | 2026-05-22 | V3 design låst — interview gennemført |
| Interview | færdig (alle 4 faser) | 2026-05-26 | Alle faser accepteret af Carsten |
| Dev | signed-klar-til-architect | 2026-05-26 | `asfaltbestilling/CONTRACT.md` = SIGNED-2026-05-26 FROZEN — architect kan dispatches via `/develop-screen` |
| Test | ikke-startet | — | |
| Live | ikke-startet | — | |

**Cross-cutting blockers tjekket:**
- [x] Status-vokabular låst 2026-05-26 — se `.claude/docs/STATUS_VOKABULAR.md` (`TransportOrderStatus`, `AflysningsAarsag`, `ProduktTilstand`)
- [x] Datoformat låst 2026-05-26 — se `.claude/docs/DATOFORMAT.md` (`formatLongDateWithDay` på dato-piller)
- [~] Multi-produkt-på-bil — kerne låst 2026-05-19, 4 opfølgnings-spg. som `TBD-refinement` i CONTRACT (MP-1..MP-4, ikke blocker)
- [N/A] Auth/RLS — ingen rolle-differentiering inde i sektionen (kun formand ser den). App-level auth dækker.

> **Dev-fase aktiveret** 2026-05-26 — kontrakt signed. Næste: `/develop-screen asfaltbestilling formand` for architect-handoff.

---

## Prototype-reference

- **Fil:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx#L1440-L1640` + handlers `L957-L1046` + send-modal `L2480-L2545`
- **Live URL:** https://formandsapp.netlify.app/ (vælg ordre → Planlægning-tab)
- **Screenshots:** `.claude/screenshots/asfaltbestilling/Screenshot 2026-05-26 at 09.46.50.png` (+ baselines genereres ved første e2e-run)

---

## Komponent-scope

> Bekræftet i interview-Fase A. 10 komponenter (8 presentere/container + 2 hooks) — opdateret fra oprindelige 8 efter Fase A-beslutninger om at ekstrahere `SendBekraeftelsesModal` og `EkstraBestillingCTA` som egne komponenter.
> **Rolle-konvention:** Container ejer state via hook(s). Presenter modtager props ind, sender callbacks ud (ingen direkte hook-import).

| # | Komponent | Rolle | Prototype-source | Status | SPEC | Handoff | Builder-signoff | Reviewer-signoff | Rounds |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `AsfaltbestillingSection` | Container | `OrdrePlanScreen.tsx#L1440-L1640` | not-started | `Docs/Formand/asfaltbestilling/SPEC_AsfaltbestillingSection.md` | — | — | — | 0 |
| 2 | `DatePillsRow` | Presenter | `OrdrePlanScreen.tsx#L1451-L1484` | not-started | `Docs/Formand/asfaltbestilling/SPEC_DatePillsRow.md` | — | — | — | 0 |
| 3 | `ProductBoxV2` | Presenter | `OrdrePlanScreen.tsx#L2595-L2793` | not-started | `Docs/Formand/asfaltbestilling/SPEC_ProductBoxV2.md` | — | — | — | 0 |
| 4 | `EkstraBestillingBox` | Presenter | `OrdrePlanScreen.tsx#L2801-L2916` | not-started | `Docs/Formand/asfaltbestilling/SPEC_EkstraBestillingBox.md` | — | — | — | 0 |
| 5 | `StatusPill` | Presenter | `OrdrePlanScreen.tsx#L2564-L2588` | not-started | `Docs/Formand/asfaltbestilling/SPEC_StatusPill.md` | — | — | — | 0 |
| 6 | `EkstraBestillingCTA` | Presenter (NY ekstraktion) | `OrdrePlanScreen.tsx#L1565-L1580` | not-started | `Docs/Formand/asfaltbestilling/SPEC_EkstraBestillingCTA.md` | — | — | — | 0 |
| 7 | `SendTilFabrikCTA` | Presenter | `OrdrePlanScreen.tsx#L1582-L1630` | not-started | `Docs/Formand/asfaltbestilling/SPEC_SendTilFabrikCTA.md` | — | — | — | 0 |
| 8 | `SendBekraeftelsesModal` | Presenter (NY ekstraktion) | `OrdrePlanScreen.tsx#L2480-L2545` | not-started | `Docs/Formand/asfaltbestilling/SPEC_SendBekraeftelsesModal.md` | — | — | — | 0 |
| 9 | `useAsfaltbestilling` | Hook | (logik spredt i OrdrePlanScreen — skal samles, inkl. `sendAlleForSelectedDate`-orkestrering) | not-started | `Docs/Formand/asfaltbestilling/SPEC_useAsfaltbestilling.md` | — | — | — | 0 |
| 10 | `useEkstraBestilling` | Hook | (logik spredt i OrdrePlanScreen + `markSent`-callback til atomic batch fra useAsfaltbestilling) | not-started | `Docs/Formand/asfaltbestilling/SPEC_useEkstraBestilling.md` | — | — | — | 0 |

**Sub-sektioner / sub-flows (interne modes — IKKE separate komponenter):**
- Aflys-årsag picker — intern mode i `ProductBoxV2` (Reason-picker), styret af container-state `cancellingDayId` (se C2-flow i `asfaltbestilling/FLOWS.md`)
- Vejr-toggle — sub-element inde i `ProductBoxV2` Default-mode (styret af `day.weatherActive`, callback `onToggleWeather`)
- "Samles på en bil"-checkbox — sub-element i både `ProductBoxV2` og `EkstraBestillingBox` (styret af `day.samlesPaaEnBil` / `ekstra.samlesPaaEnBil`)
- Empty-state `"Ingen produkter denne dag"` — rendres direkte i container (ikke egen komponent jf. Fase A-beslutning)
- Sum-warning i `SendBekraeftelsesModal` — internt UI-element når `sum(tonsPlanned) > tonsTotal` (jf. C12-default)

---

## Build-order (dependency graph)

```
Round 1 (foundation — parallel):
  - shared/types/produkt.ts          → MockProduct, DayPlan, AflysningsAarsag, EkstraBestilling, TransportOrder
  - shared/types/ordre.ts            → Ordre, TransportOrderStatus
  - apps/formand/src/mocks/asfaltbestilling.ts
  - apps/formand/src/hooks/useAsfaltbestilling.ts (inkl. sendAlleForSelectedDate-orkestrering)
  - apps/formand/src/hooks/useEkstraBestilling.ts (inkl. markSent-callback)

Round 2 (atomic presentere — parallel):
  - StatusPill                       (deps: types)
  - DatePillsRow                     (deps: types)
  - EkstraBestillingCTA              (deps: ingen)

Round 3 (komplekse presentere — parallel):
  - ProductBoxV2                     (deps: types, AflysningsAarsag-enum)
  - EkstraBestillingBox              (deps: types)
  - SendTilFabrikCTA                 (deps: types)
  - SendBekraeftelsesModal           (deps: types, sum-warning prop)

Round 4 (container — sidste):
  - AsfaltbestillingSection          (wirer alle Round 2+3 sammen via Round 1's hooks)
```

**Gate per round:** lint + typecheck + tests grønne FØR næste round. Architect skriver SPECs round-for-round.

---

## Cross-section dependencies

| Type | Sektion | App | Relation |
|---|---|---|---|
| reads-from | `ordre-detaljer` | Formand | ordre-nr, projektleder, recipe-data (recipeCode, recipeName, thicknessMm, tonsTotal, factory.code) |
| reads-from | `samleordre` | Formand | hvilke ordrer er samlet → ordre-tags på produkt-bokse i samleordre-mode |
| writes-to | `udfoersel-dagsoverblik` | Formand | morgenTons bliver default for "faktisk udlagt" (ABE-3) |
| writes-to | `asfalt-koersel` | Formand | "Klar til bilbestilling"-signal for dagen (ABE-4) |
| writes-to | `vognmand-disponering` | Vognmand | Sendte bestillinger → vognmand modtager opgaver (ABE-1, ABE-5, ABE-7, ABE-8) |
| writes-to | `fabrik-ordre-koe` | Fabrik | Sendte bestillinger → fabrik ser ordre-køen (ABE-2, ABE-6, ABE-8) |
| writes-to | `chauffør-multi-produkt-loading` | Chauffør (downstream via vognmand) | `samlesPaaEnBil=true` → 9-trins fabrik-task (ABE-7 downstream) |
| blocks | `afregning` | Formand | Afregning kan ikke køre før produkter er sendt + leveret |
| blocks | `vognmand-disponering` (Supabase-integration) | Vognmand | Kan ikke skifte fra mock til Supabase før `transport_orders`-skemaet er låst her |

Se `.claude/docs/FUNCTIONAL_FLOWS.md` (ABE-1 til ABE-8) for cross-app flow-detaljer.

---

## Artefakter

| Type | Fil | Status |
|---|---|---|
| Section manifest | `.claude/sections/formand/asfaltbestilling.md` | exists (denne fil) |
| Datafelter | `.claude/docs/DATA_FIELDS.md` (sektion Asfaltbestilling) | exists |
| UX-flows | `Docs/Formand/asfaltbestilling/FLOWS.md` | exists |
| Cross-app flows | `.claude/docs/FUNCTIONAL_FLOWS.md` (ABE-1..8) | exists |
| Kickoff | `Docs/Formand/asfaltbestilling/KICKOFF.md` | exists (DRAFT) |
| Validation contract | `Docs/Formand/asfaltbestilling/CONTRACT.md` | exists (DRAFT — afventer sign-off) |
| SPECs | `Docs/Formand/SPEC_*.md` | 0/10 (architect-fase) |
| Handoffs | `.claude/handoffs/asfaltbestilling-*.md` | 0/10 (builder-fase) |
| Validation history | `.claude/validation-history/asfaltbestilling-*.md` | 0 runs |

---

## Produktions-paths (fyldes ud under dev-fase)

| Type | Path |
|---|---|
| Components | `apps/formand/src/components/ui/{ProductBoxV2,EkstraBestillingBox,StatusPill,DatePillsRow,EkstraBestillingCTA,SendTilFabrikCTA,SendBekraeftelsesModal}.tsx` |
| Section wrapper | `apps/formand/src/components/sections/AsfaltbestillingSection.tsx` |
| Hooks | `apps/formand/src/hooks/{useAsfaltbestilling,useEkstraBestilling}.ts` |
| Types | `shared/types/{ordre,produkt,bestilling}.ts` |
| Mocks | `apps/formand/src/mocks/asfaltbestilling.ts` |
| E2E tests | `apps/formand/e2e/asfaltbestilling-{c1-send,c2-cancel,c3-restore,c4-weather,c5-samles,c6-ekstra,c7-delete-ekstra,c8-date-pills,c9-readonly,crossapp,offline,visual}.spec.ts` |

---

## Deployment

| Env | URL | Last deploy |
|---|---|---|
| Dev | TBD | — |
| Test | TBD | — |
| Live | https://formandsapp.netlify.app/ | (prototype-version 2026-05-22) |

---

## Roller der bruger sektionen

| Rolle | Adgang | Notes |
|---|---|---|
| Formand | full | Ejer sektionen — alle 9 UX-flows |
| Vognmand | read-only-derived | Ser disponerings-opgaver fra `transport_orders` (ABE-1, ABE-5, ABE-7, ABE-8), ikke selve sektionen |
| Chauffør | hidden | Modtager downstream multi-produkt-loading-flow via vognmand (ABE-7 downstream) |
| Fabrik | read-only-derived | Ser ordre-køen via `transport_orders` (ABE-2, ABE-6, ABE-8), ikke selve sektionen |
| Kunde | hidden | — |

---

## Notes

- V3 design låst 2026-05-21, se `project_dagsoversigt_v3_design` memory
- "Samles på en bil"-mønster låst som `DayPlan.samlesPaaEnBil` + `EkstraBestilling.samlesPaaEnBil` (NIKKE `productSamlesFlags`-map) jf. Fase A-beslutning
- Vejr-toggle persisterer i hook pr. produkt+dag som `DayPlan.weatherActive: boolean` jf. Fase A-beslutning
- Multi-produkt split-periods: SMA marts + GAB maj kan optræde i samme ordre, vises som adskilte perioder. Se `project_multi_product_split_periods`
- Offline-strategi: write-queue ved alle skrive-actions, optimistic UI med 5s timeout og fuld rollback ved batch-fejl (se `project_offline_strategi` + CONTRACT D4)
- `restoreDay`-bug i prototype: bruger `activeProductId` til self-lookup → fixes i architect/builder-fasen til at tage kun `dayId` med intern self-lookup (jf. C10 + CONTRACT ASF-015)
- "Bekræftet af fabrik"-state (`transport_orders.confirmed_at`) vises IKKE i denne sektion — hører til Kørsel-sektionen (jf. C11)
- 4 multi-produkt-opfølgnings-spg. (MP-1..MP-4) listet i CONTRACT som `TBD-refinement` — ikke blockers
- Forventet 10 SPECs + 2 hooks ved fuld decomposition
