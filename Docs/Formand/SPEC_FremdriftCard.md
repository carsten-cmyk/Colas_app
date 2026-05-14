# SPEC: FremdriftCard

## Formål
Ét af de 3 fremdrifts-kort i Rad 2 af `DagsoverblikSection` (Tons ankommet, Forventet udlagt, Faktisk udlagt). Indeholder: label + stor værdi + `ProgressBar` + undertekst + valgfri afvigelses-tekst med symmetrisk fortegns-baseret farve.

## Filsti
`apps/formand/src/components/ui/FremdriftCard.tsx`

## Props

```ts
import type { ProgressBarProps } from './ProgressBar'

export interface FremdriftCardProps {
  /** Hvilken af de 3 varianter — styrer hvor afvigelse vises og default progress-variant */
  variant: 'tons-ankommet' | 'forventet-udlagt' | 'faktisk-udlagt'
  /** Uppercase-label — fx "TONS ANKOMMET" */
  label: string
  /** Hoved-værdi som string ("65", "1.420", "–") */
  value: string
  /** Enhed efter value — fx "t", "m²" */
  unit: string
  /** Undertekst under progressbaren — fx "á 312 t dagens plan" eller "beregnet fra tons × kg/m²" */
  subtekst: string
  /** Progress 0–100+ — overskridelse er tilladt */
  progress: number
  /** Farve-variant for progressbar */
  progressVariant: ProgressBarProps['variant']
  /**
   * Afvigelse i samme enhed som value — kun vises hvis variant='faktisk-udlagt' OG afvigelse !== 0.
   * Positiv (+) = over forventet → grøn (`text-good`)
   * Negativ (−) = under forventet → rød (`text-bad`)
   * 0 → vises IKKE (no-op)
   */
  afvigelse?: number
  /** Valgfri ARIA label */
  ariaLabel?: string
}
```

## Layout

```
┌─────────────────────────────────────────┐
│ TONS ANKOMMET                           │   ← label
│                                         │
│ 65 t                                    │   ← value + unit (stor)
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │   ← <ProgressBar>
│ á 312 t dagens plan                     │   ← subtekst (lille, muted)
│ −12 m² i forhold til forventet          │   ← afvigelse (kun faktisk-udlagt, hvis !== 0)
└─────────────────────────────────────────┘
```

- Wrapper: `flex flex-col gap-xxs items-stretch min-w-[200px] px-sm py-sm rounded-xl border border-hairline bg-surface`
- Label: `text-xxs font-semibold tracking-wider uppercase text-text-secondary font-inter`
- Value-row: `flex items-baseline gap-xxs`
  - Value: `text-2xl font-semibold text-text-primary font-inter`
  - Unit: `text-sm text-text-secondary font-inter`
- ProgressBar: tager `value={progress}` og `variant={progressVariant}` — INGEN label/subtekst på baren selv (vi laver det i kortet)
- Subtekst: `text-xs text-text-muted font-inter`
- Afvigelse: `text-xs font-medium font-inter` + symmetrisk farve

## Afvigelses-regler (kun `variant='faktisk-udlagt'`)

| afvigelse | Visning | Farve-klasse |
|---|---|---|
| `> 0` | `+{afvigelse} m²` (eller relevant unit) — fx "+12 m²" | `text-good` |
| `< 0` | `−{Math.abs(afvigelse)} m²` — fx "−12 m²" (BEMÆRK: minus-tegn `−` U+2212, ikke bindestreg) | `text-bad` |
| `0` eller `undefined` | Skjult — ingen DOM-output | — |

**Symmetrisk farve**: Farven baseres KUN på fortegnet, ikke på absolut afvigelses-størrelse. Ingen tærskler.

For `variant='tons-ankommet'` og `variant='forventet-udlagt'`: `afvigelse`-prop ignoreres (kan accepteres for symmetrisk API, men har ingen visuel effekt).

## Visuelle states

### 1. Tons ankommet — normal
- Value: `65 t`
- ProgressBar: 21% good (eller warn ved lav fremdrift)
- Subtekst: "á 312 t dagens plan"
- Ingen afvigelse

