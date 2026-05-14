# SPEC: VejeseddelRow

> **Opdateret 2026-05-14**: Feltnavne følger eksisterende prototype-konvention
> (`anlaegsNr` ikke `materielNr`, `udlaeggerliste` ikke `materielListe`). Typen `UdlaeggerEnhed` lever i `src/types/udlaegger.ts`.

> **Type-kilde**: `Vejeseddel` og `Recept` er defineret i `apps/formand/src/types/order.ts`.
> Se den fil for autoritativ feltliste.

## Formål
Én tabel-række i `VejesedlerTable` der repræsenterer ét læs (ankommet, undervejs eller på vej til fabrik). Tager `Vejeseddel`-objekt + relateret data og delegerer status-/temp-kolonnen til den rigtige sub-komponent baseret på `vejeseddel.status`:
- `'ankommet'` → `<TemperaturBadge>` + `<UdlaeggerDropdown>` (aktiv)
- `'undervejs'` → `<EtaBadge variant="eta">` + `<UdlaeggerDropdown disabled>`
- `'paa-vej-til-fabrik'` → `<EtaBadge variant="paa-vej-til-fabrik">` + `<UdlaeggerDropdown disabled>`

## Filsti
`apps/formand/src/components/screens/udfoersel/VejeseddelRow.tsx`

## Props

```ts
import type { UdlaeggerEnhed } from '../../ui/UdlaeggerDropdown'

export interface Vejeseddel {
  /** Vejeseddel-id i Colas/PLAN */
  id: string
  /** Vejeseddelnummer fra PLAN — null hvis ikke modtaget endnu */
  vejeseddelNr: string | null
  /** Bilens registreringsnummer */
  regnr: string
  /** Chauffør-navn fra vognmandsmodul */
  chauffoerNavn: string
  /** Receptkode fra vejeseddel — bruges til opslag */
  receptkode: string | null
  /** Fabrik-id — opslag mod fabriksstamdata */
  fabrikId: string | null
  /** Fabriksnavn — typisk præ-løst af parent fra fabrikId */
  fabrikNavn: string | null
  /** Tons fra vejeseddel — null hvis ikke modtaget */
  tons: number | null
  /** Tidspunkt vejeseddel blev modtaget i Colas */
  modtagetTidspunkt: string | null
  /** Eksplicit status — kanonisk på Vejeseddel-typen */
  status: 'ankommet' | 'undervejs' | 'paa-vej-til-fabrik'
  /** Registreret temperatur i °C — null hvis ikke registreret. Skrives retur til plan_vejebilag.temperatur */
  temperatur: number | null
  /** Valgt udlægger materielNr — null hvis ikke valgt */
  valgtUdlaeggerMateriel: string | null
  /** ETA i minutter — kun relevant ved status='undervejs' */
  etaMinutter: number | null
}

export interface Recept {
  /** Receptkode — fx "82101H" */
  kode: string
  /** Receptnavn — fx "SMA 11S" */
  navn: string
  /** Densitet i kg/m³ — fx 2400 */
  densitet: number
  /** Minimumstemperatur i °C for OK-status */
  minTemperatur: number
}

export interface VejeseddelRowProps {
  /** Selve vejeseddel-rækken */
  vejeseddel: Vejeseddel
  /** Recept opslået på vejeseddel.receptkode (præ-løst af parent) */
  recept?: Recept
  /** Minimumstemperatur for ordre/dag — overrider recept.minTemperatur hvis sat */
  minTemperatur: number
  /** Udlægger-liste fra ordren — filtreres til udlæggere (prefix "9-") i UdlaeggerDropdown */
  udlaeggerliste: UdlaeggerEnhed[]
  /** Kald når formand gemmer en temperatur — parent skriver til plan_vejebilag.temperatur */
  onTemperatur: (vejeseddelId: string, temperatur: number) => void
  /** Kald når formand vælger udlægger */
  onUdlaegger: (vejeseddelId: string, anlaegsNr: string) => void
}
```

## Layout

Render som `<tr>` med 7 `<td>`-celler (matcher header i `VejesedlerTable`):

```
| Vejeseddel | Nummerplade | Chauffør   | Produkt   | Fabrik       | Tons | Udlægger | Status/Temp     |
|------------|-------------|------------|-----------|--------------|------|----------|-----------------|
| 25-1003-A  | AB 12 345   | Morten L.  | SMA 11S   | Aarhus Asfalt| 24.2 | 9-0009 ▾ | 168 °C [OK]     |
| —          | CD 67 890   | Søren K.   | —         | Aarhus Asfalt| —    | (disabled)| ETA 12 min     |
| —          | EF 11 223   | Lars H.    | —         | Aarhus Asfalt| —    | (disabled)| På vej til fab. |
```

- Celler: `px-xs py-xs text-sm text-text-primary font-inter`
- Tomme værdier vises som en-streg `"–"` i `text-text-muted`
- Række-hover: `hover:bg-surface-2`
- Border mellem rækker: `border-b border-hairline`

## Status/Temp-kolonne-delegation

