# DashboardScreen — Assembly Spec

## Kontekst
Read these files before starting:
- apps/chauffeur/docs/PRD.md
- apps/chauffeur/docs/STRUCTURE.md
- apps/chauffeur/styles/tokens.ts
- src/mocks/tasks.ts
- src/hooks/useTask.ts

Alle komponenter eksisterer allerede. Genbyg dem ikke — kun import og composition.

## Figma
[INDSÆT FIGMA LINK — dashboard skærm]

---

## File to create
- `src/screens/DashboardScreen.tsx`

---

## Komponent-import oversigt

```ts
import { DashboardHeader } from '@/components/screens/dashboard/DashboardHeader'
import { ImageGrid } from '@/components/screens/dashboard/ImageGrid'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { TaskSwiper } from '@/components/screens/task/TaskSwiper'
import { TaskCard } from '@/components/ui/TaskCard'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
```

---

## Screen struktur

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: token.colorBackgroundDark }}>

  {/* Header — Colas logo */}
  <DashboardHeader />

  <ScrollView>

    {/* Billeder + besked widget */}
    <ImageGrid
      images={[require('@/assets/project1.jpg'), require('@/assets/project2.jpg')]}
      messageCount={mockMessageCount}
      onMessagePress={() => setActiveTab('beskeder')}
    />

    {/* Sektion label */}
    <SectionLabel label="Dagens opgaver" />

    {/* Horisontal scroll af opgave-kort */}
    <TaskSwiper>
      {mockTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onPress={() => setSelectedTask(task.id)}
        />
      ))}
    </TaskSwiper>

  </ScrollView>

  {/* Fast navigation i bunden */}
  <BottomTabBar
    activeTab={activeTab}
    onTabPress={setActiveTab}
  />

</SafeAreaView>
```

---

## State

```ts
const [activeTab, setActiveTab] = useState<TabName>('start')
const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
```

Når `selectedTaskId` er sat — vis TaskDetailScreen oven på dashboard (slide-up animation fra TaskSheet).

## Data
- Opgaver fra `src/mocks/tasks.ts` — `mockTasks` array
- Besked-count: hardcode til `1` indtil Supabase er klar
- `// TODO: Erstat med Supabase realtime subscription`

## Loading og error
- Loading: vis `<TaskSkeleton />` i TaskSwiper området
- Error: vis `<ErrorBanner />` øverst

---

## Må ikke
- Ikke genbygge eksisterende komponenter
- Ikke hardcode farver eller spacing
- Ikke tilføje Expo Router — state-based navigation