### 2. Forventet udlagt — beregnet
- Value: `1.420 m²`
- ProgressBar: 65% good
- Subtekst: "beregnet fra tons × kg/m²"
- Ingen afvigelse

### 3. Faktisk udlagt — endnu ikke registreret
- Value: `–`
- ProgressBar: 0%
- Subtekst: "ikke registreret endnu"
- Afvigelse: skjult

### 4. Faktisk udlagt — over forventet
- Value: `1.432 m²`
- ProgressBar: 67% good
- Afvigelse: `+12 m² i forhold til forventet` → `text-good`

### 5. Faktisk udlagt — under forventet
- Value: `1.408 m²`
- ProgressBar: 65% bad (parent vælger variant)
- Afvigelse: `−12 m² i forhold til forventet` → `text-bad`

### 6. Faktisk udlagt — overskridelse
- Value: `3.500 m²`
- ProgressBar: 112% bad/warn (parent vælger)
- Afvigelse: `+1.000 m²` → `text-good` (selvom det er overskridelse, fortegnet er +)

## Tokens (ufravigelige)
- Baggrund: `bg-surface`
- Border: `border-hairline`
- Tekst: `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-good`, `text-bad`
- Typografi: `font-inter`, `text-xxs`, `text-xs`, `text-sm`, `text-2xl`, `font-semibold`, `font-medium`, `tracking-wider`, `uppercase`
- Spacing: `gap-xxs`, `gap-xxxs`, `px-sm`, `py-sm`
- Radius: `rounded-xl`
- Min-width: `min-w-[200px]` (lidt bredere end OrdreInfoCard for at give plads til progressbar)

## Eksisterende komponenter genbrugt
- `<ProgressBar>` (ui/) — se separat SPEC

## Mock-data
Ikke relevant — alle data kommer fra props. Eksempel-usage:

```tsx
<FremdriftCard
  variant="tons-ankommet"
  label="TONS ANKOMMET"
  value="65"
  unit="t"
  subtekst="á 312 t dagens plan"
  progress={21}
  progressVariant="good"
/>

<FremdriftCard
  variant="faktisk-udlagt"
  label="FAKTISK UDLAGT"
  value="1.408"
  unit="m²"
  subtekst="senest gemt 14:32"
  progress={65}
  progressVariant="bad"
  afvigelse={-12}
/>
```

## Storybook stories (minimum)
1. `Tons ankommet — normal progression`
2. `Forventet udlagt — beregnet`
3. `Faktisk udlagt — endnu ikke registreret (value="–")`
4. `Faktisk udlagt — afvigelse +12 m² (grøn)`
5. `Faktisk udlagt — afvigelse −12 m² (rød)`
6. `Faktisk udlagt — afvigelse 0 (skjult)`
7. `Overskridelse — 112% progress`

## Test-cases (skrives senere af test-writer)
- Renderer label, value, unit, subtekst
- Bruger `ProgressBar` med korrekt `value` og `variant`
- Viser afvigelse `+12 m²` med `text-good` ved positivt fortegn
- Viser afvigelse `−12 m²` med `text-bad` ved negativt fortegn (med U+2212 minus-tegn)
- Skjuler afvigelse når `afvigelse===0` eller undefined
- Skjuler afvigelse for `variant='tons-ankommet'` og `variant='forventet-udlagt'` selv hvis sat
- Ingen hardcodede farver i className

## Accessibility
- `aria-label` på wrapper hvis ikke struktureret tilgængelig
- Afvigelse renderet som tekst — screen reader læser "+12 m²" / "−12 m²" naturligt
- ProgressBar bevarer sine ARIA-attributter (se ProgressBar SPEC)

## Acceptance-kriterier
- Props eksporteret som `FremdriftCardProps`
- Ingen `any`-typer
- Kun tokens — ingen hardcodede farver
- Afvigelses-fortegn styrer farve SYMMETRISK (`+` = `text-good`, `−` = `text-bad`)
- Afvigelse skjules ved `0` eller `undefined`
- Afvigelse vises KUN for `variant='faktisk-udlagt'`
- Minus-tegn er U+2212 (`−`), ikke bindestreg (`-`)
