Opret en ny data-hook: $ARGUMENTS

Format: `useHookNavn [app]` — fx `useOrders formand` eller `useDriverTask chauffeur`

## Fremgangsmåde

1. Tjek eksisterende hooks i `apps/[app]/src/hooks/` for at undgå dubletter
2. Tjek at typen allerede findes i `apps/[app]/src/types/` — opret den hvis den mangler
3. Opret to filer:

### A) Hook — `apps/[app]/src/hooks/[useHookNavn].ts`

```ts
// Struktur:
// 1. Import af type fra src/types/
// 2. Import af mock-data fra src/mocks/ (TODO-kommentar)
// 3. Return type eksplicit defineret som interface
// 4. States: data, loading, error
// 5. useEffect til data-hentning (klar til Supabase-swap)
// 6. Cleanup i useEffect return

// Eksempel return type:
interface UseOrdersReturn {
  orders: Order[]
  loading: boolean
  error: string | null
  refetch: () => void
}
```

### B) Test — `apps/[app]/src/hooks/[useHookNavn].test.ts`

```ts
// @testing-library/react renderHook
// Test: returnerer loading=true initialt
// Test: returnerer data efter mock resolve
// Test: returnerer error ved fejl
// Test: refetch genindlæser data
```

## Regler

- Return type altid eksplicit defineret som interface
- Ingen forretningslogik i hooks der hører i utils
- Mock-data har `// TODO: Erstat med Supabase når klar`
- Altid eksportér return type interfacet
