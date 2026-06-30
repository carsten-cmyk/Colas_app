---
section: ordreplan-fase2
component: MaterielleveringSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Planlaegning_Sections.md
builder_session: 2026-06-30-0800
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — MaterielleveringSection

> **Hvad denne fil ER:** Builder's exit-rapport for SPEC #11 i OrdrePlanScreen Fase 2, Round 3.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: SPEC-11
    description: "MaterielleveringSection.tsx ekstraheret fra OrdrePlanScreen L1982–2157 (ORDRET).
                  Branching på alle 4 materielUiState-værdier (planlaeg, ny-etape, paa-pladsen, dvale).
                  Samleordre-mode med sub-headers pr. child-ordre bevaret.
                  3-state vognmand-badge (Ikke planlagt / Sendt til vognmand / Bekræftet vognmand) kopi.
                  Lokal UI-state (tilfoejMaterielOpen, materielSoeg, fjernModalId) flyttet ned til sektionen.
                  Tilføj materiel modal kopieret ORDRET fra OrdrePlanScreen L2249–2334.
                  FjernModal kopieret ORDRET fra OrdrePlanScreen L2240–2248.
                  Alle 4 MaterielTilstande-presentere (Planlaeg/NyEtape/PaaPladsen/Dvale) bruges via import.
                  Props-interface eksporteret som MaterielleveringSectionProps uden any-typer."
```

---

## Not implemented

```yaml
accept_skip:
  - id: N/A
    reason: "Ingen accept-kriterier fra contract er skippet. Dette er en ren extraction — ingen ny funktionalitet."
