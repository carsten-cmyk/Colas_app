# TaskDetailScreen — Assembly Spec

## Kontekst
Read these files before starting:
- /docs/PRD.md — full screen spec, all states and data model
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens
- /src/mocks/tasks.ts — mock data
- /src/hooks/useTask.ts — data hook

All components already exist. Do not rebuild them — import and compose only.

## Figma
[INDSÆT FIGMA LINK — opgave-detalje skærm]

---

## File to create
- `src/app/(app)/tasks/[id].tsx`

---

## Komponent-import oversigt

```ts
import { TaskSheet } from '@/components/layout/TaskSheet'
import { OrderMetrics } from '@/components/ui/OrderMetrics'
import { LocationCard } from '@/components/ui/LocationCard'
import { ContactCard } from '@/components/ui/ContactCard'
import { InfoCard } from '@/components/ui/InfoCard'
import { ActionButton } from '@/components/ui/ActionButton'
import { CardSwiper } from '@/components/screens/task/CardSwiper'
```

---

## Screen struktur

```tsx
<TaskSheet
  orderNumber={task.orderNumber}
  onClose={() => router.back()}
  visible={true}
>
  {/* Sektion 1: Ordre metrics — altid synlig øverst */}
  <OrderMetrics
    ton={task.ton}
    produkt={task.produkt}
    runder={task.runder}
    timer={task.timer}
  />

  {/* Sektion 2: Lokationer — altid synlig */}
  <LocationCard ... />   {/* pickup */}
  {/* transport-ikon mellem */}
  <LocationCard ... />   {/* delivery */}

  {/* Sektion 3: Horisontal swipe — kontakter + infokort */}
  <CardSwiper initialIndex={hasActiveAlert ? alertIndex : 0}>
    {task.state === 'active' && <ContactCard ... />}  {/* vises kun når startet */}
    {task.alerts.filter(a => a.active).map(alert => (
      <InfoCard variant="danger" ... />
    ))}
    {/* Generelle infokort her */}
  </CardSwiper>

  {/* Sektion 4: Action knapper — fast i bunden */}
  <TaskActions state={task.state} ... />
</TaskSheet>
```

---

## Screen states

### idle (ikke startet)
- OrderMetrics synlig
- LocationCards synlige
- CardSwiper: kun aktive InfoCards — ingen ContactCards
- TaskActions: "Start opgave" knap

### active (startet)
- Alt fra idle
- CardSwiper: ContactCards tilføjet som første kort
- TaskActions: "Pause opgave" + "Afslut opgave"

### paused
- Gul InfoCard overlay vises øverst i CardSwiper med pause-besked
- TaskActions: "Start opgave" + "Afslut opgave"

---

## Data
- Hent data via `useTask(id)` — ikke direkte fra mock
- Håndter loading: vis `<TaskSkeleton />` (simpel grå placeholder)
- Håndter error: vis `<ErrorBanner message={error} />`
- `id` hentes fra Expo Router params: `const { id } = useLocalSearchParams()`

---

## Navigation
- Åbnes fra Dashboard TaskCard via `router.push('/tasks/' + id)`
- Lukkes med X-knap via `router.back()`

---

## Må ikke
- Ikke genbygge eksisterende komponenter
- Ikke hardcode data — alt fra useTask()
- Ikke tilføje ny styling — brug kun eksisterende tokens
