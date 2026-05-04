# ProjectImage — Component Spec

## Kontekst
Read these files before starting:
- apps/chauffeur/styles/tokens.ts
- apps/chauffeur/docs/STRUCTURE.md

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/ui/ProjectImage.tsx`
- `src/components/ui/ProjectImage.stories.tsx`

---

## Component spec

```ts
export interface ProjectImageProps {
  source: ImageSourcePropType    // Lokal eller remote image source
  aspectRatio?: number           // Default: 1 (kvadrat)
}
```

## Visuel struktur
- Afrundede hjørner fra tokens
- Fast aspekt-ratio — fylder sin container
- Ingen caption eller overlay

## Storybook stories
| Story | Data |
|---|---|
| Kvadratisk | Lokal testbillede, aspectRatio: 1 |
| Rektangulær | Lokal testbillede, aspectRatio: 0.75 |

---

## Må ikke
- Ingen hardcoded border-radius eller dimensioner
- Ikke klikbar i denne version
