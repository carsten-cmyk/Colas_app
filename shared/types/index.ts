// Delte typer på tværs af alle Colas-frontends
// Alle web-apps (formand, vognmand, fabrik, kunde) re-eksporterer herfra
// TODO: Erstat mock-brug med Supabase når klar

export type { Order, Product, DayPlan, Factory, Resource, Contact, NoteComment,
  TransportPlan, ScheduleRow, MaterielTransport,
  TransportOrder, TruckAssignment,
  DriverHours, CrewHours } from './order'

export type { Driver, DriverTask, TaskState, DriverStatus } from './driver'

export type { HændelsesDokumentation } from './documentation'

export type { JobReportEntry } from './jobReport'
