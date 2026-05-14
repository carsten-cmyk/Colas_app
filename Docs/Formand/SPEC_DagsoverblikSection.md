# SPEC: DagsoverblikSection

## Formål
Wrapper-sektion under Udførelses-siden (placeret under Forundersøgelse, over `VejesedlerTable`). Indeholder:
- **Rad 1:** 4 × `<OrdreInfoCard>` (Areal i dag, Produkt, Tykkelse, Tons i dag) — statisk dagsdata
- **Rad 2:** 3 × `<FremdriftCard>` (Tons ankommet, Forventet udlagt, Faktisk udlagt) + `<FremdriftInputRow>` (m²/tons-input + faktisk-tykkelse-beregning)

Holder lokal state for `FremdriftInputRow` (faktisk-input før gem) og delegerer gem-handler op.

## Filsti
`apps/formand/src/components/screens/udfoersel/DagsoverblikSection.tsx`

## Props

```ts
import type { Recept } from './VejeseddelRow'
import type { FremdriftInputRowValues } from './FremdriftInputRow'

export interface FaktiskUdlagt {
  /** Senest gemte m² for dagen */
  m2: number
  /** Senest gemte tons for dagen */
  tons: number
  /** Tidspunkt for seneste gem */
  gemtTidspunkt: string
}

export interface DagsoverblikSectionProps {
  // === Rad 1 — statiske ordreinfo-felter ===
  /** Dagens planlagte areal i m² (beregnet i parent fra tons/dag × 1000 / kg/m²) */
  arealIDag: number
  /** Recept-navn (fx "SMA 11S") + kode (fx "82101H") */
  produkt: { navn: string; kode: string }
  /** Planlagt tykkelse i mm */
  tykkelse: number
  /** Dagens forventede tons */
  tonsIDag: number

  // === Rad 2 — fremdriftsdata ===
  /** Sum af tons fra dagens ankomne vejesedler */
  tonsAnkommet: number
  /** Beregnet m²: tonsAnkommet × 1000 / kg/m² fra recept */
  forventetUdlagtM2: number
  /** Senest gemte faktisk udlagt — null hvis ikke registreret endnu */
  faktiskUdlagt: FaktiskUdlagt | null

  // === Recept (til FremdriftInputRow tykkelses-beregning) ===
  recept: Recept

  // === Ordretotaler (til subtekst) ===
  /** Hele ordrens areal i m² */
  ordreTotalArealM2: number
  /** Hele ordrens tons */
  ordreTotalTons: number

  // === Handler ===
  /** Kald når formand trykker "Gem" i FremdriftInputRow — parent skriver til dagsoverblik_registreringer */
  onGemFaktisk: (values: FremdriftInputRowValues) => void
}
```

## Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Dagens overblik                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Rad 1 — Ordreinfo                                                                    │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│ │ AREAL I DAG │  │ PRODUKT     │  │ TYKKELSE    │  │ TONS I DAG  │                  │
│ │ 5.420 m²    │  │ SMA 11S     │  │ 45 mm       │  │ 312 t       │                  │
│ │ á 31.200 m² │  │ 82101H      │  │             │  │ á 1.040 t   │                  │
│ └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                  │
│                                                                                      │
│ Rad 2 — Fremdrift                                                                    │
│ ┌────────────────┐  ┌────────────────────┐  ┌────────────────┐                      │
│ │ TONS ANKOMMET  │  │ FORVENTET UDLAGT   │  │ FAKTISK UDLAGT │                      │
│ │ 65 t           │  │ 1.420 m²           │  │ 1.408 m²       │                      │
│ │ ████░░░░░ 21%  │  │ ████████░░░ 65%    │  │ ████████░░ 65% │                      │
│ │ á 312 t plan   │  │ beregnet fra t×kg  │  │ senest 14:32   │                      │
│ │                │  │                    │  │ −12 m² (rød)   │                      │
│ └────────────────┘  └────────────────────┘  └────────────────┘                      │
│                                                                                      │
│ ┌──────────────────────────────────────────────────────────────────────────────┐    │
│ │ Faktisk udlagt   [_______] m²   [_______] t          [ Gem ]                 │    │
│ │ Faktisk tykkelse: 45 mm · plan 45 mm · ±0%                                   │    │
│ └──────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

- Wrapper: `flex flex-col gap-md`
- Sektions-titel: `text-base font-semibold text-text-primary font-inter`
- Rad 1: `flex gap-xs flex-wrap` (eller `grid grid-cols-4 gap-xs` ved tilstrækkelig plads — afgøres i build)
- Rad 2 fremdriftskort: `flex gap-xs flex-wrap` (eller `grid grid-cols-3`)
- FremdriftInputRow: fuld bredde under fremdriftskortene, `mt-xs`

## Beregninger og afvigelses-logik

### Tons ankommet — progressbar
```ts
const tonsProgress = (tonsAnkommet / tonsIDag) * 100
// variant: 'good' hvis >=0, ingen warn/bad i v1 — progression er per definition positiv
const tonsVariant: 'good' | 'warn' | 'bad' = 'good'
```

### Forventet udlagt — progressbar
```ts
const forventetProgress = (forventetUdlagtM2 / arealIDag) * 100
const forventetVariant = 'good'
```

