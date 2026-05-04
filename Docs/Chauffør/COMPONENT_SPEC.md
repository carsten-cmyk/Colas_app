# COMPONENT_SPEC — Build Prompt Template

Brug denne template til at bygge nye komponenter. Erstat `OrderMetrics` med komponent-specifik info.

---

## Prompt (kopiér og udfyld)

```
Read these files before starting:
- /docs/PRD.md — screen requirements and data models
- /styles/tokens.ts — design tokens (no hardcoded values)
- /src/lib/utils.ts — shared utilities

Build a [COMPONENT_NAME] component for the Colas Driver App (React Native / Expo).

Component spec from PRD:
[INDSÆT RELEVANT AFSNIT FRA PRD — fx 4.2 OrderMetrics]

Files to create:
- src/components/[ui|screens/[screen]]/[ComponentName].tsx
- src/components/[ui|screens/[screen]]/[ComponentName].stories.tsx

Requirements:
- TypeScript — export props interface as [ComponentName]Props
- JSDoc comments on non-obvious props
- No hardcoded colors, spacing or font sizes — use tokens.ts only
- Use StyleSheet.create() or styled approach consistent with codebase
- Touch targets minimum 44x44px
- Props interface must match the data model in /types/[type].ts

Storybook stories must show:
- Default state with realistic data
- All relevant states (if stateful)
- Edge cases: long text, missing optional props, empty arrays

Do not build adjacent components — focus only on [COMPONENT_NAME].
```

---

## Komponent-mappe guide

| Komponent type | Placering |
|---|---|
| Generisk UI (StatCard, Button, Badge) | `src/components/ui/` |
| Screen-specifik (TaskInfoTab) | `src/components/screens/[screen]/` |
| Layout (BottomTabBar) | `src/components/layout/` |

---

## Byggerækkefølge — Opgave-detalje

Byg i denne rækkefølge (indefra og ud):

1. `StatCard` (ui)
2. `OrderMetrics` (ui) — bruger StatCard
3. `LocationCard` (ui)
4. `ContactCard` (ui)
5. `AlertBanner` (ui)
6. `ActionButton` (ui)
7. `TaskHeader` (screens/task)
8. `TaskInfoTab` (screens/task) — bruger OrderMetrics + LocationCard
9. `TaskContactsTab` (screens/task) — bruger ContactCard
10. `TaskAlertTab` (screens/task) — bruger AlertBanner
11. `TaskActions` (screens/task) — bruger ActionButton
12. `TaskSwiper` (screens/task) — samler tabs
13. `[id].tsx` (screen) — samler det hele


## Data & Mock krav (gælder alle komponenter)
- Ingen hardcoded data i komponenter — kun props
- Mock-data hentes fra /src/mocks/tasks.ts
- Screens bruger useTask(id) hook — aldrig direkte mock
- Alle komponenter håndterer loading og error states
