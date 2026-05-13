// TODO: Erstat med Supabase typer fra shared/types når klar

export type TaskState = 'idle' | 'active' | 'paused' | 'completed'

export interface Location {
  name: string
  address: string
  meetingTime?: string // Format: "HH.MM"
  type: 'pickup' | 'delivery'
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
}
