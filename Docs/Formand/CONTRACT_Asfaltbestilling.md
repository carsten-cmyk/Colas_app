---
section: asfaltbestilling
app: formand
tab: planlaegning
phase: dev-ready
created: 2026-05-26
last_updated: 2026-05-26
contract_version: 1.0
status: SIGNED-2026-05-26
frozen: true
signed_by: Carsten
---

# Validation Contract — Asfaltbestilling (Formand · Planlægning-tab)

> **Brug:** Når status = `SIGNED-yyyy-mm-dd` er denne fil **FROZEN**. Architect læser den, builder bygger mod den, reviewer + validator tjekker mod den.
> **Regel:** Builder MÅ IKKE starte uden signed contract. Validator MÅ IKKE editere — kun raise amendment-request.
> **Læs sammen med:**
> - `.claude/sections/formand/asfaltbestilling.md` — komponent-scope
> - `.claude/docs/DATA_FIELDS.md` (sektion: Asfaltbestilling) — felter, validation, Supabase-mapping
> - `Docs/Formand/FLOWS_Asfaltbestilling.md` — alle 9 UX-flows
> - `.claude/docs/FUNCTIONAL_FLOWS.md` (ABE-1..8) — cross-app kontrakt
> - `.claude/docs/STATUS_VOKABULAR.md` — låst 2026-05-26
> - `.claude/docs/DATOFORMAT.md` — låst 2026-05-26
> - `Docs/Formand/KICKOFF_Asfaltbestilling.md` — forretnings-scope

---

## Identitet

- **Sektion:** Asfaltbestilling
- **App:** Formand
- **Manifest:** `.claude/sections/formand/asfaltbestilling.md`
- **Kickoff:** `Docs/Formand/KICKOFF_Asfaltbestilling.md`
- **Status:** `DRAFT`
- **Contract-version:** 1.0
- **Godkendt af Carsten:** `[ ] Dato: ___`

---

## Cross-cutting blockers — HARD GATE

Builder MÅ IKKE starte hvis nogen af disse er åbne:

- [x] **Status-vokabular låst** (2026-05-26) — `TransportOrderStatus`, `AflysningsAarsag`, `ProduktTilstand` eksisterer i `shared/types/`
- [x] **Datoformat låst** (2026-05-26) — `formatLongDate`, `formatLongDateWithDay`, `formatDateTime` skal eksistere i `shared/utils/dateFormat.ts`
- [~] **Multi-produkt-på-bil kerne låst** (2026-05-19) — 4 opfølgnings-spg. = `TBD-refinement`, ikke blocker for build
- [N/A] **Auth/RLS-model** — sektionen har ingen rolle-differentiering INDE i sektionen (kun formand ser den). Auth dækkes på app-niveau.

> **Status:** ✅ Builder må starte når contract er signed.

---

## Domæne-invariants

> Disse er ufravigelige regler. Brydes én → bug, ikke et legitimt edge-case.

| # | Invariant | Type |
|---|---|---|
| INV-1 | `activeProductId` og `selectedPlanDate` er **controlled fra parent** (`OrdrePlanScreen`) — container ejer dem ikke, den propagerer kun via callbacks | SKAL-ALTID |
| INV-2 | Auto-skift af `activeProductId` (når current ikke matcher noget produkt på `selectedPlanDate`) sker i `useAsfaltbestilling` — **aldrig** i container eller anden komponent | SKAL-ALTID |
| INV-3 | `isSent === true` låser `tonsPlanned`-input, `morgenTons`-input, og `samlesPaaEnBil`-checkbox. Vejr-toggle (C4) og aflys-knap (C2) forbliver aktive | SKAL-ALTID |
| INV-4 | Send-batch er **atomar** pr. `(orderId, selectedPlanDate)`: alle ikke-sendte morgen-bestillinger + alle ikke-sendte ekstra-bestillinger (med `tons > 0` og `productId !== ''`) sendes sammen. Fejler én → ingen `transport_orders` oprettes, ingen `ekstra.sent` opdateres | SKAL-ALTID |
| INV-5 | Kommentar er pr. (orderId, date)-batch — **aldrig** pr. row. Samme `kommentar`-streng gemmes på alle `transport_orders` der oprettes i samme batch | SKAL-ALTID |
| INV-6 | Aflysning nulstiller `tonsPlanned` til `0` men bevarer `morgenTons` for audit. `restoreDay` bringer **ikke** `tonsPlanned` tilbage — formand skal genindtaste | SKAL-ALTID |
| INV-7 | Sum-validering `sum(tonsPlanned) ≤ tonsTotal` er **soft warning**, må aldrig blokere send | MÅ-ALDRIG (blokere) |
| INV-8 | Dato-piller bruger `formatLongDateWithDay` (fx `mandag 16. marts 2026`) jf. DATOFORMAT.md | SKAL-ALTID |
| INV-9 | `puljelaes`, `multilaes`, `andreOrdrer` på `ekstra_bestillinger` vises **aldrig** i denne sektions UI — kun data-flags for vejeseddel/afregning | MÅ-ALDRIG (vises) |
| INV-10 | `transport_orders` skrives kun med `status = 'afventer'` fra denne sektion. `'bekraeftet'` sættes af fabrik/vognmand (ikke her) | SKAL-ALTID |

---

## 1. Accept-kriterier (BDD-format)

> Hvert kriterium har unique ID `ASF-NNN`. Klassifikation:
> - **TESTBAR** = Playwright/Vitest kan checke automatisk
> - **VISUEL** = screenshot-diff mod prototype-baseline
> - **HUMAN** = kræver manuel verifikation (forretningsregel)

---

### Flow C1 — Send-bestilling-flow

#### ASF-001 — Klik "Send til fabrik" åbner bekræftelses-modal

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    SendTilFabrikCTA + SendBekraeftelsesModal

GIVEN:        mindst én ikke-sendt produkt-bestilling for `selectedPlanDate` med `morgenTons > 0`
AND:          ingen in-flight send-batch
WHEN:         bruger klikker "Send til fabrik"-CTA
THEN:         `SendBekraeftelsesModal` rendres med `open=true`
AND:          kommentar-textarea er tom (lokal state reset)
AND:          fokus er flyttet til kommentar-textarea for tilgængelighed
```

#### ASF-002 — Bekræftelse i modal udløser atomic batch-send

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    SendBekraeftelsesModal + useAsfaltbestilling

GIVEN:        modal er åben med kommentar="Husk indkørsel via Nord"
AND:          dagen har 2 morgen-bestillinger (`morgenTons > 0`) og 1 ekstra-bestilling (`tons > 0`, `productId !== ''`)
WHEN:         bruger klikker "Send til fabrik" i modalen
THEN:         `sendAlleForSelectedDate("Husk indkørsel via Nord")` kaldes
AND:          3 `transport_orders` INSERTes (2 kind='morgen' + 1 kind='ekstra')
AND:          alle 3 rækker har `status='afventer'`, `kommentar="Husk indkørsel via Nord"`
AND:          de 2 `day_plans` og 1 `ekstra_bestilling` markeres som sendt (UI-derived `isSent=true`)
AND:          modal lukker
AND:          alle 3 produkt-/ekstra-bokse skifter til read-only-tilstand jf. INV-3
```

