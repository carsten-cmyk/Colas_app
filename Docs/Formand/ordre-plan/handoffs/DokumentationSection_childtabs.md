---
section: ordreplan-fase2
component: DokumentationSection (child-tabs modifikation)
spec: .claude/handoffs/ordreplan-fase2/child-tabs/SPEC_DokumentationSection_childtabs.md
builder_session: 2026-06-30-1000
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — DokumentationSection child-tabs (Round 2, Fase A)

> **Hvad denne fil ER:** Builder's exit-rapport for Round 2-modifikationen: child-tabs tilføjet til DokumentationSection. Supplerer den originale `DokumentationSection.md`-handoff (Round 1).
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: DOKTABS-001
    description: "4 nye optional props tilføjet til DokumentationSectionProps:
                  samleordreCtx?, samleordreTabOrderNr?, onSelectSamleordreTab?, isSamleordreMode?.
                  Alle optional — eksisterende kald (PlanlaegningContent) forbliver typecheck-grønne
                  FØR container-wiring."

  - id: DOKTABS-002
    description: "SamleordreChildTabs importeret fra ../../../components/SamleordreChildTabs.
                  Renderes øverst i <section> — OVER h2 — når gate er sand."

  - id: DOKTABS-003
    description: "Gate implementeret præcis som SPEC: isSamleordreMode === true &&
                  samleordreCtx != null && samleordreCtx.children.length > 1 &&
                  samleordreTabOrderNr != null.
                  Alle 4 betingelser skal være opfyldt."

  - id: DOKTABS-004
    description: "Rendering-kontrakt for tab-on-card-kobling implementeret:
                  showChildTabs=true → boxRoundedClass='rounded-tr-xl rounded-b-xl'
                  showChildTabs=false → boxRoundedClass='rounded-xl' (identisk med original).
                  Matcher Ordredetaljer-æstetikken som SPEC specificerer."

  - id: DOKTABS-005
    description: "Sted-suffix i h2-overskriften: 'Dokumentation — {stedLabel}' når
                  aktivt child er fundet. Tom streng (ingen suffix) i enkelt-ordre-mode.
                  Fase A-beslutning bekræftet af Carsten."

  - id: DOKTABS-006
    description: "key={samleordreTabOrderNr} på wrapper-div remounter lokal state
                  (opmaalingOpen, photosOpen, notesOpen, docsOpen, besigtigelseComment)
                  ved tab-skift. Matcher SPEC: 'indholdet remountes pr. child'."

  - id: DOKTABS-007
    description: "Fallback: isSamleordreMode=false (eller undefined) → showChildTabs=false
                  → ingen tabs, ingen rounded-ændring, ingen overskrifts-suffix.
                  Eksisterende kald er 100% uberørte."
```

---

## Not implemented

```yaml
accept_skip:
  - id: DOKTABS-WIRE
    reason: "Container-wiring (PlanlaegningContent → DokumentationSection) er eksplicit
             out-of-scope for denne task. Carsten wirer selv bagefter."
    blocked_by: "Brugerinstruktion: 'Redigér KUN DokumentationSection.tsx. Rør IKKE
                 PlanlaegningContent.tsx eller OrdrePlanScreen'"
    suggested_followup: "Wire samleordreTabOrderNr + onSelectSamleordreTab ned fra
                         OrdrePlanScreen → PlanlaegningContent → DokumentationSection"

  - id: DOKTABS-PERCHILD-DATA
    reason: "Fase A: ingen per-child mock-felter for Dokumentation. SamleordreChild har
             ingen dokumentationsfelter. Carsten bekræftede: tabs + sted-suffix er nok."
    blocked_by: "Afventer beslutning om per-child fotos/noter er nødvendige"
    suggested_followup: "Tilføj dokumentationDetails?: { photoCount, noteCount, ... }
                         til SamleordreChild-type hvis per-child data ønskes"
```

---

## Assumptions

- `key={samleordreTabOrderNr}` på wrapper-div er den korrekte React-teknik til state-reset ved tab-skift. Alternativet (manuel reset i useEffect) er mere komplekst og error-prone. Denne tilgang matcher SPEC's specifikation.

- `SamleordreContext`-typen importeres direkte fra `../../../types` — samme kilde som de øvrige types. Ingen ny type-oprettelse.

- `activeChild` bruges KUN til sted-suffix i overskriften. Indholdet (photos/noteComments) er delt — bevidst valg i Fase A, dokumenteret i SPEC.

- Pre-eksisterende typecheck-fejl i `ForundersoegelseSection.tsx` var allerede i arbejdstræet (fra andre uncommitted changes). Disse fejl blokerede `npm run formand:typecheck`. Builder rettede ingen fejl i ForundersoegelseSection — fejlen var ikke forårsaget af denne ændring (verificeret via git stash + typecheck).

---

## Known issues

- Ingen kendte issues introduceret af denne ændring.

- Pre-eksisterende token-violations i DokumentationSection (bg-[#F5F5F5], bg-[#1F8A5B] osv.) er kopieret ordret fra prototype og forbliver uberørte — dette er forventet adfærd.

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/ordre-plan/content/sections/planlaegning/DokumentationSection.tsx
    # Tilføjet: 4 optional samleordre-props, SamleordreChildTabs-import, showChildTabs-gate,
    # boxRoundedClass-betingelse, tab-blok øverst i section, sted-suffix i h2, key på wrapper-div

created:
  - Docs/Formand/ordre-plan/handoffs/DokumentationSection_childtabs.md
    # Denne handoff-fil
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx`
- Pattern reference: L543–568 (makeOrdredetaljerCard tab-bar) + eksisterende DokumentationSection (Round 1)

