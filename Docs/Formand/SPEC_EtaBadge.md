# SPEC: EtaBadge

## Formål
Lille statisk badge i "Status / Temp."-kolonnen på vejesedler der endnu ikke er ankommet. To varianter:
- `eta` — viser `ETA X min` (når bil er på vej fra fabrik mod udførselssted)
- `paa-vej-til-fabrik` — viser `På vej til fabrik` (når bil er disponeret, men endnu ikke har afhentet last)

Begge varianter er rent visuelle — ingen interaktion.

## Filsti
`apps/formand/src/components/ui/EtaBadge.tsx`

## Props

```ts
export interface EtaBadgeProps {
  /** Hvilken statisk badge der vises */
  variant: 'eta' | 'paa-vej-til-fabrik'
  /** ETA i minutter — kræves hvis variant='eta', ignoreres ellers */
  etaMinutter?: number
}
```

## Layout

```
┌─────────────┐         ┌─────────────────────┐
│ ETA 12 min  │   eller │ På vej til fabrik   │
└─────────────┘         └─────────────────────┘
```

- Wrapper: `inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md`
- Baggrund: `bg-surface-2`
- Tekst: `text-xs text-text-secondary font-inter font-medium`
- Ikon (valgfrit, lucide-react): `Clock` for `eta`, `Truck` for `paa-vej-til-fabrik` — `w-3 h-3 text-text-secondary`

## Visuelle states

### 1. `eta` med `etaMinutter=12`
- Tekst: `ETA 12 min`
- Ikon: `Clock`

### 2. `eta` med `etaMinutter=undefined`
- Fallback: `ETA –` (en-streg)
- Ikon: `Clock`

### 3. `paa-vej-til-fabrik`
- Tekst: `På vej til fabrik`
- Ikon: `Truck`

### 4. `eta` med 0 minutter
- Tekst: `Snart fremme` (i stedet for "ETA 0 min" som virker forvirrende)
- Eller behold som `ETA 0 min` — bekræft i Storybook med stakeholder
- Default i v1: behold `ETA 0 min` for konsistens

## Tokens (ufravigelige)
- Baggrund: `bg-surface-2`
- Tekst: `text-text-secondary`
- Typografi: `font-inter text-xs font-medium`
- Spacing: `px-xs py-xxxs`, `gap-xxxs`
- Radius: `rounded-md`
- Icon size: `w-3 h-3`
- INGEN hardcodede farver eller pixel-størrelser

## Eksisterende komponenter genbrugt
Ingen — atomar UI-komponent.

## Mock-data
Ikke relevant — alle data kommer fra props.

## Storybook stories (minimum)
1. `ETA 12 min`
2. `ETA – (undefined)`
3. `ETA 0 min`
4. `På vej til fabrik`

## Test-cases (skrives senere af test-writer)
- Renderer "ETA 12 min" når `variant='eta'` og `etaMinutter=12`
- Renderer "ETA –" når `variant='eta'` og `etaMinutter` er undefined
- Renderer "På vej til fabrik" når `variant='paa-vej-til-fabrik'`
- `etaMinutter` ignoreres når variant er `paa-vej-til-fabrik`
- Kun token-klasser i className

## Accessibility
- Ren tekst, ingen interaktion → ingen ARIA-roller nødvendige
- Hvis ikon er rent dekorativt: `aria-hidden="true"`

## Acceptance-kriterier
- Props eksporteret som `EtaBadgeProps`
- Ingen `any`-typer
- Kun tokens
- Ingen interaktion — ingen onClick eller fokus-håndtering
- Begge varianter bruger SAMME neutrale `bg-surface-2 text-text-secondary` — adskiller sig kun på tekst og ikon
