---
section: asfaltbestilling
app: formand
tab: planlaegning
phase: interview
created: 2026-05-26
last_updated: 2026-06-18
contract_version: 2.0
status: DRAFT
frozen: false
supersedes: CONTRACT.v1-frozen.md (SIGNED-2026-05-26)
signed_by: null
---

# Validation Contract v2 — Asfaltbestilling (Formand · Planlægning-tab)

> ## 🟡 STATUS: DRAFT — IKKE FROZEN. Architect må IKKE starte.
>
> **Hvorfor v2:** v1 (`SIGNED-2026-05-26`, bevaret som `CONTRACT.v1-frozen.md`) er forældet. Prototypen er drevet ~3 uger; architect-re-baseline (2026-06-18) konkluderede at ~25% af de 48 ASF-kriterier er ugyldige (ekstra-bestilling slettet, aflysning flyttet, datovælger ændret, Flow 9c tilføjet).
>
> **Denne fil låser IKKE noget endnu.** Den afventer Carstens beslutning på **B-1..B-7 + E-1** (§9) + sign-off. Først derefter: `SIGNED-yyyy-mm-dd` → FROZEN.
>
> **Læs sammen med:**
> - `.claude/sections/formand/asfaltbestilling.md` — re-scoped komponent-scope + drift-noter (D-A..D-K)
> - `.claude/docs/DATA_FIELDS.md` (sektion Asfaltbestilling) — re-scoped felter
> - `.claude/docs/FUNCTIONAL_FLOWS.md` — ABE-1..8, ABE-2b, Flow 9b, Flow 9c
> - `.claude/docs/STATUS_VOKABULAR.md`, `.claude/docs/DATOFORMAT.md`
> - `Docs/Formand/asfaltbestilling/CONTRACT.v1-frozen.md` — fuld v1 (kriterie-tekster genbruges hvor stadig gyldige)

---

## Identitet

- **Sektion:** Asfaltbestilling · **App:** Formand · **Tab:** Planlægning
- **Status:** `DRAFT` (v2)
- **Godkendt af Carsten:** `[ ] Dato: ___`

---

## 0. Re-baseline-oversigt (hvad ændrer sig fra v1)

| v1-område | v2-status | ASF-IDs påvirket |
|---|---|---|
| Flow C1 — Send | **REVIDERET** — kommentar-flow OK; sum-warning/5s-rollback/in-flight = **B-4**; Flow 9c-tekst tilføjet | ASF-001 (gyldig), ASF-002 (revideret), ASF-003/004/005/006 (**B-4 — TBD**), ASF-007 (gyldig), ASF-008 (**ugyldig** — ekstra væk) |
| Flow C2 — Aflys | **OMSKREVET** — aflysning via `AflysningCell`, ikke ProductBoxV2 | ASF-009..014 (omskrevet → AFL-serie) |
| Flow C3 — Restore | **GYLDIG** (med D-K bug-fix) | ASF-015/016 → bevaret |
| Flow C4 — Vejr | **TBD** — afhænger af B-1 (persist vs. visuelt) | ASF-017/018 (**B-1**), ASF-019 (visuel, gyldig) |
| Flow C5 — Samles | **REVIDERET** — kun på produkt; placering = B-2 | ASF-020/021 (**B-2**), ASF-022 (**ugyldig** — ekstra væk) |
| Flow C6 — Ekstra opret | **SLETTET** | ASF-023/024/025 (**ugyldige**) |
| Flow C7 — Ekstra slet | **SLETTET** | ASF-026/027 (**ugyldige**) |
| Flow C8 — Datovælger | **REVIDERET** — ingen sent-state-pille; ugedag = B-5 | ASF-028 (gyldig), ASF-029 (**B-5**), ASF-030 (**ugyldig** — ingen pr-pille send-state) |
| Flow C9 — Read-only | **GYLDIG** for ProductBoxV2; EkstraBox nu altid read-only | ASF-031 (gyldig), ASF-032 (omskrevet) |
| Cross-app ABE | **GYLDIG m. forbehold** — E-1 (kind='ekstra' arvegods) | ASF-033..040 (E-1 + B-1) |
| Flow 9c — kl-11 | **NY** | DLN-serie (ny) |

---

## 1. Cross-cutting blockers — HARD GATE

