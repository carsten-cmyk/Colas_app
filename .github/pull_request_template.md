## Linket issue

<!-- Skriv `Closes #N` (auto-lukker issue ved merge) eller `Refs #N` (links uden at lukke). -->
<!-- Eksempel: Closes #42 -->

Closes #

## Hvad er lavet

<!-- Kort beskrivelse af ændringen — gentag issue-ID hvis relevant (fx FORMPL-ASB-001) -->

## Type

- [ ] `feat` — ny funktionalitet
- [ ] `fix` — bugfix
- [ ] `refactor` — ingen ny funktionalitet, ingen bugfix
- [ ] `test` — tests tilføjet eller rettet
- [ ] `docs` — dokumentation
- [ ] `chore` — opsætning, dependencies

## Checkliste

### Kode
- [ ] TypeScript: `npm run typecheck` — ingen fejl
- [ ] Lint: `npm run lint` — 0 warnings
- [ ] Tests: `npm run test` — alle grønne
- [ ] Ingen hardcodede farver eller spacing — kun tokens

### Komponenter (hvis nye komponenter er tilføjet)
- [ ] Props interface er eksporteret (`[Navn]Props`)
- [ ] Storybook story med alle varianter og edge cases
- [ ] Loading og error states implementeret
- [ ] Touch targets minimum 44×44px
- [ ] ARIA-labels på ikoner og interaktive elementer
- [ ] `/review` er kørt og issues er håndteret

### Data
- [ ] Mock-data i `src/mocks/` — ikke inline i komponenter
- [ ] `// TODO: Erstat med Supabase når klar` på alle mock-punkter
- [ ] Data-logik i hooks — ikke i JSX

### Prototype (hvis prototype er opgraderet)
- [ ] Prototype-fil er slettet efter produktionskode er godkendt
- [ ] `PrototypeHub.tsx` er opdateret

## Screenshots / Storybook

<!-- Vedhæft screenshots eller link til Storybook story -->

## Afledte ændringer

<!-- Er der andre filer/komponenter der er påvirket? -->
