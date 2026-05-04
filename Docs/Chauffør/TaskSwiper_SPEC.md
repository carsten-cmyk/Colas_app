# TaskSwiper — Component Spec

## Kontekst
Read these files before starting:
- /docs/PRD.md
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens (no hardcoded values)

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/screens/task/TaskSwiper.tsx`
- `src/components/screens/task/TaskSwiper.stories.tsx`

---

## Component spec

```ts
export interface TaskSwiperProps {
  children: ReactNode[]    // Kortene — InfoCard, ContactCard osv.
  initialIndex?: number    // Hvilket kort der vises først (default: 0)
}
```

## Visuel struktur
- Horisontal scroll container
- Ét kort synligt ad gangen (peek af næste kort i kanten — ca. 16px)
- Ingen synlige tab-indikatorer eller pile
- Kortene har ensartet bredde — fylder container minus peek-margin

## Adfærd
- Swipe venstre/højre mellem kort
- Snap til næste kort ved swipe (ikke fri scroll)
- Brug `FlatList` med `horizontal`, `pagingEnabled` eller `snapToInterval`
- `initialIndex` scroller til korrekt kort uden animation ved mount
- Hvis `initialIndex` peger på alert-kort og det er aktivt — vis det først

## Peek-effekt
- Næste kort er synligt i højre kant (~16px fra tokens)
- Giver brugeren hint om at der er mere indhold

## Storybook stories

| Story | Data |
|---|---|
| To kort | InfoCard (info) + ContactCard |
| Tre kort | InfoCard (danger/alert) + ContactCard + InfoCard (info) |
| Start på index 1 | initialIndex: 1 — starter på andet kort |
| Ét kort | Kun ét kort — ingen swipe mulig |

---

## Må ikke
- Ingen hardcoded farver, spacing eller font sizes
- Ikke style kortene indeni — TaskSwiper er kun container
- Ikke bygge tab-bar eller dot-indikatorer i denne version