- [x] **Status-vokabular låst** (2026-05-26) — `TransportOrderStatus`, `AflysningsAarsag`
- [x] **Datoformat låst** (2026-05-26) — men prototype bruger `formatLongDate` UDEN ugedag → **B-5 BLOKERER** dato-display-kriterier (DLN/dato-piller) indtil afklaret
- [~] **Multi-produkt-på-bil kerne** — samles-flag-placering = **B-2 BLOKERER** samles-kriterier
- [N/A] **Auth/RLS** — ingen rolle-diff inde i sektionen
- [~] **Flow 9c (kl-11)** låst 2026-06-18 — men persist-flag (**B-6**) + konfigurerbarhed (**B-7**) åbne; **B-6 BLOKERER** evt. cross-app `sentLate`-kriterium

> **Status:** 🟡 **BLOCKED for delmængde.** Kriterier der afhænger af B-1/B-2/B-4/B-5/B-6/E-1 markeres `[BLOCKED-Bn]` og kan ikke testes før beslutning. Resten kan signes.

---

## 2. Domæne-invariants (revideret)

| # | Invariant | Type | Ændring vs. v1 |
|---|---|---|---|
| INV-1 | `activeProductId` og `selectedPlanDate` er controlled fra parent (`OrdrePlanScreen`) | SKAL-ALTID | uændret |
| INV-2 | Auto-skift af `activeProductId` sker i `useAsfaltbestilling` | SKAL-ALTID | uændret |
| INV-3 | `isSent === true` låser `tonsPlanned`, `morgenTons`, samles-checkbox. Vejr-toggle forbliver aktiv | SKAL-ALTID | aflys-knap fjernet fra ProductBoxV2 (nu i AflysningCell) |
| INV-4 | Send-batch er atomar pr. `(orderId, selectedPlanDate)` for alle ikke-sendte morgen-bestillinger | SKAL-ALTID | **ekstra-bestillinger fjernet fra batch** (kun morgen). Rollback-robusthed = B-4 |
| INV-5 | Kommentar er pr. (orderId, date)-batch — aldrig pr. row | SKAL-ALTID | uændret |
| INV-6 | Aflysning nulstiller `tonsPlanned`=0, bevarer `morgenTons` for audit. `restoreDay` bringer ikke `tonsPlanned` tilbage | SKAL-ALTID | uændret (prototype `cancelDay` sætter `tonsPlanned: 0` ✓) |
| INV-7 | Sum-validering er soft warning, må aldrig blokere | MÅ-ALDRIG (blokere) | **B-4** — sum-warning findes ikke i prototype |
| INV-8 | Dato-display | SKAL-ALTID | **B-5** — `formatLongDate` (uden ugedag) i prototype vs. DATOFORMAT (med) |
| INV-9 | ~~`puljelaes`/`multilaes`/`andreOrdrer` vises aldrig~~ | — | **BORTFALDET** — ekstra-konstrukt fjernet |
| INV-10 | `transport_orders` skrives kun med `status='afventer'` fra denne sektion | SKAL-ALTID | uændret |
| INV-11 (NY) | Aflysning sker udelukkende via `AflysningCell` (Ordredetaljer-grid). ProductBoxV2 har ingen aflys-entry | SKAL-ALTID | NY (D-C) |
| INV-12 (NY) | `EkstraBestillingBox` + `day.ekstraTons` er **read-only** — formand muterer aldrig ekstra-tons i app'en (PLAN-push only) | MÅ-ALDRIG (mutere) | NY (D-A/D-B) |
| INV-13 (NY) | "For sent"-bestilling (efter kl-11-deadline) blokeres ALDRIG — kan altid sendes | MÅ-ALDRIG (blokere) | NY (Flow 9c) |

---

## 3. Accept-kriterier (v2)

> Klassifikation: **TESTBAR** / **VISUEL** / **HUMAN**. `[BLOCKED-Bn]` = afventer beslutning.

### Flow C1 — Send-bestilling

#### ASF-001 — Klik "Send til fabrik" åbner bekræftelses-modal — **GYLDIG**
```
TYPE: TESTBAR | ROLLE: formand | OFFLINE: tilladt-write-queue
COMPONENT: SendTilFabrikCTA + SendBekraeftelsesModal
GIVEN: mindst ét ikke-sendt produkt for selectedPlanDate
WHEN: bruger klikker "Send til fabrik"-CTA (ikke disabled)
THEN: SendBekraeftelsesModal rendres med open=true
AND: kommentar-textarea er tom (lokal state)
```

