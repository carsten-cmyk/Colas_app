# SPEC: VejesedlerTable

> **Opdateret 2026-05-14**: Feltnavne følger eksisterende prototype-konvention
> (`anlaegsNr` ikke `materielNr`, `udlaeggerliste` ikke `materielListe`). Typen `UdlaeggerEnhed` lever i `src/types/udlaegger.ts`.

## Formål
Tabel-container der viser alle læs tilknyttet dagens ordre som én samlet pipeline — ankomne, undervejs og på vej til fabrik. Sorterer rækker efter status og tid, og delegerer hver række til `<VejeseddelRow>`. Håndterer header-rækken og empty-state.

## Filsti
`apps/formand/src/components/screens/udfoersel/VejesedlerTable.tsx`

## Props

```ts
import type { Vejeseddel, Recept } from './VejeseddelRow'
import type { UdlaeggerEnhed } from '../../ui/UdlaeggerDropdown'

export interface VejesedlerTableProps {
  /** Alle vejesedler for dagens ordre — sorteres internt */
  vejesedler: Vejeseddel[]
  /** Recept-opslag pr. receptkode — parent leverer pre-løst map */
  recepter: Record<string, Recept>
  /** Minimumstemperatur for dagen — bruges af TemperaturBadge for OK/Lav */
  minTemperatur: number
  /** Udlægger-liste på ordren — sendes ned til UdlaeggerDropdown (filtreres på prefix "9-") */
  udlaeggerliste: UdlaeggerEnhed[]
  /** Bobles op fra VejeseddelRow → TemperaturBadge */
  onTemperatur: (vejeseddelId: string, temperatur: number) => void
  /** Bobles op fra VejeseddelRow → UdlaeggerDropdown */
  onUdlaegger: (vejeseddelId: string, materielNr: string) => void
}
```