#### ASF-003 — Atomic batch ruller hele tilbage ved fejl

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    useAsfaltbestilling.sendAlleForSelectedDate

GIVEN:        3 ikke-sendte rækker klar til send (2 morgen + 1 ekstra)
AND:          mock-server returnerer 500 på den anden INSERT
WHEN:         `sendAlleForSelectedDate("test")` kaldes
THEN:         ingen `transport_orders` rækker oprettes (rollback)
AND:          `ekstra_bestillinger.sent` opdateres ikke for nogen
AND:          retur-objektet er `{ created: [], skipped: [], errors: [{ id, message }] }`
AND:          error-toast vises: "X bestillinger nåede ikke frem — prøv igen"
AND:          alle 3 bokse forbliver i ikke-sendt-tilstand
```

#### ASF-004 — Sum-warning vises i modal når `sum(tonsPlanned) > tonsTotal`

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    SendBekraeftelsesModal

GIVEN:        produkt har `tonsTotal = 100`
AND:          `sum(tonsPlanned)` på alle dage = 110
WHEN:         modal åbnes via "Send til fabrik"-CTA
THEN:         warning-element rendres i modalen: "OBS: 10 tons over total plan (110/100)"
AND:          "Send til fabrik"-knappen er stadig enabled (soft warning, jf. INV-7)
AND:          warning er placeret over kommentar-textareaen, ikke over knappen
```

#### ASF-005 — Optimistic UI viser sentstate i 5s, derefter rollback hvis ingen ack

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    useAsfaltbestilling + SendTilFabrikCTA

GIVEN:        bruger klikker "Send til fabrik" i modalen
AND:          backend svarer ikke inden for 5000ms
WHEN:         5s timeout udløber uden ack
THEN:         optimistic sentstate rulles tilbage
AND:          bokse vender tilbage til ikke-sendt-tilstand
AND:          error-toast vises: "Bestillingen kunne ikke afsendes — prøv igen"
AND:          form-state (tons-inputs, kommentar) bevares så formand ikke skal re-indtaste
```

#### ASF-006 — CTA er disabled mens batch er in-flight

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    SendTilFabrikCTA

GIVEN:        modal er åben, bruger har klikket "Send til fabrik"
AND:          batch er in-flight (ikke ack endnu)
WHEN:         bruger forsøger at åbne modal igen (klik på CTA)
THEN:         CTA er disabled + viser loading-spinner
AND:          modal kan ikke åbnes (preventet dobbelt-send, jf. D2)
```

#### ASF-007 — Kommentar-tooltip vises under CTA efter send

```
TYPE:         VISUEL
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    SendTilFabrikCTA

GIVEN:        dagen er sendt med `kommentar="Husk indkørsel via Nord"`
WHEN:         bruger hovrer over `SendTilFabrikCTA`
THEN:         tooltip vises med kommentar-teksten
AND:          screenshot-diff mod baseline < 1.0%
```

#### ASF-008 — Ekstra-bestilling med tom `productId` skips, advarsel vises

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    useAsfaltbestilling.sendAlleForSelectedDate

GIVEN:        1 morgen-bestilling klar + 2 ekstra-bestillinger, hvoraf én har `productId=''`
WHEN:         `sendAlleForSelectedDate("")` kaldes
THEN:         2 `transport_orders` INSERTes (1 morgen + 1 ekstra med productId)
AND:          retur-objektet er `{ created: [...2 ids...], skipped: [{ id: "ekstra-id-uden-product", reason: "missing_product" }], errors: [] }`
AND:          warning-toast vises: "1 ekstra-bestilling blev ikke sendt — mangler produkt"
AND:          ekstra-row uden productId forbliver `sent=false`
```

---

### Flow C2 — Aflys-produkt-dag-flow

#### ASF-009 — Klik X åbner reason-picker

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    ProductBoxV2

GIVEN:        `ProductBoxV2` rendres i Default-mode for dag X
WHEN:         bruger klikker X-knappen øverst-højre
THEN:         container sætter `cancellingDayId = day.id`
AND:          boksen re-rendres i Reason-picker-mode med 4 årsags-knapper (Regn, Frost, Underlag, Andet)
AND:          tons-inputs er skjult i denne mode
```

#### ASF-010 — Vælg årsag aflyser dagen og opdaterer state

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    ProductBoxV2 + useAsfaltbestilling.cancelDay

GIVEN:        Reason-picker er åben for dag X med `morgenTons=12, tonsPlanned=15`
WHEN:         bruger klikker "Regn"-knappen
THEN:         `cancelDay(productId, dayId, 'regn')` kaldes
AND:          `day_plans` UPDATE: `cancelled=true, cancel_reason='regn', tons_planned=0` (jf. INV-6)
AND:          `morgenTons` bevares = 12 (audit)
AND:          boksen re-rendres i Aflyst-mode (opacity-60, bad-border)
AND:          `StatusPill.kind='aflyst'`
AND:          `cancellingDayId` nulstilles til `null`
```

#### ASF-011 — `AflysningsAarsag='andet'` kræver fritekst-note

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    ProductBoxV2 (Reason-picker-mode med "Andet"-valg)

GIVEN:        Reason-picker er åben, bruger klikker "Andet"
WHEN:         "Andet" er valgt
THEN:         fritekst-felt vises (max 200 tegn jf. D1)
AND:          "Bekræft"-knap er disabled indtil mindst 1 tegn er skrevet
WHEN:         bruger skriver "Beskadiget asfalt fundet" og klikker Bekræft
THEN:         `cancelDay(productId, dayId, 'andet')` kaldes med `cancel_reason_note="Beskadiget asfalt fundet"`
AND:          `day_plans.cancel_reason_note` persisteres
```

#### ASF-012 — Blur-luk på reason-picker

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    ProductBoxV2 (Reason-picker-mode)