#### ASF-002 — Bekræftelse sender ikke-sendte morgen-bestillinger — **REVIDERET (ekstra fjernet)**
```
TYPE: TESTBAR | ROLLE: formand | OFFLINE: tilladt-write-queue
COMPONENT: SendBekraeftelsesModal + useAsfaltbestilling
GIVEN: modal åben, kommentar="Husk indkørsel via Nord", dagen har 2 ikke-sendte morgen-bestillinger
WHEN: bruger klikker "Send til fabrik" i modalen
THEN: alle ikke-sendte dayIds markeres sendt (sentDayIds)
AND: kommentar gemmes på datoen (sentKommentarer[selectedPlanDate])
AND: 2 transport_orders oprettes med kind='morgen', status='afventer'
AND: modal lukker; begge ProductBoxV2 skifter til read-only (INV-3)
NOTE: INGEN ekstra-bestillinger i batch (konstrukt fjernet — D-A)
```

#### ASF-003 — Atomic rollback ved fejl — **[BLOCKED-B4]**
```
Prototype har ingen rollback. Afhænger af B-4 (er fuld batch-robusthed Fase 1?).
Hvis B-4=ja: behold v1 ASF-003. Hvis B-4=nej: drop til senere fase.
```

#### ASF-004 — Sum-warning i modal — **[BLOCKED-B4]**
```
Prototype har ingen sum-warning. Afhænger af B-4.
```

#### ASF-005 — Optimistic 5s-rollback — **[BLOCKED-B4]**

#### ASF-006 — CTA disabled mens batch in-flight — **[BLOCKED-B4]**

#### ASF-007 — Kommentar-tooltip under CTA efter send — **GYLDIG**
```
TYPE: VISUEL | ROLLE: formand
COMPONENT: SendTilFabrikCTA
GIVEN: dagen sendt med kommentar="Husk indkørsel via Nord"
WHEN: bruger hovrer over "Kommentarer sendt til fabrik"-linje
THEN: tooltip viser kommentar-teksten (instant, custom CSS-tooltip)
AND: screenshot-diff mod baseline < 1.0%
```

#### ~~ASF-008~~ — **UGYLDIG** (ekstra-bestilling med tom productId — konstrukt fjernet)

### Flow C1b — kl-11-deadline (NY — Flow 9c)

#### DLN-001 — Send-knap viser permanent deadline-tekst — **VISUEL/TESTBAR**
```
TYPE: TESTBAR+VISUEL | ROLLE: formand
COMPONENT: SendTilFabrikCTA
GIVEN: mindst én ikke-sendt bestilling (CTA enabled)
THEN: status-linjen viser permanent "Bestilling skal ske inden kl 11"
GIVEN: intet at sende (disabled)
THEN: status-linjen viser "Intet at sende"
AND: screenshot-diff < 1.0%
```

#### DLN-002 — Modal viser rød advarsel når bestilling er for sent — **TESTBAR/VISUEL**
```
TYPE: TESTBAR+VISUEL | ROLLE: formand
COMPONENT: SendBekraeftelsesModal
GIVEN: bestillingForSent=true, modal åbnes
THEN: rød advarselsboks (bg-bad-bg border-bad/30 text-bad) med teksten:
      "Bestillingen er lavet efter kl 11. Du skal derfor ringe til fabrikken
       for at sikre produktionskapacitet."
GIVEN: bestillingForSent=false
THEN: neutral tekst "Ordren afsendes til fabrikken nu."
AND: screenshot-diff < 1.0% per variant
```

#### DLN-003 — For sent blokerer IKKE afsendelse — **TESTBAR (INV-13)**
```
TYPE: TESTBAR | ROLLE: formand
GIVEN: bestillingForSent=true, modal åben
WHEN: bruger klikker "Send til fabrik"
THEN: send gennemføres normalt (ingen blokering)
```

#### DLN-004 — Persistent "for sent"-flag videre til downstream — **[BLOCKED-B6]**
```
Afhænger af B-6: skal sentLate/needs_capacity_call følge med til vognmand/fabrik/Asfalttavlen?
Hvis B-6=ja: transport_orders.sent_late=true ved send efter deadline + ABE-payload.
```

### Flow C2 — Aflys (OMSKREVET → AflysningCell)

#### AFL-001 — "Aflys dag"-knap åbner picker — **TESTBAR**
```
TYPE: TESTBAR | ROLLE: formand | COMPONENT: AflysningCell
GIVEN: produkt uden aflyste dage
WHEN: bruger klikker "Aflys dag"
THEN: onOpenPicker(defaultDayId) kaldes (default = valgt dato hvis aktiv, ellers første aktive)
AND: picker viser dato-select + 4 årsags-knapper + OK/Fortryd
```

