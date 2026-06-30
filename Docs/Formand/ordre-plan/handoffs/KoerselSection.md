---
section: ordreplan-fase2
component: KoerselSection
spec: .claude/handoffs/ordreplan-fase2/SPEC_Udfoersel_Sections.md#5-koerselsection
builder_session: 2026-06-30-1000
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — KoerselSection

> **Hvad denne fil ER:** Builder's exit-rapport efter at have bygget komponenten. Læses af reviewer + validator + dig.
> **Regel:** Builder må IKKE committe uden denne fil.

---

## Implemented

SPEC #5 KoerselSection — extraction fra UdfoerselContent.tsx L1062–1146.

```yaml
accept_pass:
  - id: KØRSEL-001
    description: "Kørsel-sektionen (h2 + produkt-statusbar + VejesedlerTable) ekstraheret ORDRET fra UdfoerselContent.tsx L1062–1146"
  - id: KØRSEL-002
    description: "State (vejeseddelSelectedOrdre, vejeseddelTempPerOrdre, vejeseddelUdlaeggerPerOrdre) flyttet med ind i sektion-komponenten"
  - id: KØRSEL-003
    description: "Hjælpefunktion getSelectedOrdreForVs() kopieret ORDRET med ind i komponenten"
  - id: KØRSEL-004
    description: "Props-interface KoerselSectionProps eksporteret med JSDoc på alle ikke-oplagte props"
  - id: KØRSEL-005
    description: "vejesedler og minTemperatur trådes som props fra container (hooks forbliver i UdfoerselContent)"
  - id: KØRSEL-006
    description: "Samleordre-children + per-ordre temperatur/udlægger-state bevaret 1:1"
  - id: KØRSEL-007
    description: "INITIAL_RECEPTER og INITIAL_UDLAEGGERE importeres direkte i sektionen (de bruges kun her)"
```

---

## Not implemented

```yaml
accept_skip:
  - id: KØRSEL-008
    reason: "Integrations-trin #6 (UdfoerselContent → tynd container + wiring) er ikke dette builds ansvar — sker i separat integrations-trin"
    blocked_by: "SPEC INDEX #6 — integration sker EFTER #2–#5 alle er done"
    suggested_followup: "Kald integrations-trin #6 når BekraeftedeBilerSection og ForundersoegelseSection er reviewet og godkendt"
```

---

## Assumptions

- `INITIAL_RECEPTER` og `INITIAL_UDLAEGGERE` importeres direkte i KoerselSection frem for at tråde dem som props — fordi kilden (UdfoerselContent) også importerer dem direkte og kun bruger dem i denne sektion. Det ville skabe overflødig prop-tunneling at tråde dem via container.
- `minTemperatur` trådes som prop (fra `recept?.min_temperatur ?? 140` i container) frem for at importere `useRecept` direkte — fordi `useRecept`-hook forbliver i containeren (SPEC: "Container/Presenter: kun container importerer hooks").
- `products` og `selectedDate` trådes som props fordi de bruges til produkt-statusbar-logik i sektionen, men er tilgængelige i containeren.

---

## Known issues

- `KsRapporteringSection.tsx` (bygget af en anden builder i Round 2) har en pre-eksisterende `TS6133`-fejl (`onResetEkstra` erklæret men aldrig brugt). Det forhindrer `formand:typecheck` i at returnere exit-kode 0, men KoerselSection introducerer INGEN nye typecheck-fejl. Bekræftet ved: `npm run formand:typecheck 2>&1 | grep "KoerselSection"` returnerer tomt.

---

## Files changed

```
created:
  - apps/formand/src/prototypes/ordre-plan/content/sections/udfoersel/KoerselSection.tsx

modified:
  (ingen — wiring af UdfoerselContent sker i integrations-trin #6)
```

---

## Prototype-fidelity

**Source (prototype):**
- Fil: `apps/formand/src/prototypes/ordre-plan/content/UdfoerselContent.tsx`
- Linjer kopieret: L1062–1146 (JSX-blok: Kørsel-sektion)
- State kopieret: L108–110 (vejeseddel*-state), L113–120 (getSelectedOrdreForVs)

**Hvad blev ekstraheret 1:1:**
- JSX-struktur inkl. h2 "Kørsel", produkt-statusbar (pulje-læs-guard) og VejesedlerTable
- Alle Tailwind-klasser (inkl. `w-28`, `h-2`, `px-md` — token-violations flyttes UÆNDRET jf. SPEC)
- Samleordre-conditional branches (vejeseddelSelectedOrdre, samleordreChildren etc.)
- Alle kommentarer inkl. TODO-kommentarer
- `getSelectedOrdreForVs`-funktionen og dens fallback-logik

**Bevidste afvigelser fra prototype (med begrundelse):**
- Ingen. Ren extraction. `minTemperatur`-prop erstatter `recept?.min_temperatur ?? 140` i kaldet til VejesedlerTable fordi `recept` kommer fra `useRecept`-hook der forbliver i containeren (Container/Presenter-princip fra SPEC INDEX).

