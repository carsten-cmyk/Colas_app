---
section: [section-slug]                # fx asfaltbestilling
component: [ComponentName]             # fx ProductBoxV2
spec: Docs/[App]/SPEC_[Name].md
builder_session: [yyyy-mm-dd-hhmm]
status: [draft | ready-for-review | ready-for-validation]
---

# Handoff — [ComponentName]

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

> Hvilke accept-kriterier (fra validation contract) er dækket af denne komponent.

```yaml
accept_pass:
  - id: [ASF-001]
    description: "[fri tekst — hvad blev implementeret]"
  - id: [ASF-002]
    description: "..."
```

---

## Not implemented

> Hvilke accept-kriterier fra contract er IKKE dækket, og hvorfor.

```yaml
accept_skip:
  - id: [ASF-003]
    reason: "[fx Afventer cross-cutting datoformat-beslutning]"
    blocked_by: "[fx project_locked_decisions_pending #2]"
    suggested_followup: "[fx Lås datoformat → opdatér contract → re-build]"
```

---

## Assumptions

> Antagelser builder var nødt til at tage. Skal flag'es så reviewer/du kan udfordre dem.

- "[fx sentDayIds er local state — flyttes til Supabase i fase 2.2]"
- "[fx morgenTons defaulter til null indtil indtastning, ikke 0]"

---

## Known issues

> Bugs/quirks builder opdagede men ikke fixede.

- "[fx Tooltip flickerer i Safari pga. CSS-bug i parent — lib-issue #42]"
- "[fx Optimistic UI ruller ikke tilbage hvis Send fejler — håndteres af useAsfaltbestilling, ikke komponenten]"

---

## Files changed

```
created:
  - apps/formand/src/components/ui/ProductBoxV2.tsx
  - apps/formand/src/components/ui/ProductBoxV2.stories.tsx

modified:
  - apps/formand/src/types/index.ts        # tilføjet MockProduct-export
  - shared/types/ordre.ts                  # tilføjet Product-interface
```

---

## Prototype-fidelity

> **Regel:** Komponenten er ekstraheret fra prototypen, ikke nyskrevet. Dokumentér hvad der blev kopieret og hvad der bevidst afviger.

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Linjer kopieret: `L2595-L2793` (ProductBoxV2 function body)

**Hvad blev ekstraheret 1:1:**
- JSX-struktur (alle divs, knapper, inputs)
- Tailwind-klasser (alle tokens)
- State-håndtering (weatherActive, isSelectingReason)
- Conditional render-branches (cancelled, selecting-reason, default)

**Bevidste afvigelser fra prototype (med begrundelse):**
- `[fx onUpdateTons-signatur ændret fra (v: number) til (v: number, source: 'manual'|'optimistic') — for at understøtte optimistic UI i useAsfaltbestilling]`
- `[fx ordreTagLabels prop tilføjet — eksisterede ikke i prototype, kommer fra samleordre-feature]`

**Hvad blev IKKE afveget (selvom det fristede):**
- `[fx beholdt 'samles paa en bil' som intern state selvom det kunne være global — fordi prototypen bruger lokal state, og vi flytter ikke uden contract-amendment]`

---

## API exports

> Eksakt offentlig API. Reviewer + validator læser denne sektion for at vide hvad der må kaldes udefra.

**Props interface:**
```typescript
export interface ProductBoxV2Props {
  product: MockProduct                                  // ordrens recept-info
  day: DayPlan                                          // den dag denne boks repræsenterer
  isFocused: boolean
  isSelectingReason: boolean
  isSent: boolean                                       // låser inputs read-only
  onFocus: () => void
  onUpdateTons: (v: number) => void
  onUpdateMorgenTons: (v: number | undefined) => void
  onCancel: () => void
  onAbortCancel: () => void
  onConfirmCancel: (r: CancelReason) => void
  onRestore: () => void
  ordreTagLabels?: string[]                             // optional — kun ved samleordre
  samlesPaaEnBil?: boolean
  onSamlesPaaEnBilChange?: (v: boolean) => void
}
```

**Eksporterer:**
- `ProductBoxV2` (default)
- `ProductBoxV2Props`

**Forventer fra parent (hooks/types):**
- `MockProduct` fra `shared/types/produkt.ts`
- `DayPlan` fra `shared/types/produkt.ts`
- `CancelReason` fra `shared/types/produkt.ts`

---

## Tokens / patterns brugt

> Kort verificering af at design-system-tokens er overholdt. Reviewer dobbelt-tjekker.

- Farver: `bg-white`, `border-hairline`, `text-deep-teal` (ingen hex)
- Spacing: `p-sm`, `gap-xs`, `mt-xxxs` (ingen px-hardcoding)
- Font: `font-poppins` (header), `font-inter` (body) — ingen hardcoded font-family
- Touch targets: alle interaktive elementer ≥ 44×44px
- Hover/focus states: `hover:border-dark-teal`, `focus-within:bg-white`

---

## Tests skrevet (hvis test-writer kørt)

```
unit:    [N tests]  apps/formand/src/components/ui/__tests__/ProductBoxV2.test.tsx
story:   [N variants] apps/formand/src/components/ui/ProductBoxV2.stories.tsx
e2e:     [N specs]  apps/formand/e2e/asfaltbestilling.spec.ts
```

Coverage (hvis målt):
- lines: X%
- functions: X%
- branches: X%

---

## Ready-for-next-step

- [ ] Lint pass: `npm run [app]:lint`
- [ ] Typecheck pass: `npm run [app]:typecheck`
- [ ] Unit tests pass: `npm run [app]:test`
- [ ] Storybook story renderer uden errors
- [ ] Handoff udfyldt (denne fil)
- [ ] **Klar til reviewer** → ⏳

> Builder afslutter her. Reviewer overtager.
