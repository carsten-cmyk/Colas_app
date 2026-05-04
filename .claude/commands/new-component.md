Opret en ny UI-komponent: $ARGUMENTS

Format: `KomponentNavn [app]` — fx `StatCard formand` eller `DriverCard chauffeur`

## Fremgangsmåde

1. Tjek om der er en `_SPEC.md` fil for denne komponent i `Docs/[app]/`
2. Tjek eksisterende komponenter i `apps/[app]/src/components/ui/` for at undgå dubletter
3. Opret tre filer:

### A) Komponent — `apps/[app]/src/components/ui/[KomponentNavn].tsx`

```tsx
// Struktur:
// 1. JSDoc med props-beskrivelse
// 2. Eksporteret Props interface — navngivet [KomponentNavn]Props
// 3. Komponent-funktion
// 4. Ingen inline styles med hardcodede værdier
// 5. Tokens kun fra tailwind.config.ts
// 6. Semantisk HTML
// 7. ARIA-labels på alle ikoner og interaktive elementer
// 8. Loading og error states hvis relevant
// 9. Touch targets minimum 44×44px
```

### B) Story — `apps/[app]/src/components/ui/[KomponentNavn].stories.tsx`

```tsx
// CSF3 format med satisfies Meta<typeof KomponentNavn>
// Stories: Default, alle prop-varianter, edge cases
// Edge cases: tom liste, lang tekst, manglende billede, loading, error
```

### C) Test — `apps/[app]/src/components/ui/[KomponentNavn].test.tsx`

```tsx
// @testing-library/react
// Test: renders without crash, props vises korrekt
// Test: interaktioner (onClick, onChange)
// Test: edge cases (undefined props, tom liste)
// Test: accessibility (getByRole, aria-label)
```

## Regler

- Ingen `any` types
- Ingen hardcodede farver eller spacing
- Kun tokens fra tailwind.config.ts
- Props interface altid eksporteret
- Mock-data med `// TODO: Erstat med Supabase når klar`
- Kør `/review` på komponenten efter oprettelse
