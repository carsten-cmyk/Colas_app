# SPEC: TemperaturBadge

## Formål
Vises i "Status / Temp."-kolonnen på ankomne vejesedler i `VejesedlerTable`. Har to tilstande:
1. **Ikke registreret** — viser et inputfelt hvor formand indtaster temperatur i °C
2. **Registreret** — viser målt værdi + en lille status-pill ("OK" grøn eller "Lav" gul) baseret på sammenligning med `minTemperatur`

## Filsti
`apps/formand/src/components/ui/TemperaturBadge.tsx`

## Props

```ts
export interface TemperaturBadgeProps {
  /** Registreret temperatur i °C. `null` = ikke registreret endnu → vis input */
  temperatur: number | null
  /** Minimumstemperatur for OK-status — fra ordre/dag */
  minTemperatur: number
  /** Kald når formand gemmer en ny temperatur (Enter eller blur) */
  onSave: (temperatur: number) => void
  /** Valgfri disable — fx hvis vejeseddel er på vej til fabrik eller undervejs */
  disabled?: boolean
}
```

## Layout

### Tilstand A — ikke registreret (`temperatur === null`)
```
┌─────────────┐
│ [___] °C    │   ← input + enhed
└─────────────┘
```
- Wrapper: `flex items-center gap-xxxs`
- Input: `<input type="number" inputMode="decimal" min={0} max={300}>` — `w-16 px-xs py-xxxs rounded-md border border-hairline bg-surface text-sm text-text-primary font-inter`
- Enhed: `text-xs text-text-muted`
- `min-h-[44px]` på input for touch target

### Tilstand B — registreret (`temperatur !== null`)
```
┌──────────────────────┐
│ 168 °C  [OK]         │
└──────────────────────┘
```
- Wrapper: `flex items-center gap-xxs`
- Værdi: `text-sm font-medium text-text-primary font-inter`
- Pill: lille badge `px-xxs py-xxxs rounded-full text-xxs font-semibold`
  - **OK** (`temperatur >= minTemperatur`): `bg-good-bg text-good`
  - **Lav** (`temperatur < minTemperatur`): `bg-warn-bg text-text-primary` (eller `text-warn` hvis token findes — tjek tailwind.config)
- Klik på værdien åbner inputtet igen til redigering (tilbage til Tilstand A med pre-fyldt værdi)

## Visuelle states

### 1. Tom (`temperatur === null`, ikke disabled)
- Input synlig, placeholder `"–"` eller tomt
- Focus-ring: `focus-visible:ring-2 focus-visible:ring-yellow`

### 2. Tom + disabled
- Input vises som `text-text-muted` "–" tekst (ikke editable)
- Ingen interaktion mulig

### 3. Registreret OK
- Værdi + grøn `OK`-pill

### 4. Registreret Lav
- Værdi + gul `Lav`-pill

### 5. Redigering af eksisterende værdi
- Klik på værdi → input vises med `defaultValue={temperatur}` → blur eller Enter triggerer `onSave`

## Tokens (ufravigelige)
- Baggrund: `bg-surface`, `bg-good-bg`, `bg-warn-bg`
- Tekst: `text-text-primary`, `text-text-muted`, `text-good`
- Border: `border-hairline`
- Typografi: `font-inter text-sm`, `text-xs`, `text-xxs`, `font-medium`, `font-semibold`
- Spacing: `gap-xxs`, `gap-xxxs`, `px-xs`, `px-xxs`, `py-xxxs`
- Radius: `rounded-md` (input), `rounded-full` (pill)
- Width: `w-16` (input — kan justeres) — undgå arbitrære `w-[…px]`
- Touch: `min-h-[44px]` på input

## Eksisterende komponenter genbrugt
Ingen — atomar UI-komponent.

## Mock-data
Ikke relevant — alle data kommer fra props.

## Storybook stories (minimum)
1. `Tom — afventer input`
2. `Registreret OK — 168 °C, min=160 °C`
3. `Registreret Lav — 150 °C, min=160 °C`
4. `Disabled — ingen interaktion`
5. `Redigering — klik på værdi åbner input igen`

## Test-cases (skrives senere af test-writer)
- Renderer input når `temperatur === null`
- Renderer værdi + OK-pill når `temperatur >= minTemperatur`
- Renderer værdi + Lav-pill når `temperatur < minTemperatur`
- `onSave` kaldes med parsed number ved Enter
- `onSave` kaldes ved blur hvis værdi er ændret
- `onSave` kaldes IKKE hvis input er tomt eller NaN
- `disabled=true` skjuler input og blokerer onSave
- Klik på registreret værdi skifter til input-tilstand med præudfyldt værdi

## Accessibility
- `<label>` med synlig eller `aria-label` "Temperatur i grader Celsius"
- `aria-describedby` peger på status-pill når registreret
- `inputMode="decimal"` for korrekt mobil-tastatur
- Pill får `role="status"` så screen reader læser ændring

## Acceptance-kriterier
- Props eksporteret som `TemperaturBadgeProps`
- Ingen `any`-typer
- Kun tokens — ingen hardcodede farver eller størrelser
- Input har `min-h-[44px]` for touch
- Pill-farve afhænger SYMMETRISK af `temperatur < minTemperatur` (Lav) vs. `>= minTemperatur` (OK)
- Skriver retur til PLAN (`plan_vejebilag.temperatur`) — håndteres i parent (`VejeseddelRow` → hook)
