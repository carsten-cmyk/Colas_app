---
section: asfaltbestilling
app: formand
tab: planlaegning
current_phase: interview
owner: Carsten
created: 2026-05-25
last_updated: 2026-06-18
---

# Section Manifest — Asfaltbestilling

> **Hvad denne fil ER:** Lifecycle-tracker for Asfaltbestilling-sektionen på Formand's Planlægning-tab. Single index over alle artefakter.
> **Hvad denne fil IKKE er:** Forretnings-scope (kickoff), datafelter (`DATA_FIELDS.md`), UX-flows (`asfaltbestilling/FLOWS.md`) eller accept-kriterier (`asfaltbestilling/CONTRACT.md`).

---

## 🛑 GATE: RE-INTERVIEW DRAFT KLAR — AFVENTER KUNDE-SIGN-OFF (2026-06-18)

> **Beslutning Carsten 2026-06-18:** Re-interviewet er kørt og draftsene ligger klar, MEN intet finaliseres før **kunden har givet sign-off**. B-1..B-7 + E-1 besluttes IKKE internt nu — de går til kunde-review (CUSTOMER_SPEC + QA-mønster).
>
> **Hård gate — må IKKE passeres uden kunde-sign-off:**
> - CONTRACT v2 forbliver `DRAFT` (frys den ikke til `SIGNED`).
> - `/develop-screen asfaltbestilling formand` (architect) må IKKE dispatches.
>
> **Phase rullet tilbage fra `dev` → `interview`.** Den frosne kontrakt v1 (`SIGNED-2026-05-26`) er **forældet**: prototypen er drevet ~3 uger, og en architect-re-baseline (2026-06-18) konkluderede at ~25% af de 48 ASF-kriterier er ugyldige.
>
> **Hvad er stadig gyldigt:** UX er låst (V3 + datovælger-unify + Flow 9b/9c), status-vokabular låst, multi-produkt-kerne låst.
> **Hvad er drevet:** se "Drift-noter" nedenfor.
> **v1 bevares** som historisk reference indtil v2 signes (ikke overskrevet — se Artefakter).

---

## Drift-noter (siden v1-frozen 2026-05-26)

| # | Drift | Verificeret i prototype | Konsekvens for scope |
|---|---|---|---|
| D-A | **`EkstraBestillingCTA` + `useEkstraBestilling` SLETTET.** Formand kan ikke længere oprette ekstra-bestillinger (LÅST 2026-06-03, FF Flow 9b). Hele `ekstra_bestillinger`-konstruktet er fjernet fra datamodellen. | `EkstraBestillingCTA`/`useEkstraBestilling` findes ikke i fil; FF L2167/L2699 | −2 komponenter, −1 hook. C6/C7-flows + ASF-022..027 ugyldige. |
| D-B | **`EkstraBestillingBox` er nu READ-ONLY PLAN-visning.** Props `{ product, day }`, viser `day.ekstraTons` (delta-tons fra PLAN-push), ingen write-callbacks. | def L3658-L3705, brug L2069 | API-contract omskrevet. Read-only — ingen `onUpdate`/`onRemove`. |
| D-C | **Aflysning flyttet** fra ProductBoxV2-intern X-knap/reason-picker → ny delt `AflysningCell` i Ordredetaljer-grid (unified på tværs af alle 3 modes). ProductBoxV2's X-knap er fjernet; dens interne reason-picker-mode (`isSelectingReason`) er nu dead path (entry point væk). | `AflysningCell` def L3234-L3414, brug L1410+L1522; ProductBoxV2 X-knap fjernet (kommentar L3540) | NY komponent `AflysningCell`. ProductBoxV2's `onCancel`/`isSelectingReason`/reason-picker dead. C2-flow omskrevet. |
| D-D | **Datovælger flyttet til top**, unified på tværs af 3 modes, bruger `formatLongDate` (UDEN ugedag), ingen grøn sent-state-pille, passerede dage = hvid + gennemstreget. Var `DatePillsRow` i v1. | L1777-L1806 | `DatePillsRow` afspejler nu inline picker i container; `sentStateByDate`-prop fjernet (ingen pr-pille send-state). B-5 åben (ugedag ja/nej). |
| D-E | **`StatusPill` har 4. kind `'ekstra-bekraeftet'`** ("Bekræftet fabrik", grøn) til EkstraBestillingBox. | def L3416-L3453 | Enum udvidet til 4 kinds. |
| D-F | **Send-modal + Send-CTA er stadig INLINE** (ikke egne komponenter) — `showConfirmSend` + inline button. Skal ekstraheres til `SendBekraeftelsesModal` + `SendTilFabrikCTA` i build. | modal L3146-L3219; CTA L2079-L2132 | Uændret build-mål (ekstraktion). |
| D-G | **Flow 9c (kl-11-deadline) LÅST 2026-06-18.** Send-knap viser permanent "Bestilling skal ske inden kl 11"; modal viser conditional rød advarsel når `bestillingForSent`. For sent ≠ blokeret. `bestillingForSent` er hardkodet `true` i prototype. | knap L2104; modal L3169-L3177; flag L1043 | NYE felter `bestillingForSent`/`deadline`. NYE kriterier i C1. B-6/B-7 åbne. |
| D-H | **`samlesPaaEnBil` bruges stadig som `productSamlesFlags`-map** (`Record<\`${pid}__${did}\`, boolean>`) i prototypen — IKKE som `DayPlan.samlesPaaEnBil`. v1-kontrakt antog feltet på DayPlan. | map L1032-L1036, brug L2054-L2055 | B-2 åben (map vs. DayPlan-felt). |
| D-I | **`weatherActive` er rent lokal `useState` i ProductBoxV2** — persisterer intet, fyrer ingen callback. v1 antog `DayPlan.weatherActive` + ABE-8. | L3487; toggle L3546-L3557 | B-1 åben (persist+cross-app vs. visuelt Fase 1). ASF-017/018/040 afhænger af svar. |
| D-J | **`sendAlleForSelectedDate()` tager INGEN argument** i prototype (kommentar håndteres separat via `sentKommentarer`-map). Ingen atomic-rollback, ingen 5s-timeout, ingen sum-warning, ingen in-flight-spinner. | L1273-L1278 | B-4 åben (over-spec? Fase 1 vs. fuld batch-robusthed). ASF-003/004/005/006 er aspirational, ikke i prototype. |
| D-K | **`restoreDay(dayId)`** bruger fortsat `activeProductId` til self-lookup (prototype-bug bevaret). | L1243-L1249 | Bug-fix-note bevares for build (samme som v1 C10). |

