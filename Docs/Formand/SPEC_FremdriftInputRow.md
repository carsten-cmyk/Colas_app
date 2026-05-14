# SPEC: FremdriftInputRow

## Formål
Input-linjen under de 3 `FremdriftCard`-bokse i `DagsoverblikSection`. Lader formanden indtaste **faktisk udlagt m²** og **faktisk udlagte tons** for dagen, gemmer ved tryk på "Gem"-knap, og viser en beregnet **faktisk tykkelse** med sammenligning til planlagt tykkelse.

Formel for faktisk tykkelse (mm):
```
tykkelse_mm = tons × 1_000_000 / (m² × densitet_kg_per_m3)
```

Hvor `densitet_kg_per_m3` kommer fra `Recept.densitet` (heltal, fx 2400 for SMA 11S).

## Filsti
`apps/formand/src/components/screens/udfoersel/FremdriftInputRow.tsx`

## Props

```ts
export interface FremdriftInputRowValues {
  /** Faktisk udlagt m² */
  faktiskM2: number
  /** Faktisk udlagte tons */
  faktiskTons: number
}

export interface FremdriftInputRowProps {
  /** Densitet i kg/m³ fra recept — fx 2400 */
  densitet: number
  /** Planlagt tykkelse i mm fra ordre — bruges til ±%-sammenligning */
  planTykkelse: number
  /** Initiale værdier — fx senest gemte registrering */
  initial?: FremdriftInputRowValues
  /** Kald når formand trykker "Gem" — sender begge værdier */
  onSave: (values: FremdriftInputRowValues) => void
  /** Valgfri disable — fx hvis dagen er afsluttet */
  disabled?: boolean
}
```

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Faktisk udlagt     [_______] m²    [_______] t        [ Gem ]            │
│ Faktisk tykkelse: 45 mm · plan 45 mm · ±0%                               │
└──────────────────────────────────────────────────────────────────────────┘
```

- Wrapper: `flex flex-col gap-xs px-sm py-sm rounded-xl border border-hairline bg-surface`
- Input-row: `flex items-end gap-sm flex-wrap`
  - Label "Faktisk udlagt": `text-xs text-text-secondary font-inter` (kan udelades for kompakt design — afgøres i Storybook)
  - Hvert input-felt:
    - `<label>` over inputtet: `text-xxs text-text-muted uppercase tracking-wider font-inter`
    - `<input type="number" inputMode="decimal" min={0}>` — `w-24 px-xs py-xxxs rounded-md border border-hairline bg-surface text-sm text-text-primary font-inter min-h-[44px]`
    - Enhed efter input: `text-xs text-text-secondary`
  - Gem-knap: `<button>` — `px-sm py-xs rounded-lg bg-yellow text-text-primary font-semibold text-sm font-inter min-h-[44px] hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed`
- Beregnet linje: `text-xs text-text-secondary font-inter` (placeret UNDER input-rækken)

## Beregning

Når både `faktiskM2 > 0` og `faktiskTons > 0`:

```ts
const tykkelse = (faktiskTons * 1_000_000) / (faktiskM2 * densitet)
// → mm, decimaltal
const afvigelsePct = ((tykkelse - planTykkelse) / planTykkelse) * 100
// → % afvigelse fra plan, kan være negativ
```

**Vises som:**
```
Faktisk tykkelse: 45 mm · plan 45 mm · ±0%
Faktisk tykkelse: 47 mm · plan 45 mm · +4.4%
Faktisk tykkelse: 42 mm · plan 45 mm · −6.7%
```

- Tykkelse formatteres med 1 decimal hvis ikke heltal (`tykkelse.toFixed(1)`) — afgør endeligt i build
- Afvigelses-procent formatteres med 1 decimal og fortegn (`+` eller `−` U+2212)
- Hvis input mangler eller er 0: vis `Faktisk tykkelse: –` (ingen plan-sammenligning)

**Farve på beregnet linje:**
- Inden for ±5%: `text-text-secondary` (neutral)
- Mere end ±5%: `text-warn` eller `text-bad` (afgør efter UX-review — default `text-text-secondary` i v1, parent kan ikke override endnu)

## Visuelle states

### 1. Default — ingen initial værdi
- Begge inputs tomme
- Gem-knap disabled (begge inputs skal være > 0)
- Beregnet linje: `Faktisk tykkelse: –`

### 2. Initial værdi sat
- Inputs præudfyldt fra `initial`
- Gem-knap aktiv hvis værdier er gyldige
- Beregnet linje viser sammenligning med plan

### 3. Bruger redigerer
- Live-update af beregnet linje når begge inputs er gyldige
- Gem-knap aktiv

### 4. Efter gem
- `onSave` kaldt, knap kan kort vise `Gemt ✓` state (valgfrit — afgør i build)
- Inputs bevarer værdier — kan redigeres igen

### 5. Disabled
- Inputs og knap disabled
- Beregnet linje vises stadig hvis værdier eksisterer

### 6. Ugyldig input (negativ, 0, NaN)
- Gem-knap disabled
- Beregnet linje: `Faktisk tykkelse: –`
- Ingen fejl-banner i v1 — UI gør det "blødt" ved at disable knappen

## Tokens (ufravigelige)
- Baggrund: `bg-surface`, `bg-yellow` (CTA)
- Border: `border-hairline`
- Tekst: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Typografi: `font-inter`, `text-xxs`, `text-xs`, `text-sm`, `font-semibold`, `tracking-wider`, `uppercase`
- Spacing: `gap-xxs`, `gap-xs`, `gap-sm`, `px-xs`, `py-xxxs`, `px-sm`, `py-xs`, `py-sm`
- Radius: `rounded-md`, `rounded-lg`, `rounded-xl`
- Width: `w-24` (input-felter)
- Touch: `min-h-[44px]` på inputs og knap
- CTA-mønster: `bg-yellow text-text-primary font-semibold` — matcher eksisterende godkend-knapper

## Eksisterende komponenter genbrugt
Ingen — screen-komponent. Bygges fra native `<input>` + `<button>`.

**Note:** Hvis vi senere har en fælles `Button`-komponent, refaktoreres CTA-knappen. I v1 bygges den direkte.

## Mock-data
Ikke relevant — alle data kommer fra props. Eksempel-usage:

```tsx
// TODO: Erstat med Supabase når klar — gem til dagsoverblik_registreringer
<FremdriftInputRow
  densitet={2400}
  planTykkelse={45}
  initial={{ faktiskM2: 1408, faktiskTons: 152.1 }}
  onSave={(values) => saveFaktisk(values)}
