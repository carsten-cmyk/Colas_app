# SPEC: AfregningTypePill

## Formål
Lille pille-badge der visuelt markerer om afregningen er **time-afregning** eller **akkord**. Bruges i top af `BilAfregningExpander` så formand straks ser hvilke felter der vises.

## Filsti
`apps/formand/src/components/ui/AfregningTypePill.tsx`

## Props

```ts
import type { AfregningType } from '../../types/afregning'

export interface AfregningTypePillProps {
  type: AfregningType
  /** Hvis true: vis fallback-marker (lille * ved siden af tekst) */
  isFallback?: boolean
}
```

## Visuelt

- `type === 'time'`: `bg-light-aqua text-deep-teal` med ikon `Clock`, tekst "Time-afregning"
- `type === 'akkord'`: `bg-surface-2 text-text-primary` med ikon `Weight` eller `Package`, tekst "Akkord"
- `isFallback = true`: lille `*` efter teksten + tooltip-attribut "Type ikke leveret fra vognmand — fallback til time"

Layout: inline-flex, `gap-xxxs`, `px-xs py-xxxs`, `rounded-md`, `font-inter text-xs font-medium`.

## Tokens
`bg-light-aqua`, `bg-surface-2`, `text-deep-teal`, `text-text-primary`, `rounded-md`, `px-xs`, `py-xxxs`.

## Acceptance-kriterier
- Props eksporteret som `AfregningTypePillProps`
- Ingen hardcoded farver/spacing
- Ingen tekst-overflow — fast min-bredde ikke nødvendig
