---
section: ordreplan-fase2
component: UdfoerselContent (integration #6 — tynd container)
spec: .claude/handoffs/ordreplan-fase2/SPEC_Udfoersel_Sections.md#6
builder_session: 2026-06-30-integration
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — UdfoerselContent Fase 2 Integration (trin #6)

> **Hvad denne fil ER:** Builder's exit-rapport for integrations-trinet der wire de 5 nye komponenter ind
> i UdfoerselContent og gør den til en tynd container.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: INT-001
    description: "PeriodeDatoVaelger wired ind — erstatter inline 'Udføres i perioden'-blok (L227–258 i original)"
  - id: INT-002
    description: "BekraeftedeBilerSection wired ind med alle 9 props (vognmandBekraeftelse, vognmandMaterielBekraeftelse, materielUiState, selectedDate, etaper, transportPlaner, isSamleordreMode, samleordreCtx, samleordreTabOrderNr)"
  - id: INT-003
    description: "ForundersoegelseSection wired ind med alle 8 props (forundersoegelseFotos, onAddPhotos, isSamleordreMode, samleordreCtx, samleordreTabOrderNr, ekstraLinjer, setEkstraLinjer, ekstraSent, setEkstraSent)"
  - id: INT-004
    description: "KsRapporteringSection wired ind med alle 9 props inkl. onResetEkstra-callback"
  - id: INT-005
    description: "KoerselSection wired ind med alle 6 props (vejesedler, minTemperatur, products, selectedDate, isSamleordreMode, samleordreCtx)"
  - id: INT-006
    description: "detailsExpanded-gate bevaret: BekraeftedeBilerSection + ForundersoegelseSection + KsRapporteringSection er alle tre inde i {detailsExpanded && <>...</>}"
  - id: INT-007
    description: "KoerselSection er UDENFOR detailsExpanded-gaten — spejler kildestrukturen (L1062 er en direkte <section>-peer til gaten)"
  - id: INT-008
    description: "Alle state-deklarationer der tilhører de 4 sektioner er FJERNET fra containeren: underlaegsType, underlaegsAndet, tilfredsstillende, underlaegsAarsager, aftaltMed, forbehold, saved, forundersoegelseOpen, ksExpanded, ksActiveTab, smsStatusMap, materielSmsStatusMap, bilerTableExpanded, materielTableExpanded, vejeseddelSelectedOrdre, vejeseddelTempPerOrdre, vejeseddelUdlaeggerPerOrdre"
  - id: INT-009
    description: "addEkstraLinje/updateEkstraLinje/removeEkstraLinje beholdt i containeren — trådes til KsRapporteringSection (der forventer dem som props). ForundersoegelseSection bygger sine egne internt via setEkstraLinjer-setteren."
  - id: INT-010
    description: "Alle nu-ubrugte imports fjernet: ChevronDown, ChevronUp, Camera, Plus, VejesedlerTable, INITIAL_RECEPTER, INITIAL_UDLAEGGERE, formatLongDate, MaterielPaaPladsenTilstand, MaterielDvaleTilstand, formatPhone, toE164, formatRegnr, UNDERLAG_OPTIONS, AARSAG_OPTIONS, MATERIEL_ENHEDER, getEffectiveTons, dateToString, TODAY, EkstraarbejdeBlok, ForCheckbox, JaNejToggle, OvrigeOplysningerSkema3a, OvrigeOplysningerSkema, MksSkema, useRef"
  - id: INT-011
    description: "Props-signatur UdfoerselContentProps uændret — orkestratoren (OrdrePlanScreen) kald er upåvirket"
  - id: INT-012
    description: "formand:typecheck GRØN (0 errors)"
  - id: INT-013
    description: "Ingen nye lint-errors i UdfoerselContent — de 5 pre-eksisterende errors i andre filer er uændrede"
```

---

## Not implemented

```yaml
accept_skip:
  - id: N/A
    reason: "Alle SPEC #6-krav er implementeret. Integrations-trinets scope var præcist afgrænset."
```

---

## Assumptions

- `addEkstraLinje`/`updateEkstraLinje`/`removeEkstraLinje` er beholdt i containeren fordi `KsRapporteringSection` forventer dem som props-callbacks (jf. KsRapporteringSection-handoff). `ForundersoegelseSection` derimod modtager `setEkstraLinjer` (React.Dispatch-setter) og bygger sine egne callbacks internt — der er IKKE duplikering, sektionerne bruger callbacks på forskellig vis.
- `onResetEkstra`-callback leveres inline som `() => { setEkstraLinjer([]); setEkstraSent(false) }` — præcis som KsRapporteringSection-handoff specificerer.
- `detailsExpanded`-state beholdes i containeren (styrer synlighed af 3 sektioner) — den er ikke sektion-lokal.
- `useRecept` og `useVejesedler` hooks beholdes i containeren (Container/Presenter-princip: kun container importerer hooks). `recept?.min_temperatur ?? 140` trådes som `minTemperatur` til KoerselSection.
- `udfoerselDays`-useMemo beholdes i containeren og trådes som `days`-prop til `PeriodeDatoVaelger`.

---

## Known issues

- Ingen kendte issues. Typecheck er grøn, ingen nye lint-errors.

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx
    (1.153 linjer → 183 linjer — tynd container)

created:
  - Docs/Formand/ordre-plan/handoffs/UdfoerselContent_Fase2_Integration.md (denne fil)
```

Sektions-filer der nu importeres (bygget i Round 2):
- apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/BekraeftedeBilerSection.tsx
- apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/ForundersoegelseSection.tsx
- apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/KsRapporteringSection.tsx
- apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/KoerselSection.tsx
- apps/formand/src/prototypes/ordre-plan/components/PeriodeDatoVaelger.tsx

---

## Prototype-fidelity

**Kilde:**
- `apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx` (pre-integration, 1.153 linjer)

**Ændring:**
- Inline-JSX for alle 5 sektioner ersattet med komponent-kald
- State-ejerskab respekteret: kun delt state + hooks forbliver i containeren
- Rod-`<div className="flex flex-col gap-[48px]">` bevaret ORDRET (token-violation `gap-[48px]` uændret)
- Alle kommentarer for `OrdredetaljerSection` og den overordnede struktur bevaret

**Bevidste afvigelser fra prototype:**
- Ingen adfærdsændringer. Ren extraction-integration.

**Vigtige strukturelle observationer:**
- BekraeftedeBilerSection's JSX inkluderede i kilden en `{/* REPLACED: old 2-row layout */}`-kommentar-blok (L660–669) — denne blok er nu indkapslet i sektionen, ikke i containeren
- `setSelectedDate`-alias til `onSelectDate` (L80 i originalen) fjernet — containeren sender `onSelectDate` direkte til PeriodeDatoVaelger

---

## API exports

Container-signaturen er UÆNDRET. OrdrePlanScreen-orkestratoren kender ikke til denne refaktorering.

**Beholder i containeren (ikke rykket ud):**
- `useRecept` + `useVejesedler` hooks (Container/Presenter-princip)
- `udfoerselDays` useMemo
- `detailsExpanded`/`setDetailsExpanded` state
- `ekstraLinjer`/`setEkstraLinjer`/`ekstraSent`/`setEkstraSent` (løftet til root, trådet ind som props)
- `addEkstraLinje`/`updateEkstraLinje`/`removeEkstraLinje` callbacks (trådes til KsRapporteringSection)
- `DEMO_ORDRE_ID`/`DEMO_DATO` konstanter

---

## Tokens / patterns brugt

- Rod-wrapper: `flex flex-col gap-[48px]` (token-violation bevaret ORDRET — cleanup-passet retter)
- Ingen nye tokens introduceret

---

## Tests skrevet (hvis test-writer kørt)

```
unit:    0 — prototype-fase, ingen tests kræves (SPEC INDEX)
story:   0 — prototype-fase, ingen stories kræves (SPEC INDEX)
```

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — GRØN (0 errors)
- [x] Lint: ingen nye errors i UdfoerselContent (5 pre-eksisterende errors i andre filer uændrede)
- [x] Handoff udfyldt (denne fil)
- [ ] Visuel verifikation: Udførsel-mode visuelt identisk i browser — verificeres af Carsten
- [ ] Unit tests: ikke krævet (prototype-fase)
- [ ] Storybook: ikke krævet (prototype-fase)
- [x] **Round 2 Gate R2 opfyldt** — formand:typecheck GRØN

> Builder afslutter her. Visuel verifikation udestår (browser — Carsten/Claude verificerer).

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30T11:00:00"
  acceptkriterier_implementeret: "13 af 13 — INT-001..013"
  acceptkriterier_skipped: "0"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 0
  manuel_testning_udfoert:
    - "Typecheck grøn: npm run formand:typecheck returnerer 0 errors (ingen output)"
    - "Lint verificeret: grep på 'UdfoerselContent' i lint-output returnerer tomt — ingen nye errors"
    - "Importliste verificeret: alle 18 imports er i faktisk brug i container-koden"
    - "detailsExpanded-gate verificeret: BekraeftedeBilerSection + ForundersoegelseSection + KsRapporteringSection alle inde i {detailsExpanded && <>...</>}; KoerselSection er udenfor"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "addEkstraLinje/updateEkstraLinje/removeEkstraLinje er beholdt i containeren OG trådes til KsRapporteringSection — ForundersoegelseSection bygger disse selv internt via setEkstraLinjer-setter. Der er ingen duplikering; de to sektioner bruger callbacks på forskellig vis."
    - "onResetEkstra leveret inline som () => { setEkstraLinjer([]); setEkstraSent(false) } — matches KsRapporteringSection-handoff's specifikation eksakt"
    - "Visuelt check i browser er det resterende gate-krav for Round 2 — typecheck alene er ikke tilstrækkeligt"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```
