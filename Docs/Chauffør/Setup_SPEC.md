# Setup — Blockers Spec

## Kontekst
Read these files before starting:
- /docs/PRD.md — data model og screen states
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens

This is a setup task — no UI components. Create the following files before TaskDetailScreen is assembled.

---

## 1. src/types/task.ts

Opret typer der matcher PRD sektion 5:

```ts
export type TaskState = 'idle' | 'active' | 'paused' | 'completed'

export interface Location {
  name: string
  address: string
  meetingTime?: string
  type: 'pickup' | 'delivery'
}

export interface Contact {
  id: string
  name: string
  role: string
  phone: string
  imageUrl?: string
}

export interface Alert {
  id: string
  message: string
  type: 'traffic' | 'weather' | 'other'
  active: boolean
}

export interface Task {
  id: string
  orderNumber: string
  ton: number
  produkt: string
  runder: number
  timer: number
  locations: Location[]
  contacts: Contact[]
  alerts: Alert[]
  state: TaskState
}
```

---

## 3. src/mocks/tasks.ts

```ts
import { Task } from '@/types/task'

export const mockTask: Task = {
  id: '1',
  orderNumber: '1212343',
  ton: 75,
  produkt: '82101H',
  runder: 3,
  timer: 4,
  locations: [
    {
      name: 'Køge Asfaltfabrik',
      address: 'Nordhavnsvej 9, 4600 Køge',
      meetingTime: '05.30',
      type: 'pickup'
    },
    {
      name: 'Uddannelsescenter Syd',
      address: 'Søvej 6 D, 4900 Nakskov',
      type: 'delivery'
    }
  ],
  contacts: [
    {
      id: '1',
      name: 'Henrik Thor',
      role: 'Projektleder',
      phone: '2399 1448',
      imageUrl: 'https://placeholder.com/henrik'
    },
    {
      id: '2',
      name: 'Ole Jensen',
      role: 'Formand',
      phone: '2399 1443',
      imageUrl: 'https://placeholder.com/ole'
    },
    {
      id: '3',
      name: 'Fabrik Køge',
      role: '-',
      phone: '6020 1818',
      imageUrl: 'https://placeholder.com/fabrik'
    }
  ],
  alerts: [
    {
      id: '1',
      message: 'Der er lige nu risiko for glatte veje og uheld på Sydsjælland, særligt på E47 Sydmotorvejen, hvor et uheld',
      type: 'traffic',
      active: true
    }
  ],
  state: 'idle'
}

export const mockTasks: Task[] = [mockTask]
```

---

## 4. src/hooks/useTask.ts

```ts
import { mockTask } from '@/mocks/tasks'
import { Task } from '@/types/task'

interface UseTaskResult {
  data: Task | null
  loading: boolean
  error: string | null
}

export function useTask(id: string): UseTaskResult {
  // TODO: Erstat med Supabase kald når integration er klar
  return {
    data: mockTask,
    loading: false,
    error: null
  }
}
```

---

## 5. src/components/ui/TaskSkeleton.tsx

Simpel loading placeholder — grå blokke der matcher TaskDetailScreen layout:
- Rektangel for OrderMetrics (2x2 grid)
- To rektangler for LocationCards
- Én bred rektangel for CardSwiper

Brug `Animated` til en pulserende opacity (fade in/out loop).

---

## 6. src/components/ui/ErrorBanner.tsx

```ts
export interface ErrorBannerProps {
  message: string
  onRetry?: () => void    // Valgfri retry-knap
}
```

Rød banner øverst på skærmen med fejlbesked og valgfri "Prøv igen" knap.

---

## Navnemismatches at rette

- `CardSwiper` i TaskDetailScreen_SPEC.md skal være `TaskSwiper`
- Ret importen i `[id].tsx` til: `import { TaskSwiper } from '@/components/screens/task/TaskSwiper'`

---

## Må ikke
- Ikke bygge UI komponenter udover TaskSkeleton og ErrorBanner
- Ikke tilføje rigtig Supabase logik — kun mock i useTask
- Ikke style placeholders med hardcoded værdier
