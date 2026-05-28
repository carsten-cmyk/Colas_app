// TODO: Erstat faktiskRegistrering med Supabase-kald når klar
// Kilde: dagsoverblik_registreringer — ÉN række per (ordrenummer, dato), overskrives ved gem
// SELECT * FROM dagsoverblik_registreringer WHERE ordrenummer = :ordreId AND dato = :dato
// Se FUNCTIONAL_FLOWS.md Flow 7 for fuld beregnings-beskrivelse.
import { useState } from 'react'
import type { Recept, DagsoverblikRegistrering } from '@/types/order'
import { useVejesedler } from './useVejesedler'

export interface UseDagsoverblikReturn {
  /** Sum af tons fra vejesedler med status='udlagt' */
  tonsAnkommet: number
  /**
   * Beregnet m² = tonsAnkommet × 1000 / recept.kg_per_m2.
   * Repræsenterer det forventede areal der er udlagt baseret på de ankomne tons.
   * Enhed: m² (kvadratmeter)
   */
  forventetUdlagtM2: number
  /** Senest gemte faktiske registrering — null hvis formand ikke har gemt endnu */
  faktiskRegistrering: DagsoverblikRegistrering | null
  /** Gem faktisk udlagt m² og tons — opdaterer lokal state (mock). Skriver til Supabase ved integration. */
  gemFaktisk: (m2: number, tons: number) => void
  /**
   * Beregn faktisk tykkelse fra indtastede værdier.
   * Formel: tykkelse_mm = tons × 1_000_000 / (m² × recept.densitet_kg_per_m3)
   * Enheder: tons [t], m² [m²], densitet [kg/m³] → resultat [mm]
   * Returnerer 0 hvis recept mangler eller m² = 0 (undgår division med nul).
   */
  beregnFaktiskTykkelse: (m2: number, tons: number) => number
}

/**
 * Aggregerer vejeseddel-data til dagsfremdrift og håndterer formands faktisk-registrering.
 *
 * @param ordreId - Ordrenummer, fx "260423891"
 * @param dato    - ISO yyyy-mm-dd, fx "2026-05-14"
 * @param recept  - Recept for ordren — undefined medfører 0-beregninger
 */
export function useDagsoverblik(
  ordreId: string,
  dato: string,
  recept: Recept | undefined
): UseDagsoverblikReturn {
  const { vejesedler } = useVejesedler(ordreId, dato)

  // Lokal state for faktisk registrering — erstattets med Supabase ved integration
  // TODO: Erstat med Supabase når klar
  // Initialisér fra dagsoverblik_registreringer WHERE ordrenummer = ordreId AND dato = dato
  const [faktiskRegistrering, setFaktiskRegistrering] = useState<DagsoverblikRegistrering | null>(
    null
  )

  // ── Beregninger ─────────────────────────────────────────────────────────────

  /**
   * Sum af tons fra udlagte vejesedler.
   * Kun status='udlagt' tæller — øvrige statusser er ikke endeligt afleveret endnu.
   * Enhed: tons [t]
   */
  const tonsAnkommet = vejesedler.reduce<number>((sum, v) => {
    if (v.status === 'udlagt' && v.tons !== null) {
      return sum + v.tons
    }
    return sum
  }, 0)

  /**
   * Forventet udlagt areal baseret på ankomne tons og receptens kg/m².
   * Formel: m² = tons × 1000 / kg_per_m2
   * Enhed: m² (kvadratmeter), afrundet til heltal for visning
   */
  const forventetUdlagtM2 = recept && recept.kg_per_m2 > 0
    ? Math.round((tonsAnkommet * 1000) / recept.kg_per_m2)
    : 0

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * Gem faktisk udlagt m² og tons.
   * Opdaterer lokal state med nyt gemtTidspunkt (ISO 8601).
   * TODO: Erstat med Supabase-upsert når klar:
   *   supabase.from('dagsoverblik_registreringer').upsert({
   *     ordrenummer: ordreId, dato, faktisk_m2: m2, faktisk_tons: tons,
   *     faktisk_tykkelse_mm: beregnFaktiskTykkelse(m2, tons),
   *     gemt_tidspunkt: new Date().toISOString(), gemt_af: auth.user.name
   *   }, { onConflict: 'ordrenummer,dato' })
   */
  function gemFaktisk(m2: number, tons: number): void {
    setFaktiskRegistrering({
      dato,
      faktiskM2: m2,
      faktiskTons: tons,
      gemtTidspunkt: new Date().toISOString(),
    })
  }

  /**
   * Beregn faktisk tykkelse i mm fra målte værdier.
   * Formel: tykkelse_mm = tons × 1_000_000 / (m² × densitet)
   *   tons      [t]      → ganger med 1_000_000 for at konvertere til gram (densitet er kg/m³ = g/dm³)
   *   m²        [m²]
   *   densitet  [kg/m³]
   *   resultat  [mm]     → afrundet til heltal
   *
   * Faktisk tykkelse vises som "X mm · plan Y mm · ±Z%" i FremdriftInputRow.
   * Returnerer 0 ved manglende recept eller m² = 0 (undgår division-med-nul).
   */
  function beregnFaktiskTykkelse(m2: number, tons: number): number {
    if (!recept || m2 === 0) return 0
    // tons × 1_000_000 / (m² × densitet_kg_per_m3) = mm
    return Math.round((tons * 1_000_000) / (m2 * recept.densitet))
  }

  return {
    tonsAnkommet,
    forventetUdlagtM2,
    faktiskRegistrering,
    gemFaktisk,
    beregnFaktiskTykkelse,
  }
}
