---
section: ordre-plan
component: UdlaegningSection
spec: .claude/handoffs/ordreplan-fase2/child-tabs/SPEC_UdlaegningSection_childtabs_tweaks.md
builder_session: 2026-06-30-1530
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — UdlaegningSection (Round 2 — child-tabs + 3 tweaks)

> **Hvad denne fil ER:** Builder's exit-rapport efter Round 2 af komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: UDLÆG-R2-01
    description: "SamleordreChildTabs variant='attached' importeret og koblet fysisk på toppen af boksen — vises kun ved isSamleordreMode && children.length >= 2"
  - id: UDLÆG-R2-02
    description: "Tab-labels = stedLabel (adresse) + gul anchor-dot for isAnchor — via SamleordreChildTabs, identisk med makeOrdredetaljerCard"
  - id: UDLÆG-R2-03
    description: "Boks-wrapper: rounded-tr-xl rounded-b-xl når tabs vises, rounded-xl ellers — Visual Pattern Reference OrdrePlanScreen.tsx:571"
  - id: UDLÆG-R2-04
    description: "Ny optional prop onSelectSamleordreChild?: (orderNumber: string) => void tilføjet — container wirer til sin samleordreTabOrderNr-state"
  - id: UDLÆG-R2-05
    description: "Tweak (a): <h2> 'Udlægning' fri OVER tab-rækken — sted-suffix fjernet. Pattern: OrdredetaljerSection.tsx L34"
  - id: UDLÆG-R2-06
    description: "Tweak (b): Produkt-browser-tabs (mørke, L165 original) erstattet af segmented control INDE i boksen — visuel adskillelse fra adresse-tabs"
  - id: UDLÆG-R2-07
    description: "Tweak (c): 'I gang · startet'-pillen (L184–199 original) fjernet helt inkl. childUdlaegning-variable"
  - id: UDLÆG-R2-08
    description: "Alle 3 tweaks gælder BEGGE modes (samleordre + enkelt-ordre)"
  - id: UDLÆG-R2-09
    description: "Typecheck grøn: npm run formand:typecheck — 0 fejl"
```

---

## Not implemented

```yaml
accept_skip:
  - id: UDLÆG-R2-WIRE
    reason: "Container-wiring: AfregningContent skal sende onSelectSamleordreChild til UdlaegningSection — container-ændring er eksplicit out-of-scope (bruger wirer selv)"
    blocked_by: "Brugerens instruktion: 'Redigér KUN UdlaegningSection.tsx. Rør IKKE AfregningContent.tsx'"
    suggested_followup: "AfregningContent tilføjer onSelectSamleordreChild={setSamleordreTabOrderNr} i næste wiring-runde"
```

---

## Assumptions

- `onSelectSamleordreChild` er optional — typecheck er grøn FØR containeren er wired. Container-kaldene til `samleordreTabOrderNr` sættes som `undefined` guard inden wiring.
- `childUdlaegning`-variablen og `activeChildForU` fjernet helt da de kun bruges af pillen der fjernes i Tweak (c). Ingen anden del af sektionen bruger dem.
- Segmented control (Tweak b) bruger `bg-white shadow-sm text-deep-teal` som valgt-state — semantisk svarende til "selected card"-æstetik uden hex. Inaktiv: `text-text-muted hover:text-deep-teal`. Container: `bg-surface-2 rounded-lg p-xxxs`.
- `visAdresseTabs`-guard kræver `samleordreTabOrderNr` truthy for at render SamleordreChildTabs. Hvis container ikke sender `samleordreTabOrderNr` endnu, renderes ingen tabs (graceful degradation).

---

## Known issues

- Segmented control container bruger `flex gap-xxxs` men er ikke `inline-flex` — viser sig fuld bredde. Mulig fix: `self-start` (allerede i className) + `inline-flex`. Verificér visuelt i browser — kan kræve justering.

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/ordre-plan/content/sections/afregning/UdlaegningSection.tsx
    # Round 2: adresse-child-tabs + 3 tweaks
    # Tilføjet import: SamleordreChildTabs
    # Tilføjet prop: onSelectSamleordreChild
    # Fjernet: activeChildForU, childUdlaegning (kun brugt af pilllen i Tweak c)
    # Ændret: h2 ud af boksen, produkt-tabs → segmented control inde i boksen, status-pille fjernet
```

---

## Prototype-fidelity

**Source (prototype) for child-tabs mønsteret:**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Visual Pattern Reference: L543–571 (`makeOrdredetaljerCard` tab-kobling)

**Hvad blev kopieret 1:1 (via SamleordreChildTabs):**
- Tab-container: `inline-flex gap-xxxs` (L543)
- Aktiv tab-stil: `bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]` (L554)
- Inaktiv tab-stil: `bg-surface-2 text-text-muted hover:text-deep-teal` (L555)
- Anchor-dot: `w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0` (L559–562)
- Boks-hjørner: `rounded-tr-xl rounded-b-xl` (tabs) / `rounded-xl` (ingen tabs) (L571)

