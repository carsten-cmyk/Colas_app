export interface DagDisponering {
  dato: string              // YYYY-MM-DD
  bestilteBiler: number
  disponeredeBiler: number
  ændretAfFormand: boolean
  mødetidFabrik?: string    // HH:MM
  tidFabrikTilPlads?: number // minutter
  kommentar?: string
}

export interface TidligereKørtBil {
  reg: string       // f.eks. "XE32114"
  chauffør: string  // f.eks. "Lars"
}

export interface TidligereKørt {
  ordrenr: string
  fraDato: string        // YYYY-MM-DD
  tilDato: string        // YYYY-MM-DD
  biler: TidligereKørtBil[]
}

export interface MaterielLinje {
  id: string
  anlaegsNr: string
  beskrivelse: string
  transportType: string   // fx "Blokvogn" / "Kran-bånd"
  afhentning: string      // adresse
  aflæsning: string       // adresse
}

export interface Ordre {
  id: string
  ordrenr: string
  titel: string
  adresse: string
  lokation: string
  fabrik: string
  produktKode: string
  mængdeTotal: number    // tons
  startDate: string      // YYYY-MM-DD
  endDate: string        // YYYY-MM-DD
  dage: DagDisponering[]
  tidligereKørte?: TidligereKørt[]
  materiel?: MaterielLinje[]
}