## Layout

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ Vejesedler og indkomne tons                                                            │
├──────────────┬────────────┬──────────┬─────────┬──────────────┬──────┬──────────┬────┤
│ VEJESEDDEL   │ NUMMERPLADE│ CHAUFFØR │ PRODUKT │ FABRIK       │ TONS │ UDLÆGGER │ … │
├──────────────┼────────────┼──────────┼─────────┼──────────────┼──────┼──────────┼────┤
│ 25-1003-A    │ AB 12 345  │ Morten L.│ SMA 11S │ Aarhus Asfalt│ 24.2 │ 9-0009 ▾ │ … │
│ 25-1002-A    │ CD 67 890  │ Søren K. │ SMA 11S │ Aarhus Asfalt│ 24.0 │ 9-0009 ▾ │ … │
│ —            │ EF 11 223  │ Lars H.  │ —       │ Aarhus Asfalt│ —    │ disabled │ … │
│ —            │ GH 33 222  │ Mette F. │ —       │ Aarhus Asfalt│ —    │ disabled │ … │
└──────────────┴────────────┴──────────┴─────────┴──────────────┴──────┴──────────┴────┘
```

- Wrapper: `flex flex-col gap-xs rounded-xl border border-hairline bg-surface overflow-hidden`
- Sektions-titel (over tabel): `text-base font-semibold text-text-primary font-inter px-sm pt-sm`
- Tabel: `<table>` med `w-full border-collapse text-sm font-inter`
- Header-row (`<thead>`):
  - `<th>` celler: `text-xxs font-semibold tracking-wider uppercase text-text-secondary px-xs py-xs text-left`
  - Bottom border: `border-b border-hairline`
- Body (`<tbody>`):
  - Rækker fra `<VejeseddelRow>` — se sortering nedenfor
  - Hver række: `border-b border-hairline`

## Sortering

Internt i komponenten (ren funktion, test-bar):

```ts
function sorterVejesedler(vs: Vejeseddel[]): Vejeseddel[] {
  const ankomne = vs
    .filter(v => v.status === 'ankommet')
    .sort((a, b) => {
      // Nyeste modtaget øverst (DESC)
      const ta = a.modtagetTidspunkt ? new Date(a.modtagetTidspunkt).getTime() : 0
      const tb = b.modtagetTidspunkt ? new Date(b.modtagetTidspunkt).getTime() : 0
      return tb - ta
    })
  const undervejs = vs.filter(v => v.status === 'undervejs')
  // Valgfri: sortér undervejs efter ETA (kortest ETA øverst)
  undervejs.sort((a, b) => (a.etaMinutter ?? Infinity) - (b.etaMinutter ?? Infinity))
  const paaVej = vs.filter(v => v.status === 'paa-vej-til-fabrik')

  return [...ankomne, ...undervejs, ...paaVej]
}
```

**Forretningsregel:**
1. Ankomne — sorteret nyeste-først på `modtagetTidspunkt` (DESC)
2. Undervejs — sorteret efter `etaMinutter` ASC (kortest ETA øverst)
3. På vej til fabrik — original rækkefølge

## Header-kolonner

| # | Label | Kilde |
|---|---|---|
| 1 | VEJESEDDEL | `vejeseddel.vejeseddelNr` |
| 2 | NUMMERPLADE | `vejeseddel.regnr` |
| 3 | CHAUFFØR | `vejeseddel.chauffoerNavn` |
| 4 | PRODUKT | `recepter[vejeseddel.receptkode].navn` |
| 5 | FABRIK | `vejeseddel.fabrikNavn` |
| 6 | TONS | `vejeseddel.tons` |
| 7 | UDLÆGGER | `<UdlaeggerDropdown>` |
| 8 | STATUS / TEMP. | `<TemperaturBadge>` eller `<EtaBadge>` |

## Visuelle states

### 1. Normal — mange rækker
- Header + sorterede rækker (ankomne → undervejs → på vej til fabrik)

### 2. Empty — ingen vejesedler endnu
- Tabel renderes IKKE
- Vis empty-state-blok: `<div>` med `px-sm py-md text-center`
- Tekst: `"Ingen vejesedler endnu i dag"` i `text-text-muted text-sm font-inter`
- Sub-tekst (valgfri): `"Læs ankommer automatisk fra PLAN — typisk 10 min forsinkelse"` i `text-text-muted text-xs`

### 3. Kun ankomne (ingen undervejs/paa-vej)
- Render normalt — ingen separator nødvendig

### 4. Blandet status med visuel separator (valgfri v1)
- INGEN separator mellem statusgrupper i v1 — sortering gør gruppering tydelig
- TODO i koden: overvej separator-rækker i v2

## Tokens (ufravigelige)
- Baggrund: `bg-surface`
- Border: `border-hairline`
- Tekst: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Typografi: `font-inter`, `text-xxs`, `text-xs`, `text-sm`, `text-base`, `font-semibold`, `tracking-wider`, `uppercase`
- Spacing: `gap-xs`, `px-sm`, `pt-sm`, `py-md`, `px-xs`, `py-xs`
- Radius: `rounded-xl`

## Eksisterende komponenter genbrugt
- `<VejeseddelRow>` (screens/udfoersel/) — separat SPEC

## Datakilder (forretningsmæssigt)

Se datatabel i `SPEC_VejeseddelRow.md` — samme kilder.

## Mock-data

```ts
// TODO: Erstat med Supabase når klar — vejesedler fra PLAN + recept-opslag
const MOCK_VEJESEDLER: Vejeseddel[] = [
  { id: 'v-1', vejeseddelNr: '25-1003-A', regnr: 'AB 12 345', chauffoerNavn: 'Morten Lund',
    receptkode: '82101H', fabrikId: 'fab-001', fabrikNavn: 'Aarhus Asfalt', tons: 24.2,
    modtagetTidspunkt: '2026-05-14T14:21:00Z', status: 'ankommet',
    temperatur: 168, valgtUdlaeggerMateriel: '9-0009', etaMinutter: null },
  { id: 'v-2', vejeseddelNr: '25-1002-A', regnr: 'CD 67 890', chauffoerNavn: 'Søren Karlsen',
    receptkode: '82101H', fabrikId: 'fab-001', fabrikNavn: 'Aarhus Asfalt', tons: 24.0,
    modtagetTidspunkt: '2026-05-14T13:42:00Z', status: 'ankommet',
    temperatur: null, valgtUdlaeggerMateriel: null, etaMinutter: null },
  { id: 'v-3', vejeseddelNr: null, regnr: 'EF 11 223', chauffoerNavn: 'Lars Holm',
    receptkode: null, fabrikId: null, fabrikNavn: 'Aarhus Asfalt', tons: null,
    modtagetTidspunkt: null, status: 'undervejs',
    temperatur: null, valgtUdlaeggerMateriel: null, etaMinutter: 12 },
  { id: 'v-4', vejeseddelNr: null, regnr: 'GH 33 222', chauffoerNavn: 'Mette Fog',
    receptkode: null, fabrikId: null, fabrikNavn: 'Aarhus Asfalt', tons: null,
    modtagetTidspunkt: null, status: 'paa-vej-til-fabrik',
    temperatur: null, valgtUdlaeggerMateriel: null, etaMinutter: null },
]

const MOCK_RECEPTER: Record<string, Recept> = {
  '82101H': { kode: '82101H', navn: 'SMA 11S', densitet: 2400, minTemperatur: 160 },
}
```

## Storybook stories (minimum)
1. `Default — 4 rækker blandet status`
2. `Kun ankomne — 3 læs`
3. `Empty — ingen vejesedler`
4. `Mange rækker — scrollable`
5. `Ankommet uden temperatur (input synligt)`

## Test-cases (skrives senere af test-writer)
- Sortering: ankomne først (DESC modtagetTidspunkt), så undervejs (ASC etaMinutter), så på vej til fabrik
- Empty-state vises når `vejesedler.length === 0`
- Header-row rendres altid (når data findes)
- `onTemperatur` og `onUdlaegger` bobles korrekt fra `<VejeseddelRow>`
- `recepter`-map bruges til at slå produktnavn op
- Sortering er ren funktion — test isoleret

## Accessibility
- Semantisk `<table>` med `<thead>` + `<tbody>`
- `<th scope="col">` på header-celler
- Empty-state har `role="status"` så screen reader læser når det skifter

## Acceptance-kriterier
- Props eksporteret som `VejesedlerTableProps`
- Ingen `any`-typer
- Kun tokens — ingen hardcodede farver
- Sortering er korrekt og ren funktion
- Empty-state håndteret eksplicit
- Hver række renderes via `<VejeseddelRow>` — INGEN inline status/temp-logik i denne komponent
- Cross-app data: `onTemperatur` skriver retur til PLAN (`plan_vejebilag.temperatur`) — se FUNCTIONAL_FLOWS Flow 9