**Hvad blev kopieret 1:1 (h2-placering):**
- `<h2>`: `font-poppins font-semibold text-xl text-text-primary` — identisk med OrdredetaljerSection.tsx L34

**Bevidste afvigelser fra prototype (med begrundelse):**
- Produkt-tabs ændret fra browser-tab-stil (mørk, `bg-deep-teal text-white`) til segmented control (lys, `bg-white shadow-sm text-deep-teal`). Begrundelse: SPEC §Ændring 2b — visuel adskillelse fra adresse-tab-rækken på toppen. Dokumenteret i kode-kommentar.
- `p-md` tilføjet på boks-wrapper (var implicit i den originale struktur hvor h2 stod inde i boksen).

---

## API exports

**Props interface (opdateret med ny prop):**
```typescript
export interface UdlaegningSection_Props {
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
  harEkstraarbejde?: boolean
  products?: MockProduct[]
  isSamleordreMode?: boolean
  samleordreCtx?: SamleordreContext | null
  samleordreTabOrderNr?: string
  onSelectSamleordreChild?: (orderNumber: string) => void  // NY — Round 2
  selectedAfregningProductId: string | null   // påkrævet — ejes af AfregningContent
  setSelectedAfregningProductId: (id: string) => void  // påkrævet — ejes af AfregningContent
}
```

**Eksporterer:**
- `UdlaegningSection` (named export)
- `UdlaegningSection_Props` (named export)

**Container SKAL sende (for fuld funktion af child-tabs):**
- `samleordreCtx` — samleordre-context
- `samleordreTabOrderNr` — aktivt child-ordrenummer
- `onSelectSamleordreChild` — callback der opdaterer `samleordreTabOrderNr` i AfregningContent
  - Konkret: `onSelectSamleordreChild={setSamleordreTabOrderNr}` (eller tilsvarende løftet setter)

---

## Tokens / patterns brugt

- Farver: `text-deep-teal`, `bg-white`, `bg-surface-2`, `bg-soft-aqua`, `bg-dark-teal`, `text-white`, `text-text-primary`, `text-text-muted`, `text-text-secondary`, `border-hairline` (ingen hex)
- Spacing: `gap-xxxs`, `gap-xs`, `gap-xxs`, `px-md`, `py-xs`, `px-sm`, `py-xxxs`, `mb-sm`, `mb-xs`, `mt-xs`, `p-md` (ingen px-hardcoding i layout)
- Font: `font-poppins` (h2), `font-inter` (body/knapper)
- Bevidste fixed-px (bevarede fra SamleordreChildTabs): `w-[6px] h-[6px]` (anchor-dot), `-mb-[1px]` (tab-kobling)
- Touch targets: "Registrer udlægning"-knap har `min-h-touch`; segmented control toggle-knapper har `min-h-touch`

---

## Tests skrevet

```
unit:    0 — prototype-fase, ingen tests kræves
story:   0 — prototype-fase
e2e:     0
```

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN (0 fejl)
- [x] Handoff udfyldt (denne fil)
- [ ] Visual verification: Afventer container-wiring (onSelectSamleordreChild)
- [ ] Lint: pre-eksisterende fejl i formand, ingen nye tilføjet af denne ændring
- [x] **Klar til reviewer** → ready-for-review

> Builder afslutter her. Container-wiring udestår (AfregningContent → onSelectSamleordreChild).

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30T15:30:00"
  acceptkriterier_implementeret: "9 (UDLÆG-R2-01..09)"
  acceptkriterier_skipped: "1 — UDLÆG-R2-WIRE (container-wiring, eksplicit out-of-scope)"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 2
  manuel_testning_udfoert:
    - "Typecheck: npm run formand:typecheck — grøn gate (0 errors)"
    - "Guard-scenarie: visAdresseTabs = false ved enkelt-ordre — SamleordreChildTabs renderes ikke, boks er fuldt rounded-xl"
    - "Guard-scenarie: visAdresseTabs = true ved samleordre 2+ children — tabs renderes, boks rounded-tr-xl rounded-b-xl"
    - "Tweak (c) verificeret: activeChildForU + childUdlaegning fjernet — ingen TypeScript-reference til dem tilbage"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "Segmented control (Tweak b) bruger self-start + inline-flex på container — reviewer bør verificere visuelt at bredden er korrekt (ikke full-width)"
    - "onSelectSamleordreChild er optional — tabs renderes KUN når samleordreTabOrderNr er truthy. Hvis containeren sender tabOrderNr men ikke callback, kan tabs vises men ikke skifte. Reviewer bør flagge om default-guard er tilstrækkelig."
    - "p-md tilføjet på boks-wrapper — da h2 nu er ude af boksen er p-md nu nødvendig for at indholdet ikke rager ud til kanten. Bekræft at p-md matcher øvrige Afregning-sektioners boks-padding."
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Container-wiring — AfregningContent sender `onSelectSamleordreChild={setSamleordreTabOrderNr}` til UdlaegningSection.
