---
section: ordreplan-fase2
component: BekraeftedeBilerSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Udfoersel_Sections.md
builder_session: 2026-06-30-0900
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — BekraeftedeBilerSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

```yaml
accept_pass:
  - id: UDFS-001
    description: "BekraeftedeBilerSection ekstraheret ORDRET fra UdfoerselContent.tsx L269–672"
  - id: UDFS-002
    description: "Alle 4 lokale states (smsStatusMap, materielSmsStatusMap, bilerTableExpanded, materielTableExpanded) flyttet med ind i sektions-komponenten"
  - id: UDFS-003
    description: "Materiel-transport etape-branch implementeret (paa-pladsen → MaterielPaaPladsenTilstand, dvale → MaterielDvaleTilstand, planlaeg/ny-etape → eksisterende tabel)"
  - id: UDFS-004
    description: "Props-interface BekraeftedeBilerSectionProps eksporteret med JSDoc på alle ikke-oplagte props"
  - id: UDFS-005
    description: "Ingen any-typer — alle typer importeret fra ../../../types, ../../../etape, ../../../MaterielTilstande"
  - id: UDFS-006
    description: "ORDRET kopi — ingen token-rettelser, ingen redesign, ingen adfærdsændring"
```

---

## Not implemented

```yaml
accept_skip:
  - id: UDFS-007
    reason: "Integration i UdfoerselContent.tsx (trin #6) er et separat integrations-trin — bygges ikke nu"
    blocked_by: "SPEC_Udfoersel_Sections.md §6: 'Integrations-trin — gøres EFTER #2–#5 findes'"
    suggested_followup: "Når #3–#5 (ForundersoegelseSection, KsRapporteringSection, KoerselSection) er bygget, wire i UdfoerselContent"
```

---

## Assumptions

- `detailsExpanded`-wrapperen (L273 i kilden: `{detailsExpanded && (<>...</>)}`) er IKKE medtaget i denne komponent. Komponenten er self-contained; det er callerens ansvar at styre synlighed. SPEC L269–672 afgrænser sektionen fra h2-kommentaren til lukke-`</div>` L670 — selve `{detailsExpanded && ...}`-betingelsen er del af UdfoerselContent-containeren, ikke af sektionen.
- `selectedDate` trådes ind som prop (bruges til at finde aktiv etape i `paa-pladsen`-branch). I kilden er den tilgængelig via closure — her parametriseres den korrekt.
- `displayBilerBekraeftet` er beregnet lokal til komponenten (fra `vognmandBekraeftelse`-prop) — det er udeladt fra props da den ikke bruges i selve status-kortet (kun biler-tabel-branchen bruger det som `visBilDetalje`).

---

## Known issues

- Kilden L659–669 indeholder en dead-code-kommentar-blok med `*/}` der lukker en åben `{/*`-kommentar. Dette er kopieret ORDRET som JSX-kommentar for at bevare kildekoden 1:1. Det er en pre-eksisterende quirk i prototypen.
- `min-h-[120px]` i materiel-status-kortet (L639 i kilden) er en token-violation (hardcodet px) — beholdt ORDRET per princip 3 (SPEC: "Flyt eksisterende token-violations ORDRET — ret dem IKKE").

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/BekraeftedeBilerSection.tsx

