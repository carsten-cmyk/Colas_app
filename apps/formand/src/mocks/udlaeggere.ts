// Mock-udlæggere — materiel registreret på ordren med materielnummer-prefix "9-"
// TODO: Erstat med materiel-liste på ordren fra Supabase
// Kilde: orders.materiel[] filtreret til materielnr.startsWith('9-') (udlægger-konvention)
// Se FUNCTIONAL_FLOWS.md Flow 8 Trin 6 for filtrerings-logik

import type { UdlaeggerEnhed } from '../types/udlaegger'

/**
 * Udlæggere tilgængelige på demo-ordren.
 * Materielnumre med prefix "9-" — udlæggere der modtager asfalt direkte fra lastbilerne.
 * Andre materielnumre (fx "5-" tromler, "3-" andet anlæg) er IKKE udlæggere og medtages ikke.
 */
export const INITIAL_UDLAEGGERE: UdlaeggerEnhed[] = [
  {
    anlaegsNr: '9-0009',
    beskrivelse: 'VÖGELE 1900',
  },
  {
    anlaegsNr: '9-0024',
    beskrivelse: 'DYNAPAC SD2500',
  },
  {
    anlaegsNr: '9-0041',
    beskrivelse: 'VÖGELE 2100-3I',
  },
]
