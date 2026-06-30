---
section: ordreplan-fase2/child-tabs
component: PropThreading (setter)
spec: .claude/handoffs/ordreplan-fase2/child-tabs/SPEC_PropThreading_setter.md
builder_session: 2026-06-30-0000
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — PropThreading: udbred samleordre-tab-setter

> **Hvad denne fil ER:** Builder's exit-rapport for Round 1 — ren prop-threading, ingen UI-ændring.
> Læses af reviewer + R2-builders.

---

## Implemented

```yaml
accept_pass:
  - id: SOCT-R1-001
    description: >
      PlanlaegningContent: samleordreTabOrderNr + onSelectSamleordreTab tilføjet til
      PlanlaegningContentProps interface. Prop-navngivning følger SPEC (onSelectSamleordreTab,
      ikke raw setter). OrdrePlanScreen sender begge ned.
  - id: SOCT-R1-002
    description: >
      UdfoerselContent: onSelectSamleordreTab tilføjet til inline-type. OrdrePlanScreen
      sender onSelectSamleordreTab={setSamleordreTabOrderNr} ned.
  - id: SOCT-R1-003
    description: >
      AfregningContent: onSelectSamleordreTab tilføjet til inline-type. OrdrePlanScreen
      sender onSelectSamleordreTab={setSamleordreTabOrderNr} ned.
  - id: SOCT-R1-004
    description: >
      OrdrePlanScreen: alle 3 containere modtager samleordreTabOrderNr + onSelectSamleordreTab.
      PlanlaegningContent fik desuden samleordreTabOrderNr (manglede helt ifølge SPEC).
  - id: SOCT-R1-005
    description: >
      Gate bestået: typecheck grøn, ingen nye ESLint-fejl (de 2 pre-eks.
      react-hooks/rule-not-found er uændrede).
```

---

## Not implemented

```yaml
accept_skip:
  - id: SOCT-R1-DOWNSTREAM
    reason: >
      Prop-videregivelse til DokumentationSection, ForundersoegelseSection,
      KsRapporteringSection og UdlaegningSection sker IKKE i R1. Disse sektioners
      interfaces opdateres i Round 2.
    blocked_by: "R2-sektion-builderne (SPEC_DokumentationSection_childtabs.md m.fl.)"
    suggested_followup: "R2 bygger sektionerne — de modtager onSelectSamleordreTab fra containerne"
```

---

## Assumptions

- `onSelectSamleordreTab` er en callback-type (`(orderNumber: string) => void`) og IKKE rå
  `React.Dispatch<SetStateAction<string>>`. Det er bevidst (SPEC's navngivnings-konvention,
  og matcher app-konvention `onSelect…`). OrdrePlanScreen sender `setSamleordreTabOrderNr`
  direkte — det er type-kompatibelt (`string => void` assignable til `Dispatch<SetStateAction<string>>`
  fordi `Dispatch<SetStateAction<T>>` accepterer `T` direkte).
- Props er destruktureret selektivt i containerne: PlanlaegningContent destrukturerer IKKE
  `samleordreTabOrderNr`/`onSelectSamleordreTab` endnu (de er kun i interface) for at undgå
  `no-unused-vars`. R2 destrukturerer dem når de sendes videre til sektionerne.
- UdfoerselContent og AfregningContent bruger inline-types (ikke eksporterede interfaces) — i
  overensstemmelse med eksisterende mønster i disse filer.

---

## Known issues

