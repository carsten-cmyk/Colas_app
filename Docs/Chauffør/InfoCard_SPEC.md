# InfoCard — Component Spec

## Kontekst
Read these files before starting:
- /docs/PRD.md
- /docs/STRUCTURE.md — folder conventions
- /styles/tokens.ts — design tokens (no hardcoded values)
- /src/mocks/tasks.ts — mock data

## Figma
[INDSÆT FIGMA LINK]

---

## Files to create
- `src/components/ui/InfoCard.tsx`
- `src/components/ui/InfoCard.stories.tsx`

---

## Component spec

```ts
export interface InfoCardProps {
  title: string          // Fed overskrift — fx "Information"
  message: string        // Brødtekst — kan være flere linjer
  variant: 'danger' | 'info' | 'warning'
}
```

## Varianter

| Variant | Baggrund | Tekstfarve | Brug |
|---|---|---|---|
| `danger` | Rød (token: color-danger) | Hvid | Trafik, ulykker, kritiske advarsler |
| `info` | Hvid | Mørk (token: color-text-primary) | Generel information |
| `warning` | Gul (token: color-warning) | Mørk | Advarsler, påmindelser |

## Visuel struktur
1. Titel — fed, centreret, øverst
2. Brødtekst — regular weight, venstrejusteret, under titel

## Adfærd
- Ikke klikbar — ren display komponent
- Ingen touch targets nødvendige
- Fylder fuld bredde af sin container (bruges i horisontal scroll)

## Data & mock
- Ingen hardcoded data i komponenten — kun props
- Mock-data fra /src/mocks/tasks.ts

---

## Storybook stories

| Story | Data |
|---|---|
| Danger | "Information", trafik-advarsel tekst som på mockup |
| Info | "Information", neutral besked, hvid baggrund |
| Warning | "Bemærk", gul advarsel om vejr eller pause-regler |
| Lang tekst | Danger variant med meget lang besked (5+ linjer) |
| Kort tekst | Info variant med én linje |

---

## Må ikke
- Ingen hardcoded farver, spacing eller font sizes
- Ikke bygge scroll-containeren — kun det enkelte kort
- Ikke tilføje ikon endnu — tekst only i denne version