#### AFL-002 — Vælg dato + årsag + OK aflyser dagen — **TESTBAR**
```
TYPE: TESTBAR | ROLLE: formand | COMPONENT: AflysningCell + useAsfaltbestilling.cancelDay
GIVEN: picker åben, dato valgt, årsag "Regn" valgt
WHEN: bruger klikker OK
THEN: onCancelDay(dayId, 'regn') → cancelDay sætter cancelled=true, cancelReason='regn', tonsPlanned=0 (INV-6)
AND: morgenTons bevares (audit)
AND: ProductBoxV2 for dagen skifter til Aflyst-mode; StatusPill kind='aflyst'
AND: AflysningCell viser dagen i aflyste-liste (dato + "(pga. Regn)")
```

#### AFL-003 — OK disabled indtil årsag valgt — **TESTBAR**
```
GIVEN: picker åben, ingen årsag valgt → OK disabled
WHEN: årsag valgt → OK enabled
```

#### AFL-004 — Fortryd lukker picker uden aflysning — **TESTBAR**
```
WHEN: bruger klikker Fortryd → onClosePicker, ingen mutation
```

#### AFL-005 — "Aflys flere" når 1+ aflyst men dage tilbage — **TESTBAR**
```
GIVEN: 1 aflyst dag, 2 aktive tilbage → "Aflys flere"-knap vises + aflyste-liste
GIVEN: alle dage aflyst → kun liste, ingen knap
```

#### AFL-006 — Cascade ved aflysning af sendt dag — **TESTBAR (E-1 + B-6 forbehold)**
```
GIVEN: dag X sendt (transport_order findes)
WHEN: cancelDay(productId, X.id, 'regn')
THEN: ABE-5 (vognmand) + ABE-6 (fabrik) soft-cancel cascade fires
NOTE: integration-test mod receivers; cancelReason='regn' med i payload
```

#### AFL-007 — Andet-årsag fritekst — **[BLOCKED-B3]**
```
Prototype har INGEN fritekst ved 'andet' (4 knapper, ingen note-felt).
Afhænger af B-3: skal cancel_reason_note med i Fase 1?
```

### Flow C3 — Fortryd aflysning

#### ASF-015 — "Fortryd"-link reaktiverer dagen — **GYLDIG (m. D-K bug-fix)**
```
TYPE: TESTBAR | ROLLE: formand | COMPONENT: ProductBoxV2 (Aflyst) + useAsfaltbestilling.restoreDay
GIVEN: dag X aflyst (cancel_reason='regn', tons_planned=0, morgen_tons=12)
WHEN: bruger klikker "Fortryd" i Aflyst-mode
THEN: restoreDay(dayId) kaldes — signatur (dayId) med self-lookup (FIX af D-K bug: prototype bruger activeProductId)
AND: cancelled=false, cancelReason=undefined
AND: tons_planned forbliver 0 (INV-6); morgen_tons forbliver 12
AND: ProductBoxV2 i Default-mode; StatusPill kind='afventer'
```

#### ASF-016 — Cascade ved restore IKKE fires — **GYLDIG**
```
GIVEN: dag X var sendt+aflyst (cascade fyret)
WHEN: bruger klikker "Fortryd"
THEN: INGEN cascade til vognmand/fabrik; dagen lokal-reaktiveret indtil re-send
```

### Flow C4 — Vejr-toggle

#### ASF-017 — Vejr-toggle persisterer — **[BLOCKED-B1]**
```
Prototype: weatherActive er lokal useState, persisterer intet.
Hvis B-1=persist: day.weatherActive + toggleWeather-action + write-queue.
Hvis B-1=visuelt Fase 1: kun lokal toggle, ingen persist, ingen cross-app.
```

#### ASF-018 — Vejr-toggle tilladt på sendt dag — **[BLOCKED-B1]** (visuel del gyldig)

#### ASF-019 — Vejr-toggle visuelle states — **GYLDIG (VISUEL)**
```
TYPE: VISUEL | COMPONENT: ProductBoxV2 (vejr-toggle)
Inactive: bg-[#F5F5F5] + dark-teal ikon; Active: bg-dark-teal + hvid ikon. diff < 0.5%
```

### Flow C5 — Samles på en bil

#### ASF-020 — Samles-checkbox persisterer — **[BLOCKED-B2]**
```
Prototype: productSamlesFlags-map (Record<pid__did, boolean>), ikke day.samlesPaaEnBil.
Hvis B-2=DayPlan-felt: toggleSamlesPaaEnBil + day.samlesPaaEnBil + ABE-7.
Hvis B-2=behold map: setProductSamles(productId, dayId, v).
```

#### ASF-021 — Samles-checkbox locked på sendt dag — **GYLDIG**
```
GIVEN: isSent=true → checkbox disabled, ingen mutation (prototype: disabled={isSent})
```

#### ~~ASF-022~~ — **UGYLDIG** (samles-flag på ekstra-bestilling — konstrukt fjernet)

