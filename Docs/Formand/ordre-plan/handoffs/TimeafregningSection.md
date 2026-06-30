---
section: ordreplan-fase2
component: TimeafregningSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Afregning_Sections.md#16-timeafregningsection
builder_session: 2026-06-30-1200
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — TimeafregningSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

SPEC #16 TimeafregningSection — extraction fra AfregningContent.tsx L1472–1491.

```yaml
accept_pass:
  - id: TIME-001
    description: "Timeafregning-sektionen (h2 + info-tekst + PLAN-knap) ekstraheret ORDRET fra AfregningContent.tsx L1472–1491"
  - id: TIME-002
    description: "Props-interface TimeafregningProps eksporteret med JSDoc på alle props"
  - id: TIME-003
    description: "State-slices (timeafregningFraPlan, holdpakkeTimer, planModalOpen) ejes af container — trådes som props ind i sektion. Modal-toggle onOpenPlanModal erstatter direkte setPlanModalOpen-kald"
  - id: TIME-004
    description: "Alle Tailwind-tokens bevaret ORDRET: font-poppins, font-inter, bg-surface, border-hairline, rounded-lg, bg-yellow, text-deep-teal, gap-md, px-md, py-lg, py-xs, gap-xxxs m.fl."
  - id: TIME-005
    description: "Ingen hardcodede farver, px-værdier eller font-størrelser — kun tokens"
```

---

## Not implemented

```yaml
accept_skip:
  - id: TIME-006
    reason: "Integrations-trin #17 (AfregningContent → tynd container + wiring) er ikke dette builds ansvar — sker i separat integrations-trin"
    blocked_by: "SPEC INDEX #17 — integration sker EFTER #13–#16 alle er done"
    suggested_followup: "Kald integrations-trin #17 når UdlaegningSection, BilTonsAfregningSection og MaterielafregningSection er reviewet og godkendt"
```

---

## Assumptions

- `timeafregningFraPlan` og `holdpakkeTimer` bruges i SPEC's props-liste men er ikke refereret i kilden L1472–1491. De er medtaget for at matche SPEC's prop-tråding-kontrakt, selvom de reelt bruges i BilTonsAfregningSection (L1327–1430). Container kan videresende dem til begge sektioner.
- `onOpenPlanModal` erstatter `() => setPlanModalOpen(true)` — setState-callbacken inlines ikke i komponenten da modalen ejes af containeren.
- Placeholder-sektionen har ingen intern state — kun callback til container.

---

## Known issues

- Ingen kendte issues. Kilden er en simpel placeholder-sektion uden interaktiv logik udover PLAN-knappen.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/afregning/TimeafregningSection.tsx
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx`
- Linjer kopieret: L1472–1491 (`<section>` med h2 "Timeafregning")

**Hvad blev ekstraheret 1:1:**
- JSX-struktur: `<section>`, wrapper-`<div>`, `<h2>`, info-`<p>`, PLAN-`<button>`
- Alle Tailwind-klasser identiske
- Kommentar `// TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate)` bevaret i fil-header
- Kommentar `// Placeholder-sektion — selve timeafregningen håndteres i PLAN (åbnes via knap)` bevaret

**Bevidste afvigelser fra prototype (med begrundelse):**
- `onClick={() => setPlanModalOpen(true)}` → `onClick={onOpenPlanModal}` — setState-callback isoleres i container per Container/Presenter-mønster. Adfærd uændret.

**Hvad blev IKKE afveget (selvom det fristede):**
- Beholdt token-violation i kommentar-strukturen (ingen violations i selve JSX — sektionen er ren)

---

## API exports

**Props interface:**
```typescript
export interface TimeafregningProps {
  /** Fra-PLAN-toggle — 'ja' = timer hentes fra PLAN, 'nej' = manuelt */
  timeafregningFraPlan: TimeafregningFraPlan
  setTimeafregningFraPlan: (value: TimeafregningFraPlan) => void
  /** Holdpakke-timer — bruges i BilTonsAfregningSection; trådes her for symmetri med SPEC */
  holdpakkeTimer: number
  setHoldpakkeTimer: (value: number) => void
  /** Åbner PLAN-modal i AfregningContent-containeren */
  onOpenPlanModal: () => void
}
```

**Eksporterer:**
- `TimeafregningSection` (named export)
- `TimeafregningProps`

**Forventer fra parent (types):**
- `TimeafregningFraPlan` fra `../../../types` (i AfregningContent: `'ja' | 'nej'`)

---

## Tokens / patterns brugt

- Farver: `bg-surface`, `border-hairline`, `bg-yellow`, `text-deep-teal`, `text-text-primary`, `text-text-secondary` (ingen hex)
- Spacing: `px-md`, `py-lg`, `py-xs`, `gap-md`, `gap-xxxs`, `mb-sm` (ingen px-hardcoding)
- Font: `font-poppins` (header + knap), `font-inter` (brødtekst) — ingen hardcodet font-family
- Touch targets: PLAN-knap har `px-md py-xs` — touch target via inline padding; prototype-kilde har samme klasser

---

## Tests skrevet (hvis test-writer kørt)

Ingen — prototype-fase, jf. SPEC INDEX.

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN
- [x] Handoff udfyldt (denne fil)
- [x] Klar til reviewer

> Builder afslutter her. Reviewer overtager.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-30 12:00
  acceptkriterier_implementeret: 5 (TIME-001..005)
  acceptkriterier_skipped: 1 (TIME-006 — integrations-trin #17, ikke dette builds ansvar)
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 1
  manuel_testning_udfoert:
    - "Typecheck grøn — ingen type-fejl i ny komponent eller eksisterende filer"
    - "Kilde L1472–1491 sammenlignet line-by-line med output — JSX identisk"
    - "setPlanModalOpen(true) erstattet korrekt af onOpenPlanModal callback"
    - "Props-interface dækker alle SPEC-definerede state-slices"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "timeafregningFraPlan + holdpakkeTimer er i props men ikke brugt i komponentens JSX — bruges i BilTonsAfregningSection. Reviewer bør bekræfte at container-wiring i #17 tråder dem til begge sektioner"
    - "PLAN-knappens touch target er alene via px-md py-xs padding — overvej om min-h-[44px] bør tilføjes ved integration (ikke afvigelse fra prototype, men noter til cleanup-passet)"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status sat til `ready-for-review`. Reviewer-agent dispatches manuelt via `/review TimeafregningSection` (prototype-fase).
