# Offline & Cache-strategi — Colas Web Apps

Formanden arbejder på en byggekontor-tablet. Netforbindelsen kan være ustabil.
Appen skal fungere — ikke crashe — ved midlertidig netafbrud.

---

## Princip: Graceful degradation

```
Online  → hent friske data, vis realtime-opdateringer
Offline → vis sidst cachede data, gem ændringer lokalt, sync ved genopkobling
```

Brugeren skal ALTID vide om han ser live-data eller cached data.

---

## Offline-indikator (implementér i alle web-apps)

```tsx
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

Vis `<OfflineBanner />` i AppShell når `!isOnline`.
Pattern: se DESIGN_SYSTEM.md → "Offline-indikator".

---

## Data-caching (implementeres med TanStack Query når Supabase kobles til)

Indtil Supabase:
- Mock-data er altid tilgængeligt (ingen netværkskald)
- Ingen cache-setup nødvendig i prototype-fase

Når Supabase kobles til:
```ts
// Brug TanStack Query (React Query v5)
// npm install @tanstack/react-query

const { data, isLoading, isError } = useQuery({
  queryKey: ['orders'],
  queryFn: fetchOrders,
  staleTime: 5 * 60 * 1000,      // 5 min — vis cached data uden refetch
  gcTime: 30 * 60 * 1000,        // 30 min — behold i memory-cache
  retry: 3,                       // 3 forsøg ved netfejl
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

---

## Offline-skrivning (draft state)

Formanden kan taste noter og ændringer offline.
Disse gemmes lokalt og synces ved genopkobling.

```ts
// src/utils/offlineDraft.ts
const DRAFT_KEY = 'colas_offline_drafts'

export function saveDraft(key: string, data: unknown) {
  const drafts = getDrafts()
  drafts[key] = { data, savedAt: new Date().toISOString() }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

export function getDrafts(): Record<string, { data: unknown; savedAt: string }> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function clearDraft(key: string) {
  const drafts = getDrafts()
  delete drafts[key]
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}
```

---

## Optimistisk UI

Formanden tapper "Opdatér tons" — appen opdaterer UI'et straks.
Hvis Supabase-kaldet fejler: rollback + vis fejlbesked.

```ts
// Pattern i hook:
const updateTons = async (orderId: string, tonsDelivered: number) => {
  const previousOrders = queryClient.getQueryData(['orders'])
  // Optimistisk opdatering
  queryClient.setQueryData(['orders'], (old) => /* update */)
  try {
    await supabase.from('orders').update({ tons_delivered: tonsDelivered }).eq('id', orderId)
  } catch {
    // Rollback
    queryClient.setQueryData(['orders'], previousOrders)
    setError('Kunne ikke gemme — prøv igen')
  }
}
```

---

## Hvad der skal implementeres (prioriteret)

| Prioritet | Feature | Hvornår |
|---|---|---|
| KRITISK | `useOnlineStatus` + `<OfflineBanner />` | Straks — sprint 1 |
| KRITISK | Error state på alle data-hooks | Straks — sprint 1 |
| VIGTIG | TanStack Query med staleTime | Når Supabase kobles til |
| VIGTIG | Optimistisk UI for tons-opdatering | Sprint 2 |
| LATER | Draft-state med localStorage | Sprint 3 |
| LATER | Service Worker (full offline) | Post-MVP |

---

## Expo/React Native (Chauffeur-appen)

Same principles, different APIs:
- `NetInfo` fra `@react-native-community/netinfo` i stedet for `navigator.onLine`
- `AsyncStorage` i stedet for `localStorage`
- Expo Notifications til "data synced"-besked ved genopkobling