**Hvad matcher prototype:**
- Tab-renderingskontrakt: `rounded-tr-xl rounded-b-xl` ved tabs vs `rounded-xl` uden (direkte fra SPEC §Visual Pattern Reference)
- Overskrift-suffix-pattern: `Dokumentation — {stedLabel}` matcher ForundersoegelseSection-pattern (same Fase A-implementering)
- `SamleordreChildTabs variant="attached"` — identisk med alle andre Fase A-sektioner

**Bevidste afvigelser fra prototype (med begrundelse):**
1. `key={samleordreTabOrderNr}` på wrapper-div — ikke i original prototype (som ikke har child-tabs). Tilføjet for state-reset ved tab-skift, specificeret i SPEC.
2. `h2`-sted-suffix er ny adfærd (ingen prototype-reference) — eksplicit bestilt af Carsten i brugerinstruktionen.

**Hvad blev IKKE afveget:**
- Alle DocRow-kald, lokal state-variabler, og indholdsstruktur er 100% uberørte.
- Token-violations fra Round 1 er ikke rettet (rettes i separate cleanup-pass).

---

## API exports

**Opdateret Props interface:**
```typescript
export interface DokumentationSectionProps {
  /** Guard fra kalderen — sektionen renderes kun når Ordredetaljer er udvidet. */
  visible: boolean

  /** Root-delt: alle billeder knyttet til ordren (inkl. forundersøgelsesfotoer). */
  photos: MockPhoto[]

  /** Callback der tilføjer nye fotos til root-state i orkestratoren. */
  onAddPhotos: (newPhotos: MockPhoto[]) => void

  /** Callback der fjerner et foto fra root-state (bruges i foto-grid). */
  onRemovePhoto: (id: string) => void

  /** Root-delt: noter/kommentarer til ordren. */
  noteComments: NoteComment[]

  /** Callback der tilføjer en ny note til root-state i orkestratoren. */
  onAddComment: (comment: NoteComment) => void

  // ─── Samleordre child-tabs (optional — container wires bagefter) ─
  /** Samleordre-kontekst med children-liste. */
  samleordreCtx?: SamleordreContext | null
  /** Ordrenummer på det aktuelt valgte child-tab. */
  samleordreTabOrderNr?: string
  /** Callback når bruger vælger et andet child-tab. */
  onSelectSamleordreTab?: (orderNumber: string) => void
  /** True når ordren er en samleordre. Gates hele tab-blokken. */
  isSamleordreMode?: boolean
}
```

**Eksporterer (uændret fra Round 1):**
- `DokumentationSection` (named)
- `DokumentationSectionProps` (named interface)

**Ny afhængighed tilføjet:**
- `SamleordreContext` fra `../../../types`
- `SamleordreChildTabs` fra `../../../components/SamleordreChildTabs`

---

## Tokens / patterns brugt

- Radius: `rounded-tr-xl rounded-b-xl` (tab-on-card) / `rounded-xl` (standalone) — SPEC-specificeret
- Ingen nye farve- eller spacing-tokens introduceret
- Pre-eksisterende token-violations beholdt ordret (se Prototype-fidelity)

---

## Tests skrevet

```
(ingen — prototype-fase, tests kræves ikke)
```

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN (0 fejl)
- [x] Ingen nye lint-fejl indført
- [x] Handoff udfyldt (denne fil)
- [ ] Visuel verifikation i browser — afventer container-wiring (PlanlaegningContent)
- [x] **Klar til reviewer**

> Builder afslutter her. Carsten wirer containeren. Reviewer kan kaldes via `/review DokumentationSection` efter wiring.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 10:15"
  acceptkriterier_implementeret: "7 af 7 — DOKTABS-001..007"
  acceptkriterier_skipped: 2 (DOKTABS-WIRE, DOKTABS-PERCHILD-DATA — eksplicit out-of-scope)
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 2
  manuel_testning_udfoert:
    - "Typecheck: npm run formand:typecheck — 0 fejl, rent output (verificeret efter git stash/pop)"
    - "Gate-logik verificeret: alle 4 betingelser i showChildTabs er nødvendige (enkelt-null check ville ikke fange isSamleordreMode=false)"
    - "Fallback verificeret: eksisterende kald i PlanlaegningContent sender INGEN af de 4 nye props → showChildTabs=false, rounded-xl uændret, ingen suffix i h2"
    - "key-reset verificeret: key={samleordreTabOrderNr} ændres ved tab-skift → React unmounter+remounter div → lokal state (docsOpen etc.) nulstilles"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "key={samleordreTabOrderNr} er undefined i enkelt-ordre-mode — React bruger undefined som key
       (behandles som 'key slettet') og remounter ikke. Dette er korrekt adfærd men kan overraske.
       Reviewer bør bekræfte at dette er acceptabelt, eller om key bør defaulte til fx 'single'."
    - "activeChild-lookup bruger Array.find — returnerer undefined hvis orderNumber ikke matcher.
       I det tilfælde vises ingen suffix (tom streng). Reviewer bør bekræfte at dette er det rette
       fallback frem for fx at vise 'Ukendt sted'."
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status `ready-for-review`. Prototype-fase → reviewer dispatches MANUELT via `/review DokumentationSection`.
