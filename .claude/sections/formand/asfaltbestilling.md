---
section: asfaltbestilling
app: formand
tab: planlaegning
current_phase: prototype
owner: Carsten
created: 2026-05-25
last_updated: 2026-05-25
---

# Section Manifest — Asfaltbestilling

> **Hvad denne fil ER:** Lifecycle-tracker for Asfaltbestilling-sektionen på Formand's Planlægning-tab. Single index over alle artefakter.
> **Hvad denne fil IKKE er:** Forretnings-scope (kickoff) eller accept-kriterier (contract).

---

## Status

| Phase | Status | Dato | Notes |
|---|---|---|---|
| Prototype | godkendt-UX-ikke-låst | 2026-05-22 | V3 design låst, men cross-cutting blockers åbne |
| Dev | ikke-startet | — | Blokkeret af cross-cutting beslutninger |
| Test | ikke-startet | — | |
| Live | ikke-startet | — | |

**Cross-cutting blockers tjekket:**
- [ ] Status-vokabular låst — sendt/afventer/aflyst skal blive Supabase-enum
- [ ] Datoformat låst — påvirker dato-pillerne ("16. marts 2026")
- [ ] Multi-produkt-på-bil låst — 7 åbne kunde-spørgsmål (se `Docs/Formand/AFKLARING_Multi-produkt_OPFOLGNING.md`)

> **Dev-fase kan IKKE starte før alle tre er låst.**

---

## Prototype-reference

- **Fil:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx#L1440-L1640`
- **Live URL:** https://formandsapp.netlify.app/ (vælg ordre → Planlægning-tab)
- **Screenshots:** `.claude/screenshots/asfaltbestilling/` *(ikke vedlagt endnu)*

---

## Komponent-scope

> Identificeret ved manuel inspektion af prototypen. Bekræftes/justeres af interviewer Fase A.
> **Rolle-konvention:** Container ejer state via hook(s). Presenter modtager props ind, sender callbacks ud (ingen direkte hook-import).

| Komponent | Rolle | Prototype-source | Status | SPEC | Handoff |
|---|---|---|---|---|---|
| `AsfaltbestillingSection` | Container | `OrdrePlanScreen.tsx#L1440-L1640` | not-started | `Docs/Formand/SPEC_AsfaltbestillingSection.md` | — |
| `DatePillsRow` | Presenter | `OrdrePlanScreen.tsx#L1451-L1484` | not-started | `Docs/Formand/SPEC_DatePillsRow.md` | — |
| `ProductBoxV2` | Presenter | `OrdrePlanScreen.tsx#L2595-L2793` | not-started | `Docs/Formand/SPEC_ProductBoxV2.md` | — |
| `EkstraBestillingBox` | Presenter | `OrdrePlanScreen.tsx#L2801-L2916` | not-started | `Docs/Formand/SPEC_EkstraBestillingBox.md` | — |
| `StatusPill` | Presenter | `OrdrePlanScreen.tsx#L2564-L2588` | not-started | `Docs/Formand/SPEC_StatusPill.md` | — |
| `SendTilFabrikCTA` | Presenter | `OrdrePlanScreen.tsx#L1582-L1630` | not-started | `Docs/Formand/SPEC_SendTilFabrikCTA.md` | — |
| `useAsfaltbestilling` | Hook | (logik spredt i OrdrePlanScreen — skal samles) | not-started | `Docs/Formand/SPEC_useAsfaltbestilling.md` | — |
| `useEkstraBestilling` | Hook | (logik spredt i OrdrePlanScreen) | not-started | `Docs/Formand/SPEC_useEkstraBestilling.md` | — |

**Sub-sektioner / sub-flows:**
- Aflys-årsag picker (inde i ProductBoxV2 — `L2635-L2664`)
- Vejr-toggle (inde i ProductBoxV2 — `L2681-L2701`)
- Send-bekræftelses-modal (med kommentar-felt — separat komponent eller del af SendTilFabrikCTA?)
- "Samles på en bil"-checkbox (per produkt+dag og per ekstra-bestilling)

---

## Build-order (dependency graph)

