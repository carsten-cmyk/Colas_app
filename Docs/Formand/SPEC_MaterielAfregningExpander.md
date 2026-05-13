# SPEC: MaterielAfregningExpander

## Formål
Expander til afregning af materiel-transport. Adskiller sig fra `BilAfregningExpander` på tre punkter:
1. **Kun time-afregning** — ingen akkord-felter
2. **Ingen pause-felt** — pause er asfalt-specifikt; materiel-transport viser KUN køretimer + ventetid
3. **Én afregning per chauffør, ikke per materiel-enhed** — hvis samme chauffør har kørt 3 materiel-enheder (samme blokvogn til 3 maskiner), oprettes ÉN afregning som dækker alle 3

## Filsti
`apps/formand/src/components/screens/udfoersel/MaterielAfregningExpander.tsx`

## Props

```ts
import type { AfregningTimer, MaterielAfregning } from '../../../types/afregning'

export interface MaterielAfregningExpanderProps {
  /** Identificerer afregnings-rækken (fx regnr+dayId eller chauffør-id) */
  chauffoerKey: string
  /** Chauffør-navn — vises i header */
  chauffoerNavn: string
  /** Reg.nr på transport-bilen */
  regnr: string
  /** Liste over materiel-enheder denne chauffør har kørt — vises som info-strip øverst */
  materielEnheder: Array<{ anlaegsNr: string; beskrivelse: string }>
  /** Prædufyldte værdier fra chauffør-app */
  initialValues: AfregningTimer
  /** Eventuel chauffør-kommentar */
  chauffoerKommentar?: string
  /** Allerede-godkendt afregning — felter låses */
  godkendt?: MaterielAfregning
  /** Kald når formand godkender (direkte, ingen modal) */
  onGodkend: (data: MaterielAfregning) => void
  /** Kald når formand genåbner en allerede godkendt afregning */
  onGenaaben: () => void
  /** Kald når formand lukker expander uden at godkende */
  onClose: () => void
}
```

## Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Afregning · Lars Pedersen (BL77331)              [X luk]      │
│ ───────────────────────────────────────────────────────────── │
│ Dækker: HAMM HD10 VT · VÖGELE 1900-3I · HAMM DV70VV           │
│                                                                │
│ [Type-pill: Time-afregning]                                   │
│                                                                │
│ [ChauffoerKommentarBox — hvis kommentar findes]               │
│                                                                │
│ [AfregningFormFields type="time" kontekst="materiel"]         │
│ (Kun: Køretimer + Ventetid — INGEN pause)                     │
│                                                                │
│                                  [Annullér]  [Godkend afregn.]│
└────────────────────────────────────────────────────────────────┘
```

- Samme styling som `BilAfregningExpander`
- "Dækker"-strip: `font-inter text-xs text-text-muted` + materiel-navne separeret med `·`

## Visuelle states
Samme som `BilAfregningExpander`:
- **A. Klar til redigering** — felter editable, godkend-knap aktiv
- **B. Godkendt (locked)** — felter read-only, header viser "✓ Godkendt af [navn] · [tidspunkt]", "Godkend"-knap erstattes med **"Genåbn afregning"-link** der kalder `onGenaaben`

UDEN akkord-mulighed og UDEN fallback-case (materiel = altid time, leveres ikke fra vognmand-system).

## Forretningsregel
Parent (`UdfoerselscontentMateriel`) skal **gruppere materiel-rækker efter chauffør** og kun vise "Lav afregning"-badge på FØRSTE række per chauffør. De resterende rækker viser i stedet en lille muted tekst "Dækket af [chauffør-navn]" — eller intet.

## Eksisterende komponenter genbrugt
- `AfregningFormFields` (ui/) — kaldt med `type="time"` + `kontekst="materiel"` (pause skjules)
- `ChauffoerKommentarBox` (ui/)
- `GodkendAfregningButton` (ui/)
- `AfregningTypePill` (ui/) — altid `type="time"`

## Tokens
Samme som `BilAfregningExpander`.

## Mock-data

```ts
// TODO: Erstat med Supabase når klar.
// Materiel har INGEN pause-felt — pause er asfalt-specifikt.
const MOCK_MATERIEL_HOURS: Record<string, { values: AfregningTimer; kommentar?: string }> = {
  'BL77331': {
    values: { koeretimer: 5.5, ventetid: 1 },
    kommentar: 'Ventet 1 time på losseplads — ingen plads til blokvogn.',
  },
}
```

## Acceptance-kriterier
- Props eksporteret som `MaterielAfregningExpanderProps`
- Felter låses når `godkendt` er sat
- "Godkend"-knap disabled hvis felter er tomme
- Direkte godkendelse — INGEN bekræftelses-modal
- "Genåbn afregning"-link synlig i godkendt-tilstand
- Pause-felt vises ALDRIG (kontekst='materiel' i AfregningFormFields)
- Ingen afvis-flow (ikke i v1)
- Lukkes via X eller Annullér
- Ingen hardcoded farver/spacing
- Touch targets `min-h-[44px]`
