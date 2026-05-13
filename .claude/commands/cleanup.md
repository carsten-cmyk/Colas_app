Brug cleanup-agenten til at rydde op i følgende fil: $ARGUMENTS

Cleanup-agenten udfører kun disse handlinger:
1. Fjerner dead code (ubrugte imports, variabler, kommenterede blokke)
2. Fixer token-violations (hex → tokens, px → spacing-tokens)
3. Flytter forretningslogik fra JSX til hooks/utils
4. Flytter inline mock-data til `src/mocks/`
5. Flytter lokale typer til `src/types/`

Ændrer IKKE komponent-API, tilføjer IKKE funktionalitet.

Afslutter med: kald `/review [fil]` for bekræftelse.
