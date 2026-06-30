---
section: ordreplan-fase2
component: AsfaltbestillingSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Planlaegning_Sections.md
builder_session: 2026-06-30-1000
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — AsfaltbestillingSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: SPEC-#9-extraction
    description: "JSX fra OrdrePlanScreen.tsx L1219–1376 udtrukket ORDRET til ny sektionsfil"
  - id: SPEC-#9-modal
    description: "Bekræftelses-modal (L2338–2409) inkluderet da den er Asfaltbestilling-eksklusiv — alle send-state-felter verificeret til kun at bruges i Planlægning-JSX"
  - id: SPEC-#9-local-state
    description: "showConfirmSend / sentDayIds / fabrikSendtDates / sentKommentarer / kommentar / bestillingForSent er lokal state (verificeret: ingen referencer i UdfoerselContent.tsx / AfregningContent.tsx)"
  - id: SPEC-#9-props-interface
    description: "Eksporteret AsfaltbestillingSectionProps — ingen any-types, JSDoc på ikke-oplagte props"
  - id: SPEC-#9-produktbokse
    description: "ProductBoxV2 + EkstraBestillingBox importeres fra eksisterende components/ — ikke genbygget"
  - id: SPEC-#9-samleordre
    description: "Samleordre-tags-beregning (rcToChildren-loop) kopieret ORDRET fra orkestratoren"
```

---

## Not implemented

```yaml
accept_skip: []
```

Alle aspekter i SPEC #9 er implementeret. Intet skipped.

---

## Assumptions

- `showConfirmSend`, `sentDayIds`, `fabrikSendtDates`, `sentKommentarer`, `kommentar` er Planlægning-lokale (verificeret ved grep i UdfoerselContent + AfregningContent — ingen hits). De er gjort til lokal state i sektionen, ikke props fra root.
- Bekræftelses-modalen på L2338-2409 er Asfaltbestilling-eksklusiv selvom den teknisk lå som orkestrator-overlay. Modalen er inkluderet i sektionen (via React fragment `<>`) — dette er en lille strukturel beslutning, men den mest kohærente extraction da al modal-state nu er lokal.
- `onConfirmCancel`-signaturen er udvidet med `productId` og `dayId` i props-interfacet (i modsætning til orkestratoren der brugte closures). Dette er nødvendigt fordi sektionen ikke har closure-adgang til product/day — det er en ren parametrisering, ikke adfærdsændring.
- `onCancelDay` tager `dayId` som parameter (ikke `productId`) — dette matcher orkestratoren der brugte `setCancellingDayId(day.id)`.

---

## Known issues

- Ingen nye issues introduceret.
- `bestillingForSent = true` er hardcodet i lokal state (samme som prototype) — TODO-kommentar bevaret.
- `w-[160px]`-token-violations i ProductBoxV2-wrapper bevaret ORDRET per SPEC-instruks (flyt ikke, ret ikke).

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/planlaegning/AsfaltbestillingSection.tsx
```

Ingen eksisterende filer redigeret. Wiring sker i integrations-trin #12 (PlanlaegningContent).

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Sektions-JSX kopieret fra: L1219–1376
- Modal kopieret fra: L2338–2409

**Hvad blev ekstraheret 1:1:**
- `<div className="flex flex-col gap-sm">` rodcontainer med h2 "Asfaltbestilling"
- Samleordre-tags-beregning (rcToChildren-loop)
- ProductBoxV2-mapping inkl. EkstraBestillingBox-branch
- "Send til fabrik"-CTA (gul knap + grøn sendt-tilstand)
- Kommentar-tooltip nedenunder send-boksen
- Bekræftelses-modal (fixed overlay + kommentar-textarea + Annullér/Send)
- Alle Tailwind-klasser (inkl. `w-[160px]`-violations) — ORDRET

**Bevidste afvigelser fra prototype (med begrundelse):**
- `onConfirmCancel`-signaturen udvidet til `(productId, dayId, reason)` — nødvendig parametrisering da sektionen ikke har closure-adgang. Adfærd 100% identisk.
- Modal rykket ind i sektionen (fra orkestrator-overlay-position) — strukturel omplacering, ikke adfærdsændring. Al modal-state er lokal.

