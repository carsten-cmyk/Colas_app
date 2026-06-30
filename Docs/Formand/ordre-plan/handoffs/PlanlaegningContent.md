---
section: ordreplan-fase2
component: PlanlaegningContent
spec: .claude/handoffs/ordreplan-fase2/SPEC_Planlaegning_Sections.md
builder_session: 2026-06-30-1200
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — PlanlaegningContent (#12 — Integration + Container)

> **Hvad denne fil ER:** Builder's exit-rapport for det SIDSTE integrations-trin i Round 3 (Fase 2).
> Denne trin (#12) bygger PlanlaegningContent.tsx og rewirer OrdrePlanScreen.tsx.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: FASE2-012-a
    description: "PlanlaegningContent.tsx oprettet i content/ — symmetrisk container med UdfoerselContent/AfregningContent.
                  Rod-div: flex flex-col gap-[48px] (identisk med de to andre containere + originalkilde).
                  Props-interface eksporteret som PlanlaegningContentProps — ingen any-typer.
                  JSDoc på alle ikke-oplagte props."

  - id: FASE2-012-b
    description: "PeriodeDatoVaelger wired ind i PlanlaegningContent — erstatter inline-blok OrdrePlanScreen.tsx L999-1028.
                  heading='Udføres i perioden', days=planDays, selectedDate=selectedPlanDate."

  - id: FASE2-012-c
    description: "KRITISK nesting bevaret ORDRET:
                  OrdredetaljerSection + DokumentationSection + <hr> + AsfaltbestillingSection
                  deler ét <div>-wrapper (svarer til OrdrePlanScreen L1031-1378).
                  AsfaltKoerselSection + MaterielleveringSection er top-peers."

  - id: FASE2-012-d
    description: "OrdredetaljerSection-closure-mønster bevaret:
                  makeOrdredetaljerCard() + renderOrdredetaljerCollapsedPille() forbliver closures
                  i orkestratoren og trådes som props til PlanlaegningContent.
                  Kald i PlanlaegningContent: makeOrdredetaljerCard() (ingen args — identisk med original L1040)."

  - id: FASE2-012-e
    description: "DokumentationSection wired med visible=planlaegningOrdredetaljerExpanded
                  (svarer til originalen conditionelle {planlaegningOrdredetaljerExpanded && (<section>...)}).
                  photos/onAddPhotos/onRemovePhoto/noteComments/onAddComment trådes fra root."

  - id: FASE2-012-f
    description: "AsfaltbestillingSection wired med alle 13 props fra sektionens handoff-API.
                  onConfirmCancel har UDVIDET signatur (productId, dayId, reason) — matcher sektionens props-interface.
                  onUpdateTons/onUpdateMorgenTons trådes som nye props til PlanlaegningContent."

  - id: FASE2-012-g
    description: "AsfaltKoerselSection wired med alle props fra sektionens handoff-API.
                  kørselExpandedId er lokal state i sektionen — sendes IKKE som prop.
                  onGemKørsel bevarer revert-on-edit-logikken inkl. days.find(d => d.id === dayId)?.date-lookup."

  - id: FASE2-012-h
    description: "MaterielleveringSection wired med alle props fra sektionens handoff-API.
                  onTilfoejResource-callback genererer id: mat-${Date.now()}-${Math.random()...} identisk med
                  OrdrePlanScreen L2306 — og sætter resources via setResources i orkestratoren."

  - id: FASE2-012-i
    description: "OrdrePlanScreen rewired:
                  Inline Planlægning-JSX (L992-2160, ~1170 linjer) ERSTATTET af <PlanlaegningContent .../>.
                  OrdrePlanScreen: 2420 → 1126 linjer."

  - id: FASE2-012-j
    description: "Duplikerede state-variabler FJERNET fra OrdrePlanScreen:
                  showConfirmSend, bestillingForSent, kommentar, sentKommentarer (→ AsfaltbestillingSection lokal)
                  sentDayIds, fabrikSendtDates (→ AsfaltbestillingSection lokal)
                  kørselExpandedId (→ AsfaltKoerselSection lokal)
                  tilfoejMaterielOpen, materielSoeg, fjernModalId (→ MaterielleveringSection lokal)
                  opmaalingOpen, photosOpen, notesOpen, docsOpen, besigtigelseComment (→ DokumentationSection lokal)"

  - id: FASE2-012-k
    description: "Duplikerede modaler FJERNET fra OrdrePlanScreen:
                  FjernModal (→ MaterielleveringSection)
                  Tilføj materiel-modal (→ MaterielleveringSection)
                  Bekræftelses-modal/Send til fabrik (→ AsfaltbestillingSection)"

  - id: FASE2-012-l
    description: "Ubrugte imports renset fra OrdrePlanScreen:
                  Truck, X, ChevronDown, Mic, Info, Camera, CheckCircle2, MessageSquare (lucide)
                  formatWeekday, formatLongDate
                  MaterielPlanlaegTilstand, MaterielNyEtapeTilstand, MaterielPaaPladsenTilstand, MaterielDvaleTilstand
                  TODAY, dateToString, getEffectiveTons
                  STANDARD_MATERIEL_KATALOG, VEHICLE_TYPES, MOCK_VOGNMAEND, DEFAULT_VOGNMAND_ID
                  OrdredetaljerSection, ProductBoxV2, EkstraBestillingBox, DocRow, FjernModal"

  - id: FASE2-012-m
    description: "gemKørsel-funktion i orkestratoren rettet:
                  setKørselExpandedId(null) FJERNET (kørselExpandedId er nu lokal i AsfaltKoerselSection).
                  Revert-on-edit-logikken (days.find + sendtTilVognmandDates.delete) bevaret."

  - id: FASE2-012-n
    description: "Gate R3 GRØN: npm run formand:typecheck — 0 fejl.
                  0 NYE lint-errors (5 pre-eksisterende er uberørte)."
```

---

## Not implemented

```yaml
accept_skip: []
```

Alle accept-kriterier fra SPEC #12 er implementeret. Intet skipped.

---

## Assumptions

- `onUpdateTons` og `onUpdateMorgenTons` er tilføjet som props til `PlanlaegningContentProps` (var ikke eksplicit listede i SPEC, men nødvendige for at tråde `updateTons`/`updateMorgenTons`-closurerne fra orkestratoren til `AsfaltbestillingSection`). De er closures i orkestratoren der opdaterer `products`-state.

- `onRemovePhoto` er tilføjet som prop til `PlanlaegningContentProps` (afledt af DokumentationSection-handoff: den kræver `onRemovePhoto`-callback). Callback implementeret som `(id) => setPhotos(prev => prev.filter(p => p.id !== id))` — identisk med original L1113.

- `onAddComment` er tilføjet som prop til `PlanlaegningContentProps` (afledt af DokumentationSection-handoff). Callback implementeret som `(comment) => setNoteComments(prev => [...prev, comment])` — identisk med original L1195.

- `PlanlaegningContent` modtager `planDays` (ikke `activeDays` direkte) som dato-array til `PeriodeDatoVaelger` — dette spejler orkestratorens `planDays`-beregning der inkluderer DEMO_DVALE_DAG.

- `makeOrdredetaljerCard` i UdfoerselContent har en anden signatur (med `hideTabs?` og `cardMode?` og `udfoerselSelectedDate?`) — PlanlaegningContent kalder den uden args (som originalen L1040 `makeOrdredetaljerCard()` uden parametre).

---

## Known issues

- `makeOrdredetaljerCard`-closuren i OrdrePlanScreen er stadig ~300 linjer lang og bidrager til at orkestratoren kun reduceredes til 1126 linjer (mod forventede ~600-800 fra SPEC INDEX). Closuren FORBLIVER i orkestratoren per explicit SPEC-beslutning. Yderligere cleanup kræver en separat Round (fx løft closure til OrdredetaljerCard.tsx). Dette er IKKE Fase 2's ansvar.

- `renderOrdredetaljerCollapsedPille` og `makeOrdredetaljerCard` er stadig closures i OrdrePlanScreen — de kan på et tidspunkt flyttes til en selvstændig komponent, men det er post-Fase-2.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/PlanlaegningContent.tsx  (326 linjer)
  - Docs/Formand/ordre-plan/handoffs/PlanlaegningContent.md

modified:
  - apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx
    (2420 → 1126 linjer: Planlægning-JSX erstattet, state/modaler/imports ryddet)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Planlægning-JSX kilde: L992–2160 (~1170 linjer)

**Hvad blev ekstraheret 1:1:**
- Rod-container `<div className="flex flex-col gap-[48px]">` (identisk med UdfoerselContent/AfregningContent)
- KRITISK nesting: OrdredetaljerSection + DokumentationSection + `<hr>` + AsfaltbestillingSection i delt `<div>`
- AsfaltKoerselSection og MaterielleveringSection som top-peers
- Alle prop-tråd-mønstre fra 4 sektion-handoffs

**Bevidste afvigelser fra prototype (med begrundelse):**

1. **`onUpdateTons` / `onUpdateMorgenTons` tilføjet til PlanlaegningContentProps** — nødvendige for at tråde `updateTons`/`updateMorgenTons`-closurerne fra orkestratoren til AsfaltbestillingSection. Ikke nævnt eksplicit i SPEC-prop-liste, men logisk krævet.

2. **`onRemovePhoto` tilføjet til PlanlaegningContentProps** — afledt fra DokumentationSection-handoff der kræver den. Var implicit i SPEC ("Root-delt state via props: photos, onAddPhotos").

3. **`onAddComment` tilføjet til PlanlaegningContentProps** — tilsvarende afledt fra DokumentationSection-handoff.

4. **`onConfirmCancel`-kald bruger `(productId, dayId, reason)` i stedet for `(reason)` alene** — matcher AsfaltbestillingSectionProps udvidede signatur (dokumenteret i AsfaltbestillingSection-handoff). Orkestratoren sender `cancelDay(productId, dayId, reason)` videre.

**Hvad blev IKKE afveget:**
- Token-violation `gap-[48px]` på rod-container kopieret ORDRET per SPEC-princip 3
- `makeOrdredetaljerCard`-closure beholdt i orkestratoren (per SPEC § "ORDRET closures")
- `setKørselExpandedId(null)` fjernet PRÆCIS som AsfaltKoerselSection-handoff specificerer

---

## API exports

**Props interface:** Se `/Users/carstenanthonisen/Documents/Colas/apps/formand/src/prototypes/ordre-plan/content/PlanlaegningContent.tsx`

**Eksporterer:**
- `PlanlaegningContent` (named export)
- `PlanlaegningContentProps` (named interface)

**Importerer:**
- `OrdredetaljerSection` fra `../components/OrdredetaljerSection`
- `PeriodeDatoVaelger` fra `../components/PeriodeDatoVaelger`
- `DokumentationSection` fra `./sections/planlaegning/DokumentationSection`
- `AsfaltbestillingSection` fra `./sections/planlaegning/AsfaltbestillingSection`
- `AsfaltKoerselSection` fra `./sections/planlaegning/AsfaltKoerselSection`
- `MaterielleveringSection` fra `./sections/planlaegning/MaterielleveringSection`
- Typer fra `../types`, `../etape`, `../MaterielTilstande`

---

## Tokens / patterns brugt

- Rod-container: `flex flex-col gap-[48px]` (token-violation kopieret ORDRET fra prototype)
- hr-skille: `my-lg border-t border-hairline` (tokens)
- Ingen direkte farvebrug, spacing eller font — al visuel kode lever i sektionerne
- Komponent er ren container: ingen direkte Tailwind-klasser udover rod-div + hr

---

## Tests skrevet

```
unit:    0 — prototype-fase, ikke krævet
story:   0 — prototype-fase, SPEC INDEX kræver ingen stories
e2e:     0 — prototype-fase
```

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN (0 fejl)
- [x] Lint: 5 pre-eksisterende errors, 0 nye tilføjet
- [ ] Unit tests: prototype-fase, ikke krævet
- [ ] Storybook story: prototype-fase, ikke krævet
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer**

> Builder afslutter her. Round 3 er komplet.
> Gate R3: typecheck grøn + Planlægning-mode visuelt identisk (visuel verifikation i browser af Carsten).

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 12:30"
  acceptkriterier_implementeret: "14 — FASE2-012-a..n (alle #12 integration-krav)"
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 4
  manuel_testning_udfoert:
    - "Typecheck: npm run formand:typecheck — 0 fejl, rent output"
    - "Lint: 5 pre-eksisterende errors, 0 nye errors i PlanlaegningContent.tsx eller de 3 nye imports i OrdrePlanScreen"
    - "State-rydning verificeret: grep på showConfirmSend/kørselExpandedId/tilfoejMaterielOpen mv. i OrdrePlanScreen — kun kommentarer, ingen aktive referencer"
    - "Nesting-struktur verificeret mod SPEC: OrdredetaljerSection + DokumentationSection + hr + AsfaltbestillingSection i delt <div>; AsfaltKoerselSection + MaterielleveringSection som top-peers"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "makeOrdredetaljerCard-closure i OrdrePlanScreen er ~300 linjer og bidrager til at orkestratoren kun er 1126 linjer (mod forventede ~600-800). Dette er per SPEC-beslutning — closuren FORBLIVER. Reviewer bør bekræfte at dette er acceptabelt for Round 3."
    - "onConfirmCancel-signaturen: AsfaltbestillingSection forventer (productId, dayId, reason) — orkestratoren sender cancelDay(productId, dayId, reason). Reviewer bør verificere at denne mapping er korrekt."
    - "onTilfoejResource-callback i PlanlaegningContent genererer id: mat-${Date.now()}-${Math.random()...} og kalder setResources i orkestratoren — identisk med OrdrePlanScreen L2306. Reviewer bør bekræfte at dette er korrekt proxy-mønster."
    - "Visuel verifikation endnu ikke udført i browser — det er den resterende gate R3."
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status `ready-for-review`. Prototype-fase → Carsten verificerer visuelt i browser (Gate R3), derefter `/review PlanlaegningContent` eller direkte til Round 4 (Afregning-sektioner).
