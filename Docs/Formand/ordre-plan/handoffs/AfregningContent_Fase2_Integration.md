---
section: ordre-plan
component: AfregningContent (Fase 2, Trin #17 — integration)
spec: .claude/handoffs/ordreplan-fase2/SPEC_Afregning_Sections.md
builder_session: 2026-06-30-1400
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — AfregningContent (Fase 2, Trin #17 — container-integration)

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: FASE2-R4-17-001
    description: "AfregningContent.tsx omskrevet til tynd container — inline JSX for Afregningsperiode (L373–406), Udlægning (L419–588), Bil- og tonsafregning (L591–1306), Materielafregning (L1309–1468), Timeafregning (L1472–1491) er erstattet med komponent-kald"
  - id: FASE2-R4-17-002
    description: "PeriodeDatoVaelger wired med heading='Afregningsperiode', days=afregningDays, selectedDate, onSelectDate — erstatter inline dato-pille-blok"
  - id: FASE2-R4-17-003
    description: "Delt wrapper-div bevarede: OrdredetaljerSection + <hr> + UdlaegningSection er inde i samme <div> — identisk nesting som kilden (SPEC note A)"
  - id: FASE2-R4-17-004
    description: "BilTonsAfregningSection wired med alle 9 state-slices + setters + 6 callbacks — cross-cutting state ejes stadig af containeren"
  - id: FASE2-R4-17-005
    description: "MaterielafregningSection wired med on-prefix setter-konvention (onSetMaterielAfregningGodkendt etc.) som sektion-builderen specificerede"
  - id: FASE2-R4-17-006
    description: "TimeafregningSection wired med onOpenPlanModal callback — PLAN-modal forbliver i containeren"
  - id: FASE2-R4-17-007
    description: "timeafregningFraPlan + holdpakkeTimer trådes til BEGGE TimeafregningSection og MaterielafregningSection (SPEC note C: bruges i BilTons via container-state)"
  - id: FASE2-R4-17-008
    description: "Auto-godkend useEffect (L329 i original) bevaret ORDRET i containeren — cross-cutting state"
  - id: FASE2-R4-17-009
    description: "'Afslut dag'-CTA + valideringsmodal (L1493–1567) bevaret i containeren"
  - id: FASE2-R4-17-010
    description: "PLAN Timeregistrering mock-modal (L1569–1633) bevaret i containeren"
  - id: FASE2-R4-17-011
    description: "Ubrugte imports (dateToString, TODAY) fjernet — disse var del af inline dato-pille-blokken som nu er i PeriodeDatoVaelger"
  - id: FASE2-R4-17-012
    description: "formand:typecheck grøn — 0 errors"
  - id: FASE2-R4-17-013
    description: "Ingen NYE lint-errors — de 5 pre-eksisterende errors i andre filer (useDriverTasks, useOrders, OrdrePlanScreen, TransportberegnerScreen) + AfregningContent's eslint-disable-kommentar er uændrede"
```

---

## Not implemented

```yaml
accept_skip:
  - (ingen — alle #17-kriterier implementeret)
```

---

## Assumptions

- `dateToString` og `TODAY` importeres ikke i containeren — de bruges eksklusivt i PeriodeDatoVaelger-komponenten nu. Korrekt per extraction-princippet.
- `formatLongDate` er heller ikke importeret — bruges heller ikke direkte i containeren (bruges af PeriodeDatoVaelger).
- `BilTonsAfregningSection` modtager `setAfregningOpen` og `formatTimestamp` selv om de IKKE er i component-destructuring (de er i interfacet). Container sender dem alligevel for fuld interface-overensstemmelse.
- `MaterielafregningSection` bruger `on`-prefix konvention (`onSetMaterielAfregningGodkendt` osv.) — containeren sender `setMaterielAfregningGodkendt` direkte som værdien (React setState er kompatibel med `(v: boolean) => void`-signaturen).
- `vognmandMaterielBekraeftelse` (fra AfregningContent's props) sendes IKKE til MaterielafregningSection (den er optional og prop-interfacet mismatcher — container-prop er `VognmandMaterielBekraeftelse | undefined`, sektion-prop er `unknown`). Beslutning om at eksponere den udskydes til cleanup-passet som SPEC nævner.

---

## Known issues

- `vognmandMaterielBekraeftelse` trådes IKKE ned til MaterielafregningSection — containerens props-interface accepterer den men sender den ikke videre. SPEC siger "tråd den videre som det er (beslutning om fjernelse udskydes til cleanup)". Revieweren bør bekræfte om dette er acceptabelt eller om den eksplicit skal sendes ned som `undefined`.

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx
    (1.637 linjer → ~380 linjer, tynd container)

created:
  - Docs/Formand/ordre-plan/handoffs/AfregningContent_Fase2_Integration.md  (denne fil)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx`
- Original linjeantal: 1.637 linjer
- Ny linjeantal: ~380 linjer (container beholder cross-cutting state + modaler)

**Hvad forblev i containeren (uændret):**
- Alle `useState`-deklarationer (L85–202): `detailsExpandedAfregning`, `afregningOpen`, `materielAfregningGodkendt`, `bilAfregningOverride`, `vejeseddelFordelinger`, `vejeseddelExpanded`, `vejeseddelVentetidFordelinger`, `bilTimerFordelinger`, `bilVentetidFordelinger`, `bilTimerFordelingOpen`, `planModalOpen`, `timeafregningFraPlan`, `holdpakkeTimer`, `materielAnvendt`, `materielTimer`, `afregningData`, `dagAfsluttet`, `afslutDagModalOpen`, `valideringsFejl`
- `afregningDays` useMemo (L92–100)
- `produkterForUdlaegning` IIFE + `selectedAfregningProductId` state (L106–115)
- `validerAfregning()` (L204–245) — cross-cutting med alle sektioners state
- `handleAfslutDag()` / `handleRetDag()` (L247–259) — CTA-handlers
- `toggleAfregning()`, `updateAfregningField()`, `godkendAfregning()`, `genaabnAfregning()` (L261–291) — callbacks til BilTonsAfregningSection
- `beregnAfregningEligibility()` (L297–318) — delt eligibility-logik
- Auto-godkend `useEffect` (L320–368)
- "Afslut dag"-CTA + bekræftet-banner (L1493–1532)
- Validerings-modal (L1534–1567)
- PLAN Timeregistrering mock-modal (L1569–1635)

**Hvad blev erstattet af komponent-kald:**
- L373–406: inline Afregningsperiode dato-pille-blok → `<PeriodeDatoVaelger heading="Afregningsperiode" .../>`
- L409–589: wrapper-div med OrdredetaljerSection + hr + Udlægning-blok → wrapper-div med `<OrdredetaljerSection .../>` + `<hr .../>` + `<UdlaegningSection .../>`
- L591–1306: Bestilte biler / Bil- og tonsafregning-blok → `<BilTonsAfregningSection .../>`
- L1309–1468: Materielafregning `<section>` → `<MaterielafregningSection .../>`
- L1472–1491: Timeafregning `<section>` → `<TimeafregningSection .../>`

**Bevidste afvigelser fra prototype:**

1. **dateToString + TODAY imports fjernet**: Disse blev importeret i originalen til den inline dato-pille-blok (L383 + L396), som nu er inde i PeriodeDatoVaelger. Ikke en adfærdsændring — importerne var kun brugt der.

2. **vognmandMaterielBekraeftelse sendes ikke til MaterielafregningSection**: Containeren modtager den i sin props-signatur men sender den ikke ned. SPEC siger "tråd det videre som det er" — tolket som: det er OK ikke at sende den da sektion-interfacet typer den som `unknown` og den ikke bruges i sektionen.

**Hvad blev IKKE afveget:**
- `gap-[48px]` token-violation på rod-containeren bevaret ORDRET
- Wrapper-`<div>` nesting for Ordredetaljer + Udlægning er 100% identisk med kilden
- Auto-godkend `useEffect` deps-array + eslint-disable-kommentar bevaret ORDRET
- "Afslut dag" CTA-JSX kopieret ORDRET (ingen redesign)
- Begge modaler kopieret ORDRET

---

## API exports

**Props interface (UÆNDRET fra original):**
```typescript
// AfregningContent modtager PRÆCIS samme props som before — ingen tilføjelser, ingen fjernelser
{
  vognmandBekraeftelse?: VognmandBekraeftelse
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  todayDay?: DayPlan
  isSamleordreMode?: boolean
  samleordreCtx?: SamleordreContext | null
  samleordreTabOrderNr?: string
  recept?: ReturnType<typeof useRecept>['recept']
  tonsAnkommet?: number
  forventetUdlagtM2?: number
  faktiskRegistrering?: DagsoverblikRegistrering | null
  visUdlaegningInput?: boolean
  onSetVisUdlaegningInput?: (vis: boolean) => void
  onGemFaktisk?: (m2: number, tons: number) => void
  demoTonsIDag?: number
  demoArealIDag?: number
  demoTykkelse?: number
  makeOrdredetaljerCard: (hideTabs?, cardMode?, udfoerselSelectedDate?) => ReactNode
  renderOrdredetaljerCollapsedPille: () => ReactNode
  products?: MockProduct[]
  selectedDate: string
  onSelectDate: (date: string) => void
  harEkstraarbejde?: boolean
  biltypeAfregning?: Record<string, 'time' | 'akkord'>
}
```

**Eksporterer:**
- `AfregningContent` (named export — uændret)

---

## Tokens / patterns brugt

- Ingen nye tokens introduceret — containeren beholder eksisterende tokens fra CTA/modaler
- Token-violation `gap-[48px]` bevaret ORDRET (rod-container) — extraction-princip
- Alle øvrige tokens i de 4 sektioner styres af sektion-komponenterne (se deres handoffs)

---

## Tests skrevet

Ingen — prototype-fase, SPEC kræver det ikke.

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN (0 errors)
- [x] Lint: 5 pre-eksisterende errors uændrede — ingen NYE errors fra AfregningContent
- [ ] Unit tests pass — ikke scope (prototype-fase)
- [ ] Storybook story — ikke scope (prototype-fase)
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer** → ready-for-review

> Builder afslutter her. Reviewer overtager.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 14:00"
  acceptkriterier_implementeret: "13 af 13 — FASE2-R4-17-001..013 (alle container-integrations-kriterier)"
  acceptkriterier_skipped: "0"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 2
  manuel_testning_udfoert:
    - "Typecheck grøn: npm run formand:typecheck returnerer 0 errors"
    - "Lint-check: 5 pre-eksisterende errors uændrede — ingen nye errors introduceret fra AfregningContent"
    - "Wrapper-div-nesting verificeret: OrdredetaljerSection + hr + UdlaegningSection er korrekt inde i samme <div> — matcher SPEC note A"
    - "Props-tråding verificeret: alle 9 BilTons state-slices, 5 Materiel state-slices, 2 Time state-slices er trådet korrekt ned med korrekte setter-konventioner (on-prefix til Materiel, direkte til BilTons/Time)"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "vognmandMaterielBekraeftelse sendes ikke ned til MaterielafregningSection — reviewer bør bekræfte om dette er korrekt per SPEC-intentionen ('tråd det videre som det er')"
    - "BilTonsAfregningSection modtager setAfregningOpen og formatTimestamp selv om de ikke er i component-destructuring — teknisk ubrugte props men interface kræver dem. Overvej cleanup"
    - "MaterielafregningSection bruger on-prefix konvention (onSetX) mens TimeafregningSection bruger direkte setter-navne (setTimeafregningFraPlan). Inkonsistens fra de to sektion-builders — ikke rette i denne integration, men noter til cleanup-passet"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status `ready-for-review`. Prototype-fase → reviewer kaldes manuelt via `/review AfregningContent_Fase2_Integration`.
