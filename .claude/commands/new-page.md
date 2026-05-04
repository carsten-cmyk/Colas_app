Opret en ny side/screen: $ARGUMENTS

Format: `SideNavn [app] [route]` — fx `DagsoversiktPage formand /` eller `OrdreDetaljePage formand /ordre/:id`

## Fremgangsmåde

1. Læs PRD for den relevante app: `Docs/[app]/PRD.md`
2. Tjek eksisterende pages i `apps/[app]/src/pages/`
3. Opret følgende filer:

### A) Page — `apps/[app]/src/pages/[SideNavn].tsx`

```tsx
// Struktur:
// 1. Import af layout-komponenter (TopBar, BottomTabBar)
// 2. Import fra src/hooks/ — IKKE direkte fra src/mocks/
// 3. Loading state
// 4. Error state
// 5. Semantisk HTML: <main>, <section>, <header>
// 6. Ingen forretningslogik i JSX — kun i hooks
```

### B) Hook — `apps/[app]/src/hooks/use[DataNavn].ts`

```ts
// Returnerer: { data, loading, error }
// Mock-data fra src/mocks/ med TODO-kommentar
// Klar til Supabase-swap uden komponent-ændringer
```

### C) Tilføj route i `apps/[app]/src/App.tsx`

```tsx
<Route path="[route]" element={<SideNavn />} />
```

### D) Test — `apps/[app]/src/pages/[SideNavn].test.tsx`

```tsx
// Test: renderer uden crash
// Test: loading state vises
// Test: data vises korrekt
// Test: navigation fungerer
```

## Regler

- Al data-hentning i hooks — aldrig direkte i page-komponenten
- Typer importeres fra src/types/ — aldrig lokalt defineret
- Mock-data importeres fra src/mocks/ — aldrig inline
- Kør `/review` på siden efter oprettelse
