---
section: ordre-plan
component: MaterielEtapeRound4b
spec: Docs/Formand/ordre-plan/handoffs/MaterielEtapeRound4b.md
builder_session: 2026-06-23-1500
builder_model: claude-sonnet-4-6
status: ready-for-review
review_rounds: 0
---

# Handoff — Materiel Etape Round 4b (finale)

> Tredje og afsluttende round i "etape-bevidst materiel"-ombygningen. Bygger direkte
> oven på Round 4a (transportPlaner-state + send/bekræft re-keyed). Ændringer sker
> udelukkende i prototype-fil — ingen separate komponenter oprettet.

---

## Implemented

```yaml
accept_pass:
  - id: R4b-001
    description: "Auto-opret blanke transport-pladser ved ny-etape: useEffect der
      idempotent sikrer MaterielTransportPlan-poster (status: 'ikke-planlagt', alle
      felter tomme, sendt/bekraeftet: false) for HVER enhed i materielResources for
      aktivEtape når materielUiState === 'ny-etape'. Kører efter hvert render; ingen
      overskrivning af eksisterende planer (guard: if (!next[key]))."
  - id: R4b-002
    description: "Ny-etape container-niveau notifikation: diskret sektion-tekst
      'Ny etape planlagt — materiel-transport skal planlægges' vist i materiel-sektionens
      header-område (under h2, før presenter) i normal mode (ikke samleordre). Ingen
      ikoner, kun design-tokens (text-text-muted, font-inter text-xs)."
  - id: R4b-003
    description: "Token-sweep — materiel transport-tabel SMS-kolonne (Udfoersel, 6x
      min-h-[44px] → min-h-touch, 6x min-w-[44px] → min-w-touch). Linje 5699-5742."
  - id: R4b-004
    description: "Token-sweep — 'Godkend afregning'-knap i Kørt materiel-sektionen
      (1x min-h-[44px] → min-h-touch). Linje 7662."
```

---

## Not implemented

```yaml
accept_skip:
  - id: R4b-DEMO
    reason: "DEMO_PLANLAGTE_DAGE → faktiskPlanlagteDage swap er eksplicit UDE AF SCOPE
      for Round 4b per opgavebeskrivelsen. TODO-kommentar bevaret."
    blocked_by: "Afventer mock-ordre med faktiske maj/juli-dage"
    suggested_followup: "Swap etaper-memo til faktiskPlanlagteDage når INITIAL_PRODUCTS
      dækker flerperiode-ordre"
```

---

## Assumptions

- `materielResources` som dependency i useEffect er stabil (memo-referenceidentitet);
  effekten kører kun ved reel ændring i state-afledninger.
- Container-niveau ny-etape-notifikationen er bevidst ENKEL (en linje tekst) fordi
  `MaterielNyEtapeTilstand`-presenteren allerede har et fuldt `warn-bg`-banner med
  etape-nummer og dato. To prominente bannere ville konkurrere visuelt.
- `min-h-[96px]` i produktbokse (Planlægning-mode) er IKKE berørt — de er i asfalt-
  produktboks-sektionen, udenfor materiel-scope.
- `w-[100px]`/`w-[120px]` i Kørt materiel-tabel (timer-inputs) er bevidste fixed
  dimensions på form-inputs, ikke layout-containers — OK pr. CLAUDE.md.

---

## Known issues

- `min-h-[44px]`/`min-w-[44px]` i asfalt-biler SMS-kolonne (Udfoersel, linje ~5466-5509)
  er identiske violations som dem i materiel-tabellen, men er udenfor scope (asfalt-
  sektionen). Noteres til næste cleanup-round.
- `bg-[#F5F5F5]`/`text-[#8A6A00]`/`bg-[#E7F4EE]` violations i Planlægning-asfalt-
  biler-sektionen (~L2573, L2603, L2607) er udenfor scope. De ligger i shared markup
  (delt med asfalt-biler, ikke kun materiel).

---

## Files changed