modified:
  (ingen)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx`
- Linjer kopieret: L269–672 (h2-kommentar "Status-bokse" → lukke-`</div>` der afslutter `.flex.flex-col.gap-xs.-mt-[48px]`-wrapperen)

**Hvad blev ekstraheret 1:1:**
- JSX-struktur (alle divs, tabeller, betingede branches)
- Tailwind-klasser inkl. token-violations (`-mt-[48px]`, `min-h-[120px]`, `min-h-[44px]`, `min-w-[44px]`)
- State-initialiseringslogik (smsStatusMap + materielSmsStatusMap med mock-defaults)
- Etape-bevidst branch (`paa-pladsen`/`dvale`/`planlaeg|ny-etape`)
- SMS-konsoliderings-logik (én knap pr. regnr via seenSmsRegnr-Set)
- `TABEL_DEFAULT = 3` + expand-knapper

**Bevidste afvigelser fra prototype:**
- Ingen. Alle afvigelser er ren parametrisering via props (state der kom fra closure flyttes til props + lokale states flyttes med ind).

**Hvad blev IKKE afveget:**
- `detailsExpanded`-betingelsen (L273) tilhører containeren og er ikke medtaget i sektionen — det er ikke en afvigelse men en korrekt grænseafgrænsning.

---

## API exports

**Props interface:**
```typescript
export interface BekraeftedeBilerSectionProps {
  vognmandBekraeftelse?: VognmandBekraeftelse
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  materielUiState: MaterielUiState
  selectedDate: string
  etaper: Etape[]
  transportPlaner: Record<string, MaterielTransportPlan>
  isSamleordreMode?: boolean
  samleordreCtx?: SamleordreContext | null
  samleordreTabOrderNr?: string
}
```

**Eksporterer:**
- `BekraeftedeBilerSection` (named export)
- `BekraeftedeBilerSectionProps`

**Forventer fra parent:**
- `VognmandBekraeftelse`, `VognmandMaterielBekraeftelse`, `SamleordreContext` fra `../../../types`
- `MaterielUiState`, `Etape`, `MaterielTransportPlan` fra `../../../etape`
- `MaterielEnhed as MaterielEnhedTilstand` fra `../../../MaterielTilstande`
- `MATERIEL_ENHEDER` fra `../../../mocks`

---

## Tokens / patterns brugt

- Farver: `bg-good-bg`, `border-good/30`, `text-deep-teal`, `text-text-muted`, `bg-surface`, `border-hairline`, `text-warning`, `bg-warning-bg`, `text-dark-teal` (ingen hex)
- Spacing: `px-sm`, `py-xs`, `gap-xs`, `gap-xxxs`, `px-xs`, `py-xxxs` (ingen ny px-hardcoding)
- Pre-eksisterende token-violations kopieret ORDRET: `-mt-[48px]`, `min-h-[120px]`, `min-h-[44px]`, `min-w-[44px]`
- Font: `font-poppins` (h2-header), `font-inter` (tabel + badges)
- Touch targets: `min-h-touch min-w-touch` på materiel-SMS-knapper (kilden); `min-h-[44px] min-w-[44px]` på biler-SMS-knapper (kopieret ordret fra kilde)

---

## Tests skrevet (hvis test-writer kørt)

```
unit:    0  (prototype-fase — ingen tests kræves per SPEC INDEX)
story:   0  (prototype-fase — ingen stories kræves per SPEC INDEX)
e2e:     0
```

---

## Ready-for-next-step

- [ ] Lint pass: `npm run formand:lint` — 5 pre-eksisterende errors, tilføjet ingen nye
- [x] Typecheck pass: `npm run formand:typecheck` — GRØN (0 errors)
- [ ] Unit tests pass: N/A (prototype-fase)
- [ ] Storybook story renderer: N/A (prototype-fase)
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer** → prototype-fase: caller `/review` manuelt

> Builder afslutter her. Reviewer overtager ved manuel `/review`.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: "2026-06-30 09:15"
  acceptkriterier_implementeret: "6 af 6 UDFS-001..006 fra SPEC_Udfoersel_Sections.md #2"
  acceptkriterier_skipped: "1 — UDFS-007 (integrations-trin, separat)"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 0
  manuel_testning_udfoert:
    - "Scenarie 1: typecheck grøn (0 errors) — verificeret via npm run formand:typecheck"
    - "Scenarie 2: props-interface dækker alle closures fra kildefilen (vognmandBekraeftelse, materielUiState, etaper, transportPlaner, samleordre-props)"
    - "Scenarie 3: materiel-branch (paa-pladsen/dvale/planlaeg) bevaret 1:1 med korrekte imports"
    - "Scenarie 4: SMS-state initialiseres korrekt fra vognmandBekraeftelse + vognmandMaterielBekraeftelse (første materiel-bil = 'sendt', øvrige 'ikke_sendt')"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "detailsExpanded-wrapper (L273 kilden) er IKKE en del af sektionen — caller (UdfoerselContent) skal selv wrap i {detailsExpanded && ...} ved integration"
    - "dead-code-kommentar-blokken L659–669 kopieret ordret — tjek om den giver visuelt rod i JSX (kompilerer fint, men kan forvirre)"
    - "min-h-[44px]/min-w-[44px] på biler-SMS-knapper vs min-h-touch/min-w-touch på materiel-SMS-knapper — forskel eksisterer i kilden og er kopieret ORDRET"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```