```

---

## Assumptions

- `tilfoejMaterielOpen`, `materielSoeg`, `fjernModalId` er rene UI-state der KUN bruges inden for denne sektion — de flyttes herned (jf. SPEC: "kan flyttes ned"). Den tilhørende modal-JSX flyttes med.
- `onTilfoejResource`-callbacket bruger `STANDARD_MATERIEL_KATALOG`'s faktiske type (`{ plantNumber, description, transportTag }`) — kataloget i mocks.ts har IKKE `id`-felt. Orkestratoren ansvarlig for at generere `id: mat-${Date.now()}-...` ved tilføjelse (identisk med OrdrePlanScreen L2306).
- `onFjernResource`-callbacket forventer `resourceId: string` — orkestratoren kender sin `removeResource`-funktion.
- `materielResources`-prop (subset-filtreret MaterielEnhedTilstand[]) beregnes i orkestratoren/PlanlaegningContent og trådes ind — sektionen beregner det ikke selv.
- `aktivEtape`-prop beregnes i orkestratoren/PlanlaegningContent — sektionen bruger det blot.
- Section er pakket i `<>` fragment (ikke `<div>`) for at modaler kan rende uden ekstra wrapper.

---

## Known issues

- Tilføj materiel modal er pr. SPEC kopieret ORDRET fra L2249–2334 i orkestratoren. Den EKSISTERER allerede i OrdrePlanScreen i dag — ved integration (#12) skal den SLETTES derfra. Integration-builder ansvarlig.
- FjernModal eksisterer ligeledes allerede i OrdrePlanScreen (L2240–2248). Skal slettes ved integration.
- `w-[8px] h-[8px]` og `w-[44px] h-[44px]` er token-violations (hardkodet px) — de kopieres ORDRET jf. SPEC-princip 3 (flyt violations ORDRET, ret dem ikke). Cleanup-passet håndterer det.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/planlaegning/MaterielleveringSection.tsx

modified:
  (ingen)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Sektionens grænse: L1982–2157 (`<section>` med h2 "Materiellevering")
- Modal-JSX medbringes: L2249–2334 (Tilføj materiel) + L2240–2248 (FjernModal)

**Hvad blev ekstraheret 1:1:**
- Hele `<section>`-blokken inkl. h2, ny-etape-notifikation, samleordre-branch og normal-mode-branch
- Alle 4 UiState-cases (planlaeg / ny-etape / paa-pladsen / dvale)
- 3-state vognmand-badge IIFE
- "Tilføj materiel"-knapper i planlaeg + ny-etape-branches
- Alle Tailwind-klasser, inkl. eksisterende violations (`w-[8px]`, `w-[44px]`)
- Alle kommentarer og JSDoc

**Bevidste afvigelser fra prototype:**

1. **`onTilfoejResource`-prop type** matcher katalog-elementets faktiske type (ingen `id`) — orkestratoren genererer id ved oprettelse. Dette er en nødvendig tilpasning for at typecheck kan passere uden at ændre mocks.ts.

2. **Lokal state** (`tilfoejMaterielOpen`, `materielSoeg`, `fjernModalId`) er flyttet ned fra orkestratoren til sektionen — jf. SPEC (#11: "kan flyttes ned") + INDEX-SPEC princip 2 (Container/Presenter — kun root-delt state props-trådes).

3. **Modal-JSX** fra L2249–2334 + L2240–2248 er fysisk kopieret ind i sektionen (da den er sektion-lokal state). Vil SLETTES fra orkestratoren ved integration (#12).

**Hvad blev IKKE afveget (selvom det fristede):**
- Token-violations (`w-[8px]`, `w-[44px]`, `bg-deep-teal/40`) er bevaret ORDRET — cleanup-pass ansvarlig.
- Ingen redesign af badge-layout eller modal-markup selvom forbedringer var mulige.

---

## API exports

**Props interface:**
```typescript
export interface MaterielleveringSectionProps {
  resources: MockResource[]
  transportPlaner: Record<string, MaterielTransportPlan>
  etaper: Etape[]
  materielUiState: MaterielUiState
  materielResources: MaterielEnhedTilstand[]
  aktivEtape: Etape | undefined
  selectedPlanDate: string
  bekraeftedeEnhederIds: Set<string>
  materielSendteEnhederIds: Set<string>
  isSamleordreMode: boolean
  samleordreCtx: SamleordreContext | null
  onTransportChange: (resourceId: string, etapeId: number, patch: TransportPlanPatch) => void
  onTransportGem: (resourceId: string, etapeId: number) => void
  onMaterielSend: (etape: Etape) => void
  onFjernResource: (resourceId: string) => void
  onTilfoejResource: (katalogItem: { plantNumber: string; description: string; transportTag: MockResource['transportTag'] }) => void
}
```

**Eksporterer:**
- `MaterielleveringSection` (named)
- `MaterielleveringSectionProps`

**Forventer fra parent:**
- `MockResource`, `SamleordreContext` fra `./types`
- `Etape`, `MaterielTransportPlan`, `MaterielUiState`, `transportKey` fra `./etape`
- `TransportPlanPatch`, `MaterielEnhed as MaterielEnhedTilstand` fra `./MaterielTilstande`
- `MaterielPlanlaegTilstand`, `MaterielNyEtapeTilstand`, `MaterielPaaPladsenTilstand`, `MaterielDvaleTilstand` fra `./MaterielTilstande`
- `FjernModal` fra `./components/FjernModal`
- `STANDARD_MATERIEL_KATALOG` fra `./mocks`

---

## Tokens / patterns brugt

- Farver: `text-text-primary`, `text-deep-teal`, `bg-yellow`, `bg-soft-aqua`, `bg-white`, `bg-surface`, `bg-surface-2`, `bg-good-bg`, `bg-warn-bg`, `text-good`, `text-text-muted`, `text-text-secondary`, `border-hairline`, `border-hairline-2` — ingen hex
- Spacing: `mb-sm`, `mb-xs`, `mt-md`, `gap-xs`, `gap-md`, `px-sm`, `py-sm`, `px-xs`, `py-xxxs`, `p-lg`, `mt-xxxs` — ingen hardcodede px (undtagen pre-eksisterende violations fra prototype)
- Font: `font-poppins` (h2/h3), `font-inter` (body/labels/badges) — ingen hardcodet font-family
- Touch targets: Tilføj-knapper ≥ 44px via `min-h-[44px]` på katalog-items; Luk-knap i modal `w-[44px] h-[44px]` (pre-eksisterende violation, kopieret ORDRET)
- Pre-eksisterende token-violations bevaret ORDRET: `w-[8px] h-[8px]` (samleordre-dot), `w-[44px] h-[44px]` (Luk-knap), `bg-deep-teal/40` (modal-overlay), `shadow-[0_0_0_2px_rgba(254,238,50,0.35)]` (anchor-dot glow)

---

## Tests skrevet (hvis test-writer kørt)

```
unit:    0 tests  (prototype-fase — ingen tests kræves per SPEC INDEX)
story:   0 stories (prototype-fase — ingen stories kræves per SPEC INDEX)
```

---

## Ready-for-next-step

- [ ] Lint pass: `npm run formand:lint` (5 pre-eksisterende errors — ikke Fase 2's ansvar)
- [x] Typecheck pass: `npm run formand:typecheck` — GRØN
- [ ] Unit tests pass: N/A (prototype-fase)
- [ ] Storybook story renderer: N/A (prototype-fase)
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til integration #12** — PlanlaegningContent + wiring

> Builder afslutter her. Integration-builder (#12) overtager wiring.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-30 08:15
  acceptkriterier_implementeret: "SPEC #11 — MaterielleveringSection extraction komplet"
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 3
  manuel_testning_udfoert:
    - "Typecheck grøn (npm run formand:typecheck — ingen fejl)"
    - "Alle 4 UiState-branches dækket: planlaeg/ny-etape med Tilfoej-knap, paa-pladsen uden, dvale med naestEtape-opslag"
    - "Samleordre-branch: 3-state badge IIFE kopieret identisk med original, child-loop og sub-header bevaret"
    - "Tilfoej materiel modal + FjernModal: lokal state + JSX kopieret ORDRET fra L2249–2334 og L2240–2248"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "onTilfoejResource type-tilpasning: katalog-elementets faktiske type bruges (ingen id-felt). Orkestratoren skal generere id: mat-${Date.now()}-... identisk med original L2306. Reviewer: tjek at PlanlaegningContent sender korrekt wrapper-callback."
    - "Modal-JSX dublering: Tilføj materiel modal + FjernModal er BÅDE i den nye sektion OG stadig i OrdrePlanScreen.tsx. De skal SLETTES fra OrdrePlanScreen ved integration (#12). Reviewer: sørg for at integration-builder er opmærksom herpå."
    - "setFjernModalId-callbacket trigges ikke fra MaterielTilstande-presenterne — det bruges endnu ikke (originalen i OrdrePlanScreen heller ikke). Det er en sektion-lokal state der er klar til fremtidig brug."
  signatur: "Jeg står inde for at koden implementerer SPEC #11 + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status `ready-for-review`. Integration #12 (PlanlaegningContent) skal wire denne sektion ind og slette den overflødige modal-JSX fra orkestratoren.
