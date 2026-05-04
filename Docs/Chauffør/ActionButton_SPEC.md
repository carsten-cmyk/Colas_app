# ActionButton — Component Spec

## Kontekst
Read these files before starting:
- /docs/PRD.md — section 4.7 TaskActions
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens (no hardcoded values)

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/ui/ActionButton.tsx`
- `src/components/ui/ActionButton.stories.tsx`

---

## Component spec

```ts
export interface ActionButtonProps {
  label: string
  variant: 'start' | 'pause' | 'stop'
  onPress: () => void
  disabled?: boolean
}
```

## Varianter

| Variant | Baggrund | Tekstfarve | Brug |
|---|---|---|---|
| `start` | Lysblå/mint (token) | Mørk | "Start opgave" |
| `pause` | Gul (token) | Mørk | "Pause opgave" |
| `stop` | Rød (token) | Hvid | "Afslut opgave" |

## Visuel struktur
- Fuld bredde (fylder container)
- Afrundede hjørner — store border-radius fra tokens
- Centreret label tekst, fed
- Fast højde fra tokens (stor touch target)

## Adfærd
- Touch target minimum 44px højde (sandsynligvis større per design)
- `disabled` prop giver reduceret opacity — ingen farveændring
- Ingen hover state (React Native)

## Storybook stories

| Story | Data |
|---|---|
| Start | variant: "start", label: "Start opgave" |
| Pause | variant: "pause", label: "Pause opgave" |
| Stop | variant: "stop", label: "Afslut opgave" |
| Disabled | variant: "start", disabled: true |
| Lang label | variant: "start", label: "Start opgave nu og registrer tid" |

---

## Må ikke
- Ingen hardcoded farver, spacing eller font sizes
- Ikke bygge TaskActions (knap-gruppen) — kun den enkelte knap
