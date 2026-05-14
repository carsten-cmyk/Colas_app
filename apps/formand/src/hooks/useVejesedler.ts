// TODO: Erstat med Supabase-kald + PLAN-polling når klar
// Kilde: plan_vejebilag (PLAN — 10 min forsinkelse) + status fra chauffør-app GPS
// SELECT * FROM plan_vejebilag WHERE ordrenummer = :ordreId AND dato = :dato
// Hooket sætter status-feltet eksplicit (KANONISK) baseret på GPS-timestamps.
// Se FUNCTIONAL_FLOWS.md Flow 8 for fuld datakilde-beskrivelse.
import type { Vejeseddel } from '@/types/order'
import { INITIAL_VEJESEDLER } from '@/mocks/vejesedler'

export interface UseVejesedlerReturn {
  vejesedler: Vejeseddel[]
  loading: false
  error: null
}

/**
 * Henter vejesedler for én ordre på én given dato.
 * I mock-versionen filtreres på ordrenummer — dato er ikke i mock-datamodellen
 * da alle mock-rækker antages at tilhøre dagens dato.
 *
 * @param ordreId - Ordrenummer, fx "260423891"
 * @param dato    - ISO yyyy-mm-dd, fx "2026-05-14" (bruges ved Supabase-integration)
 */
export function useVejesedler(ordreId: string, dato: string): UseVejesedlerReturn {
  // TODO: Erstat med Supabase når klar — inkl. polling hvert 10. minut (PLAN-forsinkelse)
  // const { data } = await supabase
  //   .from('plan_vejebilag')
  //   .select('*')
  //   .eq('ordrenummer', ordreId)
  //   .eq('dato', dato)
  //   .order('tidspunkt', { ascending: false })

  // Supress unused-variable lint i mock-fasen — dato bruges ved Supabase-integration
  void dato

  const vejesedler = INITIAL_VEJESEDLER.filter(v => v.ordrenummer === ordreId)

  return {
    vejesedler,
    loading: false,
    error: null,
  }
}