### Faktisk udlagt — progressbar + afvigelse
```ts
const faktiskProgress = faktiskUdlagt
  ? (faktiskUdlagt.m2 / arealIDag) * 100
  : 0

// Afvigelse: faktisk - forventet
const afvigelse = faktiskUdlagt
  ? Math.round(faktiskUdlagt.m2 - forventetUdlagtM2)
  : undefined

// Variant: 
//   afvigelse > 0  → 'good' (over forventet)
//   afvigelse < 0  → 'bad'  (under forventet)
//   afvigelse === 0 → 'good' (på plan)
//   null/undefined → 'good' (ikke registreret)
const faktiskVariant: 'good' | 'warn' | 'bad' =
  afvigelse !== undefined && afvigelse < 0 ? 'bad' : 'good'
```

**Vigtigt:** Afvigelses-farve er **symmetrisk på fortegn** — `+` = grøn, `−` = rød. Tærskel: vis kun afvigelse hvis `afvigelse !== 0`. Dette håndteres af `<FremdriftCard>` selv (se SPEC).

## Visuelle states

### 1. Ingen vejesedler endnu
- `tonsAnkommet=0, forventetUdlagtM2=0, faktiskUdlagt=null`
- Rad 1 vises stadig (statisk dagsdata)
- Rad 2: progress=0% på alle, "Faktisk udlagt" viser "–"

### 2. Delvis fremdrift
- `tonsAnkommet`-progress < 100%
- `forventetUdlagtM2`-progress samme
- `faktiskUdlagt=null` → "Faktisk udlagt" viser "–"

### 3. Fuld dag + faktisk registreret
- Alle progressbars omkring 100%
- Faktisk udlagt viser værdi + afvigelse (kan være grøn eller rød)

### 4. Overskridelse på faktisk
- Faktisk udlagt > forventet → afvigelse `+X m²` (grøn)
- Progressbar > 100% — clampes visuelt

## Tokens (ufravigelige)
- Baggrund: `bg-surface` (på hver underkomponent)
- Tekst: `text-text-primary`, `text-text-secondary`
- Typografi: `font-inter text-base font-semibold`
- Spacing: `gap-md`, `gap-xs`, `mt-xs`

## Eksisterende komponenter genbrugt
- `<OrdreInfoCard>` (ui/) × 4
- `<FremdriftCard>` (ui/) × 3
- `<FremdriftInputRow>` (screens/udfoersel/)

## Mock-data

```ts
// TODO: Erstat med Supabase når klar.
const MOCK_DAGSOVERBLIK = {
  arealIDag: 5420,
  produkt: { navn: 'SMA 11S', kode: '82101H' },
  tykkelse: 45,
  tonsIDag: 312,
  tonsAnkommet: 65,
  forventetUdlagtM2: 1420,
  faktiskUdlagt: { m2: 1408, tons: 152.1, gemtTidspunkt: '14:32' } as FaktiskUdlagt | null,
  recept: { kode: '82101H', navn: 'SMA 11S', densitet: 2400, minTemperatur: 160 } as Recept,
  ordreTotalArealM2: 31200,
  ordreTotalTons: 1040,
}
```

## Format-helpers (lokal)
- Tal-formatering bruger dansk locale: `1.408` (punkt som tusindtals-separator)
- `Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 })` for værdier
- Tykkelse vises uden decimaler hvis heltal, ellers 1 decimal (`FremdriftInputRow` håndterer dette internt)

## Storybook stories (minimum)
1. `Default — fuld dag med registreret faktisk`
2. `Ingen vejesedler endnu — alt 0`
3. `Delvis fremdrift — uden faktisk registreret`
4. `Faktisk over forventet — afvigelse grøn`
5. `Faktisk under forventet — afvigelse rød`
6. `Overskridelse — progress >100%`

## Test-cases (skrives senere af test-writer)
- Beregning af `tonsProgress`, `forventetProgress`, `faktiskProgress` korrekt
- Afvigelses-fortegn styrer `faktiskVariant` (`'bad'` ved negativ, `'good'` ellers)
- `faktiskUdlagt=null` → "Faktisk udlagt" viser "–" og progress=0
- `onGemFaktisk` kaldes med korrekte values fra FremdriftInputRow
- Recept-densitet sendes korrekt til FremdriftInputRow
- Ingen hardcoded farver

## Accessibility
- Sektions-titel som `<h2>` eller `<h3>` afhængig af parent-hierarki
- Hver underkomponent bevarer egne ARIA-egenskaber
- `FremdriftInputRow`'s gem-handler annoncerer "Gemt" via `role="status"` på beregnet linje

## Acceptance-kriterier
- Props eksporteret som `DagsoverblikSectionProps` (og `FaktiskUdlagt` for state-type)
- Ingen `any`-typer
- Kun tokens
- Beregninger er rene funktioner (kan ekstraheres til `utils/dagsoverblik.ts` ved cleanup)
- Symmetrisk afvigelses-farve (`+` = grøn, `−` = rød) håndhæves via `FremdriftCard`-prop
- Cross-app data: `onGemFaktisk` triggerer skrivning til `dagsoverblik_registreringer` — håndteres af parent/hook
