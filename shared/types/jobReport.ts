// Typer for jobraport — efterkalkulation
// TODO: Erstat mock-brug med Supabase når klar

export interface JobReportEntry {
  orderId: string
  day: number
  vehicleType: string
  drivingHours: number         // Faktiske køretimer
  waitingHours: number         // Ventetimer
  accordTons: number           // Akkord-tons
  comment?: string
}