/>
```

## Storybook stories (minimum)
1. `Default — tom`
2. `Med initial værdi — matcher plan`
3. `Med initial værdi — under plan`
4. `Med initial værdi — over plan`
5. `Disabled`
6. `Live-beregning — bruger redigerer`

## Test-cases (skrives senere af test-writer)
- Formel: `tons=152.1, m²=1408, densitet=2400` → tykkelse ≈ 45.0 mm
- Formel: `tons=160, m²=1408, densitet=2400` → tykkelse ≈ 47.3 mm
- Procent-afvigelse korrekt beregnet
- Minus-tegn er U+2212
- Gem-knap disabled hvis input er tomt, 0 eller negativt
- Gem-knap kalder `onSave` med korrekte parsed numbers
- Live-update af beregnet linje ved input-ændring
- `initial`-prop præudfylder inputs
- `disabled=true` blokerer alt
- Beregnet linje skjules/viser "–" hvis ugyldig input

## Accessibility
- Begge inputs har `<label>` (synlig eller `aria-label`)
- Gem-knap har klar tekst eller `aria-label`
- `inputMode="decimal"` for korrekt mobil-tastatur
- `min-h-[44px]` for touch på inputs og knap
- Beregnet linje får `role="status"` så screen reader læser live-ændringer

## Acceptance-kriterier
- Props eksporteret som `FremdriftInputRowProps` (og `FremdriftInputRowValues` for `onSave`-payload)
- Ingen `any`-typer
- Kun tokens — ingen hardcodede farver eller spacing (undtagen `w-24` for inputs)
- CTA-knap bruger `bg-yellow text-text-primary` mønstret
- `min-h-[44px]` på alle interaktive elementer
- Formel bruger densitet i **kg/m³** (heltal) og giver tykkelse i **mm**
- Minus-tegn i procent-afvigelse er U+2212
- Skriver til `dagsoverblik_registreringer` (Supabase senere) via `onSave` — parent håndterer persistens
