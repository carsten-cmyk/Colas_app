/**
 * Én udlægger-enhed fra ordren.
 * Følger samme konvention som eksisterende MaterielEnhed i OrdrePlanScreen:
 *   anlaegsNr: fx "9-0009" — prefix "9-" identificerer udlæggere
 *   beskrivelse: fx "VÖGELE 1900"
 * Udlægger-dropdown filtrerer materiel-listen på anlaegsNr.startsWith('9-').
 */
export interface UdlaeggerEnhed {
  /** Anlægsnummer — prefix "9-" identificerer udlægger-type */
  anlaegsNr: string
  /** Beskrivelse af udlæggeren, fx maskintype og model */
  beskrivelse: string
}
