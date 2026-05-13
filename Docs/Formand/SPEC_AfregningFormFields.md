# SPEC: AfregningFormFields

## Formål
Felt-gruppe der viser de korrekte input-felter baseret på afregningstype OG kontekst (asfalt-bil vs. materiel). Bruges af både `BilAfregningExpander` og `MaterielAfregningExpander`.

**Conditional rendering (pause-feltet):**
- **Asfalt-bil + time-afregning** → Køretimer, Ventetid, **Pause** (pause er asfalt-specifikt)
- **Asfalt-bil + akkord** → Tons kørt, Ventetid (ingen pause)
- **Materiel + time** → Køretimer, Ventetid (INGEN pause — pause er ikke relevant for materiel-transport)

Felter er prædufyldt fra hooks; formand kan redigere indtil godkendelse, hvorefter de låses.

## Filsti
`apps/formand/src/components/ui/AfregningFormFields.tsx`

## Props

```ts
import type { AfregningType, AfregningTimer } from '../../types/afregning'

export interface AfregningFormFieldsProps {
  /** Hvilke felter der skal vises */
  type: AfregningType
  /** Kontekst — afgør om pause-feltet skal vises ved time-afregning. 'asfalt' viser pause, 'materiel' skjuler pause. */
  kontekst: 'asfalt' | 'materiel'
  /** Værdier (kontrolleret) */
  values: AfregningTimer
  /** Kald når et felt ændres */
  onChange: (next: AfregningTimer) => void
  /** Hvis true: alle felter er read-only (efter godkendelse) */
  locked?: boolean
}
```

## Layout

Grid med 2 eller 3 kolonner afhængig af type + kontekst:

```
[Køretimer t]  [Ventetid t]  [Pause min]      ← time + kontekst='asfalt'
[Køretimer t]  [Ventetid t]                   ← time + kontekst='materiel' (INGEN pause)
[Tons kørt t]  [Ventetid t]                   ← akkord (kun asfalt — materiel har ingen akkord)
```

Hvert felt:
- Label (UPPERCASE uppercase tracking-widest, `text-xxs`, `text-text-muted`)
- Numerisk input (`type="number"`, `inputMode="decimal"`, `min="0"`)
- Enhedssuffiks (`t` eller `min`) som `text-xs text-text-muted` ved siden af tallet

Når `locked = true`: render som tekst (ikke `<input>`), samme typografi men uden border.

## Tokens
- Spacing: `gap-sm`, `p-sm`
- Border: `border-hairline`, focus `ring-2 ring-dark-teal/30`
- Radius: `rounded-lg`
- Typografi: `font-poppins text-lg font-semibold text-text-primary tabular-nums` for tallet
- Label: `font-inter text-xxs font-medium text-text-muted uppercase tracking-widest`

## Mock-data (eksempel — bruges i story / parent)

```ts
// TODO: Erstat med Supabase når klar — kommer fra chauffør-app timeregistrering.
const MOCK_TIME_VALUES: AfregningTimer = {
  koeretimer: 7.5,
  ventetid: 0.5,
  pause: 30,  // minutter
}

const MOCK_AKKORD_VALUES: AfregningTimer = {
  tonsKoert: 142.5,
  ventetid: 0.5,
}
```

## Eksisterende komponenter genbrugt
Ingen — atomar.

## Acceptance-kriterier
- Props-interface eksporteret som `AfregningFormFieldsProps`
- Locked-state render som tekst, ikke `<input>` med disabled
- Numerisk validering: ingen negative tal
- Decimaler tilladt (køretimer kan være 7.5)
- Inputs har `min-h-[44px]`
- Ingen hardcoded farver / spacing
- Pause-feltet renderes KUN ved `type='time'` OG `kontekst='asfalt'`
- Akkord-mode må aldrig kombineres med `kontekst='materiel'` (materiel er altid time) — kast warning ved invalid kombination i dev