---

## Status

| Phase | Status | Dato | Notes |
|---|---|---|---|
| Prototype | drevet-videre | 2026-06-18 | V3 + datovælger-unify + Flow 9b/9c — UX låst |
| Interview | re-interview (afgrænset) | 2026-06-18 | Re-scope efter architect-re-baseline. Fase A+B re-kørt; C/D-draft. |
| Dev | BLOCKED — afventer re-sign | — | CONTRACT v2 = DRAFT. Architect må IKKE starte før v2 = SIGNED. |
| Test | ikke-startet | — | |
| Live | ikke-startet | — | |

**Cross-cutting blockers tjekket:**
- [x] Status-vokabular låst 2026-05-26 — `.claude/docs/STATUS_VOKABULAR.md` (`TransportOrderStatus`, `AflysningsAarsag`)
- [x] Datoformat låst 2026-05-26 — `.claude/docs/DATOFORMAT.md`. NB: prototype bruger `formatLongDate` (UDEN ugedag) på datovælger → B-5 afklarer om DATOFORMAT-reglen (ugedag PÅ i planlægning) trumfer prototypen.
- [~] Multi-produkt-på-bil — kerne låst 2026-05-19. Samles-flag-placering (map vs. DayPlan) = B-2.
- [N/A] Auth/RLS — ingen rolle-differentiering inde i sektionen.
- [~] **NY (Flow 9c):** kl-11-deadline LÅST 2026-06-18, men persist-flag (B-6) + konfigurerbarhed (B-7) er åbne.

---

## Prototype-reference (2026-06-18 ankre)

- **Fil:** `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx` — Asfaltbestilling lever i Planlægning-mode
- **Datovælger (unified, top):** `#L1777-L1806`
- **Asfaltbestilling-blok (produkt-række + send):** `#L1994-L2136`
- **ProductBoxV2:** def `#L3455-L3656`, brug `#L2040`
- **EkstraBestillingBox (read-only PLAN):** def `#L3658-L3705`, brug `#L2069`
- **AflysningCell (NY):** def `#L3234-L3414`, brug `#L1410` + `#L1522` (i Ordredetaljer-grid)
- **StatusPill:** `#L3416-L3453` (4 kinds)
- **Send-til-fabrik CTA (inline):** `#L2079-L2132`
- **Bekræftelses-modal (inline):** `#L3146-L3219`
- **`bestillingForSent`-flag:** `#L1043`
- **Handlers:** `cancelDay #L1234`, `restoreDay #L1243`, `sendAlleForSelectedDate #L1273`, `productSamlesFlags/setProductSamles #L1032-L1036`
- **Live URL:** https://formandsapp.netlify.app/ (vælg ordre → Planlægning-tab) — kun til menneske-verifikation
- **Screenshots:** `.claude/screenshots/asfaltbestilling/` (baselines re-genereres ved første e2e-run mod nuværende prototype)

---

## Komponent-scope (RE-SCOPED 2026-06-18)

