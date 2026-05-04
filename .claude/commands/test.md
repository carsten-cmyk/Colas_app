Skriv tests for følgende fil: $ARGUMENTS

## Fremgangsmåde

1. Læs filen der skal testes
2. Identificér om det er en **komponent** (`.tsx`) eller **hook** (`.ts`)
3. Opret testfil ved siden af kildefilen: `[Navn].test.tsx` eller `[Navn].test.ts`

---

## Komponent-tests (`.test.tsx`)

Brug `@testing-library/react`. Dæk disse cases:

```tsx
// 1. Renderer uden crash
it('renders without crashing', () => {
  render(<Komponent {...defaultProps} />)
})

// 2. Viser korrekt indhold fra props
it('displays the correct title', () => {
  render(<Komponent title="Test" {...defaultProps} />)
  expect(screen.getByText('Test')).toBeInTheDocument()
})

// 3. Alle prop-varianter (fx status badges, typer)
it('renders error variant correctly', () => { ... })

// 4. Interaktioner
it('calls onPress when button is clicked', async () => {
  const onPress = vi.fn()
  render(<Komponent onPress={onPress} {...defaultProps} />)
  await userEvent.click(screen.getByRole('button'))
  expect(onPress).toHaveBeenCalledOnce()
})

// 5. Edge cases
it('handles empty list gracefully', () => { ... })
it('handles undefined optional props', () => { ... })
it('truncates long text without crashing', () => { ... })

// 6. Tilgængelighed
it('has correct aria-label on icon button', () => {
  render(<Komponent {...defaultProps} />)
  expect(screen.getByRole('button', { name: /indstillinger/i })).toBeInTheDocument()
})
```

---

## Hook-tests (`.test.ts`)

Brug `@testing-library/react` `renderHook`. Dæk disse cases:

```ts
// 1. Starter med loading=true
it('starts in loading state', () => {
  const { result } = renderHook(() => useOrders())
  expect(result.current.loading).toBe(true)
})

// 2. Returnerer data
it('returns mock data', async () => {
  const { result } = renderHook(() => useOrders())
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.orders).toHaveLength(1)
})

// 3. Returnerer error ved fejl (mock fejlscenarie)
it('returns error when fetch fails', async () => { ... })

// 4. refetch virker
it('refetch reloads data', async () => { ... })
```

---

## Regler

- Brug `vi.fn()` til mocks — ikke `jest.fn()`
- Brug `userEvent` fra `@testing-library/user-event` — ikke `fireEvent`
- Ingen snapshots — kun assertions på konkret indhold
- Test adfærd, ikke implementering
- Kør `npm run test` til sidst og vis resultatet
