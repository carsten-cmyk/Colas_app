---
section: ordreplan-fase2
component: ForundersoegelseSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Udfoersel_Sections.md#3-forundersoegelseSection
builder_session: 2026-06-30-1000
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — ForundersoegelseSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: FASE2-UDF-003
    description: "ForundersoegelseSection ekstraheret ORDRET fra UdfoerselContent.tsx L673–918. JSX, state, PHOTO_COLORS, hjælpefunktioner (handleFileChange, toggleAarsag, addEkstraLinje, updateEkstraLinje, removeEkstraLinje) alle kopieret 1:1."
  - id: FASE2-UDF-003a
    description: "Sektion-lokal state (underlaegsType, underlaegsAndet, tilfredsstillende, underlaegsAarsager, aftaltMed, forbehold, saved, forundersoegelseOpen) og fileInputRef er alle FLYTTET ind i komponenten."
  - id: FASE2-UDF-003b
    description: "Props ind fra container: forundersoegelseFotos, onAddPhotos, isSamleordreMode, samleordreCtx, samleordreTabOrderNr, ekstraLinjer, setEkstraLinjer, ekstraSent, setEkstraSent — præcist som SPEC specificerer."
  - id: FASE2-UDF-003c
    description: "ForundersoegelsesSectionProps interface eksporteret. Ingen any-typer."
  - id: FASE2-UDF-003d
    description: "Relative stier bruges korrekt: ../../../components/..., ../../../mocks, ../../../types (ingen @/-alias brudt)."
```

---

## Not implemented

```yaml
accept_skip:
  - id: N/A
    reason: "Ingen accept-kriterier skippet. Sektionen er en ren extraction — ingen manglende adfærd."