GIVEN:        Reason-picker er åben for dag X
WHEN:         bruger klikker udenfor boksen (på baggrunden eller anden komponent)
THEN:         `cancellingDayId` nulstilles til `null`
AND:          boksen vender tilbage til forrige mode (Default eller Sent+aktiv)
AND:          ingen aflysning er sket
```

#### ASF-013 — Cascade-aflysning af allerede sendt dag fires ABE-5 + ABE-6

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    useAsfaltbestilling.cancelDay

GIVEN:        dag X er sendt (mindst én `transport_order` med `day_plan_id = X.id`)
WHEN:         `cancelDay(productId, X.id, 'regn')` kaldes
THEN:         `day_plans` UPDATE: cancelled=true, cancel_reason='regn'
AND:          relevante `transport_orders` får cancel-payload (soft-cancel cascade jf. C2-default)
AND:          ABE-5 fires: vognmand notificeres
AND:          ABE-6 fires: fabrik notificeres
AND:          UI: boksen er stadig i Sendt+aktiv-mode VISUELT men nu med Aflyst-mode overlay (aflyst vinder)
```

#### ASF-014 — Når alle produkter på dagen aflyses, skifter `selectedPlanDate`

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    AsfaltbestillingSection + useAsfaltbestilling

GIVEN:        `selectedPlanDate = '2026-03-16'`, dagen har 1 ikke-aflyst produkt tilbage
WHEN:         bruger aflyser sidste produkt på dagen
THEN:         dato-pillen for `2026-03-16` forsvinder fra `DatePillsRow`
AND:          `selectedPlanDate` skifter automatisk til nærmeste fremtidige dato i `planDays` med mindst ét ikke-aflyst produkt
AND:          hvis ingen fremtidig dato findes, skifter til nærmeste tidligere dato
AND:          hvis ingen lovlig dato findes, vises empty-state "Alle dage aflyst"
```

---

### Flow C3 — Fortryd-aflysning-flow

#### ASF-015 — "Fortryd"-link reaktiverer dagen lokalt

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    ProductBoxV2 (Aflyst-mode) + useAsfaltbestilling.restoreDay

GIVEN:        dag X er aflyst med `cancel_reason='regn', tons_planned=0, morgen_tons=12`
WHEN:         bruger klikker "Fortryd"-link i Aflyst-mode
THEN:         `restoreDay(dayId)` kaldes (NB: signatur er `(dayId)` med self-lookup, ikke `(productId, dayId)` — fix af prototype-bug jf. C10)
AND:          `day_plans` UPDATE: cancelled=false, cancel_reason=null, cancel_reason_note=null
AND:          `tons_planned` forbliver 0 (INV-6 — formand skal genindtaste)
AND:          `morgen_tons` forbliver 12
AND:          boksen re-rendres i Default-mode med tons-input = 0
AND:          `StatusPill.kind='afventer'` med label='Klar til afsendelse' (fordi morgenTons != null)
```

#### ASF-016 — Cascade ved restore IKKE fires

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    useAsfaltbestilling.restoreDay