### Flow C6/C7 — Ekstra opret/slet — **ALLE UGYLDIGE**

#### ~~ASF-023..027~~ — **UGYLDIGE** (D-A: formand opretter/sletter ikke ekstra-bestillinger)

### Flow C6b — Ekstra-visning (read-only PLAN — NY rolle)

#### EKS-001 — EkstraBestillingBox vises når day.ekstraTons findes — **TESTBAR**
```
TYPE: TESTBAR | COMPONENT: EkstraBestillingBox
GIVEN: day.ekstraTons = { tons: 8, bekraeftetAf: 'fabrik', tidspunkt: '...' }
THEN: boks rendres ved siden af produktet: "Ekstra: +8 tons" + "Bekræftet: kl. HH:MM"
AND: StatusPill kind='ekstra-bekraeftet' ("Bekræftet fabrik") under boksen
GIVEN: day.ekstraTons undefined → boksen rendres ikke (returnerer null)
```

#### EKS-002 — EkstraBestillingBox er read-only — **TESTBAR (INV-12)**
```
THEN: ingen inputs, ingen dropdown, ingen slet-knap, ingen callbacks
```

### Flow C8 — Datovælger (REVIDERET — unified, ingen sent-state)

#### ASF-028 — Klik dato-pille opdaterer selectedPlanDate — **GYLDIG**
```
TYPE: TESTBAR | COMPONENT: DatePillsRow
GIVEN: piller for hele ordrens dag-spænd, selectedPlanDate='2026-03-16'
WHEN: bruger klikker pille '2026-03-18'
THEN: setSelectedPlanDate('2026-03-18'); productsForSelectedDate rekalkuleres
AND: activeProductId auto-skiftes via hook hvis nuværende ikke matcher (INV-2)
```

#### ASF-029 — Dato-format på piller — **[BLOCKED-B5]**
```
Prototype: formatLongDate "16. marts 2026" (UDEN ugedag).
DATOFORMAT.md: planlægnings-view = ugedag PÅ. B-5 afgør.
```

#### ASF-030b — Passeret dag vises gennemstreget — **VISUEL (NY, erstatter ugyldig ASF-030)**
```
TYPE: VISUEL | COMPONENT: DatePillsRow
GIVEN: pille for dato < i dag
THEN: hvid bg + line-through + text-muted; aria-label suffix " (overstået)"
NOTE: v1 ASF-030 (per-pille all-sent/partial send-state) er UGYLDIG — sent-state-pille fjernet (D-D)
```

### Flow C9 — Read-only efter send

#### ASF-031 — isSent låser ProductBoxV2-inputs — **GYLDIG**
```
TYPE: TESTBAR | COMPONENT: ProductBoxV2
GIVEN: isSent=true
THEN: Forventet-input disabled; Morgen-input disabled; samles-checkbox disabled
AND: vejr-toggle aktiv; produkt-header-klik virker (driver Spec-grid)
NOTE: aflys-knap findes IKKE i ProductBoxV2 længere (INV-11)
```

#### ASF-032 — EkstraBestillingBox er altid read-only — **OMSKREVET**
```
THEN: ingen write-elementer uanset state (INV-12). v1's "sent=true skjuler X-knap" er bortfaldet.
```

### Cross-app writes (ABE-1..8)

#### ASF-033 — ABE-1: Send-batch skriver transport_orders for vognmand — **GYLDIG m. E-1**
```
TYPE: TESTBAR | ROLLE: formand → vognmand
THEN: transport_orders rows (kind='morgen') med order_id, date, tons, product_id,
      samles_paa_en_bil (B-2), weather_active (B-1), kommentar, sent_at, status='afventer'
E-1: payload må IKKE indeholde kind='ekstra'-rows (konstrukt fjernet) — modsiger nuværende FF L2442
```

#### ASF-034 — ABE-2: Send-batch læsbar for fabrik — **GYLDIG**
#### ASF-035 — ABE-3: Morgen-tons pre-fyldes i Udførsel-dagsoverblik — **GYLDIG**
#### ASF-036 — ABE-4: AsfaltKoersel "klar til bilbestilling" — **GYLDIG**
#### ASF-037 — ABE-5: CancelDay efter send → vognmand cascade — **GYLDIG** (kaldt fra AflysningCell nu)
#### ASF-038 — ABE-6: CancelDay efter send → fabrik — **GYLDIG**
#### ASF-039 — ABE-7: Samles → vognmand — **[BLOCKED-B2]**
#### ASF-040 — ABE-8: ToggleWeather → vognmand + fabrik — **[BLOCKED-B1]**
#### ASF-041 — ABE-2b: Send-batch → PLAN/Asfalttavlen (pr. produkt-celle) — **GYLDIG (NY ift. v1)**
```
TYPE: TESTBAR | ROLLE: formand → PLAN
THEN: Asfalttavlen modtager dagens bestillinger pr. produkt-celle (LÅST 2026-06-12).
NOTE: ekstra-bestillinger pr. produkt skal også fremgå pr. celle (fra PLAN-data) — retning afklares til PLAN-kickoff
```

