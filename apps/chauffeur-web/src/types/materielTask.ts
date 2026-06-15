export interface MaterielUnit {
  beskrivelse: string
  anlaegsnr: string
}

export interface MaterielPickup {
  sted: string
  adresse: string
  /** Format: "HH.MM" */
  tid: string
  /** KUN sat hvis formand har pin/adresse — ellers undefined (intet kort-link) */
  mapsQuery?: string
}

export interface MaterielDropoff {
  id: string
  sted: string
  adresse: string
  mapsQuery?: string
  leveret: boolean
}

export type MaterielTaskState = 'idle' | 'i-gang' | 'afsluttet'

export interface MaterielTask {
  id: string
  orderNumber: string
  /** Diskriminator til liste-integration */
  kind: 'materiel'
  /** De materiel-enheder kørslen rummer */
  units: MaterielUnit[]
  /** 1..n afhentningssteder — sorteres efter tid (tidligste først) */
  pickups: MaterielPickup[]
  /** 1..n aflæsningssteder */
  dropoffs: MaterielDropoff[]
  formandNote?: string
  formand: { name: string; phone: string }
  state: MaterielTaskState
}
