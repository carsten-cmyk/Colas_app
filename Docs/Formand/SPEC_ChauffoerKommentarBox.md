# SPEC: ChauffoerKommentarBox

## Formål
Lille info-boks der viser chaufførens kommentar (hvis nogen) sendt fra chauffør-appen sammen med timerne. Bruges i bil- og materiel-afregnings-expander.

## Filsti
`apps/formand/src/components/ui/ChauffoerKommentarBox.tsx`

## Props

```ts
export interface ChauffoerKommentarBoxProps {
  /** Selve kommentar-teksten. Hvis tom/undefined returneres null. */
  kommentar?: string
  /** Chauffør-navn — vises i header */
  chauffoerNavn?: string
  /** Tidspunkt fra chauffør-app — "DD. mmm · HH:MM" */
  sendtTidspunkt?: string
}
```

## Visuelt

```
┌──────────────────────────────────────────────────┐
│ [icon] Kommentar fra Morten Lund · 15. mar · 17:42 │
│                                                   │
│ "Stoppet 30 min ved fabrik pga. produktionsstop." │
└──────────────────────────────────────────────────┘
```

- Baggrund: `bg-soft-aqua` eller `bg-surface-2`
- Border: `border border-hairline`
- Radius: `rounded-lg`
- Ikon: `MessageSquare` (lucide-react, `size={14}`, `text-text-muted`)
- Header: `font-inter text-xs font-medium text-text-muted`
- Body: `font-inter text-sm text-text-secondary` med `italic` for at signalere citat
- Padding: `p-sm`

## Edge cases
- `kommentar` tom eller kun whitespace → komponenten render `null`

## Tokens
Kun `bg-soft-aqua`/`bg-surface-2`, `border-hairline`, `text-text-*`, `p-sm`, `rounded-lg`.

## Acceptance-kriterier
- Returnerer `null` hvis `kommentar` er tom
- Ingen hardcoded farver/spacing
- Props eksporteret som `ChauffoerKommentarBoxProps`
