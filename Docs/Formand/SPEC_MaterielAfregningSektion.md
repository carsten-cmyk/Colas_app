# SPEC: MaterielAfregningSektion

## Formål
Den **udvidede** "Materiel"-bekræftet-boks i Udførelse-mode. Tager den nuværende sektion (line ~2250 i `OrdrePlanScreen.tsx`) og udvider med afregnings-knap per **chauffør** (ikke per materiel-enhed).

Når én chauffør kører flere materiel-enheder med samme reg.nr, vises "Lav afregning"-knappen kun på første række — resterende rækker viser "Dækket af [chauffør]" eller intet.

## Filsti
`apps/formand/src/components/screens/udfoersel/MaterielAfregningSektion.tsx`

## Props

```ts
import type { AfregningTimer, MaterielAfregning } from '../../../types/afregning'

export interface MaterielAfregningSektionProps {
  /** Den eksisterende vognmandMaterielBekraeftelse — bevares uændret */
  vognmandMaterielBekraeftelse: {
    items: Array<{
      resourceId: string
      anlaegsNr: string
      beskrivelse: string
      regnr: string
      chauffoer: string
      tlf: string
      transportType: string
    }>
    bekraeftetTidspunkt: string
  } | undefined
  /** Prædufyldte timer per chauffør-key (fx regnr+dayId) */
  initialHours: Record<string, { values: AfregningTimer; kommentar?: string }>
  /** Allerede godkendte materiel-afregninger per chauffør-key */
  godkendteAfregninger: Record<string, MaterielAfregning>
  /** Kald når en afregning godkendes */
  onGodkend: (chauffoerKey: string, data: MaterielAfregning) => void
}
```

## Forretningslogik — gruppering

Komponenten skal **gruppere** items i `vognmandMaterielBekraeftelse.items` per `regnr` (= chauffør-key):
1. Iterér gennem items i original rækkefølge
2. Track et `Set<string>` af reg.nr vi har set
3. På første forekomst af et reg.nr: vis `<AfregningBadge>` i en ny "AFREGNING"-kolonne. Tooltip på badge viser hvor mange materiel-enheder afregningen dækker
4. På efterfølgende forekomster: vis `<span className="font-inter text-xxs text-text-muted">Dækket af afregning ovenfor</span>` ELLER tom celle

Når brugeren klikker badge: åbn `<MaterielAfregningExpander>` der dækker **alle** materiel-enheder med samme reg.nr.

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Materiel                                                                 │
│ ┌─ ✓ Bekræftet af vognmand                          15. mar · 17:05 ──┐│
│ │ ┌───────────────────────────────────────────────────────────────────┐││
│ │ │ ANLÆG   BESKRIVELSE    TRANSPORT       CHAUFFØR       TLF.   AFR. │││
│ │ │ 5-0034  HAMM HD10 VT   Blokvogn BL...  Lars Pedersen  20... [LAV] │││
│ │ │ 3-0112  VÖGELE 1900-3I Blokvogn BL...  Lars Pedersen  20... ↑ same│││
│ │ │ 7-0078  HAMM DV70VV    Kran-bånd BL... Lars Pedersen  20... ↑ same│││
│ │ └───────────────────────────────────────────────────────────────────┘││
│ └────────────────────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────────────────┘
```

## Token-fixes (skal med i build)
Samme princip som `BestilteBilerAfregningSektion`:
| Linje | Hardcoded | Skal være |
|---|---|---|
| 2255 | `bg-[#E7F4EE]` | `bg-good-bg` |
| 2258-2259 | `text-[#1F8A5B]` | `text-good` |
| 2264 | `border-[#1F8A5B]/15` | `border-hairline` (undgår at oprette ny `border-good/15`-token) |
| 2267 | `bg-[#F5F5F5]` | `bg-surface-2` |

## Mock-data

```ts
// TODO: Erstat med Supabase når klar.
const MOCK_MATERIEL_HOURS: Record<string, { values: AfregningTimer; kommentar?: string }> = {
  // Key = regnr (alle 3 materiel-enheder kører på BL77331)
  'BL77331': {
    values: { koeretimer: 5.5, ventetid: 1, pause: 30 },
    kommentar: 'Ventet 1 time på losseplads — ingen plads til blokvogn.',
  },
}

const MOCK_GODKENDTE_MATERIEL_AFREGNINGER: Record<string, MaterielAfregning> = {}
```

## Eksisterende komponenter genbrugt
- `AfregningBadge` (ui/)
- `MaterielAfregningExpander` (screens/udfoersel/)

## Acceptance-kriterier
- Korrekt gruppering: én badge per chauffør, ikke per materiel-enhed
- Expander dækker alle materiel-enheder for chaufføren
- Token-violations fra eksisterende kode fixes
- Props eksporteret som `MaterielAfregningSektionProps`
- Ingen `any`-typer
- Ingen hardcoded farver/spacing
