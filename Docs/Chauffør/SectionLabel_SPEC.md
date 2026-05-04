# SectionLabel — Component Spec

## Kontekst
Read these files before starting:
- apps/chauffeur/styles/tokens.ts
- apps/chauffeur/docs/STRUCTURE.md

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/ui/SectionLabel.tsx`
- `src/components/ui/SectionLabel.stories.tsx`

---

## Component spec

```ts
export interface SectionLabelProps {
  label: string        // "Dagens opgaver"
}
```

## Visuel struktur
- Enkelt tekstlabel, fed
- Hvid tekst på mørk baggrund
- Ingen bagfarve — ligger på screen baggrund
- Venstrejusteret

## Genanvendelighed
Generisk komponent til ui/ — bruges overalt hvor der er en sektion-overskrift.

## Storybook stories
| Story | Data |
|---|---|
| Default | label: "Dagens opgaver" |
| Lang tekst | label: "Alle opgaver for i dag og i morgen" |

---

## Må ikke
- Ingen hardcoded farver eller font sizes