### Status-vokabular + dato-format

#### ASF-042 — transport_order.status='afventer' ved INSERT — **GYLDIG**
#### ASF-043 — AflysningsAarsag enum-match (4 værdier) — **GYLDIG** (nu i AflysningCell via CANCEL_REASONS)
#### ASF-044 — StatusPill.kind UI-derived (4 kinds inkl. 'ekstra-bekraeftet') — **REVIDERET**
```
GIVEN cancelled → 'aflyst'; isSent → 'sendt'; morgenTons==null → afventer 'Indtast morgen';
      morgenTons!=null → afventer 'Klar til afsendelse'; day.ekstraTons → 'ekstra-bekraeftet' (egen boks)
AND: ingen kind persisteres i DB
```
#### ASF-045 — ISO storage på dato-felter — **GYLDIG**
#### ASF-046 — Dato-display lang-format — **[BLOCKED-B5]**

### Visual baseline

#### ASF-047 — Visual baseline alle komponent-states — **REVIDERET**
```
TYPE: VISUEL — baselines re-genereres mod NUVÆRENDE prototype:
- ProductBoxV2: default/focused/sent/cancelled/with-tags/weather-active (NB: reason-picker IKKE baseline'et — dead): 0.5%
- EkstraBestillingBox: read-only: 0.5%
- StatusPill: sendt/afventer/aflyst/ekstra-bekraeftet (4 kinds): 0.5%
- AflysningCell: tilstand-A/B/C + picker-open: 0.5%
- DatePillsRow: selected/passeret/default (INGEN all-sent): 1.0%
- SendTilFabrikCTA: enabled(kl-11-tekst)/disabled/with-tooltip: 1.0%
- SendBekraeftelsesModal: forsent-rød/til-tiden-neutral: 1.0%
- AsfaltbestillingSection full-render: 2.0%
```

### Offline

#### ASF-048 — Write-queue ved offline-send — **GYLDIG (B-4-robusthed adskilt)**
#### ASF-049 — Cached reads ved offline — **GYLDIG**

---

## 4. Out-of-scope (revideret)

- Afregnings-logik (puljelaes/multilaes/vejesedler hører til afregning)
- Returlæs-håndtering
- Vognmand-disponerings-UI / Fabrik-ordre-kø-UI (egne sektioner)
- "Bekræftet af fabrik"-state for morgen-bestilling (`confirmed_at`) — Kørsel-sektion
- Asfalt kørsel / Bilbehov-dashboard, Materiel, Afregning-mode, pinnede opstarts-læs, Udførsel-mode
- Samleordre-orkestrering (her kun grænseflade-props: `ordreTagLabels`, `samleordreCtx`)
- **Ekstra-bestilling-oprettelse** (formand opretter ikke — PLAN-push only)
- Den faktiske kl-11-deadline-beregning (`nu > deadline`) — Supabase/PLAN-integration; her kun `bestillingForSent`-flag-UI

---

## 5. API-contracts (per komponent — re-scoped)

> Eksakt props. Komplet i `DATA_FIELDS.md`. Felter markeret (B-n) afhænger af beslutning.

### `AsfaltbestillingSection` (Container)
```typescript
export interface AsfaltbestillingSectionProps {
  orderId: string
  isSamleordreMode: boolean
  samleordreCtx: SamleordreContext | null
  activeProductId: string
  onActiveProductIdChange: (id: string) => void
  selectedPlanDate: string                          // ISO
  onSelectedPlanDateChange: (date: string) => void
}
```

### `DatePillsRow` (Presenter)
```typescript
export interface DatePillsRowProps {
  dates: string[]                                   // ISO, sorted ASC — hele ordrens dag-spænd
  selectedDate: string
  today: string                                     // ISO — til passeret-styling
  onSelect: (date: string) => void
  // FJERNET ift. v1: sentStateByDate (ingen pr-pille send-state)
}
```

