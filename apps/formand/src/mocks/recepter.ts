// Mock-recepter fra PLAN — produktkatalog
// TODO: Erstat med Supabase når klar
// Kilde: recepter-tabel i PLAN (se FUNCTIONAL_FLOWS.md datamodel)
import type { Recept } from '@/types/order'

/**
 * Opslag: receptkode → Recept.
 * kg_per_m2 angiver kg asfalt per kvadratmeter ved planlagt tykkelse.
 * densitet bruges til faktisk tykkelse-beregning: mm = tons × 1_000_000 / (m² × densitet).
 * min_temperatur er fallback-grænse for TemperaturBadge (formand kan override per ordre/dag).
 */
export const INITIAL_RECEPTER: Record<string, Recept> = {
  // SMA 11S — tæt slidlag, densitet 2400 kg/m³
  '82101H': {
    kode: '82101H',
    navn: 'SMA 11S',
    kg_per_m2: 112,
    densitet: 2400,
    min_temperatur: 140,
  },
  // GAB I — grovkornet asfaltbeton (bærelag), densitet 2380 kg/m³
  '23001B': {
    kode: '23001B',
    navn: 'GAB I',
    kg_per_m2: 187,
    densitet: 2380,
    min_temperatur: 130,
  },
  // ABT 11 — asfaltbetontynd-lag, densitet 2350 kg/m³
  '71204K': {
    kode: '71204K',
    navn: 'ABT 11',
    kg_per_m2: 95,
    densitet: 2350,
    min_temperatur: 135,
  },
}
