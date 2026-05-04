# DashboardHeader — Component Spec

## Kontekst
Read these files before starting:
- .claude/docs/CONFIGURATION_STRATEGY.md
- apps/chauffeur/styles/tokens.ts
- apps/chauffeur/docs/STRUCTURE.md

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/screens/dashboard/DashboardHeader.tsx`
- `src/components/screens/dashboard/DashboardHeader.stories.tsx`

---

## Component spec

```ts
export interface DashboardHeaderProps {
  // Ingen props — logo er statisk
}
```

## Visuel struktur
- Colas logo (gult diamond-logo) øverst til højre
- Ingen bagfarve — ligger på mørk teal baggrund fra ScreenLayout
- Fast højde fra tokens

## Storybook stories
| Story | Data |
|---|---|
| Default | Logo synligt øverst højre |

---

## Må ikke
- Ingen hardcoded farver eller spacing
- Ikke tilføje navigation eller interaktion
