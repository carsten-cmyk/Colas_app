Ryd op i følgende fil: $ARGUMENTS

## Hvad cleanup gør (ikke mere, ikke mindre)

1. **Fjern dead code** — ubrugte imports, variabler, konstanter, kommenterede blokke
2. **Flyt forretningslogik** — filtrering, sortering, beregninger der sidder i JSX flyttes til hook eller util
3. **Flyt inline mock-data** — data defineret direkte i komponenten flyttes til `src/mocks/`
4. **Flyt lokale typer** — interfaces defineret i komponenten flyttes til `src/types/`
5. **Ret åbenlyse token-brud** — hardcodede farver/spacing erstattes med tokens
6. **Ingen refaktor ud over ovenstående** — ændr ikke logik, tilføj ikke features, omdøb ikke props

## Output

Vis præcis hvilke ændringer der er lavet:
```
[FJERNET] src/components/ui/StatCard.tsx:12 — ubrugt import `useEffect`
[FLYTTET] src/components/ui/StatCard.tsx:34-41 — sorteringslogik → src/hooks/useOrders.ts
[TOKEN]   src/components/ui/StatCard.tsx:28 — style={{ color: '#333' }} → className="text-text-primary"
```

Kør derefter `/review` på filen og vis om der er resterende issues.

## Må ikke
- Ændre komponent-API (props interface)
- Tilføje ny funktionalitet
- Omdøbe variabler uden grund
- Ændre test-filer