> **9 reelle komponenter** (1 container + 7 presentere + AflysningCell) + **1 hook**.
> Ift. v1 (10 komponenter + 2 hooks): **fjernet** `EkstraBestillingCTA` + `useEkstraBestilling`; **tilføjet** `AflysningCell`; `EkstraBestillingBox` ændret presenter → read-only presenter.
> **Rolle-konvention:** Container ejer state via hook. Presenter modtager props ind, sender callbacks ud (ingen direkte hook-import).

| # | Komponent | Rolle | Prototype-source (2026-06-18) | Drift | Status |
|---|---|---|---|---|---|
| 1 | `AsfaltbestillingSection` | Container | `#L1994-L2136` (+ datovælger `#L1777-L1806`) | uændret rolle | not-started |
| 2 | `DatePillsRow` | Presenter | `#L1777-L1806` | `sentStateByDate` fjernet (D-D); `formatLongDate` (B-5) | not-started |
| 3 | `ProductBoxV2` | Presenter | `#L3455-L3656` | X-knap + reason-picker dead (D-C); `weatherActive` lokal (D-I); `samlesPaaEnBil` via map (D-H) | not-started |
| 4 | `EkstraBestillingBox` | Presenter (READ-ONLY) | `#L3658-L3705` | NU read-only PLAN-visning, props `{product, day}` (D-B) | not-started |
| 5 | `StatusPill` | Presenter (🌍 shared-kandidat) | `#L3416-L3453` | 4. kind `'ekstra-bekraeftet'` (D-E) | not-started |
| 6 | `AflysningCell` | Presenter (NY) | `#L3234-L3414` | NY — aflysning flyttet hertil (D-C) | not-started |
| 7 | `SendTilFabrikCTA` | Presenter (ekstraktion) | `#L2079-L2132` | permanent kl-11-tekst (D-G) | not-started |
| 8 | `SendBekraeftelsesModal` | Presenter (ekstraktion) | `#L3146-L3219` | conditional `bestillingForSent`-advarsel (D-G) | not-started |
| 9 | `useAsfaltbestilling` | Hook | handlers spredt `#L1234`, `#L1243`, `#L1273` + state | absorberer hele state (ingen `useEkstraBestilling` mere) | not-started |

**Fjernet ift. v1 (DEAD — byg IKKE):**
- ❌ `EkstraBestillingCTA` — formand opretter ikke ekstra-bestillinger (D-A)
- ❌ `useEkstraBestilling` — ekstra-konstrukt fjernet; `day.ekstraTons` er PLAN-push read-only (D-A/D-B)

**Sub-flows / interne modes (IKKE separate komponenter):**
- Aflysnings-picker (vælg dato → vælg årsag → OK/Fortryd) — intern mode i `AflysningCell`, styret af parent-state `aflysPickerDayId` (D-C)
- Vejr-toggle — sub-element i `ProductBoxV2` Default-mode. **NB:** i prototype rent lokal — persist afgøres af B-1
- "Samles på en bil"-checkbox — sub-element i `ProductBoxV2`. Placering afgøres af B-2
- Empty-state `"Ingen produkter denne dag"` — rendres direkte i container (`#L2002-L2004`)
- Samleordre-mode — påvirker `ProductBoxV2` (`ordreTagLabels`) + container (`samleordreCtx`, `samleordreTags`-beregning `#L2016-L2033`). **Selve samleordre-orkestreringen er egen sektion** — her kun grænseflade-props.

---

## Build-order (dependency graph — re-scoped)

```
Round 1 (foundation — parallel):
  - shared/types/produkt.ts          → MockProduct, DayPlan (inkl. ekstraTons, evt. samlesPaaEnBil/weatherActive afh. B-1/B-2), AflysningsAarsag, TransportOrder
  - shared/types/ordre.ts            → Ordre, TransportOrderStatus, SamleordreContext
  - apps/formand/src/mocks/asfaltbestilling.ts
  - apps/formand/src/hooks/useAsfaltbestilling.ts (én hook — absorberer al state)

Round 2 (atomic presentere — parallel):
  - StatusPill                       (deps: types — 4 kinds) → tjek shared/components FØR build
  - DatePillsRow                     (deps: types)

Round 3 (komplekse presentere — parallel):
  - ProductBoxV2                     (deps: types)
  - EkstraBestillingBox              (deps: types — read-only)
  - AflysningCell                    (deps: types, AflysningsAarsag-enum)
  - SendTilFabrikCTA                 (deps: types)
  - SendBekraeftelsesModal           (deps: types, bestillingForSent-prop)

Round 4 (container — sidste):
  - AsfaltbestillingSection          (wirer Round 2+3 via useAsfaltbestilling)
```

**Gate per round:** lint + typecheck + tests grønne FØR næste round.

---

