# SPEC: BilAfregningExpander

## Formål
Den expander-row der vises **under** en bil-række i "Bestilte biler"-bekræftet-boks når formand trykker "Lav afregning". Indeholder:
- Afregningstype-indikator (time/akkord) + fallback-warning hvis ukendt
- Chauffør-kommentar (hvis sendt)
- Felter (køretimer/ventetid/pause ELLER tons/ventetid)
- Godkend-knap

## Filsti
`apps/formand/src/components/screens/udfoersel/BilAfregningExpander.tsx`

## Props

```ts
import type { AfregningType, AfregningTimer, ChauffoerAfregning } from '../../../types/afregning'

export interface BilAfregningExpanderProps {
  /** Reg.nr fra bil-rækken — også expander-key */
  regnr: string
  /** Chauffør-navn — vises i header */
  chauffoerNavn: string
  /** Afregningstype fra vognmand-systemet. Undefined = fallback til 'time' med gult warning-banner */
  afregningType: AfregningType | undefined
  /** Prædufyldte værdier — timer fra chauffør-app, tons fra PLAN vejebilag (join'et i hook) */
  initialValues: AfregningTimer
  /** Eventuel chauffør-kommentar fra app */
  chauffoerKommentar?: string
  /** Eventuel allerede-godkendt afregning — hvis sat: felter låses, vises som bekræftet-boks */
  godkendt?: ChauffoerAfregning
  /** Kald når formand godkender (direkte godkendelse, ingen modal) */
  onGodkend: (data: ChauffoerAfregning) => void
  /** Kald når formand genåbner en allerede godkendt afregning (sætter godkendt_af_formand=false igen) */
  onGenaaben: () => void
  /** Kald når formand lukker expander uden at godkende */
  onClose: () => void
}
```

## Layout

```
┌───────────────────────────────────────────────────────────────┐
│ Afregning · Morten Lund (AB 12 345)             [X luk]      │
│ ─────────────────────────────────────────────────────────── │
│ [Type-pill: Time-afregning]  /  [Type-pill: Akkord]          │
│ [Hvis fallback: gul info "Type ikke leveret fra vognmand"]   │
│                                                               │
│ [ChauffoerKommentarBox — hvis kommentar findes]              │
│                                                               │
│ [AfregningFormFields — time eller akkord-felter]             │
│                                                               │
│                                  [Annullér]  [Godkend afregn.]│
└───────────────────────────────────────────────────────────────┘
```

- Baggrund: `bg-surface` (hvid) — for at adskille fra den grønne `bg-good-bg`-container fra parent
- Border: `border border-hairline border-t-0` (sidder under bil-rækken)
- Padding: `p-sm`
- Spacing internt: `space-y-sm`

## Visuelle states

### A. Klar til redigering (default)
- Felter er editable
- "Godkend afregning"-knap aktiv

### B. Fallback (afregningType undefined)
- Vis **gult warning-banner** øverst i expander: `bg-warn-bg`, `text-text-primary`, ikon `AlertTriangle` (`text-warn` eller `text-yellow`)
- Tekst: "Afregningstype ikke leveret fra vognmand-system. Default er sat til **time-afregning**."
- Padding: `p-sm`, radius: `rounded-md`
- INGEN manuel toggle/dropdown i v1 — formand kan IKKE override typen i UI'et endnu (TODO-kommentar i koden)
- Banner forsvinder når godkendt (state C)

### C. Godkendt (locked)
- Felter er read-only (render som tekst, ikke `<input>`)
- Header viser bekræftet-checkmark + tidspunkt: "✓ Godkendt af [formand-navn] · [tidspunkt]"
- "Godkend"-knap fjernes
- Tilføj **"Genåbn afregning"-link** (sekundær-knap eller `text-button` i `text-text-secondary` med `underline`) — kalder `onGenaaben` der sætter `godkendt_af_formand = false` og åbner expanderen til redigering igen
- Hvis afregningen tidligere er blevet genåbnet: vis lille muted-tekst "Genåbnet [tidspunkt]" under godkendelses-stempel
- ChauffoerKommentarBox vises stadig

## Eksisterende komponenter genbrugt
- `AfregningFormFields` (ui/)
- `ChauffoerKommentarBox` (ui/)
- `GodkendAfregningButton` (ui/)
- `AfregningTypePill` (ui/ — se separat SPEC)

## Tokens
`bg-surface`, `bg-warn-bg`, `border-hairline`, `text-text-primary`, `text-text-muted`, `text-text-secondary`, `p-sm`, `space-y-sm`, `rounded-b-lg`.

## Mock-data (bruges af parent)

```ts
// TODO: Erstat med Supabase når klar — kommer fra chauffør-app timeregistrering + PLAN vejebilag.
const MOCK_DRIVER_HOURS: Record<string, { type: AfregningType | undefined; values: AfregningTimer; kommentar?: string }> = {
  'AB 12 345': {
    type: 'time',
    values: { koeretimer: 7.5, ventetid: 0.5, pause: 30 },
    kommentar: 'Stoppet 30 min ved fabrik pga. produktionsstop.',
  },
  'CD 67 890': {
    type: 'akkord',
    values: { tonsKoert: 142.5, ventetid: 0.25 },
  },
  'EF 11 223': {
    type: undefined, // fallback-case
    values: { koeretimer: 6, ventetid: 0, pause: 30 },
  },
}
```

## Acceptance-kriterier
- Props eksporteret som `BilAfregningExpanderProps`
- Felter låses når `godkendt` er sat
- Gult fallback-banner vises hvis `afregningType === undefined` (fallback = time, ingen manuel override i v1)
- Direkte godkendelse — INGEN bekræftelses-modal
- "Genåbn afregning"-knap synlig i godkendt-tilstand — kalder `onGenaaben`
- "Godkend"-knap er disabled hvis felter er tomme
- Lukker via `X`-knap eller "Annullér"-knap
- AfregningFormFields kaldes med `kontekst='asfalt'` (pause-felt synligt ved time)
- Ingen hardcoded farver/spacing
- Touch targets `min-h-[44px]` på alle knapper
