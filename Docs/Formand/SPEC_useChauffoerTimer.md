# SPEC: useChauffoerTimer (hook)

## Formål
Data-hook der returnerer prædufyldte timer + afregningstype per chauffør (= per reg.nr) for en given dag. I prototype = mock; senere = Supabase Realtime der lytter på `time_registreringer` + `vognmand_chauffoer_setup` + `plan_vejebilag` (tons-kilde for akkord-afregning).

## Datakilder (Supabase, senere)
- `time_registreringer` — timer/ventetid/pause per chauffør (afsluttes af chauffør i app)
- `vognmand_chauffoer_setup` — afregningstype (time/akkord) per chauffør fra vognmand-system
- `plan_vejebilag` — tons-data per vejebilag (registreres ved fabrik hver gang chauffør henter asfalt). Hooket SKAL **joine** `plan_vejebilag` på `(regnr, dato)` og summere `tons` for at få total `tonsKoert` ved akkord-afregning. Bruges IKKE `time_registreringer.tons_koert`.

## Filsti
`apps/formand/src/hooks/useChauffoerTimer.ts`

## Signatur

```ts
import type { AfregningTimer, ChauffoerAfregningSetup, ChauffoerAfregning, MaterielAfregning } from '../types/afregning'

export interface UseChauffoerTimerResult {
  /** Setup per reg.nr (afregningstype + kilde) */
  setups: Record<string, ChauffoerAfregningSetup>
  /** Prædufyldte timer/tons per reg.nr */
  initialBilHours: Record<string, { values: AfregningTimer; kommentar?: string }>
  /** Prædufyldte timer per materiel-chauffør-key (regnr) */
  initialMaterielHours: Record<string, { values: AfregningTimer; kommentar?: string }>
  /** Allerede godkendte bil-afregninger */
  godkendteBilAfregninger: Record<string, ChauffoerAfregning>
  /** Allerede godkendte materiel-afregninger */
  godkendteMaterielAfregninger: Record<string, MaterielAfregning>
  /** Standard-hook-felter */
  loading: boolean
  error: Error | null
  /** Skift en godkendt bil-afregning til godkendt */
  godkendBilAfregning: (regnr: string, data: ChauffoerAfregning) => void
  /** Skift en godkendt materiel-afregning til godkendt */
  godkendMaterielAfregning: (chauffoerKey: string, data: MaterielAfregning) => void
  /** Genåbn en allerede godkendt bil-afregning — sætter godkendt_af_formand=false og åbner expanderen igen */
  genaabnAfregning: (regnr: string) => void
  /** Genåbn en allerede godkendt materiel-afregning */
  genaabnMaterielAfregning: (chauffoerKey: string) => void
}

export function useChauffoerTimer(orderId: string, dayId: string): UseChauffoerTimerResult
```

## Adfærd
- Returnerer mock-data straks (loading = false fra start)
- `godkend*`-funktionerne opdaterer in-memory state (Set/Record)
- `genaabn*`-funktionerne fjerner posten fra `godkendteBilAfregninger` / `godkendteMaterielAfregninger` — UI'et viser så expander-formen igen
- Akkord-data (`tonsKoert`) hentes fra `plan_vejebilag` join — i mock kommer det fra en separat `MOCK_PLAN_VEJEBILAG`-konstant der summer tons per regnr
- Når Supabase er klar:
  - Realtime-subscribe på `time_registreringer` + `plan_vejebilag`
  - Skriv via `supabase.from('time_registreringer').upsert({ godkendt_af_formand: true })`
  - Genåbn via `supabase.from('time_registreringer').upsert({ godkendt_af_formand: false, godkendt_tidspunkt: null, genaabnet_tidspunkt: now() })`

## Mock-data
Importerer mock-konstanter fra `apps/formand/src/mocks/chauffoerTimer.ts` (ny fil — bygges som del af hook-builden).

```ts
// apps/formand/src/mocks/chauffoerTimer.ts
// TODO: Erstat med Supabase når klar.
import type { ChauffoerAfregningSetup } from '../types/afregning'

export const MOCK_AFREGNING_SETUPS: Record<string, ChauffoerAfregningSetup> = {
  'AB 12 345': { regnr: 'AB 12 345', afregningType: 'time',   kilde: 'vognmand' },
  'CD 67 890': { regnr: 'CD 67 890', afregningType: 'akkord', kilde: 'vognmand' },
  'EF 11 223': { regnr: 'EF 11 223', afregningType: 'time',   kilde: 'fallback' },
}

// PLAN vejebilag — tons per regnr summeret over dagen.
// I prod: SELECT regnr, SUM(tons) FROM plan_vejebilag WHERE dato = :dayId GROUP BY regnr
export const MOCK_PLAN_VEJEBILAG: Record<string, number> = {
  'CD 67 890': 142.5,  // akkord-chauffør har kørt 142,5 tons i dag
}
// ... resten af mock-konstanter (initialBilHours, initialMaterielHours, godkendteBilAfregninger, godkendteMaterielAfregninger)
```

## Acceptance-kriterier
- Return-shape matcher `UseChauffoerTimerResult`
- Loading/error felter er obligatoriske (selv om de altid er false/null i mock)
- TODO-kommentar ved hver mock-konstant
- Hook bruger `useState` + opdaterer in-memory state ved godkend
- Ingen `any`-typer