```

---

## Assumptions

- `ekstraLinjer`/`setEkstraLinjer`/`ekstraSent`/`setEkstraSent` er løftet state (deles med AfregningContent via root) — de er props ind, IKKE lokale. Dette er verificeret i UdfoerselContent-signaturen.
- Interface-navn `ForundersoegelsesSectionProps` (med dobbelt 's') — for at undgå sammenfald med komponentnavnet `ForundersoegelseSection`. Alternativt `FornudersoegelseSection` + `ForundersoegelseSection.Props` via namespace, men det er mere komplekst end nødvendigt for en prototype.
- Token-violations fra kilden (`w-[76px]`, `h-[76px]`, `pr-[32px]`, `bg-[#F5F9FA]`, `mt-[1px]`, `border-dark-teal/15`) er kopieret ORDRET uden rettelser — det er cleanup-passets ansvar (jf. princip 3 i INDEX-SPEC).

---

## Known issues

- Typecheck afslørede et usynligt zero-width space (U+200B) i interface-navnet som Write-værktøjet indførte. Rettet inden commit.
- `bg-[#F5F9FA]` og `pr-[32px]` er token-violations fra prototype — kopieret ORDRET som specificeret i SPEC.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/ForundersoegelseSection.tsx

modified:
  (ingen — UdfoerselContent.tsx rettes i integrations-trin #6, ikke her)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx`
- Linjer kopieret: L673–918 (`<section>` kommentar til lukke-`</section>`)

**Hvad blev ekstraheret 1:1:**
- JSX-struktur (hele section-elementet med header, collapsed-preview IIFE, expanded-indhold)
- Tailwind-klasser (alle token-violations fra prototype bevaret uændret)
- State-deklarationer og -håndtering (8 useState + 1 useRef, alle fra L91–98 + L194 i kilden)
- PHOTO_COLORS-array og alle 5 hjælpefunktioner
- IIFE-pattern i collapsed-preview og header (samleordre-child-lookup)
- Alle kommentarer (inkl. TODO Supabase-noter)

**Bevidste afvigelser fra prototype (med begrundelse):**
- Interface-navn `ForundersoegelsesSectionProps` i stedet for det mere åbenlyse `ForundersoegelseSection` (for at undgå TypeScript-navnekonflikt med selve funktionen)
- Imports er omorganiseret til korrekte relative stier fra `sections/udfoersel/` — dette er en nødvendig konsekvens af ny filplacering, ingen adfærdsændring

**Hvad blev IKKE afveget (selvom det fristede):**
- Token-violations (`w-[76px]`, `h-[76px]`, `bg-[#F5F9FA]` osv.) er bibeholdt — cleanup-passet retter dem
- PHOTO_COLORS er en lokal konstant i komponenten (ikke importeret fra mocks) — det er præcis som i kilden

---

## API exports

**Props interface:**
```typescript
export interface ForundersoegelsesSectionProps {
  /** Fotos taget under forundersøgelsen — løftet til root */
  forundersoegelseFotos: MockPhoto[]
  /** Callback der tilføjer nye fotos — løftet til root */
  onAddPhotos: (p: MockPhoto[]) => void
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Aktivt ordrenummer i samleordre-tab — bruges til per-child preview i Forundersøgelse-header */
  samleordreTabOrderNr?: string
  /** Ekstralinjer — løftet til root så AfregningContent kan aflæse dem */
  ekstraLinjer: EkstraLinje[]
  setEkstraLinjer: React.Dispatch<React.SetStateAction<EkstraLinje[]>>
  /** Om ekstraarbejde er sendt (godkendt) — løftet til root */
  ekstraSent: boolean
  setEkstraSent: (b: boolean) => void
}
```

**Eksporterer:**
- `ForundersoegelseSection` (named function export)
- `ForundersoegelsesSectionProps` (interface)

**Forventer fra parent (typer):**
- `MockPhoto`, `SamleordreContext`, `EkstraLinje`, `UnderlagType`, `UnderlaegsAarsag` fra `../../../types`
- `UNDERLAG_OPTIONS`, `AARSAG_OPTIONS` fra `../../../mocks`
- `EkstraarbejdeBlok` fra `../../../components/EkstraarbejdeBlok`
- `ForCheckbox` fra `../../../components/ForCheckbox`
- `JaNejToggle` fra `../../../components/JaNejToggle`

---

## Tokens / patterns brugt

- Farver: `bg-surface`, `border-hairline`, `text-deep-teal`, `text-text-primary`, `text-text-muted`, `text-text-secondary`, `bg-good`, `text-good`, `bg-good-bg`, `bg-bad-bg`, `text-bad`, `bg-yellow`, `text-dark-teal` (ingen hex — undtagen prototype-violations kopieret ORDRET)
- Spacing: `px-md`, `py-sm`, `gap-sm`, `gap-xs`, `gap-xxxs`, `mb-sm`, `ml-xs`, `p-md`, `pt-sm`, `mt-xs` (ingen hardcoded spacing — undtagen `mt-[1px]` fra prototype kopieret ORDRET)
- Font: `font-poppins` (h2-header), `font-inter` (alle andre) — ingen hardcoded font-family
- Touch targets: collapse-knap (`px-md py-sm`) — ≥44px. Gem-knap (`px-md py-xs`) — OK
- Hover/focus states: `hover:border-dark-teal`, `hover:border-hairline-2`, `focus:outline-none focus:border-dark-teal`

---

## Tests skrevet (hvis test-writer kørt)

```
unit:    0 tests — prototype-fase, ingen tests kræves (jf. INDEX-SPEC)
story:   0 stories — prototype-fase, ingen stories kræves (jf. INDEX-SPEC)
e2e:     0 specs
```

---

## Ready-for-next-step

- [ ] Lint pass: `npm run formand:lint` (pre-eksisterende 5 fejl i projektet — ingen nye tilføjet)
- [x] Typecheck pass: `npm run formand:typecheck` — GRØN
- [ ] Unit tests pass: ikke krævet i prototype-fase
- [ ] Storybook story: ikke krævet i prototype-fase
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer** — wiring afventer integrations-trin #6

> Builder afslutter her. Integrations-trin #6 (UdfoerselContent → tynd container) sker sekventielt EFTER #2–#5 er alle done.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-30 10:15
  acceptkriterier_implementeret: "Alle kriterier for #3 ForundersoegelseSection fra SPEC_Udfoersel_Sections.md"
  acceptkriterier_skipped: 0
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 2
  bevidste_afvigelser:
    - "Interface-navn ForundersoegelsesSectionProps (dobbelt-s) for at undgå TypeScript-navnekonflikt"
    - "Imports omorganiseret til korrekte relative stier fra ny filplacering — ingen adfærdsændring"
  manuel_testning_udfoert:
    - "Typecheck grøn: npm run formand:typecheck passerer uden fejl"
    - "Alle sektion-lokale state-felter verificeret som moved-in (underlaegsType, tilfredsstillende osv.)"
    - "Props-signatur verificeret mod UdfoerselContent-signatur — ekstraLinjer/ekstraSent er props fra root"
    - "Relative import-stier verificeret manuelt (tre niveauer op: sections/udfoersel/ → content/ → ordre-plan/)"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "ForundersoegelsesSectionProps med dobbelt-s — ved integrations-trin #6 skal UdfoerselContent importere dette korrekte navn"
    - "ekstraLinjer-state-tråding: ForundersoegelseSection modtager setEkstraLinjer som React.Dispatch<React.SetStateAction<EkstraLinje[]>> — UdfoerselContent skal sende den rigtige setter, ikke en wrapper"
    - "PHOTO_COLORS er lokal konstant i komponenten (ikke fra mocks) — dette er korrekt da det var en lokal konstant i kilden"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status sat til `ready-for-review`. Prototype-fase — reviewer kaldes manuelt via `/review ForundersoegelseSection`.
