// Typer for chauffører og opgaver
// TODO: Erstat mock-brug med Supabase når klar

export interface Driver {
  id: string
  name: string
  imageUrl?: string
  phone: string
  vehicleType: string
}

export type TaskState = 'idle' | 'active' | 'paused' | 'completed'

export interface DriverTask {
  id: string
  orderId: string
  driver: Driver
  state: TaskState
  tripsToday: number
  tonsDelivered: number
  lastUpdatedAt?: string       // ISO 8601
  startedAt?: string
  completedAt?: string
}

export type DriverStatus = 'korer' | 'pa-fabrik' | 'pa-plads' | 'afsluttet'