```ts
switch (vejeseddel.status) {
  case 'ankommet':
    return (
      <TemperaturBadge
        temperatur={vejeseddel.temperatur}
        minTemperatur={minTemperatur}
        onSave={(temp) => onTemperatur(vejeseddel.id, temp)}
      />
    )
  case 'undervejs':
    return <EtaBadge variant="eta" etaMinutter={vejeseddel.etaMinutter ?? undefined} />
  case 'paa-vej-til-fabrik':
    return <EtaBadge variant="paa-vej-til-fabrik" />
}
```

## Udlægger-kolonne-delegation

```tsx
<UdlaeggerDropdown
  udlaeggerliste={udlaeggerliste}
  selected={vejeseddel.valgtUdlaeggerMateriel}
  onChange={(anlaegsNr) => onUdlaegger(vejeseddel.id, anlaegsNr)}
  disabled={vejeseddel.status !== 'ankommet'}
/>
```

## Produkt-kolonne

- Hvis `recept` er sat: vis `recept.navn` (fx "SMA 11S")
- Hvis `recept` undefined men `vejeseddel.receptkode` sat: vis `receptkode` som fallback i `text-text-muted`
- Hvis begge null: vis `"–"`

## Visuelle states

### 1. Ankommet — fuldt registreret
- Alle celler udfyldt, temperatur registreret
- Udlægger valgt eller dropdown aktiv

### 2. Ankommet — temperatur mangler
- Temperatur-cellen viser inputfelt
- Udlægger-dropdown er aktiv

### 3. Undervejs
- Vejeseddelnr, Produkt, Tons = `–`
- Status/Temp viser `<EtaBadge variant="eta">`
- Udlægger-dropdown disabled

### 4. På vej til fabrik
- Vejeseddelnr, Produkt, Tons = `–`
- Status/Temp viser `<EtaBadge variant="paa-vej-til-fabrik">`
- Udlægger-dropdown disabled

### 5. Manglende recept-opslag
- Produkt viser receptkode i `text-text-muted` som fallback

## Tokens (ufravigelige)
- Tekst: `text-text-primary`, `text-text-muted`
- Baggrund: `hover:bg-surface-2`
- Border: `border-hairline`
- Typografi: `font-inter text-sm`
- Spacing: `px-xs py-xs`

## Eksisterende komponenter genbrugt
- `<TemperaturBadge>` (ui/) — separat SPEC
- `<EtaBadge>` (ui/) — separat SPEC
- `<UdlaeggerDropdown>` (ui/) — separat SPEC

## Datakilder (forretningsmæssigt)

| Felt | Kilde | Status i v1 |
|---|---|---|
| `vejeseddelNr`, `tons`, `receptkode`, `fabrikId` | PLAN (10 min forsinkelse) | Mock |
| `regnr`, `chauffoerNavn` | Vognmandsmodul (disponering) | Mock |
| `status`, `etaMinutter` | Chauffør-app GPS (hooket beregner) | Mock |
| `temperatur` | Formand manuel registrering — skrives RETUR til `plan_vejebilag.temperatur` | Mock |
| `valgtUdlaeggerMateriel` | Formand manuel — gemmes på vejeseddel-rækken i Colas | Mock |

## Mock-data

```ts
// TODO: Erstat med Supabase når klar.
const MOCK_VEJESEDDEL: Vejeseddel = {
  id: 'v-1',
  vejeseddelNr: '25-1003-A',
  regnr: 'AB 12 345',
  chauffoerNavn: 'Morten Lund',
  receptkode: '82101H',
  fabrikId: 'fab-001',
  fabrikNavn: 'Aarhus Asfalt',
  tons: 24.2,
  modtagetTidspunkt: '2026-05-14T14:21:00Z',
  status: 'ankommet',
  temperatur: 168,
  valgtUdlaeggerMateriel: '9-0009',
  etaMinutter: null,
}
```

## Storybook stories (minimum)
1. `Ankommet — fuldt registreret`
2. `Ankommet — temperatur mangler`
3. `Ankommet — temperatur for lav`
4. `Undervejs — ETA 12 min`
5. `På vej til fabrik`
6. `Manglende recept-opslag`

## Test-cases (skrives senere af test-writer)
- Renderer korrekt sub-komponent baseret på `status`
- Udlægger-dropdown er disabled når `status !== 'ankommet'`
- Produkt viser `recept.navn` når recept findes
- Produkt viser receptkode i muted-farve når recept mangler
- Tomme værdier vises som `"–"`
- `onTemperatur` kaldes med `(vejeseddelId, temperatur)`
- `onUdlaegger` kaldes med `(vejeseddelId, anlaegsNr)`
- ARIA-roller bevares på sub-komponenter

## Accessibility
- `<tr>` med rolle bevaret fra tabel-kontekst
- Celler bruger semantiske `<td>` — ingen `role="cell"` manuelt
- Sub-komponenter bevarer egne ARIA-egenskaber

## Acceptance-kriterier
- Props eksporteret som `VejeseddelRowProps`
- `Vejeseddel` og `Recept` typer lever autoritativt i `apps/formand/src/types/order.ts` — importer derfra
- Ingen `any`-typer
- Kun tokens
- `status`-feltet er KILDEN til hvilken sub-komponent der renderes — IKKE en kombination af flags
- Temperatur skrives retur til PLAN via `onTemperatur` → parent → hook → `plan_vejebilag.temperatur` (se FUNCTIONAL_FLOWS Flow 9)