- Ingen nye issues introduceret. Den eksisterende `react-hooks/exhaustive-deps`-fejl i
  OrdrePlanScreen.tsx L433 + AfregningContent.tsx L350 er pre-eksisterende og uberørt.

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx
      # PlanlaegningContent + UdfoerselContent + AfregningContent kald: tilføjet
      # samleordreTabOrderNr={samleordreTabOrderNr} + onSelectSamleordreTab={setSamleordreTabOrderNr}
      # (PlanlaegningContent manglede samleordreTabOrderNr helt)

  - apps/formand/src/prototypes/ordre-plan/content/PlanlaegningContent.tsx
      # PlanlaegningContentProps: tilføjet samleordreTabOrderNr? + onSelectSamleordreTab?
      # Destructuring: IKKE ændret (undgår no-unused-vars til R2 er klar)

  - apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx
      # Inline-type: tilføjet onSelectSamleordreTab? med JSDoc

  - apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx
      # Inline-type: tilføjet onSelectSamleordreTab? med JSDoc
```

---

## Prototype-fidelity

**Source (prototype):** Ingen ny UI. Ren wiring.

**Hvad blev ændret:**
- 4 filer: interface-udvidelse + prop-videregivelse fra orkestrator til containere.
- Ingen JSX ændret.
- Ingen state oprettet.

**Bevidste afvigelser:**
- 0. Prop-navngivning `onSelectSamleordreTab` følger SPEC præcist.

---

## API exports

**PlanlaegningContent — nye props:**
```typescript
// Tilføjet til PlanlaegningContentProps
/** Aktivt ordrenummer i samleordre-tab (delt root-state) */
samleordreTabOrderNr?: string
/**
 * Callback der skifter aktiv child-ordre i delt root-state.
 * Eksponeres som callback (ikke rå setter) for at holde containere agnostiske.
 * Sektionerne forbruger den i Round 2.
 */
onSelectSamleordreTab?: (orderNumber: string) => void
```

**UdfoerselContent — ny prop (inline-type):**
```typescript
/**
 * Callback der skifter aktiv child-ordre i delt root-state.
 * Modtages af containeren og trådes til ForundersoegelseSection + KsRapporteringSection i Round 2.
 */
onSelectSamleordreTab?: (orderNumber: string) => void
```

**AfregningContent — ny prop (inline-type):**
```typescript
/**
 * Callback der skifter aktiv child-ordre i delt root-state.
 * Modtages af containeren og trådes til UdlaegningSection i Round 2.
 */
onSelectSamleordreTab?: (orderNumber: string) => void
```

---

## Tokens / patterns brugt

Ingen tokens brugt — ren prop-threading, nul JSX.

---

## Tests skrevet

Ingen (prototype-fase).

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN
- [x] ESLint: ingen NYE fejl i de 4 filer (2 pre-eks. react-hooks/rule-not-found uberørt)
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer** — prototype-fase: Carsten kalder `/review` manuelt

> Builder afslutter her. R2-builders kan begynde.

---

## Builder sign-off

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 00:00"
  acceptkriterier_implementeret: "5 af 5 (SOCT-R1-001..005)"
  acceptkriterier_skipped: "1 downstream (SOCT-R1-DOWNSTREAM — hører til R2)"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 0
  manuel_testning_udfoert:
    - "Typecheck: grøn efter alle 4 fil-ændringer"
    - "ESLint: ingen nye fejl i de 4 filer — kun 2 pre-eks. react-hooks/rule-not-found"
    - "Grep: bekræftet at onSelectSamleordreTab IKKE er destruktureret i containere (undgår unused-vars)"
    - "Grep: bekræftet at OrdrePlanScreen sender onSelectSamleordreTab={setSamleordreTabOrderNr} til alle 3 containere"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - >
      PlanlaegningContent destrukturerer IKKE samleordreTabOrderNr/onSelectSamleordreTab endnu —
      de lever kun i interface. R2-builder skal huske at tilføje destrukturering + videregive til
      DokumentationSection.
    - >
      UdfoerselContent og AfregningContent bruger inline-types (ingen eksporterede interfaces) —
      afviger fra PlanlaegningContent-mønstret men er konsistent med eksisterende stil i disse filer.
      Reviewer: bekræft at dette er acceptabelt eller om UdfoerselContent bør konverteres til interface.
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```
