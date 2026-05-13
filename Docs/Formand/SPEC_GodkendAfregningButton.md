# SPEC: GodkendAfregningButton

## Formål
Primær CTA-knap der låser afregningens felter og markerer den som godkendt af formand. Når trykket: emit en bekræftelse til parent som skifter status til "godkendt".

## Filsti
`apps/formand/src/components/ui/GodkendAfregningButton.tsx`

## Props

```ts
export interface GodkendAfregningButtonProps {
  /** Klik-handler — parent håndterer state-skift */
  onGodkend: () => void
  /** Hvis true: knap er disabled (fx hvis værdier mangler) */
  disabled?: boolean
  /** Hvis true: viser "Godkender..." mens parent gemmer */
  loading?: boolean
  /** Tekst-override — default "Godkend afregning" */
  label?: string
}
```

## Visuelt
- Primær CTA-pattern fra DESIGN_SYSTEM.md
- `bg-yellow text-text-primary`, `font-inter font-semibold text-sm`
- `px-sm py-xs rounded-lg min-h-[44px]`
- Hover: `hover:brightness-95`, active: `active:scale-[0.98]`
- Loading: spinner-ikon i venstre side (samme spinner-pattern som DESIGN_SYSTEM)
- Disabled: `opacity-50 cursor-not-allowed`, ingen hover-effekt

## Bekræftelses-flow (åbent spørgsmål)
Skal der vises en confirmation-dialog inden godkendelse? Default = nej, men parent kan implementere det. Komponenten er ren CTA.

## Tokens
`bg-yellow`, `text-text-primary`, `rounded-lg`, `px-sm`, `py-xs`.

## Acceptance-kriterier
- Props eksporteret som `GodkendAfregningButtonProps`
- `min-h-[44px]` overholdt
- Disabled-state forhindrer click
- Loading-state forhindrer click + viser spinner
- Ingen hardcodede farver/spacing