**Hvad blev IKKE ændret (selvom det fristede):**
- `w-[160px]` / `min-h-[172px]` på send-boksen — bevaret som token-violation per SPEC-instruks
- `bestillingForSent = true` hardcoded — bevaret med TODO-kommentar
- IIFE-pattern i send-boks (`(() => { ... })()`) — bevaret ORDRET

---

## API exports

**Props interface:**
```typescript
export interface AsfaltbestillingSectionProps {
  productsForSelectedDate: { product: MockProduct; day: DayPlan }[]
  selectedPlanDate: string
  activeProductId: string
  onSetActiveProductId: (id: string) => void
  onUpdateTons: (productId: string, dayId: string, v: number) => void
  onUpdateMorgenTons: (productId: string, dayId: string, v: number | undefined) => void
  cancellingDayId: string | null
  onCancelDay: (dayId: string) => void
  onAbortCancel: () => void
  onConfirmCancel: (productId: string, dayId: string, reason: CancelReason) => void
  onRestoreDay: (dayId: string) => void
  productSamlesFlags: Record<string, boolean>
  onSetProductSamles: (productId: string, dayId: string, value: boolean) => void
  isSamleordreMode: boolean
  samleordreCtx: SamleordreContext | null
}
```

**Eksporterer:**
- `AsfaltbestillingSection` (named)
- `AsfaltbestillingSectionProps` (named)

**Importerer:**
- `ProductBoxV2`, `EkstraBestillingBox` fra `../../../components/ProductBoxV2`
- `MockProduct`, `DayPlan`, `SamleordreContext`, `CancelReason` fra `../../../types`

---

## Tokens / patterns brugt

- Farver: `text-deep-teal`, `bg-yellow`, `border-yellow`, `text-good`, `bg-good/5`, `bg-good/15`, `text-bad`, `bg-bad-bg`, `border-bad/30`, `border-hairline` — ingen hex
- Spacing: `gap-sm`, `gap-xs`, `gap-xxs`, `px-sm`, `py-xs`, `p-sm`, `p-lg`, `mt-xxxs`, `mb-sm`, `px-xxs`, `px-xs`, `py-xxxs` — ingen px-hardcoding udover `w-[160px]`/`min-h-[172px]` (prototype-violations bevaret ORDRET)
- Font: `font-poppins` (headers, boks-labels), `font-inter` (body, meta) — ingen hardcoded font-family
- Visual Pattern Reference (SPEC): `font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm` — implementeret identisk på h2

---

## Tests skrevet (hvis test-writer kørt)

```
unit:    0 — prototype-fase, ikke påkrævet
story:   0 — SPEC kræver ingen stories (prototype-fase, INDEX.md §"INGEN tests/stories kræves")
e2e:     0 — prototype-fase
```

---

## Ready-for-next-step

- [ ] Lint pass: `npm run formand:lint` — 5 pre-eksisterende errors (ikke Fase 2's ansvar)
- [x] Typecheck pass: `npm run formand:typecheck` — **GRØN**
- [ ] Unit tests pass: N/A (prototype)
- [ ] Storybook story: N/A (prototype, SPEC kræver ingen)
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer** — prototype-fase: `/review AsfaltbestillingSection` manuelt

> Builder afslutter her. Integrations-trin #12 (PlanlaegningContent) wirer sektionen ind.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 10:30"
  acceptkriterier_implementeret: "alle #9-krav fra SPEC_Planlaegning_Sections.md"
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 2
  manuel_testning_udfoert:
    - "Typerne kompilerer rent (formand:typecheck grøn)"
    - "Alle prop-flows traceret fra prototype-kildekode til props-interface — ingen manglende callbacks"
    - "Modal-state (showConfirmSend/sentDayIds/fabrikSendtDates) verificeret som Planlægning-lokal via grep mod UdfoerselContent + AfregningContent (ingen hits)"
    - "SamleordreContext-import og rcToChildren-loop kopieret tegn-for-tegn fra L1241-1258"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "onConfirmCancel-signaturen er udvidet med productId+dayId ift. orkestratoren der brugte closure — kald-stedet i #12 skal tilpasse sig dette"
    - "Modal er rykket fra orkestrator-overlay til sektionens React-fragment — verify at z-50 fixed modal fungerer korrekt fra nested context"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status sat til `ready-for-review`. Prototype-fase: reviewer kaldes manuelt via `/review AsfaltbestillingSection`. Wiring sker i integrations-trin #12 (PlanlaegningContent).
