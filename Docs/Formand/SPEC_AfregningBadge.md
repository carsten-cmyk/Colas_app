# SPEC: AfregningBadge

## Formål
Lille badge der viser status på en afregning: **"Lav afregning"** (klikbar CTA), **"Afregning godkendt"** (grøn), eller **"Afventer chauffør"** (når chauffør ikke har sendt timer endnu).

## Filsti
`apps/formand/src/components/ui/AfregningBadge.tsx`

## Props

```ts
export interface AfregningBadgeProps {
  /** Hvilken visuel tilstand badgen er i */
  status: 'afventer-chauffoer' | 'klar-til-godkendelse' | 'godkendt'
  /** Klik-handler — kun aktiv når status = 'klar-til-godkendelse' */
  onClick?: () => void
  /** Tidspunkt for godkendelse — vises kun ved status = 'godkendt' */
  godkendtTidspunkt?: string
  /** ARIA label */
  ariaLabel?: string
}
```

## Visuelle states

### 1. `afventer-chauffoer`
- Baggrund: `bg-warn-bg` (advarsel)
- Tekst: `text-text-muted`
- Ikon: `Clock` (lucide-react)
- Tekst: "Afventer chauffør"
- **Ikke klikbar** (`disabled`)

### 2. `klar-til-godkendelse`
- Baggrund: `bg-yellow`
- Tekst: `text-text-primary`
- Ikon: `FileSignature` eller `PenLine`
- Tekst: "Lav afregning"
- **Klikbar** — `min-h-[44px]` for touch target
- Hover: `hover:brightness-95`

### 3. `godkendt`
- Baggrund: `bg-good-bg`
- Tekst: `text-good`
- Ikon: `CheckCircle2`
- Tekst: "Afregning godkendt" + lille tidspunkt under (`text-xxs text-text-muted`)
- Ikke klikbar (men ikke disabled — kan udvides senere til "rediger"-flow)

## Tokens (ufravigelige)
- Farver: `bg-warn-bg`, `bg-yellow`, `bg-good-bg`, `text-good`, `text-text-primary`, `text-text-muted`
- Spacing: `px-xs py-xxxs`, `gap-xxxs`
- Radius: `rounded-md`
- Typografi: `font-inter text-xs font-semibold`
- Touch: `min-h-[44px]` når klikbar

## Eksisterende komponenter genbrugt
Ingen — det er en atomar UI-komponent.

## Acceptance-kriterier
- Props-interface eksporteret som `AfregningBadgeProps`
- Ingen `any`-typer
- Ingen hardcoded farver, padding eller størrelse — kun tokens
- Klikbar variant har `min-h-[44px]`
- `aria-label` sættes hvis det ikke fremgår af tekst