GIVEN:        dag X var sendt og derefter aflyst (cascade fyret via ABE-5/6)
WHEN:         bruger klikker "Fortryd"
THEN:         INGEN cascade fires til vognmand/fabrik (jf. C3-default)
AND:          UI viser advarsel: "Dagen er reaktiveret lokalt. Hvis du vil sende den til fabrik igen, klik 'Send til fabrik'."
AND:          dagen er nu i `'afventer'`-state (UI-derived) indtil re-send
```

---

### Flow C4 — Vejr-toggle-flow

#### ASF-017 — Vejr-toggle persisterer på `day_plans.weather_active`

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    ProductBoxV2 + useAsfaltbestilling.toggleWeather

GIVEN:        dag X har `weather_active=false`
WHEN:         bruger klikker vejr-ikon nederst-højre på `ProductBoxV2`
THEN:         `toggleWeather(productId, dayId, true)` kaldes
AND:          `day_plans.weather_active=true` persisteres
AND:          ikon-styling skifter fra `bg-[#F5F5F5]` til `bg-dark-teal`
```

#### ASF-018 — Vejr-toggle tilladt på sendt dag

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    ProductBoxV2 (Sent+aktiv-mode) + useAsfaltbestilling.toggleWeather

GIVEN:        dag X er sendt (`isSent=true`)
WHEN:         bruger klikker vejr-ikon
THEN:         toggle fungerer (ikke locked jf. C7)
AND:          `day_plans.weather_active` opdateres
AND:          ABE-8 fires: vognmand + fabrik får opdateret flag
```

#### ASF-019 — Vejr-toggle visuelle states

```
TYPE:         VISUEL
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    ProductBoxV2 (vejr-toggle)

GIVEN:        `ProductBoxV2` rendres
THEN:         Inactive state: `bg-[#F5F5F5]` + grå ikon, screenshot-diff < 0.5%
AND:          Active state (`day.weather_active=true`): `bg-dark-teal` + hvid ikon, screenshot-diff < 0.5%
```

---

### Flow C5 — Samles-på-en-bil-flow

#### ASF-020 — Samles-checkbox persisterer på `day_plans.samles_paa_en_bil`

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    ProductBoxV2 + useAsfaltbestilling.toggleSamlesPaaEnBil

GIVEN:        dag X har `samles_paa_en_bil=false`
WHEN:         bruger klikker "Samles på en bil"-checkbox
THEN:         `toggleSamlesPaaEnBil(productId, dayId, true)` kaldes
AND:          `day_plans.samles_paa_en_bil=true` persisteres
AND:          ABE-7 fires til vognmand
```

#### ASF-021 — Samles-checkbox er locked på sendt dag

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    ProductBoxV2 (Sent+aktiv-mode)

GIVEN:        dag X er sendt (`isSent=true`)
WHEN:         bruger forsøger at klikke samles-checkbox
THEN:         checkbox er disabled (read-only)
AND:          ingen state-mutation sker
AND:          tooltip eller visuel cue: "Bilbestilling sendt — ring til fabrik for ændringer" (jf. C8-default)
```

#### ASF-022 — Samles-flag på ekstra-bestilling

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    EkstraBestillingBox + useEkstraBestilling.updateEkstra

GIVEN:        ekstra-row med `samles_paa_en_bil=false`
WHEN:         bruger toggler samles-checkbox
THEN:         `updateEkstra(id, { samlesPaaEnBil: true })` kaldes
AND:          `ekstra_bestillinger.samles_paa_en_bil=true` persisteres
```

---

### Flow C6 — Ekstra-bestilling-flow

#### ASF-023 — Klik "+ Ekstra" opretter tom row

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    EkstraBestillingCTA + useEkstraBestilling.addEkstra

GIVEN:        `productsForSelectedDate.length > 0`, dvs. CTA er synlig (B8)
WHEN:         bruger klikker "+ Ekstra"
THEN:         `addEkstra()` kaldes
AND:          ny `ekstra_bestillinger` INSERT: `order_id`, `date=selectedPlanDate`, `product_id=NULL`, `tons=0`, `samles_paa_en_bil=false`, `puljelaes=false`, `multilaes=false`, `sent=false`
AND:          ny `EkstraBestillingBox` rendres i Default-mode med tom productId-dropdown og tons=0
```

#### ASF-024 — Ekstra-CTA er skjult når ingen produkter på dagen

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    AsfaltbestillingSection + EkstraBestillingCTA

GIVEN:        `productsForSelectedDate.length === 0`
WHEN:         sektionen rendres
THEN:         `EkstraBestillingCTA` rendres ikke
AND:          empty-state "Ingen produkter denne dag" vises i stedet (rendret af container)
```

#### ASF-025 — Ekstra-CTA er synlig når alle produkter er aflyste

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    AsfaltbestillingSection + EkstraBestillingCTA

GIVEN:        `productsForSelectedDate.length > 0`, men alle produkter har `cancelled=true`
WHEN:         sektionen rendres
THEN:         `EkstraBestillingCTA` er stadig synlig (B8-default: altid synlig når der er produkter på dagen)
AND:          aflyste produkt-bokse rendres i Aflyst-mode
```

---

### Flow C7 — Sletning-af-ekstra-flow

#### ASF-026 — Slet ikke-sendt ekstra

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    EkstraBestillingBox + useEkstraBestilling.removeEkstra

GIVEN:        ekstra-row eksisterer med `sent=false`
WHEN:         bruger klikker X-knap øverst på ekstra-boksen
THEN:         `removeEkstra(id)` kaldes
AND:          `ekstra_bestillinger` row DELETEs
AND:          boksen forsvinder fra UI
```

#### ASF-027 — Slet sendt ekstra IKKE tilladt

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    EkstraBestillingBox (Sendt-mode)

GIVEN:        ekstra-row har `sent=true`
WHEN:         boksen rendres
THEN:         X-knap er ikke synlig (jf. C9-default)
AND:          ingen DELETE-mulighed fra UI
```

---

### Flow C8 — Dato-pille-skift-flow

#### ASF-028 — Klik dato-pille opdaterer `selectedPlanDate`

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    DatePillsRow

GIVEN:        `DatePillsRow` rendres med 5 piller, `selectedPlanDate='2026-03-16'`
WHEN:         bruger klikker pille `'2026-03-18'`
THEN:         `onSelect('2026-03-18')` kaldes
AND:          parent `setSelectedPlanDate('2026-03-18')` kaldes
AND:          `productsForSelectedDate` rekalkuleres for ny dato
AND:          `activeProductId` auto-skiftes via `useAsfaltbestilling`-effect hvis nuværende ikke matcher (INV-2)
```

#### ASF-029 — Dato-piller bruger `formatLongDateWithDay`

```
TYPE:         VISUEL
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    DatePillsRow

GIVEN:        pille for `'2026-03-16'` (mandag)
WHEN:         pille rendres
THEN:         tekst i pille = `"mandag 16. marts 2026"` jf. INV-8 + DATOFORMAT.md
AND:          screenshot-diff mod baseline < 1.0%
```

#### ASF-030 — Pille-status afspejler `sentStateByDate`

```
TYPE:         VISUEL
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    DatePillsRow + useAsfaltbestilling.sentStateByDate

GIVEN:        dato D har 2 produkter, begge sendt
THEN:         pille for D rendres med `bg-good` + CheckCircle2-ikon (`all-sent`-state)
AND:          screenshot-diff < 1.0%

GIVEN:        dato D har 2 produkter, 1 sendt + 1 ikke
THEN:         pille rendres med `partial`-styling (TBD: design ikke explicit i prototype — bekræft i Fase build)
```

---

### Flow C9 — Read-only-efter-send-flow

#### ASF-031 — `isSent=true` låser inputs på `ProductBoxV2`

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    ProductBoxV2

GIVEN:        `transport_order` eksisterer for dayId, dvs. `isSent=true`
WHEN:         boksen rendres
THEN:         Forventet-input er disabled (jf. INV-3)
AND:          Morgen-input er disabled
AND:          samles-checkbox er disabled
AND:          vejr-toggle er stadig aktiv (jf. ASF-018)
AND:          X-aflys-knap er stadig aktiv (jf. ASF-013)
AND:          produkt-header-klik virker stadig (driver Spec-grid fokus)
```

#### ASF-032 — `EkstraBestillingBox.sent=true` skjuler alle write-elementer

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    EkstraBestillingBox

GIVEN:        ekstra-row med `sent=true`
WHEN:         boksen rendres
THEN:         tons-input er disabled
AND:          productId-dropdown er disabled
AND:          samles-checkbox er disabled
AND:          X-slet-knap er skjult (jf. ASF-027)
AND:          E-badge + read-only tons + produkt-navn + (evt.) samles-indikator vises
```

---

### Cross-app writes (ABE-1 til ABE-8)

#### ASF-033 — ABE-1: Send-batch skriver `transport_orders` for vognmand

```
TYPE:         TESTBAR
ROLLE:        formand → vognmand (cross-app)
OFFLINE:      tilladt-write-queue
COMPONENT:    useAsfaltbestilling.sendAlleForSelectedDate

GIVEN:        2 morgen-bestillinger + 1 ekstra klar til send
WHEN:         `sendAlleForSelectedDate("test")` lykkes
THEN:         3 `transport_orders` rækker eksisterer i DB med korrekte felter:
              - `order_id`, `date`, `kind`, `tons`, `product_id`, `samles_paa_en_bil`, `weather_active`, `kommentar="test"`, `sent_at=NOW()`, `status='afventer'`
AND:          vognmand-disponering kan queryer rækkerne (verificeres via integration-test)
```

#### ASF-034 — ABE-2: Send-batch er læsbar for fabrik

```
TYPE:         TESTBAR
ROLLE:        formand → fabrik (cross-app)
OFFLINE:      n/a
COMPONENT:    transport_orders schema + JOIN på products

GIVEN:        send-batch lykkes
WHEN:         fabrik queryer `transport_orders JOIN products`
THEN:         resultatet inkluderer alle 3 nye rækker
AND:          hver række har join'ed `recipe_code`, `recipe_name`, `factory_code`
```

#### ASF-035 — ABE-3: Morgen-tons pre-fyldes i Udførsel-dagsoverblik

```
TYPE:         TESTBAR
ROLLE:        formand (cross-section samme app)
OFFLINE:      n/a
COMPONENT:    useAsfaltbestilling.sendAlleForSelectedDate → Formand.UdfoerselDagsoverblik

GIVEN:        morgen-bestilling sendt for produktet med `morgen_tons=12`
WHEN:         formand åbner Udførsel-dagsoverblik for samme `(orderId, date, productId)`
THEN:         "faktisk udlagt"-input er pre-fyldt med `12`
AND:          formand kan stadig overskrive værdien manuelt
AND:          hvis manuel værdi allerede er sat, beholder den (pre-fill overskriver IKKE)
```

#### ASF-036 — ABE-4: AsfaltKoersel markerer dagen som "klar til bilbestilling"

```
TYPE:         TESTBAR
ROLLE:        formand (cross-section samme app)
OFFLINE:      n/a
COMPONENT:    useAsfaltbestilling.sendAlleForSelectedDate → AsfaltKoersel-sektion

GIVEN:        mindst én morgen-bestilling sendt for dato D
WHEN:         formand scroller til AsfaltKoersel-sektion på samme skærm
THEN:         dato D er markeret som "klar til bilbestilling" (UI-cue)
AND:          total_tons_for_date = aggregeret morgen-tons af alle sendte produkter for dagen
```

#### ASF-037 — ABE-5: CancelDay efter send fires soft-cancel cascade til vognmand

```
TYPE:         TESTBAR
ROLLE:        formand → vognmand (cross-app)
OFFLINE:      tilladt-write-queue
COMPONENT:    useAsfaltbestilling.cancelDay

GIVEN:        dag X er sendt med `transport_order` eksisterende
WHEN:         `cancelDay(productId, X.id, 'regn')` kaldes
THEN:         `day_plans.cancelled=true, cancel_reason='regn'`
AND:          `transport_orders` der peger på X.id får cancel-payload (soft-cancel — verificeres via integration-test mod vognmand-receiver)
AND:          notification-event sendes til vognmand: "Dagens bestilling for [adresse] er aflyst (årsag: regn)"
```

#### ASF-038 — ABE-6: CancelDay efter send fires til fabrik

```
TYPE:         TESTBAR
ROLLE:        formand → fabrik (cross-app)
OFFLINE:      tilladt-write-queue
COMPONENT:    useAsfaltbestilling.cancelDay

GIVEN:        dag X er sendt
WHEN:         `cancelDay(...)` kaldes
THEN:         fabrik-receiver modtager event med `day_plan_id` + `cancel_reason`
AND:          relevante `transport_orders` markeres som aflyst i fabrik-kø-view
```

#### ASF-039 — ABE-7: ToggleSamlesPaaEnBil fires til vognmand

```
TYPE:         TESTBAR
ROLLE:        formand → vognmand (cross-app)
OFFLINE:      tilladt-write-queue
COMPONENT:    useAsfaltbestilling.toggleSamlesPaaEnBil

GIVEN:        dag X har `samles_paa_en_bil=false`, ikke sendt endnu
WHEN:         `toggleSamlesPaaEnBil(productId, X.id, true)` kaldes
THEN:         `day_plans.samles_paa_en_bil=true` persisteres
AND:          vognmand-receiver ser flag når næste `transport_order` ankommer (eller real-time hvis allerede sendt)
```

#### ASF-040 — ABE-8: ToggleWeather fires til vognmand + fabrik

```
TYPE:         TESTBAR
ROLLE:        formand → vognmand + fabrik (cross-app)
OFFLINE:      tilladt-write-queue
COMPONENT:    useAsfaltbestilling.toggleWeather

GIVEN:        dag X har `weather_active=false`
WHEN:         `toggleWeather(productId, X.id, true)` kaldes
THEN:         `day_plans.weather_active=true` persisteres
AND:          vognmand-receiver opdaterer "Vejr-påvirket"-flag i UI
AND:          fabrik-receiver opdaterer flag i kø-view
AND:          ingen automatisk re-disponering eller minus-regn-fradrag (jf. INV — ren information)
```

---

### Status-vokabular usage

#### ASF-041 — `TransportOrder.status='afventer'` ved INSERT

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    useAsfaltbestilling.sendAlleForSelectedDate

GIVEN:        send-batch udløses
WHEN:         `transport_orders` INSERT'es
THEN:         hver row har `status='afventer'` (jf. INV-10 + STATUS_VOKABULAR §5)
AND:          ALDRIG `status='bekraeftet'` direkte (det sættes af fabrik/vognmand i deres egen sektion)
```

#### ASF-042 — `AflysningsAarsag` enum-værdier matcher præcist

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    ProductBoxV2 Reason-picker + useAsfaltbestilling.cancelDay

GIVEN:        Reason-picker rendres
THEN:         4 knapper med labels: "Regn", "Frost", "Underlag", "Andet"
AND:          ved klik kaldes `cancelDay` med præcis enum-værdi: `'regn' | 'frost' | 'underlag' | 'andet'` (lowercase, snake_case-style, jf. STATUS_VOKABULAR §8)
AND:          DB-write bruger samme enum-værdier
```

#### ASF-043 — `StatusPill.kind` er UI-derived, ikke persisteret

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    StatusPill + AsfaltbestillingSection

GIVEN:        dag X med `cancelled=true, isSent=false`
THEN:         `StatusPill.kind='aflyst'`

GIVEN:        dag X med `cancelled=false, isSent=true`
THEN:         `StatusPill.kind='sendt'`

GIVEN:        dag X med `cancelled=false, isSent=false, morgenTons=null`
THEN:         `StatusPill.kind='afventer', afventerLabel='Indtast morgen'`

GIVEN:        dag X med `cancelled=false, isSent=false, morgenTons=12`
THEN:         `StatusPill.kind='afventer', afventerLabel='Klar til afsendelse'`

AND:          ingen `pillKind`-felt persisteres i DB (kun beregnes per render)
```

---

### Dato-format

#### ASF-044 — ISO storage på alle dato-felter

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    useAsfaltbestilling + useEkstraBestilling

GIVEN:        formand opretter en ny dag/ekstra/transport_order
THEN:         alle date-felter persisteres som ISO `yyyy-mm-dd` (jf. DATOFORMAT.md)
AND:          `sent_at`, `confirmed_at`, `cancelled_at` persisteres som ISO 8601 + TZ
AND:          ingen storage i andet format (fx `dd/mm/yyyy`)
```

#### ASF-045 — Lang-format display med ugedag i dato-piller

```
TYPE:         VISUEL
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    DatePillsRow

GIVEN:        pille for `'2026-03-16'`
THEN:         tekst = "mandag 16. marts 2026" (formatLongDateWithDay)
AND:          ALDRIG "16/3" eller "2026-03-16" (jf. feedback_global_date_format + INV-8)
```

---

### Visual baseline-kriterier

#### ASF-046 — Visual baseline: alle komponent-states

```
TYPE:         VISUEL
ROLLE:        formand
OFFLINE:      n/a
COMPONENT:    alle 8 presenter-komponenter

GIVEN:        prototype-baseline genereret via `?prototype=1`-route
THEN:         visual diff for hver komponent + state < threshold:
              - ProductBoxV2 default/focused/sent/cancelled/reason-picker/with-tags/weather-active: 0.5%
              - EkstraBestillingBox default/sent: 0.5%
              - StatusPill sendt/afventer/aflyst: 0.5%
              - DatePillsRow normal/selected/all-sent: 1.0%
              - SendTilFabrikCTA enabled/disabled/with-tooltip: 1.0%
              - SendBekraeftelsesModal default/with-warning: 1.0%
              - EkstraBestillingCTA default: 0.5%
              - AsfaltbestillingSection full-render: 2.0%
```

---

### Offline-opførsel

#### ASF-047 — Write-queue ved offline-send

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      tilladt-write-queue
COMPONENT:    useAsfaltbestilling.sendAlleForSelectedDate

GIVEN:        bruger er offline (DevTools throttle = Offline)
WHEN:         `sendAlleForSelectedDate("test")` kaldes
THEN:         batch køes i write-queue
AND:          UI viser optimistisk sentstate på alle bokse
AND:          OfflineBanner er synlig (app-level)
AND:          ved reconnect: batch replayes
AND:          hvis server afviser hele batch: fuld rollback (jf. D4) + toast "X bestillinger nåede ikke frem"
```

#### ASF-048 — Cached reads ved offline

```
TYPE:         TESTBAR
ROLLE:        formand
OFFLINE:      read-only-cached
COMPONENT:    useAsfaltbestilling

GIVEN:        bruger har tidligere besøgt sektionen + er nu offline
WHEN:         sektionen åbnes
THEN:         products + day_plans + ekstra_bestillinger vises fra cache
AND:          OfflineBanner er synlig
AND:          alle write-actions køes (ikke blokeret)
```

---

## 2. Out-of-scope

> Eksplicit IKKE en del af denne sektion. Builder må ikke "fixe" disse.

- **Afregnings-logik** — `puljelaes`, `multilaes`, `andreOrdrer` er data-flags i `ekstra_bestillinger`-tabellen, men UI'en hører til Afregning-sektionen.
- **Returlæs-håndtering** — separat flow (`project_returlaes_diskussion`)
- **Vognmand-disponerings-UI** — separat sektion. Asfaltbestilling skriver kun `transport_orders`.
- **Fabrik-ordre-kø-UI** — kommende sektion.
- **"Bekræftet af fabrik"-state-visualisering** (`confirmed_at`) — hører til Kørsel-sektionen (jf. C11).
- **Historik / audit-log** — ingen view i denne sektion.
- **Edit-cascade efter send** (ud over vejr-toggle + aflysning) — locked, formand ringer til fabrik.
- **Multi-formand-konflikt-UX** — server-side optimistic locking + 409 → toast + refetch er det vi går med. Mere avanceret konflikt-UI hører til en tværgående sync-sektion.
- **Authentication / RLS-tjek** — app-level auth dækker.
- **Bilberegner / kapacitets-validering** — hører til AsfaltKoersel-sektionen.
- **Cross-app modtager-rendering** (vognmand/fabrik/chauffør-UI) — bygges i deres egne sektion-pakker.

---

## 3. Visual baseline

> Validator sammenligner produktion mod prototype-screenshots. Baseline genereres første gang via `npm run formand:e2e -- --update-snapshots` mod prototype-route.

| Komponent | Baseline-screenshot | Threshold | States dækket |
|---|---|---|---|
| `ProductBoxV2` | `.claude/screenshots/asfaltbestilling/productbox-*.png` | 0.5% | default, focused, sent, cancelled, selecting-reason, with-tags, weather-active |
| `EkstraBestillingBox` | `.claude/screenshots/asfaltbestilling/ekstra-*.png` | 0.5% | default, sent |
| `StatusPill` | `.claude/screenshots/asfaltbestilling/pill-*.png` | 0.5% | sendt, afventer-indtast-morgen, afventer-klar, aflyst |
| `DatePillsRow` | `.claude/screenshots/asfaltbestilling/datepills-*.png` | 1.0% | normal, selected, all-sent, partial |
| `SendTilFabrikCTA` | `.claude/screenshots/asfaltbestilling/sendcta-*.png` | 1.0% | enabled, disabled, with-tooltip |
| `SendBekraeftelsesModal` | `.claude/screenshots/asfaltbestilling/modal-*.png` | 1.0% | default, with-sum-warning |
| `EkstraBestillingCTA` | `.claude/screenshots/asfaltbestilling/ekstracta-*.png` | 0.5% | default |
| `AsfaltbestillingSection` (full) | `.claude/screenshots/asfaltbestilling/section-*.png` | 2.0% | full-render integration |

---

## 4. API-contracts (per komponent)

> Eksakt Props + callbacks pr. komponent. **Bindende.** Builder må IKKE udvide uden contract-amendment.
> Komplet detalje findes i `.claude/docs/DATA_FIELDS.md` (sektion Asfaltbestilling). Her er kun signatur-resumé.

### `AsfaltbestillingSection` (Container)

```typescript
export interface AsfaltbestillingSectionProps {
  orderId: string
  isSamleordreMode: boolean
  samleordreCtx: SamleordreContext | null
  activeProductId: string
  onActiveProductIdChange: (id: string) => void
  selectedPlanDate: string                          // ISO yyyy-mm-dd
  onSelectedPlanDateChange: (date: string) => void
}
```

### `DatePillsRow` (Presenter)

```typescript
export interface DatePillsRowProps {
  dates: string[]                                   // ISO, sorted ASC
  selectedDate: string
  sentStateByDate: Record<string, 'all-sent' | 'partial' | 'none'>
  onSelect: (date: string) => void
}
```

### `ProductBoxV2` (Presenter)

```typescript
export interface ProductBoxV2Props {
  product: MockProduct
  day: DayPlan
  isFocused: boolean
  isSelectingReason: boolean
  isSent: boolean
  ordreTagLabels?: string[]
  onFocus: () => void
  onUpdateTons: (v: number) => void
  onUpdateMorgenTons: (v: number | undefined) => void
  onToggleWeather: (active: boolean) => void
  onToggleSamlesPaaEnBil: (samles: boolean) => void
  onCancel: () => void
  onAbortCancel: () => void
  onConfirmCancel: (reason: AflysningsAarsag, note?: string) => void  // note kun ved 'andet'
  onRestore: () => void
}
```

### `EkstraBestillingBox` (Presenter)

```typescript
export interface EkstraBestillingBoxProps {
  ekstra: EkstraBestilling
  products: MockProduct[]
  onUpdate: (patch: Partial<EkstraBestilling>) => void
  onRemove: () => void
}
```

### `StatusPill` (Presenter)

```typescript
export interface StatusPillProps {
  kind: 'sendt' | 'aflyst' | 'afventer'             // UI-derived
  afventerLabel?: string                            // default 'Afventer'
}
```

### `EkstraBestillingCTA` (Presenter)

```typescript
export interface EkstraBestillingCTAProps {
  onClick: () => void
}
```

### `SendTilFabrikCTA` (Presenter)

```typescript
export interface SendTilFabrikCTAProps {
  disabled: boolean
  totalIkkeSendt: number                            // ≥ 0
  sentKommentar: string | null
  isInFlight: boolean                               // disabled + spinner mens batch in-flight (D2)
  onClick: () => void
}
```

### `SendBekraeftelsesModal` (Presenter)

```typescript
export interface SendBekraeftelsesModalProps {
  open: boolean
  sumWarning: { sum: number; total: number } | null  // null = ingen warning
  onCancel: () => void
  onConfirm: (kommentar: string) => void              // kommentar trimmed
}
```

### `useAsfaltbestilling(orderId)` (Hook)

```typescript
export function useAsfaltbestilling(orderId: string): {
  // State
  products: MockProduct[]
  activeProductId: string
  setActiveProductId: (id: string) => void
  selectedPlanDate: string                          // ISO
  setSelectedPlanDate: (date: string) => void

  // Derived
  planDays: string[]                                // ISO[]
  productsForSelectedDate: Array<{ product: MockProduct; day: DayPlan }>
  orderStartDate: string                            // ISO
  orderEndDate: string                              // ISO
  sentStateByDate: Record<string, 'all-sent' | 'partial' | 'none'>

  // Queries
  isDaySent: (dayId: string) => boolean
  kommentarForDate: (date: string) => string | null

  // Actions
  updateTons: (productId: string, dayId: string, tons: number) => void
  updateMorgenTons: (productId: string, dayId: string, tons: number | undefined) => void
  cancelDay: (productId: string, dayId: string, reason: AflysningsAarsag, note?: string) => void
  restoreDay: (dayId: string) => void               // self-lookup via dayId (C10 fix)
  toggleWeather: (productId: string, dayId: string, active: boolean) => void
  toggleSamlesPaaEnBil: (productId: string, dayId: string, samles: boolean) => void
  sendAlleForSelectedDate: (kommentar: string) => Promise<{
    created: string[]                               // transport_order ids
    skipped: Array<{ id: string; reason: 'missing_product' | 'zero_tons' }>
    errors: Array<{ id: string; message: string }>
  }>

  // Standard
  loading: boolean
  error: Error | null
}
```

### `useEkstraBestilling(orderId, selectedDate)` (Hook)

```typescript
export function useEkstraBestilling(orderId: string, selectedDate: string): {
  ekstraForSelectedDate: EkstraBestilling[]
  addEkstra: () => void
  updateEkstra: (id: string, patch: Partial<EkstraBestilling>) => void
  removeEkstra: (id: string) => void
  isEkstraSent: (id: string) => boolean
  markSent: (ids: string[]) => void                 // callback brugt af useAsfaltbestilling.sendAlleForSelectedDate

  loading: boolean
  error: Error | null
}
```

---

## 5. Offline-opførsel

> Per `project_offline_strategi`: Formand SKAL arbejde offline.

| Operation | Online | Offline | Sync-strategi |
|---|---|---|---|
| Læs products + day_plans + ekstra | Supabase | Cached (IndexedDB) | OfflineBanner vises |
| `updateTons` / `updateMorgenTons` | Supabase write | Write-queue + optimistic UI | Auto-sync ved reconnect |
| `toggleWeather` / `toggleSamlesPaaEnBil` | Supabase write | Write-queue | Auto-sync ved reconnect |
| `cancelDay` / `restoreDay` | Supabase write | Write-queue | Auto-sync; last-write-wins ved konflikt |
| `addEkstra` / `updateEkstra` / `removeEkstra` | Supabase write | Write-queue | Auto-sync |
| `sendAlleForSelectedDate` (batch) | Supabase + cross-app push | Write-queue, optimistisk sentstate + 5s timeout | Auto-sync; **fuld rollback** ved partial-fejl (D4) |

---

## 6. Rolle-adgang

| Rolle | Read | Write | Notes |
|---|---|---|---|
| Formand | ✅ | ✅ | Ejer sektionen — alle 9 flows |
| Vognmand | ❌ (kan ikke se UI) | ❌ | Ser kun resulterende disponerings-opgaver (cross-app via ABE-1/5/7/8) |
| Chauffør | ❌ | ❌ | Modtager downstream multi-produkt-loading-flow (ABE-7) |
| Fabrik | ❌ (kan ikke se UI) | ❌ | Ser kun ordre-kø (ABE-2/6/8) |
| Kunde | ❌ | ❌ | Skjult |

**RLS-tjek:** Dækkes på app-niveau. Sektionen behøver ingen ekstra rolle-tjek.

---

## 7. Test-strategi

### 7.1 — Unit (Vitest)

| Target | Coverage-mål | Fokus |
|---|---|---|
| `useAsfaltbestilling` reducer | 90% lines | Alle actions: updateTons, updateMorgenTons, cancelDay, restoreDay, toggleWeather, toggleSamlesPaaEnBil + auto-skift af activeProductId |
| `useEkstraBestilling` reducer | 90% lines | addEkstra, updateEkstra, removeEkstra, markSent |
| `sendAlleForSelectedDate` orchestration | 95% branches | Happy path, partial-skip (missing productId), batch-fail rollback, 5s timeout |
| Derived selectors (`sentStateByDate`, `productsForSelectedDate`, `planDays`) | 90% lines | Edge cases: tom liste, alle aflyste, alle sendte |

### 7.2 — Component (Vitest + Testing Library + Storybook)

| Target | Coverage-mål | Fokus |
|---|---|---|
| `ProductBoxV2` (7 modes) | 80% lines | Hver visual mode via Storybook stories — TESTBAR + VISUEL |
| `EkstraBestillingBox` (2 modes) | 80% | Sendt-mode (alt locked) + Default |
| `StatusPill` (4 derived states) | 90% | Alle 4 kind+label kombinationer |
| `DatePillsRow` (3 pille-states) | 80% | Selected, all-sent, partial, default |
| `SendBekraeftelsesModal` | 80% | Default + with-sum-warning + tom kommentar + max-længde |
| `SendTilFabrikCTA` | 80% | enabled / disabled / in-flight / with-tooltip |

### 7.3 — Integration (hook + container)

| Test | Fokus |
|---|---|
| `AsfaltbestillingSection.integration.test.tsx` | Container + begge hooks wired sammen + alle 9 flows happy path |
| `sendAlleForSelectedDate.integration.test.ts` | Atomic batch: success, partial-skip, rollback |
| `auto-skift-activeProductId.test.ts` | Dato-pille-skift → auto-skift virker |

### 7.4 — E2E (Playwright)

| Test-fil | Dækker |
|---|---|
| `apps/formand/e2e/asfaltbestilling-c1-send.spec.ts` | ASF-001 til ASF-008 (Flow C1) |
| `apps/formand/e2e/asfaltbestilling-c2-cancel.spec.ts` | ASF-009 til ASF-014 (Flow C2) |
| `apps/formand/e2e/asfaltbestilling-c3-restore.spec.ts` | ASF-015, ASF-016 |
| `apps/formand/e2e/asfaltbestilling-c4-weather.spec.ts` | ASF-017 til ASF-019 |
| `apps/formand/e2e/asfaltbestilling-c5-samles.spec.ts` | ASF-020 til ASF-022 |
| `apps/formand/e2e/asfaltbestilling-c6-ekstra.spec.ts` | ASF-023 til ASF-025 |
| `apps/formand/e2e/asfaltbestilling-c7-delete-ekstra.spec.ts` | ASF-026, ASF-027 |
| `apps/formand/e2e/asfaltbestilling-c8-date-pills.spec.ts` | ASF-028 til ASF-030 |
| `apps/formand/e2e/asfaltbestilling-c9-readonly.spec.ts` | ASF-031, ASF-032 |
| `apps/formand/e2e/asfaltbestilling-crossapp.spec.ts` | ASF-033 til ASF-040 |
| `apps/formand/e2e/asfaltbestilling-offline.spec.ts` | ASF-047, ASF-048 |
| `apps/formand/e2e/asfaltbestilling-visual.spec.ts` | ASF-046 (visual diff) |

**Coverage-mål totalt:** 80% lines, 70% branches på `useAsfaltbestilling` + `useEkstraBestilling` + `AsfaltbestillingSection`.

---

## 8. Test-matrix (accept-ID → test-fil)

| Accept-ID | Type | Test-fil |
|---|---|---|
| ASF-001..008 | TESTBAR/VISUEL | `e2e/asfaltbestilling-c1-send.spec.ts` |
| ASF-009..014 | TESTBAR | `e2e/asfaltbestilling-c2-cancel.spec.ts` |
| ASF-015..016 | TESTBAR | `e2e/asfaltbestilling-c3-restore.spec.ts` |
| ASF-017..019 | TESTBAR/VISUEL | `e2e/asfaltbestilling-c4-weather.spec.ts` |
| ASF-020..022 | TESTBAR | `e2e/asfaltbestilling-c5-samles.spec.ts` |
| ASF-023..025 | TESTBAR | `e2e/asfaltbestilling-c6-ekstra.spec.ts` |
| ASF-026..027 | TESTBAR | `e2e/asfaltbestilling-c7-delete-ekstra.spec.ts` |
| ASF-028..030 | TESTBAR/VISUEL | `e2e/asfaltbestilling-c8-date-pills.spec.ts` |
| ASF-031..032 | TESTBAR | `e2e/asfaltbestilling-c9-readonly.spec.ts` |
| ASF-033..040 | TESTBAR | `e2e/asfaltbestilling-crossapp.spec.ts` |
| ASF-041..043 | TESTBAR | `e2e/asfaltbestilling-c1-send.spec.ts` + `c2-cancel.spec.ts` (status-vokabular del af eksisterende tests) |
| ASF-044..045 | TESTBAR/VISUEL | `e2e/asfaltbestilling-c8-date-pills.spec.ts` + `e2e/asfaltbestilling-visual.spec.ts` |
| ASF-046 | VISUEL | `e2e/asfaltbestilling-visual.spec.ts` |
| ASF-047..048 | TESTBAR | `e2e/asfaltbestilling-offline.spec.ts` |

---

## 9. TBD-refinement (ikke-blockerende åbne spørgsmål)

> Listet eksplicit så architect/builder ved at disse kan blive afklaret under build. Hvis afklaring kommer FØR build, opdater contract via amendment.

| # | Spørgsmål | Owner | Påvirker |
|---|---|---|---|
| MP-1 | Hvordan vises "kombineret samleordre" (flere ordrer på samme bil) i vognmand-UI? | Vognmand-sektion | Påvirker IKKE Asfaltbestilling — kun receiver-rendering |
| MP-2 | Hvilke kombinationer af produkter (recepter) må samles på én bil? Regel-tabel? | Forretning/Fabrik | Påvirker IKKE Asfaltbestillings UI — kun valideringer der evt. tilføjes senere |
| MP-3 | Default-vejning per produkt på fabrik når `samles_paa_en_bil=true` — auto eller manuel? | Fabrik-sektion + Chauffør | Påvirker IKKE Asfaltbestilling — kun chauffør/fabrik-flow |
| MP-4 | Cross-ordre-fordeling (`ekstra_bestilling.andreOrdrer`) — hvem populerer det? Formand i Asfaltbestilling, eller derived ved afregning? | Carsten + Afregning-sektion | **Påvirker bestilling-UI potentielt.** Bekræft før build. Default: derived ved afregning (ikke UI-felt her). |
| D1 | Skal `cancel_reason_note` (fritekst ved `'andet'`) have max-længde i UI? | Carsten | Default 200 tegn — bekræft |
| D2 | Skal "Send til fabrik"-knappen vise loading-spinner under in-flight batch (5s window)? | Bekræftet — ja | — |
| D3 | Skal `sentStateByDate` opdateres optimistisk ved send (før server-ack)? | Bekræftet — ja, optimistisk | — |
| D4 | Partial vs. fuld rollback ved write-queue-replay-fejl | Bekræftet — fuld rollback | — |
| D5 | Offline-banner: app-level eller sektion-level | Bekræftet — app-level (`<OfflineBanner />` i AppShell) | — |

---

## 10. Contract-amendments log

> Hver gang contract ændres efter sign-off, log her.

| Dato | Amendment | Årsag | Re-signed |
|---|---|---|---|
| 2026-05-26 | Initial DRAFT (v1.0) | Interview-Fase-D output | `[ ]` |

---

## Sign-off

**Status overgang:**
- `DRAFT` → `SIGNED-yyyy-mm-dd` ved Carstens godkendelse
- `SIGNED-...` → automatisk FROZEN (kun amendments via re-interview eller validator-amendment-request)

**Underskrevet:** _______________
**Dato:** _______________
**Version:** 1.0