## Cross-section dependencies

| Type | Sektion | App | Relation |
|---|---|---|---|
| reads-from | `ordre-detaljer` | Formand | ordre-nr, projektleder, recipe-data (recipeCode, recipeName, thicknessMm, tonsTotal, factory.code) |
| reads-from | `samleordre` | Formand | samleordreCtx → ordre-tags på produkt-bokse i samleordre-mode |
| reads-from | **PLAN (Flow 9b)** | — | `day.ekstraTons` (delta-tons + bekræftelses-tidspunkt) pushes fra PLAN → vist i `EkstraBestillingBox` |
| writes-to | `udfoersel-dagsoverblik` | Formand | morgenTons → default for "faktisk udlagt" (ABE-3) |
| writes-to | `asfalt-koersel` | Formand | "Klar til bilbestilling"-signal (ABE-4) |
| writes-to | `vognmand-disponering` | Vognmand | Sendte bestillinger → disponerings-opgaver (ABE-1, ABE-5, ABE-8) |
| writes-to | `fabrik-ordre-koe` | Fabrik | Sendte bestillinger → ordre-kø (ABE-2, ABE-6, ABE-8) |
| writes-to | `PLAN/Asfalttavlen` | — | Sendte bestillinger pr. produkt-celle (ABE-2b, LÅST 2026-06-12) |
| blocks | `afregning` | Formand | Afregning kan ikke køre før produkter er sendt + leveret |

> ⚠️ **ABE-konsistens-flag:** ABE-1/ABE-2/cross-app payloads (FF L2442-L2455) refererer stadig `kind='ekstra'`-rows fra `ekstra_bestillinger`, men Flow 9b (L2167) + FF L2699 siger konstruktet er fjernet og `kind` kollapset til `'morgen'`. **Skal afklares (se spørgsmål E-1 i CONTRACT v2).**

Se `.claude/docs/FUNCTIONAL_FLOWS.md` (ABE-1..8, ABE-2b, Flow 9b, Flow 9c) for cross-app flow-detaljer.

---

## Artefakter

| Type | Fil | Status |
|---|---|---|
| Section manifest | `.claude/sections/formand/asfaltbestilling.md` | exists (denne fil — re-scoped 2026-06-18) |
| Datafelter | `.claude/docs/DATA_FIELDS.md` (sektion Asfaltbestilling) | exists (re-scoped 2026-06-18) |
| UX-flows | `Docs/Formand/asfaltbestilling/FLOWS.md` | exists (v1 — afventer architect-revision i dev) |
| Cross-app flows | `.claude/docs/FUNCTIONAL_FLOWS.md` (ABE-1..8, 2b, Flow 9b/9c) | exists |
| Kickoff | `Docs/Formand/asfaltbestilling/KICKOFF.md` | exists (v1 DRAFT) |
| Validation contract v1 (FROZEN ref) | `Docs/Formand/asfaltbestilling/CONTRACT.v1-frozen.md` | bevaret som historik |
| Validation contract v2 | `Docs/Formand/asfaltbestilling/CONTRACT.md` | exists (v2 DRAFT — afventer sign-off) |
| SPECs | `Docs/Formand/asfaltbestilling/SPEC_*.md` | 0/9 (architect-fase) |

---

## Roller der bruger sektionen

| Rolle | Adgang | Notes |
|---|---|---|
| Formand | full | Ejer sektionen |
| Vognmand | read-only-derived | Ser disponerings-opgaver fra `transport_orders` (ABE-1/5/8), ikke selve sektionen |
| Chauffør | hidden | Modtager downstream multi-produkt-loading-flow via vognmand |
| Fabrik | read-only-derived | Ser ordre-køen via `transport_orders` (ABE-2/6/8), ikke selve sektionen |
| Kunde | hidden | — |

---

## Out-of-scope (egne sektioner — IKKE asfaltbestilling)

- Asfalt kørsel / Bilbehov-dashboard (`#L2138-L2992`)
- Materiel-sektion
- `dagAfregning` / Afregning-mode
- Pinnede opstarts-læs / startrækkefølge
- Udførsel-mode

---

## Notes

- V3 design låst 2026-05-21; datovælger-unify 2026-06-15; Flow 9b 2026-06-09; Flow 9c 2026-06-18
- `getEffectiveTons(d) = d.tonsPlanned + (d.ekstraTons?.tons ?? 0)` er kanonisk total i ALLE downstream-beregninger (FF L2172) — ProductBoxV2 viser fortsat KUN originalt `tonsPlanned`
- `restoreDay`-bug bevaret i prototype (self-lookup via `activeProductId`) → fix i build til ren `(dayId)`-self-lookup (D-K)
- Åbne forretnings-spørgsmål: B-1..B-7 + E-1 (ABE-konsistens) — se CONTRACT v2 §9