### `ProductBoxV2` (Presenter)
```typescript
export interface ProductBoxV2Props {
  product: MockProduct
  day: DayPlan                                       // viser KUN originalt tonsPlanned
  isFocused: boolean
  isSent: boolean
  ordreTagLabels?: string[]
  samlesPaaEnBil?: boolean                           // (B-2)
  onFocus: () => void
  onUpdateTons: (v: number) => void
  onUpdateMorgenTons: (v: number | undefined) => void
  onSamlesPaaEnBilChange?: (v: boolean) => void      // (B-2)
  onRestore: () => void                              // Fortryd i Aflyst-mode
  // (B-1) onToggleWeather?: (active: boolean) => void — kun hvis vejr persisteres
  // FJERNET: onCancel/onAbortCancel/onConfirmCancel/isSelectingReason (D-C → AflysningCell)
}
```

### `EkstraBestillingBox` (Presenter — READ-ONLY)
```typescript
export interface EkstraBestillingBoxProps {
  product: MockProduct
  day: DayPlan                                       // rendres kun hvis day.ekstraTons findes
  // INGEN callbacks — read-only
}
```

### `StatusPill` (Presenter — 🌍 shared-kandidat)
```typescript
export interface StatusPillProps {
  kind: 'sendt' | 'aflyst' | 'afventer' | 'ekstra-bekraeftet'
  afventerLabel?: string
}
```

### `AflysningCell` (Presenter — NY)
```typescript
export interface AflysningCellProps {
  product: MockProduct
  udfoerselSelectedDate?: string                     // ISO — default i picker
  pickerOpenForDayId: string | null                  // controlled fra container
  onOpenPicker: (defaultDayId: string) => void
  onClosePicker: () => void
  onCancelDay: (dayId: string, reason: AflysningsAarsag) => void
}
```

### `SendTilFabrikCTA` (Presenter)
```typescript
export interface SendTilFabrikCTAProps {
  disabled: boolean
  factoryLabel: string                               // fx "PROD A EAST KØGE PH"
  sentKommentar: string | null
  onClick: () => void
  // FJERNET: totalIkkeSendt (erstattet af permanent kl-11-tekst, D-G)
  // (B-4) isInFlight?: boolean — kun hvis in-flight-spinner i Fase 1
}
```

### `SendBekraeftelsesModal` (Presenter)
```typescript
export interface SendBekraeftelsesModalProps {
  open: boolean
  bestillingForSent: boolean                         // Flow 9c — conditional rød advarsel
  onCancel: () => void
  onConfirm: (kommentar: string) => void
  // (B-4) sumWarning?: { sum: number; total: number } | null
}
```

### `useAsfaltbestilling(orderId)` (Hook — ÉN hook; useEkstraBestilling fjernet)
```typescript
export function useAsfaltbestilling(orderId: string): {
  products: MockProduct[]
  activeProductId: string
  setActiveProductId: (id: string) => void
  selectedPlanDate: string
  setSelectedPlanDate: (date: string) => void
  planDays: string[]
  productsForSelectedDate: Array<{ product: MockProduct; day: DayPlan }>
  sentDayIds: Set<string>                            // (eller isDaySent(dayId))
  isDaySent: (dayId: string) => boolean
  kommentarForDate: (date: string) => string | null
  bestillingForSent: boolean                         // Flow 9c
  updateTons: (productId: string, dayId: string, tons: number) => void
  updateMorgenTons: (productId: string, dayId: string, tons: number | undefined) => void
  cancelDay: (productId: string, dayId: string, reason: AflysningsAarsag) => void
  restoreDay: (dayId: string) => void                // self-lookup via dayId (D-K fix)
  setProductSamles: (productId: string, dayId: string, value: boolean) => void  // (B-2)
  sendAlleForSelectedDate: (/* kommentar afhænger af B-4 */) => void | Promise<unknown>
  // (B-1) toggleWeather — kun hvis vejr persisteres
  loading: boolean
  error: Error | null
}
```

---

## 6. Rolle-adgang
Uændret fra v1: Formand full; Vognmand/Fabrik read-only-derived (cross-app); Chauffør/Kunde hidden. RLS på app-niveau.

---

## 7. Test-matrix (accept-ID → test-fil)

