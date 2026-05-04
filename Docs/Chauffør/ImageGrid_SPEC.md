# ImageGrid — Component Spec

## Kontekst
Read these files before starting:
- apps/chauffeur/styles/tokens.ts
- apps/chauffeur/docs/STRUCTURE.md

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/screens/dashboard/ImageGrid.tsx`
- `src/components/screens/dashboard/ImageGrid.stories.tsx`

---

## Component spec

```ts
export interface ImageGridProps {
  images: ImageSourcePropType[]  // To statiske billeder
  messageCount: number           // Videresendes til MessageWidget
  onMessagePress: () => void     // Videresendes til MessageWidget
}
```

## Visuel struktur
Grid layout — 2 kolonner, 2 rækker:

```
┌─────────────┬─────────────┐
│             │ ProjectImage│  ← række 1
│ ProjectImage│─────────────│
│  (stor)     │ MessageWidget  ← række 2
└─────────────┴─────────────┘
```

- Venstre kolonne: ét stort billede der spænder over begge rækker
- Højre kolonne øverst: lille billede
- Højre kolonne nederst: MessageWidget
- Gap mellem celler fra tokens

## Importerer
- `ProjectImage` fra `src/components/ui/ProjectImage`
- `MessageWidget` fra `src/components/ui/MessageWidget`

## Storybook stories
| Story | Data |
|---|---|
| Default | 2 lokale testbilleder, messageCount: 1 |
| Flere beskeder | messageCount: 3 |

---

## Må ikke
- Ingen hardcoded dimensioner eller gaps
- Ikke genbygge ProjectImage eller MessageWidget
