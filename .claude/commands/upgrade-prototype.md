Opgradér prototype til produktionskode: $ARGUMENTS

Angiv prototype-filen, fx: `src/prototypes/ordre-plan/OrdrePlanScreen.tsx`

## Hvad upgrade gør

En prototype indeholder typisk alt på ét sted: typer, mock-data, logik og UI.
Upgrade splitter den op i de rigtige lag — uden at ændre den visuelle adfærd.

## Trin 1 — Kortlæg prototypen

Læs filen og lav en liste over:
- Lokale typer/interfaces → skal flyttes til `src/types/`
- Inline mock-data → skal flyttes til `src/mocks/`
- Forretningslogik i JSX (filtrering, sortering, beregninger) → skal flyttes til `src/hooks/`
- UI-blokke der kan blive selvstændige komponenter → kandidater til `src/components/ui/`
- Hardcodede tokens → skal rettes

Vis listen og få godkendelse **før** du ændrer noget.

## Trin 2 — Udpak i rækkefølge

1. Typer → `src/types/[navn].ts`
2. Mock-data → `src/mocks/[navn].ts` med `// TODO: Erstat med Supabase når klar`
3. Data-hook → `src/hooks/use[Navn].ts` der returnerer `{ data, loading, error }`
4. Komponenter → én fil per komponent i `src/components/ui/`
5. Page → `src/pages/[Navn].tsx` der importerer hook + komponenter

## Trin 3 — Verificér

- Kør `/review` på hver udpakket komponent
- Kør `/test` på hver komponent og hook
- Kør `npm run typecheck && npm run lint`
- Verificér visuelt at siden ser identisk ud

## Trin 4 — Ryd op

Først når produktionssiden er **bygget + testet + reviewet**:
- Slet prototype-filen
- Fjern prototypen fra `PrototypeHub.tsx`
- Opdater `PROJECT_STATUS.md`

## Regel

En prototype må **aldrig** slettes før den tilsvarende produktionskode er godkendt.
