// Typer for ordrer, produkter og transport
// Kilde: Docs/Formand/PRD.md §6 + Docs/Formand/ARCHITECTURE.md
// TODO: Erstat mock-brug med Supabase når klar

// ─── Ordre ────────────────────────────────────────────────────────────────────

export interface Order {
  id: string
  orderNumber: string           // Arbejdsordre nr, fx "1212343"
  customer: string
  projectName: string           // Projekt + etape
  district: string
  foreman: string               // Holdnr/formand
  contactPM: Contact            // Projektleder + tlf
  comments?: string             // Forbehold
  products: Product[]
  resources: Resource[]
  state: 'planned' | 'active' | 'completed'
}

// ─── Produkt ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  activityName: string          // fx "GAB I at levere og udlægge, 80mm"
  recipeCode: string            // fx "23001B"
  recipeName: string            // fx "GAB I"
  factory: Factory
  m2: number
  kgPerM2: number
  kgPerM3: number
  tonsTotal: number
  startDate?: string            // ISO dato
  endDate?: string              // ISO dato
  /** Fordeling per dag — regenereres når startDate+endDate ændres */
  dailyPlan: DayPlan[]
  state: 'pending' | 'active' | 'completed'
}

export interface DayPlan {
  day: number                   // 1, 2, 3 ...
  date: string                  // ISO dato
  tonsPlanned: number
  tonsDelivered?: number        // Fyldes under/efter eksekvering
  cancelled: boolean
  cancelReason?: 'regn' | 'frost' | 'underlag' | 'andet'
  transportPlan?: TransportPlan
}

export interface Factory {
  code: string                  // fx "29000"
  name: string                  // fx "PROD A EAST KØGE PH"
  /** Køretid i minutter fra fabrik til plads */
  driveTimeMinutes: number
}

// ─── Ressourcer ───────────────────────────────────────────────────────────────

export interface Resource {
  plantNumber: string           // Anlægsnr, fx "D8302463"
  description: string           // fx "HAMM HD10 VT 2220 KG"
  type: 'asphalt-truck' | 'equipment' | 'crane' | 'other'
  vehicleType?: string          // Vogntype (sættevogn, båndtrailer osv.)
  capacityTonsPerTrip?: number
  transportType?: 'blokvogn' | 'kran-baand' | 'egen-korsel'
}

// ─── Transport ────────────────────────────────────────────────────────────────

/** Beregnet køreplan for én dag på én ordre */
export interface TransportPlan {
  date: string                  // ISO dato
  orderId: string
  productCode: string
  tonsToday: number
  startTime: string             // "06:00"
  intervalMinutes: number       // Minutter mellem biler
  driveTimeMinutes: number      // Fabrik → plads
  loadingTimeMinutes: number    // Default 10 min
  unloadingTimeMinutes: number  // Default 10 min
  recommendedTruckCount: number
  recommendedTruckType: string
  schedule: ScheduleRow[]
  status: 'beregnet' | 'sendt-til-vognmand' | 'bekræftet'
}

/** Én bil i køreplanen */
export interface ScheduleRow {
  truckNumber: number
  licensePlate?: string         // Tildeles af vognmand
  driver?: string
  phone?: string
  factoryDeparture: string      // "06:00"
  siteArrival: string           // "06:36"
  siteDeparture: string         // "06:46"
  factoryArrival: string        // "07:22"
  waitingMinutesSite: number    // Holdet venter
  waitingMinutesDriver: number  // Chauffør venter
  waitingMinutesFactory: number // Ved fabrik
  tons: number
  status?: 'planlagt' | 'på-vej' | 'læsser' | 'ankommet' | 'afsluttet'
}

export interface MaterielTransport {
  id: string
  orderId: string
  materielIds: string[]
  description: string
  transportType: 'blokvogn' | 'kran-baand' | 'egen-korsel'
  /** 'ud' = dag 1, 'hjem' = sidste dag */
  direction: 'ud' | 'hjem'
  plannedDate: string           // ISO dato
  state: 'planlagt' | 'bestilt' | 'bekræftet'
  // TODO: Kobles til vognmand-frontend når flow er afklaret
}

// ─── Vognmand ─────────────────────────────────────────────────────────────────

/** Transportordre sendt fra formand til vognmand */
export interface TransportOrder {
  id: string
  date: string                  // ISO dato
  orderId: string
  projectName: string
  deliveryAddress: string
  factory: string
  truckCount: number
  truckType: string
  startTime: string
  intervalMinutes: number
  tonsTotal: number
  status: 'afventer' | 'bekræftet'
  /** Tildeles af vognmand */
  trucks: TruckAssignment[]
}

export interface TruckAssignment {
  licensePlate: string
  driver: string
  phone: string
}

// ─── Timer & Rapportering ─────────────────────────────────────────────────────

export interface DriverHours {
  date: string                  // ISO dato
  orderId: string
  licensePlate: string
  driver: string
  phone: string
  drivingHours: number
  waitingHours: number
  breakHours: number
  tripCount: number
  tonsTotal: number
  approved: boolean
}

export interface CrewHours {
  date: string                  // ISO dato
  orderId: string
  employee: string
  role: string
  hours: number
  approved: boolean
}

// ─── Fælles ───────────────────────────────────────────────────────────────────

export interface Contact {
  name: string
  role: string
  phone: string
  imageUrl?: string
}

export interface NoteComment {
  id: string
  authorId: string
  authorInitials: string        // fx "OJ"
  authorName: string
  timestamp: string             // ISO 8601
  text: string
  // TODO: Erstat med Supabase når klar
}

