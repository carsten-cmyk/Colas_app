// TODO: Erstat med Supabase typer fra shared/types når klar

export type TaskState = 'idle' | 'active' | 'paused' | 'completed'

/** Vejeseddel fra vejesystem (MAUS). brutto beregnes som tara + tons i visningen — gem ikke brutto. */
export interface Vejeseddel {
  /** MAUS vejeseddel-nummer, fx '4471023' */
  vejeseddelNr: string
  /** Klokkeslæt i format 'HH.MM', fx '07.42' */
  tidspunkt: string
  /** Produkt/recept-navn, fx 'SMA 11S 8mm' */
  produkt: string
  /** Taravægt i tons */
  tara: number
  /** Nettovægt i tons (brutto = tara + tons) */
  tons: number
}

export interface Location {
  name: string
  address: string
  meetingTime?: string // Format: "HH.MM"
  type: 'pickup' | 'delivery'
  /** Fabrikkens vejekontor-telefon (kun relevant ved type: 'pickup') */
  phone?: string
}

export interface Contact {
  id: string
  name: string
  role: string
  phone: string
  imageUrl?: string
}

export interface Alert {
  id: string
  message: string
  type: 'traffic' | 'weather' | 'other'
  active: boolean
}

export interface Task {
  id: string
  orderNumber: string
  ton: number
  produkt: string
  runder: number
  timer: number
  locations: Location[] // [0] = pickup, [1] = delivery
  contacts: Contact[]
  alerts: Alert[]
  state: TaskState
  /** Valgfri kommentar fra formanden — vises på opgavekortet */
  formandNote?: string
  /** Recept-kode fra PLAN (fx "94202A") */
  recept_nr?: string
  /** Dansk produkt-navn (fx "SMA 11S 8mm") */
  produktnavn?: string
  /** Hele ordrens bestilte tons — samme værdi for alle læs */
  bestilt_total?: number
  /** Sum af tons hentet på vejesedler indtil nu */
  hentet?: number
  /** Vejesedler fra MAUS — kun asfalt-ordrer. TODO: Erstat med Supabase når klar */
  vejesedler?: Vejeseddel[]
}
