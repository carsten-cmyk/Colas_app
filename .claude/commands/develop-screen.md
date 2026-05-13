Brug architect-agenten til at planlægge og nedbryde følgende skærm/feature: $ARGUMENTS

## Hvad architect skal gøre

1. Forstå hvad "$ARGUMENTS" er — fx "AnkomstFabrik chauffeur" betyder skærmen hvor chauffør ankommer til fabrik i chauffeur-appen

2. Læs kontekst:
   - `.claude/docs/PROJECT_STATUS.md`
   - `Docs/Formand/CONTEXT.md`
   - `.claude/docs/FUNCTIONAL_FLOWS.md`
   - `.claude/docs/core/DESIGN_SYSTEM.md`
   - Relevant PRD og prototype-filer

3. Producér en plan med:
   - Hvilke komponenter der genbruges
   - Hvilke komponenter der skal bygges (med SPEC-filer)
   - Build-rækkefølge og parallellisering
   - Cross-app flows der opdateres i FUNCTIONAL_FLOWS.md

4. STOP og præsenter planen. Vent på "godkend" fra brugeren.

5. Når godkendt: skriv SPEC.md filer til `Docs/[App]/[KomponentNavn]_SPEC.md`

## Efter godkendelse af plan

Byg komponenterne i godkendt rækkefølge:
- Kald builder-agenten per komponent (parallelt hvor muligt)
- Kald reviewer-agenten efter hver builder
- Saml alle review-issues og præsenter dem samlet

## Slutresultat til brugeren

```
## Build færdig: [Screen navn]

### Byggede komponenter
- [KomponentNavn] — [filsti] — KLAR / [N issues]

### Review issues (samlet)
[issues fra reviewer]

### Næste skridt
- /cleanup [fil] for at løse CRITICAL issues
- /test [fil] når cleanup er godkendt
- /git når du er klar til at committe
```
