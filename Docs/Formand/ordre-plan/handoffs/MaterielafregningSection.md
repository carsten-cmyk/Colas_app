---
section: ordreplan-fase2
component: MaterielafregningSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Afregning_Sections.md
builder_session: 2026-06-30-1000
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — MaterielafregningSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: FASE2-R4-15-001
    description: "Ny fil oprettet: content/sections/afregning/MaterielafregningSection.tsx"
  - id: FASE2-R4-15-002
    description: "JSX kopieret ORDRET fra AfregningContent.tsx L1309–1468 (<section> med h2 'Materielafregning')"
  - id: FASE2-R4-15-003
    description: "Eksporteret props-interface MaterielafregningProps med alle state-slices og setters"
  - id: FASE2-R4-15-004
    description: "State ejes af container — materielAfregningGodkendt/materielAnvendt/materielTimer/holdpakkeTimer/timeafregningFraPlan trådes ind som props + setters"
  - id: FASE2-R4-15-005
    description: "MATERIEL_ENHEDER trådes ind som prop (fra mocks — container importerer og sender ned)"
  - id: FASE2-R4-15-006
    description: "Ingen adfærdsændring: Case A (toggle switch) og Case B (timer-input) bevaret identisk"
  - id: FASE2-R4-15-007
    description: "Godkend-afregning-knap og Genåbn-afregning-link bevaret med identiske className-strenge"
  - id: FASE2-R4-15-008
    description: "typecheck: grøn (npm run formand:typecheck)"
```

---

## Not implemented

```yaml
accept_skip:
  - id: FASE2-R4-17
    reason: "AfregningContent → container (integrations-trin) er #17, IKKE scope for denne builder-runde"
    blocked_by: "Afventer #13 (UdlaegningSection) + #14 (BilTonsAfregningSection) + #16 (TimeafregningSection)"
    suggested_followup: "Kald builder igen med #17-scope når alle sektioner (#13-#16) er bygget"
```

---

## Assumptions

- `MATERIEL_ENHEDER` trådes som prop (type `MaterielEnhed[]`) frem for at importere direkte fra `../../../mocks` — dette følger SPEC's Container/Presenter-princip og giver containeren kontrol over datakilde.
- `vognmandMaterielBekraeftelse` er markeret `@deprecated` i props-interface fordi SPEC siger "Ubrugt nu" — bedt om at inkludere det alligevel som `unknown` type for fuld bagudkompatibilitet.
- Setter-signaturer for `materielAnvendt` og `materielTimer` er `(updater: (prev: Record<...>) => Record<...>) => void` — dette matcher de functional updaters der bruges i kilden (setState(prev => ...)-mønster).

---

## Known issues

- Ingen kendte issues. Sektionen er ren extraction uden logik.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/afregning/MaterielafregningSection.tsx

modified:
  (ingen)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/AfregningContent.tsx`
- Linjer kopieret: `L1309–1468` (`<section>` med h2 "Materielafregning")

**Hvad blev ekstraheret 1:1:**
- JSX-struktur: `<section>`, header-div, tabel (thead/tbody), toggle-switch, timer-inputs, footer-row, godkendt-banner
- Tailwind-klasser: alle tokens identiske med kilde (inkl. `w-[100px]`, `w-[120px]`, `translate-x-[18px]`, `translate-x-[2px]` — disse er intentionelle fixed-width UI-elementer, ikke layout-containers)
- Conditional render: `{!materielAfregningGodkendt && ...}` + `{materielAfregningGodkendt && ...}` bevaret
- Demo-toggle (nej/ja knapper) bevaret ordret inkl. TODO-kommentar

**Bevidste afvigelser fra prototype:**
1. `setMaterielAfregningGodkendt(true/false)` → `onSetMaterielAfregningGodkendt(true/false)` — prop-navngivning følger callback-konventionen (on-prefix) som bruges i øvrige Fase 2-sektioner.
2. `setTimeafregningFraPlan(v)` → `onSetTimeafregningFraPlan(v)` — samme begrundelse.
3. `setMaterielAnvendt(prev => ...)` → `onSetMaterielAnvendt(prev => ...)` — functional updater bevaret.
4. `setMaterielTimer(prev => ...)` → `onSetMaterielTimer(prev => ...)` — functional updater bevaret.
5. `setHoldpakkeTimer(...)` → `onSetHoldpakkeTimer(...)` — on-prefix.

Alle 5 afvigelser er navngivningskonvention — ingen adfærdsændring.

