# SPEC: BestilteBilerAfregningSektion

## Formål
Den **udvidede** "Bestilte biler"-bekræftet-boks i Udførelse-mode. Tager den nuværende sektion (line ~2183 i `OrdrePlanScreen.tsx`) og udvider hver række med en `AfregningBadge` der toggler en `BilAfregningExpander` inline under rækken.

Dette er en **screen-komponent** der erstatter den eksisterende inline-blok i `UdfoerselContent`.

## Filsti
`apps/formand/src/components/screens/udfoersel/BestilteBilerAfregningSektion.tsx`

## Props

```ts
import type { ChauffoerAfregning, ChauffoerAfregningSetup, AfregningTimer } from '../../../types/afregning'

export interface BestilteBilerAfregningSektionProps {
  /** Den eksisterende vognmandBekraeftelse for dagen — bevares uændret */
  vognmandBekraeftelse: {
    biler: Array<{ regnr: string; chauffoer: string; tlf: string; biltype: string }>
    bekraeftetTidspunkt: string
  } | undefined
  /** Map af afregnings-setup per reg.nr — fra vognmand-system */
  afregningSetups: Record<string, ChauffoerAfregningSetup>
  /** Prædufyldte timer/værdier fra chauffør-app per reg.nr */
  initialHours: Record<string, { values: AfregningTimer; kommentar?: string }>
  /** Allerede godkendte afregninger per reg.nr */
  godkendteAfregninger: Record<string, ChauffoerAfregning>
  /** Kald når en afregning godkendes */
  onGodkend: (regnr: string, data: ChauffoerAfregning) => void
}
```

## Layout

Beholder eksisterende layout men tilføjer en ny kolonne i tabellen:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Bestilte biler                                                       │
│ ┌─ ✓ Bekræftet af vognmand                       15. mar · 16:42 ─┐│
│ │ ┌───────────────────────────────────────────────────────────────┐ ││
│ │ │ REG.NR.    CHAUFFØR        TLF.           TYPE   AFREGNING    │ ││
│ │ │ AB 12 345  Morten Lund     22 33 44 55    6 Aks  [Lav afregning] │
│ │ │ ──── (expander når åben) ──────────────────────────────────── │ ││
│ │ │ CD 67 890  Søren Karlsen   26 77 88 99    6 Aks  [✓ Godkendt] │ ││
│ │ │ EF 11 223  Lars Holm       40 12 56 78    7 Aks  [Afventer]   │ ││
│ │ └───────────────────────────────────────────────────────────────┘ ││
│ └───────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

- Ny kolonne "AFREGNING" tilføjes som sidste kolonne i tabel-header
- Hver række får `<AfregningBadge>` i den nye kolonne
- Når badge er klikket: tabel-rækken efterfølges af en `<tr><td colSpan={5}>` der wrapper `<BilAfregningExpander>`
- Kun ÉN expander åben ad gangen (state i denne komponent)

## Visuelle states

### Container
- **Bekræftet af vognmand:** behold eksisterende `bg-good-bg` (`#E7F4EE` → token)  
  **NOTE — token-violation i eksisterende kode:** linje 2190 + 2192 + 2197 + 2213 bruger hardcodet `bg-[#E7F4EE]`, `text-[#1F8A5B]`, `bg-[#FEEE3215]`, `text-[#8A6A00]`, `border-[#1F8A5B]/15`. **Disse skal udskiftes til tokens** (`bg-good-bg`, `text-good`, `bg-warn-bg`, `border-hairline`) som del af denne opgave — ellers spreder vi violations. **Brug `border-hairline` i stedet for at oprette nye `border-good/15`-tokens** — vi undgår at udvide token-paletten.
- **Afventer vognmand:** behold eksisterende warn-state (men token-fix samtidig)

### Expander
- Render inde i `<tr>` med `colSpan=5` direkte under den åbnede række
- Animationskrav: ingen — instant toggle er OK (kan tilføjes senere)

## Eksisterende komponenter genbrugt
- `AfregningBadge` (ui/)
- `BilAfregningExpander` (screens/udfoersel/)

## Token-fixes inkluderet (skal med i build)
| Linje | Hardcoded | Skal være |
|---|---|---|
| 2190 | `bg-[#E7F4EE]` | `bg-good-bg` |
| 2190 | `bg-[#FEEE3215]` | `bg-warn-bg` (eller `bg-yellow/8`) |
| 2196-2197 | `text-[#1F8A5B]` | `text-good` |
| 2201-2202 | `text-[#8A6A00]` | `text-text-secondary` (godkendt fallback) |
| 2213 | `border-[#1F8A5B]/15` | `border-hairline` (undgår at oprette ny `border-good/15`-token) |
| 2216 | `bg-[#F5F5F5]` | `bg-surface-2` |
| 2242 | `text-[#8A6A00]/80` | `text-text-muted` |

## Mock-data

```ts
// TODO: Erstat med Supabase når klar.
const MOCK_AFREGNING_SETUPS: Record<string, ChauffoerAfregningSetup> = {
  'AB 12 345': { regnr: 'AB 12 345', afregningType: 'time',   kilde: 'vognmand' },
  'CD 67 890': { regnr: 'CD 67 890', afregningType: 'akkord', kilde: 'vognmand' },
  'EF 11 223': { regnr: 'EF 11 223', afregningType: 'time',   kilde: 'fallback' },
}

const MOCK_INITIAL_HOURS = {
  'AB 12 345': { values: { koeretimer: 7.5, ventetid: 0.5, pause: 30 }, kommentar: 'Stoppet 30 min ved fabrik pga. produktionsstop.' },
  'CD 67 890': { values: { tonsKoert: 142.5, ventetid: 0.25 } },
  'EF 11 223': { values: { koeretimer: 6, ventetid: 0, pause: 30 } },
}

// Mock: én afregning allerede godkendt for at vise locked-state
const MOCK_GODKENDTE_AFREGNINGER: Record<string, ChauffoerAfregning> = {
  'CD 67 890': {
    regnr: 'CD 67 890',
    dayId: 'd2-1',
    afregningType: 'akkord',
    timer: { tonsKoert: 142.5, ventetid: 0.25 },
    godkendt: true,
    godkendtTidspunkt: '15. mar · 18:22',
    godkendtAf: 'Ole Jensen',
  },
}
```

## Tokens
Se token-fix-tabellen ovenfor — alle hardcoded fjernes.

## Acceptance-kriterier
- Bevarer eksisterende layout og indhold for bekræftet-boks
- Ny kolonne "AFREGNING" + badge + expander
- Kun én expander åben ad gangen
- Alle eksisterende token-violations i denne sektion fixes
- Props eksporteret som `BestilteBilerAfregningSektionProps`
- Ingen `any`-typer
- Ingen hardcodede farver/spacing
- Cross-app data: når `onGodkend` kaldes, parent skriver til `time_registreringer.godkendt_af_formand = true` (Supabase senere)