**Hvad blev IKKE afveget (selvom det fristede):**
- Beholdt `INITIAL_RECEPTER` og `INITIAL_UDLAEGGERE` som direkte imports (ikke trådet som props) — fordi kilden gør det samme og de kun bruges her.

---

## API exports

**Props interface:**
```typescript
export interface KoerselSectionProps {
  /** Vejesedler for dagens ordre — fra useVejesedler-hook i container. TODO: Erstat med Supabase når klar */
  vejesedler: Vejeseddel[]
  /** Minimum-temperatur fra aktiv recept — fra useRecept-hook i container. TODO: Erstat med Supabase når klar */
  minTemperatur: number
  /** Alle produkter i ordren — til aktivt-produkt-filter + estimat-beregning */
  products: MockProduct[]
  /** Valgt dato i Udførelse-mode — bruges til at filtrere aktive produkter */
  selectedDate: string
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
}
```

**Eksporterer:**
- `KoerselSection` (navngivet eksport)
- `KoerselSectionProps`

**Forventer fra parent (hooks/data):**
- `vejesedler: Vejeseddel[]` — fra `useVejesedler(ordreId, dato)` i container
- `minTemperatur: number` — fra `recept?.min_temperatur ?? 140` i container (via `useRecept`)
- `products: MockProduct[]` — fra container-props
- `selectedDate: string` — fra container-props

---

## Tokens / patterns brugt

- Farver: `text-text-primary`, `text-text-muted`, `text-text-secondary`, `bg-surface-2`, `bg-white`, `bg-good` — ingen hex
- Spacing: `mb-sm`, `gap-xs`, `px-md`, `py-xs` — ingen hardcoded px (bortset fra `w-28`, `h-2` der er kopieret ORDRET fra prototype og ikke rettet jf. SPEC princip 3)
- Font: `font-poppins` (h2), `font-inter` (labels)
- Touch targets: VejesedlerTable håndterer egne touch targets
- Runtime-beregnet inline style: `style={{ width: \`${pct}%\` }}` — berettiget (progressbar-procent)

---

## Tests skrevet (hvis test-writer kørt)

```
unit:    0 — prototype-fase, ingen tests kræves (SPEC INDEX)
story:   0 — prototype-fase, ingen stories kræves (SPEC INDEX)
```

---

## Ready-for-next-step

- [ ] Lint pass: `npm run formand:lint` (5 pre-eks. errors — ikke dette builds ansvar)
- [x] Typecheck pass: `npm run formand:typecheck` — KoerselSection introducerer INGEN nye fejl (pre-eks. KsRapporteringSection TS6133 eksisterede før dette build)
- [ ] Unit tests pass: ikke krævet (prototype-fase)
- [ ] Storybook story: ikke krævet (prototype-fase)
- [x] Handoff udfyldt (denne fil)
- [x] **Klar til reviewer** → se builder sign-off nedenfor

> Builder afslutter her. Reviewer overtager.

---

## Builder sign-off (LÅST 2026-05-28)

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-30T10:00:00
  acceptkriterier_implementeret: "7 af 8 — KØRSEL-001..007 implementeret"
  acceptkriterier_skipped: "1 — KØRSEL-008 (integrations-trin #6, bevidst udskudt)"
  prototype_kopieret_1_til_1: true
  bevidste_afvigelser_count: 1
  # Afvigelse 1: minTemperatur trådes som prop frem for at kalde useRecept direkte i sektionen
  # — Container/Presenter-princip fra SPEC INDEX (hooks forbliver i container).
  manuel_testning_udfoert:
    - "Typecheck: kun KsRapporteringSection TS6133 (pre-eksisterende) — KoerselSection er fejlfri"
    - "Import-stier verificeret: @/components, @/mocks, @/types/order, ../../../types, ../../../utils"
    - "State-extraction verificeret: alle 3 useState + getSelectedOrdreForVs er i komponenten"
    - "JSX-sammenligning mod kilde L1062–1146: identisk inkl. alle kommentarer og TODO'er"
  selv_lint_typecheck: "typecheck: ingen nye fejl fra KoerselSection (pre-eks. fejl i KsRapporteringSection)"
  saerlig_opmaerksomhed_bedes_paa:
    - "INITIAL_RECEPTER og INITIAL_UDLAEGGERE importeres direkte i sektionen — er dette intentionelt eller skal de trådes fra container? Konsulent SPEC-INDEX siger ikke eksplicit."
    - "KsRapporteringSection TS6133 blokerer en grøn typecheck-gate — bør rettes inden integrations-trin #6 markeres done"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```

**Næste skridt:** Status sat til `ready-for-review`. Prototype-fase → brug `/review KoerselSection` manuelt når klar.