**Hvad blev IKKE afveget (selvom det fristede):**
- `w-[100px]` og `w-[120px]` på input-felterne beholdt (intentionelle — ikke layout-containers)
- `translate-x-[18px]` og `translate-x-[2px]` på toggle-span beholdt (pixel-nøjagtigt toggle-design)
- MATERIEL_ENHEDER-loop beholdt som prop (ikke hardcodet)

---

## API exports

**Props interface:**
```typescript
export interface MaterielafregningProps {
  materielAfregningGodkendt: boolean
  onSetMaterielAfregningGodkendt: (v: boolean) => void
  timeafregningFraPlan: TimeafregningFraPlan
  onSetTimeafregningFraPlan: (v: TimeafregningFraPlan) => void
  materielAnvendt: Record<string, boolean>
  onSetMaterielAnvendt: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void
  materielTimer: Record<string, number>
  onSetMaterielTimer: (updater: (prev: Record<string, number>) => Record<string, number>) => void
  holdpakkeTimer: number
  onSetHoldpakkeTimer: (v: number) => void
  MATERIEL_ENHEDER: MaterielEnhed[]
  vognmandMaterielBekraeftelse?: unknown
}
```

**Eksporterer:**
- `MaterielafregningSection` (named export)
- `MaterielafregningProps` (named export)

**Forventer fra parent (types/imports):**
- `TimeafregningFraPlan` fra `../../../types`
- `MaterielEnhed` fra `../../../types`
- `CheckCircle2` fra `lucide-react`

---

## Tokens / patterns brugt

- Farver: `text-text-primary`, `text-text-secondary`, `text-text-muted`, `bg-surface`, `bg-soft-aqua`, `bg-good`, `bg-good-bg`, `bg-warn-bg`, `bg-yellow`, `bg-white`, `bg-hairline-2`, `border-hairline`, `border-good/20`, `text-deep-teal`, `text-good`, `text-white` — ingen hex
- Spacing: `gap-sm`, `gap-xs`, `gap-xxxs`, `px-sm`, `py-xs`, `px-xs`, `py-xxxs`, `mb-sm`, `ml-auto`, `p-sm` — ingen hardcodet spacing
- Font: `font-poppins` (h2), `font-inter` (body/labels/knapper) — ingen hardcodet font-family
- Touch targets: `min-h-touch` på "Godkend afregning"-knap — OK
- Undtagelse: `w-[100px]`, `w-[120px]` (inputfelter), `translate-x-[18px]`, `translate-x-[2px]` (toggle-thumb), `w-9`, `h-5`, `w-4`, `h-4` (toggle) — alle intentionelle UI-komponent-dimensioner, ikke layout

---

## Tests skrevet

Ingen — prototype-fase, tests kræves ikke ifølge INDEX-SPEC.

---

## Ready-for-next-step

- [ ] Lint pass: `npm run formand:lint` (5 pre-eksisterende errors — ikke Fase 2's ansvar)
- [x] Typecheck pass: `npm run formand:typecheck` — GRØN
- [ ] Unit tests pass — ikke scope (prototype-fase)
- [ ] Storybook story — ikke scope (prototype-fase, SPEC kræver det ikke)
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer** → ⏳

> Builder afslutter her. Reviewer overtager eller bruger kalder `/review MaterielafregningSection`.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 10:15"
  acceptkriterier_implementeret: "8 af 8 fra SPEC_Afregning_Sections.md #15-scope (FASE2-R4-15-001..008)"
  acceptkriterier_skipped: "1 — FASE2-R4-17 (integrations-trin, ikke scope for denne builder)"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 5
  manuel_testning_udfoert:
    - "Scenarie 1: Verificeret at alle JSX-klasser matcher AfregningContent.tsx L1309-1468 ORDRET ved side-by-side diff"
    - "Scenarie 2: Godkend-afregning-knap bruger min-h-touch (touch target OK)"
    - "Scenarie 3: Toggle-switch aria-checked + aria-label korrekt bevaret fra kilde"
    - "Scenarie 4: typecheck grøn (ingen nye type-fejl introduceret)"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "Setter-signaturer bruger functional updater-form (prev => ...) — reviewer bør bekræfte at dette matcher AfregningContent's forventede setState-kald i integrationstrinnet #17"
    - "vognmandMaterielBekraeftelse er typed som unknown (ikke VognmandMaterielBekraeftelse) fordi SPEC siger 'Ubrugt nu' — reviewer bør beslutte om den skal fjernes helt eller types korrekt"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status `ready-for-review`. Kaldes via `/review MaterielafregningSection` (prototype-fase — ingen auto-dispatch).