// ─── Recepter ─────────────────────────────────────────────────────────────────

/** Asfalt-recept fra PLAN — produktkatalog */
export interface Recept {
  /** Receptkode — fx "82101H" */
  kode: string
  /** Receptnavn — fx "SMA 11S" */
  navn: string
  /** kg asfalt per m² — bruges til m² ↔ tons-beregning: m² = tons × 1000 / kg_per_m2 */
  kg_per_m2: number
  /** Densitet i kg/m³ (heltal) — bruges til faktisk tykkelse-beregning: mm = tons × 1_000_000 / (m² × densitet) */
  densitet: number
  /** Minimumstemperatur i °C — under denne grænse vises "Lav"-badge på vejeseddel */
  min_temperatur: number
}

// ─── Vejesedler ───────────────────────────────────────────────────────────────

/** Eksplicit status på et læs — sat af hook baseret på GPS + afhentet-flag. KANONISK: UI læser kun dette felt */
export type VejeseddelStatus =
  | 'paa_vej_til_fabrik'  // chauffør på vej til fabrik (disponeret, ingen GPS-afgang endnu)
  | 'paa_fabrik'          // ankommet fabrik, indvejning/læsning/udvejning i gang
  | 'undervejs'           // afsluttet vejning på fabrik, kører mod plads (ETA aktiv)
  | 'aflaesning'          // ankommet plads, læsser af
  | 'dag_afsluttet'       // NY — bilens planlagte næste-tur er overflødiggjort (sidste-læs taget af anden bil)
  | 'udlagt'              // afsluttet — udlagt + temp-målt (tidligere 'ankommet')

/**
 * Afledt view der kombinerer plan_vejebilag (PLAN) + status fra chauffør-app GPS.
 * Status-afledning:
 *   udlagt             ⇔ vejeseddelNr !== null OG tons !== null
 *   undervejs          ⇔ afgang_fabrik sat men vejeseddelNr === null
 *   paa_vej_til_fabrik ⇔ bil disponeret, ingen GPS-afgang endnu
 */
export interface Vejeseddel {
  /** Unik id — = plan_vejebilag.id når vejebilag findes, ellers temp-id */
  id: string
  /** Ordrenummer vejeseddelen tilhører — bruges til filtrering */
  ordrenummer: string
  /** Eksplicit status — KANONISK felt som UI delegerer på */
  status: VejeseddelStatus
  /** Vejeseddelnummer fra PLAN — null hvis vejebilag ikke er modtaget endnu */
  vejeseddelNr: string | null
  /** Bilens registreringsnummer */
  regnr: string
  /** Chauffør-navn fra vognmandsmodul */
  chauffoerNavn: string
  /** Receptkode fra vejeseddel (= plan_vejebilag.produkt) — null hvis vejebilag ikke modtaget */
  receptkode: string | null
  /** Fabrik-id — opslås mod fabriksstamdata */
  fabrikId: string
  /** Fabriksnavn — præ-løst af hook fra fabrikId */
  fabrikNavn: string | null
  /** Tons fra vejeseddel — null hvis vejebilag ikke modtaget */
  tons: number | null
  /** Tidspunkt vejeseddel blev modtaget i Colas (= plan_vejebilag.tidspunkt) — bruges til sortering "nyeste øverst" */
  modtagetTidspunkt: string | null
  /** Registreret temperatur i °C — null = afventer manuel registrering af formand */
  temperatur: number | null
  /** Valgt udlægger materielnr (fx "9-0009") — null hvis ikke valgt endnu */
  valgtUdlaeggerMaterielNr: string | null
  /** ETA i minutter til udførselssted — kun relevant ved status='undervejs' */
  etaMinutter: number | null
  /** Forventet ETA i minutter tildelt ved disponering — bruges til forsinkelse-beregning i EtaBadge */
  forventetEtaMinutter: number | null
  /** Multilæs-flag: bil leverer samme produkt til 2+ ordrer. Tons skal fordeles af formand.
   * Bevares som datafelt men ikke længere brugt visuelt — kontekstuelt indlejret i samleordre-mode. */
  multilaesFlag?: boolean
  /** Puljelæs-flag: bil har flere produkter til samme ordre. Ingen fordeling — tons går direkte.
   * Visuelt label er "Samles på en bil". */
  puljelaesFlag?: boolean
  /** Markeret som sidste læs for dagen (indeholder rest-tons, ikke fuld kapacitet).
   *  Beregnes automatisk fra: tons < bil_kapacitet OG sum(allokeret_tons) >= bestilt_total - bil_kapacitet.
   *  I prototypen sat manuelt i mock — i produktion beregnet i hook eller server-side.
   *  TODO: Erstat med beregning når Supabase klar */
  er_sidste_laes?: boolean
}

// ─── Dagsoverblik ─────────────────────────────────────────────────────────────

/**
 * Formands manuelle registrering af faktisk udlagt for én dag på én ordre.
 * Én registrering per (ordrenummer, dato) — overskrives ved hver gem.
 */
export interface DagsoverblikRegistrering {
  /** ISO yyyy-mm-dd — hvilken dag registreringen gælder */
  dato: string
  /** Faktisk udlagt areal i m² — null hvis ikke registreret endnu */
  faktiskM2: number | null
  /** Faktisk udlagt tons — null hvis ikke registreret endnu */
  faktiskTons: number | null
  /** Tidspunkt for seneste gem (ISO 8601) — null hvis ikke gemt endnu */
  gemtTidspunkt: string | null
}