```
Round 1 (foundation — parallel):
  - shared/types/produkt.ts          → MockProduct, DayPlan, CancelReason, EkstraBestilling
  - shared/types/ordre.ts            → Ordre, OrderStatus
  - apps/formand/src/mocks/asfaltbestilling.ts
  - apps/formand/src/hooks/useAsfaltbestilling.ts
  - apps/formand/src/hooks/useEkstraBestilling.ts

Round 2 (atomic presentere — parallel):
  - StatusPill                       (ingen deps udover types)
  - DatePillsRow                     (deps: types)

Round 3 (komplekse presentere — parallel):
  - ProductBoxV2                     (deps: types, CancelReason-enum)
  - EkstraBestillingBox              (deps: types)
  - SendTilFabrikCTA                 (deps: types)

Round 4 (container — sidste):
  - AsfaltbestillingSection          (wirer alle Round 2+3 sammen via Round 1's hooks)
```

**Gate per round:** lint + typecheck + tests grønne FØR næste round.

---

## Cross-section dependencies

| Type | Sektion | Relation |
|---|---|---|
| reads-from | `ordre-detaljer` | ordre-nr, projektleder, recept-data (recipeCode, recipeName, thicknessMm) |
| reads-from | `samleordre` | hvilke ordrer der er samlet → ordre-tags på produkt-bokse |
| writes-to | `udfoersel-dagsoverblik` | morgenTons bliver default for "faktisk udlagt" |
| writes-to | `vognmand-disponering` | sendte bestillinger → vognmand modtager opgaver (cross-app via FUNCTIONAL_FLOWS) |
| writes-to | `fabrik-bestillinger` | sendte bestillinger → fabrik ser ordre-køen |
| blocks | `afregning` | afregning kan ikke køre før produkter er sendt + leveret |

Se `.claude/docs/FUNCTIONAL_FLOWS.md` for cross-app flow-detaljer.

---

## Artefakter

| Type | Fil | Status |
|---|---|---|
| Kickoff | `Docs/Formand/KICKOFF_Asfaltbestilling.md` | not-started |
| Validation contract | `Docs/Formand/CONTRACT_Asfaltbestilling.md` | not-started |
| SPECs | `Docs/Formand/SPEC_*.md` | 0/8 |
| Handoffs | `.claude/handoffs/asfaltbestilling-*.md` | 0/8 |
| Validation history | `.claude/validation-history/asfaltbestilling-*.md` | 0 runs |

---

## Produktions-paths (fyldes ud under dev-fase)

| Type | Path |
|---|---|
| Components | `apps/formand/src/components/ui/{ProductBoxV2,EkstraBestillingBox,StatusPill,...}.tsx` |
| Section wrapper | `apps/formand/src/components/sections/AsfaltbestillingSection.tsx` |
| Hooks | `apps/formand/src/hooks/{useAsfaltbestilling,useEkstraBestilling}.ts` |
| Types | `shared/types/{ordre,produkt,bestilling}.ts` |
| Mocks | `apps/formand/src/mocks/asfaltbestilling.ts` |
| E2E tests | `apps/formand/e2e/asfaltbestilling.spec.ts` |

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
| Formand | full | ejer sektionen, kan sende til fabrik |
| Vognmand | read-only-derived | ser disponerings-opgaver fra sendte bestillinger, ikke selve sektionen |
| Chauffør | hidden | ser kun resulterende opgave i chauffør-app |
| Fabrik | read-only-derived | ser ordre-køen, ikke selve sektionen |
| Kunde | hidden | |

---

## Notes

- V3 design låst 2026-05-21, se `project_dagsoversigt_v3_design` memory
- "Samles på en bil"-mønster er åbent kunde-spørgsmål — se `project_samles_paa_en_bil_marker`
- Multi-produkt split-periods: SMA marts + GAB maj kan optræde i samme ordre, vises som adskilte perioder. Se `project_multi_product_split_periods`
- Offline-strategi: write-queue ved "Send til fabrik" (se `project_offline_strategi`)
- Forventet ~8 SPECs + 2 hooks ved fuld decomposition