| Accept-ID | Test-fil |
|---|---|
| ASF-001/002/007, DLN-001..004 | `e2e/asfaltbestilling-c1-send.spec.ts` |
| AFL-001..007 | `e2e/asfaltbestilling-c2-aflys.spec.ts` |
| ASF-015/016 | `e2e/asfaltbestilling-c3-restore.spec.ts` |
| ASF-017..019 | `e2e/asfaltbestilling-c4-weather.spec.ts` (B-1) |
| ASF-020/021 | `e2e/asfaltbestilling-c5-samles.spec.ts` (B-2) |
| EKS-001/002 | `e2e/asfaltbestilling-ekstra-readonly.spec.ts` |
| ASF-028/029/030b | `e2e/asfaltbestilling-c8-datepills.spec.ts` (B-5) |
| ASF-031/032 | `e2e/asfaltbestilling-c9-readonly.spec.ts` |
| ASF-033..041 | `e2e/asfaltbestilling-crossapp.spec.ts` (E-1, B-1, B-2, B-6) |
| ASF-042..046 | `c1-send` + `c8-datepills` + `visual` |
| ASF-047 | `e2e/asfaltbestilling-visual.spec.ts` |
| ASF-048/049 | `e2e/asfaltbestilling-offline.spec.ts` |
| ASF-003/004/005/006, AFL-007, DLN-004 | **BLOKERET** — afventer B-3/B-4/B-6 |

---

## 8. Amendments-log

| Dato | Amendment | Årsag | Re-signed |
|---|---|---|---|
| 2026-05-26 | v1.0 SIGNED (FROZEN) | Interview Fase D | ✅ (se CONTRACT.v1-frozen.md) |
| 2026-06-18 | v2.0 DRAFT — re-scope efter ~3 ugers drift + architect-re-baseline | EkstraBestilling slettet, aflysning → AflysningCell, datovælger unified, Flow 9c tilføjet, StatusPill 4. kind | `[ ]` |

---

## 9. ÅBNE FORRETNINGS-SPØRGSMÅL — kræver Carstens beslutning før sign-off

> Disse blokerer de markerede `[BLOCKED-Bn]`-kriterier. Resten af kontrakten kan signes når disse er besvaret (eller eksplicit udskudt med "ikke Fase 1").

| # | Spørgsmål | Påvirker | Default-forslag |
|---|---|---|---|
| **B-1** | Skal `weatherActive` persisteres + cross-app (ABE-8) i Fase 1, eller rent visuelt? (i dag: lokal useState, fyrer intet) | ASF-017/018/040, `DayPlan.weatherActive`, `toggleWeather`, ABE-8 | Foreslå: persistér i Fase 1 (ellers er ABE-8 død) |
| **B-2** | `samles`-flag på `DayPlan.samlesPaaEnBil` (kontrakt) eller behold `productSamlesFlags`-map? | ASF-020/039, ProductBoxV2-props, ABE-7 | Foreslå: flyt til `DayPlan.samlesPaaEnBil` (renere, cross-app-klar) |
| **B-3** | Skal `cancel_reason_note` (fritekst ved årsag 'andet') med i Fase 1? (ikke i prototype) | AFL-007 | Foreslå: udskyd — ikke Fase 1 |
| **B-4** | Skal sum-warning + optimistic 5s-rollback + in-flight-spinner med i Fase 1, eller over-spec? | ASF-003/004/005/006, modal + CTA-props | Foreslå: kun in-flight-disable (dobbeltklik-værn) i Fase 1; sum-warning + 5s-rollback udskydes |
| **B-5** | Dato-piller MED ugedag (DATOFORMAT) eller UDEN (prototype "16. marts 2026")? | ASF-029/046, DatePillsRow, AflysningCell | Foreslå: behold prototype (uden) ELLER opdater DATOFORMAT — Carsten afgør |
| **B-6** | Skal "for sent"-bestilling bære persistent flag (`sent_late`/`needs_capacity_call`) videre til vognmand/fabrik/Asfalttavlen? | DLN-004, `transport_orders.sent_late`, ABE-payloads | Foreslå: ja (modtagere bør vide at kapacitet ikke er bekræftet) |
| **B-7** | kl-11-deadline konfigurerbar pr. fabrik, eller global? | Deadline-beregning (post-Fase-1 integration) | Foreslå: global i Fase 1, gør konfigurerbar ved integration |
| **E-1** | **ABE-konsistens:** FF L2442-L2455 (ABE-1/2) refererer stadig `kind='ekstra'`-rows, men Flow 9b + FF L2699 siger ekstra-konstruktet er fjernet og `kind` kollapset til `'morgen'`. Skal `kind='ekstra'` fjernes helt fra `transport_orders` + ABE-payloads? | ASF-033, TransportOrder-type, alle ABE-tabeller | Foreslå: ja — fjern `kind='ekstra'` + `ekstraBestillingId`; architect retter FF i dev-fasen |

---

## Sign-off

- `DRAFT` → `SIGNED-yyyy-mm-dd` ved Carstens godkendelse (efter B-1..B-7 + E-1 besvaret)
- `SIGNED-...` → FROZEN (kun amendments via re-interview)

**Underskrevet:** _______________  **Dato:** _______________  **Version:** 2.0