```
modified:
  - apps/formand/src/prototypes/ordre-plan/OrdrePlanScreen.tsx
    # 1. useEffect: auto-opret blanke transport-pladser ved ny-etape (~L1543-1580)
    # 2. Container ny-etape-notifikation i materiel-sektion header (~L3148-3165)
    # 3. Token-sweep: 6x min-h-[44px]→min-h-touch + 6x min-w-[44px]→min-w-touch
    #    i materiel SMS-tabel (Udfoersel, ~L5699-5742)
    # 4. Token-sweep: 1x min-h-[44px]→min-h-touch i Godkend-afregning-knap (~L7662)
```

---

## Prototype-fidelity

Ingen separate komponenter oprettet. Alle ændringer er inline i prototype-filen.

**Bevidste afvigelser:**
- Container-notifikation er en enkel `<p>` (text-xs, text-text-muted) frem for et
  fuldt warn-bg-banner — fordi presenter-banneret allerede er det prominente element
  med handlingsopfordring. En duplikeret header-banner ville være redundant.

**Tokens overholdt:**
- Ingen nye hex-farver introduceret
- Alle nye klasser bruger design-tokens fra tailwind.config.ts

---

## API exports

Ingen nye eksporterede typer eller hooks. Ændringerne er interne i OrdrePlanScreen.

**Ny intern effekt-signatur (til reviewers orientering):**
```typescript
useEffect(() => {
  if (materielUiState !== 'ny-etape' || !aktivEtape) return
  setTransportPlaner(prev => { /* idempotent blank-plan-opret */ })
}, [materielUiState, aktivEtape, materielResources])
```

---

## Tokens / patterns brugt

- Touch targets: `min-h-touch` / `min-w-touch` (erstattet hardcoded `[44px]`)
- Notifikation: `font-inter text-xs text-text-muted` — ingen farve-afvigelser
- Blank transport-plan: alle felter tomme strenge; boolean `false` — ingen magic values

---

## Ready-for-next-step

- [x] Typecheck pass: `npm run formand:typecheck` — 0 fejl
- [x] Handoff udfyldt (denne fil)
- [x] Klar til reviewer

---

## Builder sign-off

```yaml
builder_signoff:
  builder_agent: claude-sonnet-4-6
  signed_at: 2026-06-23 15:05
  acceptkriterier_implementeret: "4 af 4 (R4b-001..004)"
  acceptkriterier_skipped: "1 (DEMO-swap — eksplicit out-of-scope per opgave)"
  prototype_kopieret_1_til_1: false
  bevidste_afvigelser_count: 1
  bevidste_afvigelser:
    - "Container-notifikation er <p> (enkel tekst) frem for warn-bg-banner.
       Begrundelse: MaterielNyEtapeTilstand har allerede fuldt banner — duplikering
       ville konkurrere visuelt."
  manuel_testning_udfoert:
    - "Typecheck kørte rent — 0 fejl, 0 warnings"
    - "Scenarie auto-opret: materielUiState='ny-etape' + aktivEtape defineret →
       useEffect kører → sætter blanke planer for alle materielResources-enheder"
    - "Idempotens-check: eksisterende planer (DEMO_TRANSPORT_PLANER) overskrives
       ikke pga. if (!next[key])-guard"
    - "Token-sweep: samtlige min-h-[44px]/min-w-[44px] i materiel-scope erstattet"
  selv_lint_typecheck: passed
  saerlig_opmaerksomhed_bedes_paa:
    - "useEffect dependency-array: [materielUiState, aktivEtape, materielResources] —
       verificer at materielResources (memo) ikke re-skaber reference ved hvert render
       og dermed trigger-looper effekten unødvendigt"
    - "Container-notifikation vises IKKE i samleordre-mode (!isSamleordreMode guard) —
       bekræft at samleordre-mode har sin egen materiel-notifikations-vej eller at
       dette er bevidst accepteret"
    - "Violations udenfor scope (asfalt-biler SMS, shared markup hex) — noter om de
       skal adresseres i en dedikeret cleanup-round"
  signatur: "Jeg står inde for at koden implementerer SPEC + handoff præcis som dokumenteret ovenfor"
```
