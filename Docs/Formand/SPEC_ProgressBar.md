# SPEC: ProgressBar

## Formål
Generel horisontal progressbar med procent-fill og farve-variant. Bruges i `FremdriftCard`-komponenterne (Tons ankommet, Forventet udlagt, Faktisk udlagt) under Udførelse → Dagens overblik. Skal håndtere både normalprogression (0–100 %) og overskridelse (>100 %).

## Filsti
`apps/formand/src/components/ui/ProgressBar.tsx`

## Props

```ts
export interface ProgressBarProps {
  /** Aktuel værdi i procent — 0–100 ved normal progression, >100 ved overskridelse, <0 ignoreres (clamp til 0) */
  value: number
  /** Farve-variant — styrer fill-farve */
  variant: 'good' | 'warn' | 'bad'
  /** Valgfri label OVER baren — fx "65 t af 90 t" */
  label?: string
  /** Valgfri subtekst UNDER baren — fx "á 1.040 t total" */
  subtekst?: string
  /** Valgfri ARIA label — falder tilbage til label hvis ikke sat */
  ariaLabel?: string
}
```

## Layout

```
[optional label                                 ]
┌──────────────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   ← fill = value%, clamp 0..150 visuelt
└──────────────────────────────────────────────┘
[optional subtekst                              ]
```

- Wrapper: `flex flex-col gap-xxxs w-full`
- Label-row (hvis sat): `text-xs text-text-secondary font-inter`
- Track: `h-2 w-full rounded-full bg-surface-2 overflow-hidden`
- Fill: `h-full rounded-full` + variant-baggrund, bredde sat via inline `style={{ width }}` (eneste tilladte inline-style — genuint runtime-beregnet)
- Subtekst (hvis sat): `text-xxs text-text-muted font-inter`

## Visuelle states

### 1. Normal (0–100 %)
- `width = value%`
- Fill-farve følger `variant`

### 2. Overskridelse (>100 %)
- `width` clampes til `150%` visuelt så fill stadig er synlig som "fyldt+ekstra"
- Track udvides IKKE — fill-elementets `width` viser at det er over
- I praksis: alt over 100 ser "helt fyldt" ud — afvigelse vises i parent-komponent (`FremdriftCard.afvigelse`)
- Variant er typisk `bad` eller `warn` ved overskridelse (parent bestemmer)

### 3. Tom (value = 0 eller undefined)
- Fill er 0 % — kun track synlig
- Ingen ekstra "empty"-tekst — parent håndterer empty-state

### 4. Variant-mapping
| variant | fill-klasse |
|---|---|
| `good` | `bg-good` |
| `warn` | `bg-warn-bg` (gul) — se note nedenfor |
| `bad`  | `bg-bad` |

**Note om `warn`:** Vi har ikke en solid `bg-warn`-token. `bg-warn-bg` er den eksisterende gule baggrund som vi bruger i øvrige warn-states. ALTERNATIV: brug `bg-yellow` hvis stærkere kontrast er nødvendig — tjek `tailwind.config.ts` før build og notér valg i koden.

## Tokens (ufravigelige)
- Track: `bg-surface-2`
- Fill: `bg-good` / `bg-warn-bg` (eller `bg-yellow`) / `bg-bad`
- Tekst: `text-text-secondary`, `text-text-muted`
- Typografi: `font-inter text-xs`, `text-xxs`
- Spacing: `gap-xxxs`
- Radius: `rounded-full`
- Height: `h-2` (8px)
- INGEN hardcodede `bg-[#…]`, `text-[…px]` eller `w-[…px]` — kun `style={{ width }}` med runtime-beregnet procent

## Eksisterende komponenter genbrugt
Ingen — atomar UI-komponent.

## Mock-data
Ikke relevant — alle data kommer fra props.

## Storybook stories (minimum)
1. `Default — good 65%` med label + subtekst
2. `Warn 85%`
3. `Bad 30%` (under target)
4. `Overskridelse — bad 112%`
5. `Tom — value=0`
6. `Uden label/subtekst` (kun bar)

## Test-cases (skrives senere af test-writer)
- Renderer med korrekt fill-bredde ved `value=50`
- Clamper `value=-10` til `0%`
- Clamper `value=200` til visuel `150%` (men `aria-valuenow=200`)
- Variant-prop styrer `bg-good`/`bg-warn-bg`/`bg-bad`-klasse
- `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100` sat korrekt
- Label og subtekst renderes når sat, skjules når undefined

## Accessibility
- `role="progressbar"`
- `aria-valuenow={value}`, `aria-valuemin={0}`, `aria-valuemax={100}` (selv ved overskridelse — vi rapporterer faktisk progress)
- `aria-label` sat fra `ariaLabel` eller `label`
- Ingen klik-interaktion → ingen touch target-krav

## Acceptance-kriterier
- Props-interface eksporteret som `ProgressBarProps`
- Ingen `any`-typer
- Kun tokens — ingen hardcodede farver eller størrelser (undtagen `style={{ width }}` for runtime-procent)
- ARIA-attributter sat
- Variant-prop styrer fill-farve via klasse-mapping
- Renderer i alle 3 varianter + overskridelses-case
