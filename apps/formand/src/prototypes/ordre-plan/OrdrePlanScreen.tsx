/**
 * PROTOTYPE — Ordre Planlægnings-mode (v2 layout)
 * Sprint 1 — Element 3
 * Viser dagfordeling, materiel og transport for én ordre.
 * Må ikke importeres i produktionskode.
 */
import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Phone,
  Truck,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Pencil,
  Mic,
  Camera,
  CloudRain,
  CheckCircle2,
  MessageSquare,
  Layers,
  AlertTriangle,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { TabName } from '@/types/navigation'
import { OrdreInfoCard } from '@/components/ui/OrdreInfoCard'
import { FremdriftCard } from '@/components/ui/FremdriftCard'
import { FremdriftInputRow } from '@/components/ui/FremdriftInputRow'
import { VejesedlerTable } from '@/components/ui/VejesedlerTable'
import { useRecept } from '@/hooks/useRecept'
import { useVejesedler } from '@/hooks/useVejesedler'
import { useDagsoverblik } from '@/hooks/useDagsoverblik'
import { INITIAL_RECEPTER } from '@/mocks/recepter'
import { INITIAL_UDLAEGGERE } from '@/mocks/udlaeggere'

// ─── Types ───────────────────────────────────────────────────────────────────

type CancelReason = 'regn' | 'frost' | 'underlag' | 'andet'

interface DayPlan {
  id: string
  day: number
  date: string         // YYYY-MM-DD
  tonsPlanned: number
  morgenTons?: number  // morgen-bekræftelse
  cancelled: boolean
  cancelReason?: CancelReason
}

interface MockProduct {
  id: string
  recipeCode: string
  recipeName: string
  activityName: string
  m2: number
  thicknessMm: number
  tonsTotal: number
  factory: { code: string; name: string; driveTimeMinutes: number }
  estimatedTrucks: number
  estimatedTonsPerTruck: number
  days: DayPlan[]
  startDate?: string
  endDate?: string
  // Felter fra PLAN — kilde: PLAN-system
  kravTilSamlinger?: string           // fx "Klæbet" / "Ikke klæbet"
  ekstraTemperaturmaalinger?: boolean // Ja/Nej
  // TODO: Erstat med Supabase når klar — A3/A4/MKS-skemaer oprettes senere under Udførelse-menupunktet.
  // Entreprisekontrol og Temperaturmåling kommer fra PLAN og styrer skema-krav:
  //   værdi 1 → kun MKS skal udfyldes
  //   værdi 2 → A3, A4, MKS skal udfyldes
  //   undefined → intet skema-krav
  // Når begge felter er sat, vises union af krav (strengeste vinder).
  entreprisekontrol?: 1 | 2
  temperaturmaaling?: 1 | 2
}

interface MockResource {
  id: string
  plantNumber: string
  description: string
  transportTag: 'blokvogn' | 'kran-baand' | 'egen-korsel'
  status: 'planlagt' | 'ikke-planlagt'
}


interface VehicleOrder {
  id: string
  type: string
  antal: number
  foersteLaes?: boolean
}

interface KørselPause {
  id: string
  time: string
  durationMin: number
}

interface KørselDayParams {
  driveMinutes: number
  loadMinutes: number
  deliverMinutes: number
  intervalMinutes: number
  firstLoadTime: string
  lastLoadTime: string
  pauses: KørselPause[]
}

const VEHICLE_TYPES: { label: string; tons: number }[] = [
  { label: '6 Aks',          tons: 32 },
  { label: '7 Aks',          tons: 35 },
  { label: 'Forvogn',        tons: 18 },
  { label: 'Forvogn/Kærre',  tons: 32 },
  { label: 'Grab',           tons: 28 },
  { label: 'Sneglebil',      tons: 15 },
  { label: 'Snegl m. kærre', tons: 30 },
  { label: 'Sideudlægger',   tons: 16 },
]

const DEFAULT_KØRSEL_PARAMS: KørselDayParams = {
  driveMinutes:    36,
  loadMinutes:     15,
  deliverMinutes:  10,
  intervalMinutes: 20,
  firstLoadTime:   '07:00',
  lastLoadTime:    '15:00',
  pauses:          [],
}

// ─── Ekstra-bestilling ──────────────────────────────────────────────────────
// Drip-bestilling der opstår når formand løbende på dagen bestiller mere asfalt
// end den oprindelige morgen-tons rakte.
//   - Puljelæs ON: ekstra deler bil med andre ekstras (samme ordre, samme dag) der også har puljelæs ON
//     → implicit gruppe; ingen eksplicit parring
//   - Multilæs ON: ekstra udvider scope til andre ordrer (samme dag); union af produkter i dropdown
//     → fordeling om aftenen via vejesedler/bilafregning
// Puljelæs og multilæs er adskilte scopes og kan kombineres.
// TODO: Erstat med Supabase når klar — fordeling pr. ordre afgøres om aftenen via vejesedler.
interface EkstraBestilling {
  id: string
  date: string             // YYYY-MM-DD — samme dag som morgen-bestillingen
  productId: string        // produkt-reference
  tons: number
  puljelaes: boolean       // del bil med andre puljelæs-ON ekstras (samme ordre+date)
  multilaes: boolean       // udvid scope til andre ordrer
  // Når multilaes ON: andre ordrer denne bil også leverer til (skal være samme dag)
  andreOrdrer: string[]
  sent: boolean
}

// ─── Andre ordrer på dagen (for multilæs-picker + ordre-pille-strip) ──────
// Inline mock — matcher Dagsoversigt for de relevante datoer (alle bortset fra denne ordre 1212343).
// TODO: Erstat med Supabase — andre ordrer for samme formand og dato.
interface AndenOrdre {
  id: string
  orderNumber: string
  jobnummer: string
  udfoerelseSted: string   // adresse + by — vises i ordre-pille-strip
  products: { id: string; recipeCode: string; recipeName: string }[]
}

const ANDRE_ORDRER_FOR_DATO: Record<string, AndenOrdre[]> = {
  '2026-03-17': [
    {
      id: 'ord-1212344',
      orderNumber: '1212344',
      jobnummer: '187. Havnevej Roskilde',
      udfoerelseSted: 'Havnevej 12, 4000 Roskilde',
      products: [{ id: 'op2-1', recipeCode: 'ABB 11', recipeName: 'ABB 11' }],
    },
    {
      id: 'ord-1212350',
      orderNumber: '1212350',
      jobnummer: '412. Ringvej Næstved E3',
      udfoerelseSted: 'Ringvej Syd 44, 4700 Næstved',
      products: [{ id: 'op3-1', recipeCode: 'SMA 8S', recipeName: 'SMA 8S' }],
    },
    {
      id: 'ord-1212351',
      orderNumber: '1212351',
      jobnummer: '298. BMF Vordingborg',
      udfoerelseSted: 'Algade 18, 4760 Vordingborg',
      products: [{ id: 'op4-1', recipeCode: 'GAB 0/16', recipeName: 'GAB 0/16' }],
    },
  ],
  '2026-03-18': [
    {
      id: 'ord-1212346',
      orderNumber: '1212346',
      jobnummer: '377. Boligvej Køge',
      udfoerelseSted: 'Boligvej 5, 4600 Køge',
      products: [{ id: 'op6-1', recipeCode: 'GAB I', recipeName: 'GAB I' }],
    },
    {
      id: 'ord-1212347',
      orderNumber: '1212347',
      jobnummer: '289. SVR Greve',
      udfoerelseSted: 'Strandvejen 2, 2670 Greve',
      products: [{ id: 'op7-1', recipeCode: 'ABB 11', recipeName: 'ABB 11' }],
    },
  ],
}


// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_PRODUCTS: MockProduct[] = [
  {
    id: 'p1',
    recipeCode: '23001B',
    recipeName: 'GAB I',
    activityName: 'GAB I at levere og udlægge, 80mm',
    m2: 67,
    thicknessMm: 80,
    tonsTotal: 200,
    factory: { code: '29000', name: 'PROD A EAST KØGE PH', driveTimeMinutes: 36 },
    estimatedTrucks: 2,
    estimatedTonsPerTruck: 26,
    startDate: '2026-03-17',
    endDate: '2026-03-19',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: true,
    entreprisekontrol: 1,
    temperaturmaaling: 1,
    days: [
      { id: 'd1-1', day: 1, date: '2026-03-17', tonsPlanned: 70, cancelled: false },
      { id: 'd1-2', day: 2, date: '2026-03-18', tonsPlanned: 70, cancelled: false },
      { id: 'd1-3', day: 3, date: '2026-03-19', tonsPlanned: 60, cancelled: false },
    ],
  },
  {
    id: 'p2',
    recipeCode: '82101H',
    recipeName: 'SMA 11S',
    activityName: 'SMA 11S at levere og udlægge, 45mm',
    m2: 4017,
    thicknessMm: 45,
    tonsTotal: 752,
    factory: { code: '29000', name: 'PROD A EAST KØGE PH', driveTimeMinutes: 36 },
    estimatedTrucks: 3,
    estimatedTonsPerTruck: 30,
    startDate: '2026-03-16',
    endDate: '2026-03-18',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: true,
    entreprisekontrol: 2,
    temperaturmaaling: 2,
    days: [
      { id: 'd2-1', day: 1, date: '2026-03-16', tonsPlanned: 250, cancelled: false },
      { id: 'd2-2', day: 2, date: '2026-03-17', tonsPlanned: 250, cancelled: false },
      { id: 'd2-3', day: 3, date: '2026-03-18', tonsPlanned: 252, cancelled: false },
    ],
  },
]

const INITIAL_RESOURCES: MockResource[] = [
  { id: 'r1', plantNumber: '5-0034', description: 'HAMM HD10 VT',      transportTag: 'blokvogn',    status: 'planlagt' },
  { id: 'r2', plantNumber: '3-0112', description: 'VÖGELE 1900-3I',    transportTag: 'blokvogn',    status: 'ikke-planlagt' },
  { id: 'r3', plantNumber: '7-0078', description: 'HAMM DV70VV',       transportTag: 'kran-baand',  status: 'ikke-planlagt' },
  { id: 'r4', plantNumber: '9-0009', description: 'Sættevogn 7-aksel', transportTag: 'egen-korsel', status: 'ikke-planlagt' },
]



const CANCEL_REASONS: { value: CancelReason; label: string }[] = [
  { value: 'regn',     label: 'Regn' },
  { value: 'frost',    label: 'Frost' },
  { value: 'underlag', label: 'Underlag' },
  { value: 'andet',    label: 'Andet' },
]


// ─── Mock documentation data ──────────────────────────────────────────────────

interface NoteComment {
  id: string
  initials: 'OJ' | 'HT'
  name: string
  timestamp: string
  text: string
}

const INITIAL_COMMENTS: NoteComment[] = [
  {
    id: 'nc1',
    initials: 'OJ',
    name: 'Ole Jensen',
    timestamp: '14. mar · 08:42',
    text: 'Området er opmålt og klargjort. Underlag ser fornuftigt ud — mindre ujævnheder ved indkørslen mod nord er udbedret. Koordination med skolens vicevært er på plads, adgang sikret fra kl. 06:00.',
  },
  {
    id: 'nc2',
    initials: 'HT',
    name: 'Henrik Thor',
    timestamp: '14. mar · 11:15',
    text: 'Besigtigelse gennemført. Bemærk at det nordøstlige hjørne kræver ekstra komprimering — kunden har påpeget sætninger fra tidligere belægning. Aftalt med Ole at vi tager et ekstra gennemløb med HAMM HD10 i det område inden udlægning af lag 2.',
  },
]

interface MockPhoto { id: string; color: string; label: string; source?: string; url?: string }

const INITIAL_PHOTOS: MockPhoto[] = [
  { id: 'ph1', color: 'bg-dark-teal/20',  label: 'Foto 1' },
  { id: 'ph2', color: 'bg-yellow/30',     label: 'Foto 2' },
  { id: 'ph3', color: 'bg-light-aqua/60', label: 'Foto 3' },
]

// ─── Samleordre mock-data ─────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar — samleordrer fra samleordrer-tabel

interface SamleordreChild {
  orderNumber: string
  jobnummer: string
  udfoerelseSted: string
  /** Kort stedangivelse til tab-label (fx "Søvej" eller "Strandvejen") */
  stedLabel: string
  isAnchor: boolean
  products: {
    id: string
    recipeCode: string
    recipeName: string
    tonsTotal: number
  }[]
  resources: MockResource[]
}

interface SamleordreContext {
  id: string
  children: SamleordreChild[]
}

const MOCK_SAMLEORDRE: SamleordreContext = {
  id: 'samle-001',
  children: [
    {
      // Anchor: den aktuelle ordre (1212343)
      orderNumber: '1212343',
      jobnummer: '52. VD Kibæk Vammen',
      udfoerelseSted: 'Søvej 6D, 4900 Nakskov',
      stedLabel: 'Søvej',
      isAnchor: true,
      products: [
        { id: 'p1', recipeCode: '23001B', recipeName: 'GAB I', tonsTotal: 200 },
        { id: 'p2', recipeCode: '82101H', recipeName: 'SMA 11S', tonsTotal: 752 },
      ],
      resources: [
        { id: 'r1', plantNumber: '5-0034', description: 'HAMM HD10 VT',      transportTag: 'blokvogn',    status: 'planlagt' },
        { id: 'r2', plantNumber: '3-0112', description: 'VÖGELE 1900-3I',    transportTag: 'blokvogn',    status: 'ikke-planlagt' },
        { id: 'r3', plantNumber: '7-0078', description: 'HAMM DV70VV',       transportTag: 'kran-baand',  status: 'ikke-planlagt' },
      ],
    },
    {
      // Anden ordre i samleordren
      orderNumber: '1212347',
      jobnummer: '289. SVR Greve',
      udfoerelseSted: 'Strandvejen 2, 2670 Greve',
      stedLabel: 'Strandvejen',
      isAnchor: false,
      products: [
        // SMA 11S overlapper med anchor → samles i bestillings-rækken
        { id: 'sp2', recipeCode: '82101H', recipeName: 'SMA 11S', tonsTotal: 200 },
        // Unikt produkt for denne ordre
        { id: 'sp3', recipeCode: 'ABB11',  recipeName: 'ABB 11',  tonsTotal: 100 },
      ],
      resources: [],
    },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatWeekday(dateStr: string) {
  return ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'][new Date(dateStr + 'T00:00:00').getDay()]
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}

const DA_MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']
function formatLongDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}. ${DA_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Frozen "today" for prototype — bruger mock-dato svarende til produkternes range
// TODO (produktion): Erstat med new Date() og tilpas INITIAL_PRODUCTS til rigtige datoer
const TODAY = new Date('2026-03-17T00:00:00')

function dateToString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}



// ─── Types (mode) ─────────────────────────────────────────────────────────────

type OrderMode = 'planlaegning' | 'udfoersel'

type UnderlagType = 'asfalt' | 'grus' | 'beton' | 'fraeset' | 'andet'
type UnderlaegsAarsag = 'revner' | 'sporkoert' | 'krakeleret' | 'ujaevn' | 'saetninger' | 'snavs' | 'bloed' | 'graes-ukrudt'

// ─── Vejeseddel types (inline prototype) ──────────────────────────────────────
// TODO: Erstat med Supabase når klar — data fra plan_vejebilag-tabel

interface PreFordeling {
  ordre_id: string
  ordre_label: string     // fx "1212343 · Søvej 6D"
  tons: number
  is_anchor: boolean      // anchor-ordre vises først med gul prik
}

interface Vejeseddel {
  id: string
  product_code: string        // fx "ABB 11"
  product_name: string        // fx "ABB 11 toplag"
  netto_tons: number
  multilaes_flag: boolean
  puljelaes_flag: boolean
  aflæsset_efter_1_5t: boolean  // for akkord-biler: om 1.5-times-reglen er trådt i kraft
  /**
   * Puljelæs-gruppe-id: vejesedler med samme bil + samme læs_id tilhører én pulje.
   * Undefined for normale læs og multilæs.
   * TODO: Erstat med Supabase når klar — fra plan_vejebilag.laes_id
   */
  laes_id?: string
  // pre-mock fordeling (vises som initial state for multilæs)
  pre_fordeling: PreFordeling[]
}

// ─── Afregning types (inline prototype) ──────────────────────────────────────

type AfregningType = 'time' | 'akkord'

interface ChauffoerAfregning {
  chauffoer_navn: string
  reg_nr?: string                // null for materiel
  afregning_type?: AfregningType // undefined → fallback time + banner
  // Prædufyldte fra chauffør-app (alle valgfrie)
  // TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
  koretimer?: number
  ventetid?: number
  pause?: number
  tons_koert?: number            // fra PLAN vejebilag (mock for nu)
  chauffoer_kommentar?: string
  // State
  godkendt_af_formand: boolean
  godkendt_tidspunkt?: string
}

interface ConfirmedTruck {
  regnr: string
  chauffoer: string
  tlf: string
  biltype: string
  afregning?: Omit<ChauffoerAfregning, 'chauffoer_navn' | 'reg_nr'>
  /** Sat til true for biler der kører materiel (blokvogn, kran-bånd etc.) */
  er_materiel_bil?: boolean
  /** Liste over materiel-beskrivelser bilen kører, fx ['HAMM HD10 VT', 'VÖGELE 1900-3I'] */
  koert_materiel?: string[]
  /** Vejesedler for bilen — én pr. produkt, arvet fra plan_vejebilag */
  vejesedler?: Vejeseddel[]
}

interface VognmandBekraeftelse {
  dayId: string
  biler: ConfirmedTruck[]
  bekraeftetTidspunkt: string // "DD. mmm · HH:MM"
}

interface ConfirmedMaterielItem {
  resourceId: string
  anlaegsNr: string
  beskrivelse: string
  regnr: string
  chauffoer: string
  tlf: string
  transportType: string
  // Afregning — kun første materiel-enhed per chauffør bærer afregning
  // TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
  afregning_type?: AfregningType
  afregning_timer?: number
  afregning_ventetid?: number
  afregning_chauffoer_kommentar?: string
}

interface VognmandMaterielBekraeftelse {
  items: ConfirmedMaterielItem[]
  bekraeftetTidspunkt: string
}

// TODO: Erstat med Supabase Realtime subscription.
// Når vognmand godkender disponering (inkl. materiel) i VognmandDisponeringsScreen:
//   1. Supabase opdaterer ordre-rækken med bekræftede transport-data
//   2. Formand-app modtager via Realtime og opdaterer denne state
//   3. Badges i Planlægning → Materiellevering skifter til grønt
//   4. UdfoerselContent → Materiel-sektion viser bekræftede data
// Se .claude/docs/MATERIEL_FLOW.md for fuld spec.
// TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
const INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE: VognmandMaterielBekraeftelse = {
  bekraeftetTidspunkt: '15. mar · 17:05',
  items: [
    {
      resourceId: 'r1',
      anlaegsNr: '5-0034',
      beskrivelse: 'HAMM HD10 VT',
      regnr: 'BL77331',
      chauffoer: 'Lars Pedersen',
      tlf: '20 30 40 50',
      transportType: 'Blokvogn',
      // Første og eneste materiel for Lars Pedersen → afregning herunder
      afregning_type: 'time',
      afregning_timer: 8.5,
      afregning_ventetid: 1,
      afregning_chauffoer_kommentar: 'Pakket ud og ind 2 gange — ændret placering af tromle.',
    },
    {
      resourceId: 'r2',
      anlaegsNr: '3-0112',
      beskrivelse: 'VÖGELE 1900-3I',
      regnr: 'BL77331',
      chauffoer: 'Lars Pedersen',
      tlf: '20 30 40 50',
      transportType: 'Blokvogn',
      // Anden enhed for Lars Pedersen → ingen afregning-knap (groupering)
    },
    {
      resourceId: 'r3',
      anlaegsNr: '7-0078',
      beskrivelse: 'HAMM DV70VV',
      regnr: 'KK45892',
      chauffoer: 'Bent Sørensen',
      tlf: '31 42 53 64',
      transportType: 'Kran-bånd',
      // Kun én enhed for Bent Sørensen → afregning herunder
      afregning_type: 'time',
      afregning_timer: 7,
      afregning_ventetid: 0,
    },
  ],
}

// Mock: dag d2-1 er bekræftet af vognmand, d2-2 afventer vognmand
// TODO: Erstat med Supabase Realtime subscription.
// Når vognmand godkender disponering i VognmandDisponeringsScreen:
//   1. dispMap (Record<dato, reg[]>) sendes til Supabase
//   2. Formand-app modtager via Realtime og opdaterer denne state
//   3. Badges i Planlægning → Asfalt kørsel skifter per dag
//   4. UdfoerselContent → Bestilte biler viser bekræftede biler for dagens dato
// Se .claude/docs/MATERIEL_FLOW.md for fuld spec.
// TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
const INITIAL_VOGNMAND_BEKRAEFTELSER: Record<string, VognmandBekraeftelse> = {
  'd2-1': {
    dayId: 'd2-1',
    bekraeftetTidspunkt: '15. mar · 16:42',
    biler: [
      {
        regnr: 'AB 12 345',
        chauffoer: 'Morten Lund',
        tlf: '22 33 44 55',
        biltype: '6 Aks',
        // time-afregning med prædufyldte værdier fra chauffør-app
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 0.5,
          pause: 0.5,
          chauffoer_kommentar: 'Ventet 30 min ved fabrikken pga. kø ved indvejning.',
          godkendt_af_formand: false,
        },
        // TODO: Erstat med Supabase når klar — vejesedler fra plan_vejebilag-tabel
        vejesedler: [
          {
            id: 'vsb-1',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 28.0,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 28.0, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'CD 67 890',
        chauffoer: 'Søren Karlsen',
        tlf: '26 77 88 99',
        biltype: '6 Aks',
        // akkord-afregning — tons arves fra vejesedler (49.2t multilæs + 12.5t puljelæs = 61.7t)
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 61.7,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        // TODO: Erstat med Supabase når klar — vejesedler fra plan_vejebilag-tabel
        vejesedler: [
          {
            id: 'vsb-2',
            product_code: 'ABB 11',
            product_name: 'ABB 11 toplag',
            netto_tons: 49.2,
            multilaes_flag: true,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            // Pre-mock fordeling: A=30t (anchor), B=10t, C=9.2t
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 30.0, is_anchor: true },
              { ordre_id: 'ord-1212344', ordre_label: '1212344 · Havnevej 12', tons: 10.0, is_anchor: false },
              { ordre_id: 'ord-1212350', ordre_label: '1212350 · Ringvej Syd 44', tons: 9.2, is_anchor: false },
            ],
          },
          {
            id: 'vsb-3',
            product_code: 'GAB 1',
            product_name: 'GAB 0/16 bærelag',
            netto_tons: 12.5,
            multilaes_flag: false,
            puljelaes_flag: true,
            aflæsset_efter_1_5t: false,
            // TODO: Erstat med Supabase når klar — laes_id fra plan_vejebilag-tabel
            laes_id: 'laes-pulje-1',
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 12.5, is_anchor: true },
            ],
          },
          {
            id: 'vsb-4',
            product_code: 'GAB 0/8',
            product_name: 'GAB 0/8 slidlag',
            netto_tons: 8.4,
            multilaes_flag: false,
            puljelaes_flag: true,
            aflæsset_efter_1_5t: false,
            laes_id: 'laes-pulje-1',
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 8.4, is_anchor: true },
            ],
          },
          {
            id: 'vsb-5',
            product_code: 'SMA 8S',
            product_name: 'SMA 8S toplag',
            netto_tons: 6.2,
            multilaes_flag: false,
            puljelaes_flag: true,
            aflæsset_efter_1_5t: false,
            laes_id: 'laes-pulje-1',
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 6.2, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'EF 11 223',
        chauffoer: 'Lars Holm',
        tlf: '40 12 56 78',
        biltype: '7 Aks',
        // INGEN afregning_type → trigger fallback-banner + default time
        afregning: {
          afregning_type: undefined,
          koretimer: 8,
          ventetid: 0,
          pause: 0,
          godkendt_af_formand: true,
          godkendt_tidspunkt: '16. mar · 09:14',
        },
      },
      // Akkord-bil med 1,5-times-reglen triggered
      // TODO: Erstat med Supabase når klar — vejesedler og 1.5t-flag fra plan_vejebilag-tabel
      {
        regnr: 'GH 33 441',
        chauffoer: 'Kim Vestergaard',
        tlf: '51 62 73 84',
        biltype: '7 Aks',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 35.0,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-6',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 35.0,
            multilaes_flag: false,
            puljelaes_flag: false,
            // 1.5-times-reglen er trådt i kraft for dette læs
            aflæsset_efter_1_5t: true,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 35.0, is_anchor: true },
            ],
          },
        ],
      },
      // TODO: Erstat med Supabase når klar — materiel-biler fra vognmand.aftaler.materiel[]
      {
        regnr: 'BL77331',
        chauffoer: 'Lars Pedersen',
        tlf: '20 30 40 50',
        biltype: 'Blokvogn',
        er_materiel_bil: true,
        koert_materiel: ['HAMM HD10 VT (5-0034)', 'VÖGELE 1900-3I (3-0112)'],
        afregning: {
          afregning_type: 'time',
          koretimer: 8.5,
          ventetid: 1,
          chauffoer_kommentar: 'Pakket ud og ind 2 gange — ændret placering af tromle.',
          godkendt_af_formand: false,
        },
      },
      {
        regnr: 'KK45892',
        chauffoer: 'Bent Sørensen',
        tlf: '31 42 53 64',
        biltype: 'Kran-bånd',
        er_materiel_bil: true,
        koert_materiel: ['HAMM DV70VV (7-0078)'],
        afregning: {
          afregning_type: 'time',
          koretimer: 7,
          ventetid: 0,
          godkendt_af_formand: false,
        },
      },
    ],
  },
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function OrdrePlanScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  // Læs initial-dato + samleordreId fra URL-params (primært) eller location.state (fallback).
  // URL-params giver bookmarkable + refreshable + deeplinkable samleordre-visning.
  // TODO (produktion): Også orderId fra path-param hvis nested route bygges.
  const navState = location.state as { selectedDate?: string; initialDate?: string; orderId?: string; samleordreId?: string } | null
  const urlSamleordreId = searchParams.get('samleordreId')
  const urlSelectedDate = searchParams.get('date')
  const initialPlanDate = urlSelectedDate ?? navState?.selectedDate ?? navState?.initialDate
  // Samleordre-mode: aktiveres når samleordreId er sat i URL eller navigation.state
  // TODO: Erstat med Supabase når klar — hent samleordre fra samleordrer-tabel
  const isSamleordreMode = !!(urlSamleordreId ?? navState?.samleordreId)
  const samleordreCtx = isSamleordreMode ? MOCK_SAMLEORDRE : null
  const [activeTab, setActiveTab] = useState<TabName>('dagens-opgaver')
  // Samleordre Ordredetaljer tab: hvilken child-ordre vises i spec-grid
  const [samleordreTabOrderNr, setSamleordreTabOrderNr] = useState<string>(() =>
    MOCK_SAMLEORDRE.children.find(c => c.isAnchor)?.orderNumber ?? MOCK_SAMLEORDRE.children[0].orderNumber
  )
  const [activeMode, setActiveMode] = useState<OrderMode>('planlaegning')
  const [activeProductId, setActiveProductId] = useState('p2')
  const [products, setProducts] = useState<MockProduct[]>(INITIAL_PRODUCTS)
  // Valgt dag i Bestilling-rækken (driver produkt-bokse + planlægning for ordren)
  // Initialiseres fra location.state eller TODAY.
  const [selectedPlanDate, setSelectedPlanDate] = useState<string>(
    initialPlanDate ?? dateToString(TODAY)
  )
  // Ekstra-bestillinger pr. dato
  // TODO: Erstat med Supabase når klar
  const [ekstraBestillinger, setEkstraBestillinger] = useState<EkstraBestilling[]>([])
  // Bekræftelses-modal før afsendelse til fabrik
  const [showConfirmSend, setShowConfirmSend] = useState(false)
  // TODO: Erstat med Supabase når klar — kommentar gemmes på ordren ved afsendelse
  const [kommentar, setKommentar] = useState('')
  const [resources, setResources] = useState<MockResource[]>(INITIAL_RESOURCES)
  const [fjernModalId, setFjernModalId] = useState<string | null>(null)
  const [cancellingDayId, setCancellingDayId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<MockPhoto[]>(INITIAL_PHOTOS)
  const [opmaalingOpen, setOpmaalingOpen] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [besigtigelseComment, setBesigtigelseComment] = useState('')
  const [noteComments, setNoteComments] = useState<NoteComment[]>(INITIAL_COMMENTS)
  const [sentDayIds, setSentDayIds] = useState<Set<string>>(new Set())
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(null)
  const [udlaantIds, setUdlaantIds] = useState<Set<string>>(new Set())
  const [fakturaOrdre, setFakturaOrdre] = useState<Record<string, string>>({})
  const [afhentningAdresse, setAfhentningAdresse] = useState<Record<string, string>>({})
  const [afhentningPostnr, setAfhentningPostnr] = useState<Record<string, string>>({})
  const [afhentningKlar, setAfhentningKlar] = useState<Record<string, string>>({})
  const [afhentningLevering, setAfhentningLevering] = useState<Record<string, string>>({})
  // null = ikke besvaret endnu, true = samme som første, false = nyt sted
  const [sammeAflæsning, setSammeAflæsning] = useState<Record<string, boolean | null>>({})
  const [kørselExpandedId, setKørselExpandedId] = useState<string | null>(null)
  // TODO: Erstat med Supabase — d2-1 og d2-2 er forudfyldte til demo
  const [kørselPlanlagtIds, setKørselPlanlagtIds] = useState<Set<string>>(new Set(['d2-1', 'd2-2']))
  // TODO: Erstat med Supabase — forudfyldte kørselordre til demo
  const [kørselOrders, setKørselOrders] = useState<Record<string, VehicleOrder[]>>({
    'd2-1': [
      { id: 'vo-d21-1', type: '6 Aks', antal: 2 },
      { id: 'vo-d21-2', type: '7 Aks', antal: 1 },
    ],
    'd2-2': [
      { id: 'vo-d22-1', type: '6 Aks', antal: 2 },
    ],
  })
  const [kørselParams, setKørselParams] = useState<Record<string, KørselDayParams>>({})
  const [factoryKm, setFactoryKm] = useState(36) // TODO: initialiseres fra ordre.factory.km
  const [kørselKommentar, setKørselKommentar] = useState<Record<string, string>>({})
  const [materielKommentar, setMaterielKommentar] = useState<Record<string, string>>({})
  const [vognmandBekraeftelser] = useState<Record<string, VognmandBekraeftelse>>(INITIAL_VOGNMAND_BEKRAEFTELSER)
  const [vognmandMaterielBekraeftelse] = useState<VognmandMaterielBekraeftelse>(INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE)

  const activeProduct = products.find(p => p.id === activeProductId)!
  const days = activeProduct.days
  const activeDays = days.filter(d => !d.cancelled)

  // ── Dato-først model ──────────────────────────────────────────────────────
  // Ordrens samlede dag-spænd = min(start) til max(end) over alle produkter
  const orderStartDate = useMemo(() => {
    return products.reduce((min, p) => (p.startDate && (!min || p.startDate < min) ? p.startDate : min), '' as string)
  }, [products])
  const orderEndDate = useMemo(() => {
    return products.reduce((max, p) => (p.endDate && (!max || p.endDate > max) ? p.endDate : max), '' as string)
  }, [products])

  // Alle dage i ordrens spænd (inkl. dage uden produkter — vises grayed-out i pillen)
  const planDays = useMemo(() => {
    if (!orderStartDate || !orderEndDate) return [] as string[]
    const out: string[] = []
    let cur = new Date(orderStartDate + 'T00:00:00')
    const end = new Date(orderEndDate + 'T00:00:00')
    while (cur <= end) {
      out.push(dateToString(cur))
      cur = addDays(cur, 1)
    }
    return out
  }, [orderStartDate, orderEndDate])

  // Produkter for valgt dag (med deres day-objekt for den dag)
  const productsForSelectedDate = useMemo(() => {
    return products
      .map(p => ({ product: p, day: p.days.find(d => d.date === selectedPlanDate) }))
      .filter((x): x is { product: MockProduct; day: DayPlan } => !!x.day)
  }, [products, selectedPlanDate])

  // Ekstra-bestillinger for valgt dag
  const ekstraForSelectedDate = ekstraBestillinger.filter(eb => eb.date === selectedPlanDate)

  // Default ordre/produkt på dato-skift: hvis det fokuserede produkt ikke har et
  // day-objekt for selectedPlanDate, skift til første produkt der HAR en day på dagen.
  // Sikrer at Spec-grid altid viser noget meningsfuldt.
  useEffect(() => {
    if (productsForSelectedDate.length === 0) return
    const currentMatches = productsForSelectedDate.some(({ product }) => product.id === activeProductId)
    if (!currentMatches) {
      setActiveProductId(productsForSelectedDate[0].product.id)
    }
  }, [selectedPlanDate, productsForSelectedDate, activeProductId])

  function updateTons(productId: string, dayId: string, value: number) {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, tonsPlanned: value } : d) }
        : p
    ))
  }

  function updateMorgenTons(productId: string, dayId: string, value: number | undefined) {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, morgenTons: value } : d) }
        : p
    ))
  }

  function cancelDay(productId: string, dayId: string, reason: CancelReason) {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, cancelled: true, cancelReason: reason, tonsPlanned: 0 } : d) }
        : p
    ))
    setCancellingDayId(null)
  }

  function restoreDay(dayId: string) {
    setProducts(prev => prev.map(p =>
      p.id === activeProductId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, cancelled: false, cancelReason: undefined } : d) }
        : p
    ))
  }

  function addEkstraBestilling() {
    const defaultProductId = productsForSelectedDate[0]?.product.id ?? activeProductId
    setEkstraBestillinger(prev => [
      ...prev,
      {
        id: `eb-${Date.now()}`,
        date: selectedPlanDate,
        productId: defaultProductId,
        tons: 0,
        puljelaes: false,
        multilaes: false,
        andreOrdrer: [],
        sent: false,
      },
    ])
  }

  function updateEkstraBestilling(id: string, patch: Partial<EkstraBestilling>) {
    setEkstraBestillinger(prev => prev.map(eb => eb.id === id ? { ...eb, ...patch } : eb))
  }

  function removeEkstraBestilling(id: string) {
    setEkstraBestillinger(prev => prev.filter(eb => eb.id !== id))
  }

  // Send alle ikke-sendte morgen-bestillinger for valgt dag samtidigt
  function sendAlleForSelectedDate() {
    const dayIds = productsForSelectedDate
      .filter(({ day }) => day.morgenTons != null && !sentDayIds.has(day.id))
      .map(({ day }) => day.id)
    setSentDayIds(prev => new Set([...prev, ...dayIds]))
    // Send også ikke-sendte ekstra-bestillinger for dagen
    const ekstraIds = ekstraForSelectedDate.filter(eb => !eb.sent && eb.tons > 0).map(eb => eb.id)
    setEkstraBestillinger(prev => prev.map(eb => ekstraIds.includes(eb.id) ? { ...eb, sent: true } : eb))
  }

  function removeResource(id: string) {
    setResources(prev => prev.filter(r => r.id !== id))
    setFjernModalId(null)
  }

  function markTransportPlanlagt(id: string) {
    setResources(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'planlagt' } : r
    ))
  }

  const fjernModalResource = fjernModalId ? resources.find(r => r.id === fjernModalId) : null

  // Genbrugbar Ordredetaljer-visning: samleordre split-view med tabs ELLER fuld bredde Spec-grid.
  // Bruges både på Planlægning-mode (direkte synlig) og Udførsel-mode (i collapsed-expander).
  const ordredetaljerCard = (
    isSamleordreMode && samleordreCtx ? (
      <div className="mb-lg">
        {/* Tabs ovenpå spec-grid — kun fyldt op til indholdet, ikke fuld bredde */}
        <div className="inline-flex gap-xxxs">
          {samleordreCtx.children.map(child => {
            const isActive = child.orderNumber === samleordreTabOrderNr
            return (
              <button
                key={child.orderNumber}
                onClick={() => setSamleordreTabOrderNr(child.orderNumber)}
                aria-pressed={isActive}
                className={[
                  'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                  isActive
                    ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                    : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                ].join(' ')}
              >
                {child.isAnchor && (
                  <span
                    className="w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0"
                    aria-label="Anchor-ordre"
                  />
                )}
                <span>{child.stedLabel}</span>
              </button>
            )
          })}
        </div>
        <div className="bg-white border border-hairline rounded-tr-xl rounded-b-xl overflow-hidden">
          {(() => {
            const tabChild = samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
            if (!tabChild) return null
            const tabProduct = tabChild.isAnchor ? activeProduct : null
            return (
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-4 divide-x divide-hairline bg-white">
                  <div className="p-sm">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Mængde</span>
                    <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">
                      {tabProduct ? tabProduct.tonsTotal : tabChild.products.reduce((s, p) => s + p.tonsTotal, 0)}{' '}
                      <small className="font-inter text-xs text-text-muted">tons</small>
                    </span>
                  </div>
                  <div className="p-sm">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Produkter</span>
                    {tabChild.products.map(p => (
                      <div key={p.id}>
                        <span className="font-poppins font-semibold text-sm text-text-primary tabular-nums block leading-tight">
                          {p.recipeCode}
                        </span>
                        <span className="font-inter text-xxs text-text-muted">
                          {p.recipeName} · {p.tonsTotal} t
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-sm">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Udførselssted</span>
                    <span className="font-inter text-sm text-text-primary leading-snug block">
                      {tabChild.udfoerelseSted}
                    </span>
                    {tabChild.isAnchor && (
                      <span className="inline-flex items-center gap-xxxs mt-xxxs">
                        <span className="w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0" />
                        <span className="font-inter text-xxs text-text-muted">Anchor</span>
                      </span>
                    )}
                  </div>
                  <div className="p-sm">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
                    {tabProduct ? (
                      <>
                        <span className="font-poppins font-semibold text-sm text-text-primary leading-tight block">
                          {tabProduct.factory.name}
                        </span>
                        <span className="font-inter text-xs text-text-muted">
                          {tabProduct.factory.driveTimeMinutes} min til plads
                        </span>
                      </>
                    ) : (
                      <span className="font-inter text-xs text-text-muted">–</span>
                    )}
                  </div>
                </div>
                {tabProduct && (
                  <div className="border-t border-hairline bg-white grid grid-cols-2 divide-x divide-hairline">
                    <CommentCell text={tabProduct.activityName} />
                    <div className="p-sm flex flex-col gap-xs">
                      <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Krav til udførsel</span>
                      <div className="flex flex-col gap-xxxs">
                        <div className="flex items-center justify-between">
                          <span className="font-inter text-xs text-text-muted">Krav til samlinger</span>
                          <span className="font-inter text-xs font-semibold text-text-primary">{tabProduct.kravTilSamlinger ?? '–'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-inter text-xs text-text-muted">Ekstra temperaturmålinger</span>
                          <span className="font-inter text-xs font-semibold text-text-primary">{tabProduct.ekstraTemperaturmaalinger ? 'Ja' : 'Nej'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-inter text-xs text-text-muted">Entreprisekontrol og temperatur</span>
                          <span className="font-inter text-xs font-semibold text-text-primary">
                            {tabProduct.entreprisekontrol === 2 || tabProduct.temperaturmaaling === 2
                              ? 'Følgende skal udfyldes: A3, A4, MKS'
                              : tabProduct.entreprisekontrol === 1 || tabProduct.temperaturmaaling === 1
                                ? 'Følgende skal udfyldes: MKS'
                                : '–'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-xl border border-hairline overflow-hidden mb-lg">
        <div className="grid grid-cols-4 divide-x divide-hairline bg-white">
          <div className="p-sm">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Mængde</span>
            <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">
              {activeProduct.tonsTotal} <small className="font-inter text-xs text-text-muted">tons</small>
            </span>
          </div>
          <div className="p-sm">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Produkt</span>
            <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums block leading-tight">
              {activeProduct.recipeCode}
            </span>
            <span className="font-inter text-xs text-text-muted">
              {activeProduct.recipeName} · {activeProduct.thicknessMm} mm
            </span>
          </div>
          <div className="p-sm">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Areal</span>
            <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">
              {activeProduct.m2.toLocaleString('da-DK')}<small className="font-inter text-xs text-text-muted ml-xxxs">m²</small>
            </span>
          </div>
          <div className="p-sm">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
            <span className="font-poppins font-semibold text-sm text-text-primary leading-tight block">
              {activeProduct.factory.name}
            </span>
            <span className="font-inter text-xs text-text-muted">
              {activeProduct.factory.driveTimeMinutes} min til plads
            </span>
          </div>
        </div>
        <div className="border-t border-hairline bg-white grid grid-cols-2 divide-x divide-hairline">
          <CommentCell text={activeProduct.activityName} />
          <div className="p-sm flex flex-col gap-xs">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Krav til udførsel</span>
            <div className="flex flex-col gap-xxxs">
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-text-muted">Krav til samlinger</span>
                <span className="font-inter text-xs font-semibold text-text-primary">{activeProduct.kravTilSamlinger ?? '–'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-text-muted">Ekstra temperaturmålinger</span>
                <span className="font-inter text-xs font-semibold text-text-primary">{activeProduct.ekstraTemperaturmaalinger ? 'Ja' : 'Nej'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-text-muted">Entreprisekontrol og temperatur</span>
                <span className="font-inter text-xs font-semibold text-text-primary">
                  {activeProduct.entreprisekontrol === 2 || activeProduct.temperaturmaaling === 2
                    ? 'Følgende skal udfyldes: A3, A4, MKS'
                    : activeProduct.entreprisekontrol === 1 || activeProduct.temperaturmaaling === 1
                      ? 'Følgende skal udfyldes: MKS'
                      : '–'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  )

  return (
    <div className="min-h-screen bg-page">
      {/* ── TopBar ───────────────────────────────────────────────────── */}
      <TopBar userInitials="OJ" userName="Ole J." onSettingsPress={() => {}} />

      <div
        className="grid"
        style={{ gridTemplateColumns: '280px 1fr', paddingTop: 44 }}
      >

        {/* ── Venstre rail ─────────────────────────────────────────── */}
        <aside
          className="sticky border-r border-hairline flex flex-col gap-md px-md pb-md pt-xs overflow-y-auto"
          style={{ top: 52, height: 'calc(100vh - 52px - 70px)' }}
        >
          {/* Adresse + ordrenummer */}
          <div>
            {isSamleordreMode ? (
              <>
                <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xs">
                  Samleordre
                </span>
                {/* Begge adresser i samme størrelse — anchor markeret med gul prik */}
                <div className="flex flex-col gap-sm">
                  {samleordreCtx!.children.map(child => (
                    <div key={child.orderNumber} className="flex items-start gap-xs">
                      <span
                        className={[
                          'mt-[8px] w-[10px] h-[10px] rounded-full flex-shrink-0',
                          child.isAnchor
                            ? 'bg-yellow shadow-[0_0_0_2px_rgba(254,238,50,0.35)]'
                            : 'bg-transparent border-2 border-hairline-2',
                        ].join(' ')}
                        aria-label={child.isAnchor ? 'Anchor (primær)' : undefined}
                      />
                      <h1 className="font-poppins font-semibold text-lg text-text-primary leading-tight">
                        {child.udfoerelseSted.split(',').map((line, i) => (
                          <span key={i} className="block">{line.trim()}</span>
                        ))}
                      </h1>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">
                  Udførselssted
                </span>
                <h1 className="font-poppins font-semibold text-xl text-text-primary leading-tight">
                  Søvej 6D<br />4900 Nakskov
                </h1>
                {/* TODO (produktion): Jobnummer + projektnavn kommer fra PLAN-systemet (én plan kan have flere ordrer). */}
                <span className="font-inter text-xs text-text-primary mt-xxxs block">
                  Jobnummer 52. VD Kibæk Vammen
                </span>
                <span className="font-inter text-xs text-text-muted mt-xxxs block">
                  Ordrenummer: 1212343
                </span>
              </>
            )}
          </div>

          {/* Kontakter */}
          <div className="flex flex-col border-t border-hairline pt-xs">
            <div className="flex flex-col gap-xxxs px-xs pb-xs">
              <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Projektleder</span>
              <p className="font-inter text-sm font-semibold text-text-primary leading-tight">Henrik Thor</p>
              <a href="tel:+4540506070" className="font-inter text-sm text-dark-teal flex items-center gap-xxxs hover:text-deep-teal transition-colors">
                <Phone size={13} />
                40 50 60 70
              </a>
            </div>
            <div className="flex flex-col gap-xxxs px-xs py-xs border-t border-hairline">
              <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
              <p className="font-inter text-sm font-semibold text-text-primary leading-tight">Køge Fabrik</p>
              <a href="tel:+4556781234" className="font-inter text-sm text-dark-teal flex items-center gap-xxxs hover:text-deep-teal transition-colors">
                <Phone size={13} />
                56 78 12 34
              </a>
            </div>
            <div className="flex flex-col gap-xxxs px-xs pt-xs border-t border-hairline">
              <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Kundekontakt</span>
              <p className="font-inter text-xxs text-text-muted leading-tight mb-xxxs">Uddannelsescenter Syd</p>
              <p className="font-inter text-sm font-semibold text-text-primary leading-tight">Jens Christensen</p>
              <a href="tel:+4521345678" className="font-inter text-sm text-dark-teal flex items-center gap-xxxs hover:text-deep-teal transition-colors">
                <Phone size={13} />
                21 34 56 78
              </a>
            </div>
          </div>

        </aside>

        {/* ── Hoved-indhold ────────────────────────────────────────── */}
        <main className="px-lg pb-[120px] pt-xs">

          {/* ── Mode-toggle + tilbage-link på samme række ──────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-sm mb-md">
            <div className="inline-flex bg-white border border-hairline rounded-full p-xxxs gap-xxxs shadow-sm">
              {([ 'planlaegning', 'udfoersel' ] as OrderMode[]).map(mode => {
                const isActive = mode === activeMode
                const label = mode === 'planlaegning' ? 'Planlægning' : 'Udførsel'
                return (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    aria-pressed={isActive}
                    className={[
                      'transition-colors',
                      isActive
                        ? 'bg-deep-teal text-white font-poppins font-semibold text-base px-lg py-sm rounded-full'
                        : 'text-text-muted font-inter font-semibold text-base px-lg py-sm rounded-full hover:text-deep-teal',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => navigate(`/prototyper/dagsoversigt?date=${encodeURIComponent(selectedPlanDate)}`)}
              className="flex items-center gap-xxxs px-sm py-xs font-inter text-xs font-medium text-dark-teal hover:text-deep-teal hover:bg-soft-aqua rounded-lg transition-colors"
            >
              <ChevronLeft size={14} />
              Tilbage til dagsoversigt
            </button>
          </div>

          {activeMode === 'planlaegning' && (
          <div className="flex flex-col gap-[48px]">

          {/* ── Sektion: Udlægning ───────────────────────────────── */}
          <section>

            {/* ── Header-row: kun titel (tilbage-link er flyttet op til toggle-rækken) ──────────────── */}
            <div className="mb-md">
              <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight">Ordredetaljer</h2>
            </div>

            {/* Spec-grid — genbrug af ordredetaljerCard (samme visning bruges i Udførsel-mode expander) */}
            {ordredetaljerCard}


            {/* ── Bestillings-række for valgt dag ──────────────────────── */}
            {/* Produkter (én boks pr. produkt) + ekstra-bestillinger + "+ Ekstra"-knap + "Send alle" */}
            {/* Samleordre: produkter samles per recipeCode på tværs af ordrer */}
            {/* TODO: Erstat med Supabase når klar — produktdata fra samleordre-join */}
            <div className="flex flex-col gap-sm">
              {/* Overskrift + tydelige dato-piller i samme kontekst.
                  Pillen er den primære dato-indikator nu (datoen er fjernet fra overskriften). */}
              <div className="flex items-center gap-sm flex-wrap">
                <h3 className="font-poppins font-semibold text-md text-text-primary">Bestilling</h3>
                {planDays.length > 0 && (
                  <div className="flex items-center gap-xs flex-wrap">
                    {planDays
                      .filter(ds => products.some(p => p.days.some(d => d.date === ds && !d.cancelled)))
                      .map(ds => {
                        const isSelected = ds === selectedPlanDate
                        // Grøn farve når ALLE produkters dage for denne dato er afsendt til fabrik.
                        // Bekræfter visuelt at dagens bestilling er ude af døren.
                        const dayIdsForDate = products.flatMap(p => p.days.filter(d => d.date === ds && !d.cancelled).map(d => d.id))
                        const isAllSent = dayIdsForDate.length > 0 && dayIdsForDate.every(id => sentDayIds.has(id))
                        return (
                          <button
                            key={ds}
                            onClick={() => setSelectedPlanDate(ds)}
                            aria-pressed={isSelected}
                            aria-label={isAllSent ? `${formatLongDate(ds)} (afsendt)` : formatLongDate(ds)}
                            className={[
                              'flex items-center gap-xxxs px-sm py-xs rounded-full font-poppins font-semibold text-sm transition-colors',
                              isAllSent
                                ? 'bg-good text-white shadow-sm'
                                : isSelected
                                  ? 'bg-deep-teal text-white shadow-sm'
                                  : 'bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal',
                            ].join(' ')}
                          >
                            {isAllSent && (
                              <CheckCircle2 size={13} className="text-white flex-shrink-0" strokeWidth={2.5} />
                            )}
                            {formatLongDate(ds)}
                          </button>
                        )
                      })}
                  </div>
                )}
                {productsForSelectedDate.length === 0 && (
                  <span className="font-inter text-xs text-text-muted ml-auto">Ingen produkter denne dag</span>
                )}
              </div>

              {/* items-stretch + flex-1 på bokse: alle kolonner stretcher til samme højde
                  (drevet af højeste boks, fx ekstra med åben multilæs-picker).
                  StatusPills havner aligned på én linje. */}
              <div className="flex gap-xs flex-wrap items-stretch">
                {/* Produkt-bokse for valgt dag — status-pill under (ingen send-knap, kun statusfelt) */}
                {(() => {
                  // Samleordre: beregn ordre-tags og tonsHint per recipeCode
                  // Produkter samles per recipeCode — vises KUN ÉN gang selv om begge ordrer har det
                  // TODO: Erstat med Supabase når klar
                  const samleordreTags: Record<string, string[]> = {}
                  const samleordreTonsHint: Record<string, string> = {}
                  if (isSamleordreMode && samleordreCtx) {
                    // Byg map: recipeCode → [stedLabel] for alle ordrer der har produktet
                    const rcToChildren: Record<string, { stedLabel: string; tonsTotal: number }[]> = {}
                    for (const child of samleordreCtx.children) {
                      for (const cp of child.products) {
                        if (!rcToChildren[cp.recipeCode]) rcToChildren[cp.recipeCode] = []
                        rcToChildren[cp.recipeCode].push({ stedLabel: child.stedLabel, tonsTotal: cp.tonsTotal })
                      }
                    }
                    for (const [rc, entries] of Object.entries(rcToChildren)) {
                      samleordreTags[rc] = entries.map(e => e.stedLabel)
                      samleordreTonsHint[rc] = entries.map(e => `${e.stedLabel} ${e.tonsTotal}t`).join(' · ')
                    }
                  }
                  return productsForSelectedDate.map(({ product, day }) => {
                    const isSent = sentDayIds.has(day.id)
                    const isFocused = product.id === activeProductId
                    const ordreTagLabels = isSamleordreMode ? (samleordreTags[product.recipeCode] ?? [product.recipeName]) : undefined
                    const tonsHint = isSamleordreMode ? samleordreTonsHint[product.recipeCode] : undefined
                    return (
                      <div key={product.id} className="flex flex-col gap-xs">
                        <ProductBoxV2
                          product={product}
                          day={day}
                          isFocused={isFocused}
                          isSelectingReason={cancellingDayId === day.id}
                          isSent={isSent}
                          onFocus={() => setActiveProductId(product.id)}
                          onUpdateTons={(v) => updateTons(product.id, day.id, v)}
                          onUpdateMorgenTons={(v) => updateMorgenTons(product.id, day.id, v)}
                          onCancel={() => setCancellingDayId(day.id)}
                          onAbortCancel={() => setCancellingDayId(null)}
                          onConfirmCancel={(r) => cancelDay(product.id, day.id, r)}
                          onRestore={() => restoreDay(day.id)}
                          ordreTagLabels={ordreTagLabels}
                          tonsHint={tonsHint}
                        />
                        {/* Status-pill — sendt / aflyst / afventer */}
                        <StatusPill
                          kind={day.cancelled ? 'aflyst' : isSent ? 'sendt' : 'afventer'}
                          afventerLabel={day.morgenTons == null ? 'Indtast morgen' : 'Klar til afsendelse'}
                        />
                      </div>
                    )
                  })
                })()}

                {/* Ekstra-bestilling-bokse for valgt dag */}
                {ekstraForSelectedDate.map(eb => {
                  // Implicit puljelæs-gruppe: andre ekstras på samme dato med puljelæs ON
                  const otherPuljelaesCount = ekstraForSelectedDate.filter(o => o.id !== eb.id && o.puljelaes).length
                  const andreOrdrerForDato = ANDRE_ORDRER_FOR_DATO[eb.date] ?? []
                  return (
                    <div key={eb.id} className="flex flex-col gap-xs">
                      <EkstraBestillingBox
                        ekstra={eb}
                        products={products}
                        andreOrdrer={andreOrdrerForDato}
                        otherPuljelaesCount={otherPuljelaesCount}
                        onUpdate={(patch) => updateEkstraBestilling(eb.id, patch)}
                        onRemove={() => removeEkstraBestilling(eb.id)}
                      />
                      <StatusPill
                        kind={eb.sent ? 'sendt' : 'afventer'}
                        afventerLabel={eb.tons <= 0 ? 'Indtast tons' : 'Klar til afsendelse'}
                      />
                    </div>
                  )
                })}

                {/* + Ekstra-bestilling-knap */}
                {productsForSelectedDate.length > 0 && (
                  <div className="flex flex-col gap-xs">
                    <button
                      onClick={addEkstraBestilling}
                      className="w-[160px] min-h-[172px] flex-1 rounded-xl border border-dashed border-hairline-2 bg-white hover:border-dark-teal hover:bg-soft-aqua flex flex-col items-center justify-center gap-xs p-sm transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-full bg-soft-aqua group-hover:bg-white border border-hairline flex items-center justify-center">
                        <Plus size={18} className="text-deep-teal" />
                      </div>
                      <span className="font-inter font-semibold text-xs text-text-primary text-center">Ekstra-bestilling</span>
                      <span className="font-inter text-xxs text-text-muted text-center px-xxs leading-tight">Bestil ekstra asfalt til dagen</span>
                    </button>
                    {/* Tom placeholder så højde matcher andre kolonner med status-pill */}
                    <div className="w-[160px] h-[24px]" aria-hidden="true" />
                  </div>
                )}

                {/* "Send til fabrik" CTA — én delt knap der sender alle ikke-sendte */}
                {productsForSelectedDate.length > 0 && (() => {
                  const ikkeSendteProdukter = productsForSelectedDate.filter(({ day }) => day.morgenTons != null && !sentDayIds.has(day.id))
                  const ikkeSendteEkstra = ekstraForSelectedDate.filter(eb => !eb.sent && eb.tons > 0)
                  const totalIkkeSendt = ikkeSendteProdukter.length + ikkeSendteEkstra.length
                  const disabled = totalIkkeSendt === 0
                  return (
                    <div className="flex flex-col gap-xs">
                      <button
                        onClick={() => setShowConfirmSend(true)}
                        disabled={disabled}
                        className={[
                          'w-[160px] min-h-[172px] flex-1 rounded-xl flex flex-col items-center justify-center gap-xs p-sm transition-all border',
                          disabled
                            ? 'bg-[#F5F5F5] border-hairline opacity-40 cursor-not-allowed'
                            : 'bg-warning border-warning hover:opacity-90 active:scale-[0.98]',
                        ].join(' ')}
                      >
                        <div className={`w-10 h-10 rounded-full ${disabled ? 'bg-white' : 'bg-deep-teal/15'} flex items-center justify-center`}>
                          <Truck size={20} className="text-deep-teal" />
                        </div>
                        <span className="font-poppins font-medium text-sm text-deep-teal text-center leading-tight">
                          Send til fabrik
                        </span>
                        <span className="font-inter text-xxs text-deep-teal/70 text-center px-xxs leading-tight">
                          {disabled ? 'Intet at sende' : `${totalIkkeSendt} bestilling${totalIkkeSendt === 1 ? '' : 'er'} klar`}
                        </span>
                      </button>
                      <div className="w-[160px] h-[24px]" aria-hidden="true" />
                    </div>
                  )
                })()}
              </div>

            </div>
          </section>

            {/* Kørsel */}
            <div className="mt-lg">
              <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Asfalt kørsel</h2>
              <div className="bg-white border border-hairline rounded-xl overflow-hidden">
                {activeDays.map((day, i) => {
                  const isExpanded = kørselExpandedId === day.id
                  const isPlanlagt = kørselPlanlagtIds.has(day.id)
                  const bekraeftelse = vognmandBekraeftelser[day.id]
                  const orders = kørselOrders[day.id] ?? []
                  const params = kørselParams[day.id] ?? DEFAULT_KØRSEL_PARAMS
                  const singleLoadCapacity = orders.reduce((sum, o) => {
                    const vt = VEHICLE_TYPES.find(v => v.label === o.type)
                    return sum + (vt ? vt.tons * o.antal : 0)
                  }, 0)
                  const totalTrucks = orders.reduce((s, o) => s + o.antal, 0)
                  // Rundtid = 2× køretid (km × 1 min) + 15 min læsning + 15 min aflæsning
                  const roundTime = factoryKm * 2 + 30
                  const [rsh, rsm] = (params.firstLoadTime || '07:00').split(':').map(Number)
                  const workEndMinutes = 15 * 60 + 30 // 15:30
                  const roundsPerTruck = Math.max(0, Math.floor((workEndMinutes - (rsh * 60 + rsm)) / roundTime))

                  // Total dagkapacitet = enkeltlæs × runder
                  const totalCapacity = singleLoadCapacity * (roundsPerTruck || 1)
                  const capacityOk = totalCapacity >= day.tonsPlanned

                  function updateOrder(id: string, field: 'type' | 'antal' | 'foersteLaes', value: string | number | boolean) {
                    setKørselOrders(prev => ({
                      ...prev,
                      [day.id]: (prev[day.id] ?? []).map(o => o.id === id ? { ...o, [field]: value } : o),
                    }))
                  }
                  function removeOrder(id: string) {
                    setKørselOrders(prev => ({ ...prev, [day.id]: (prev[day.id] ?? []).filter(o => o.id !== id) }))
                  }
                  function addOrder() {
                    const newOrder: VehicleOrder = { id: `vo-${Date.now()}`, type: VEHICLE_TYPES[0].label, antal: 1 }
                    setKørselOrders(prev => ({ ...prev, [day.id]: [...(prev[day.id] ?? []), newOrder] }))
                  }
                  function updateParam<K extends keyof KørselDayParams>(key: K, value: KørselDayParams[K]) {
                    setKørselParams(prev => ({ ...prev, [day.id]: { ...(prev[day.id] ?? DEFAULT_KØRSEL_PARAMS), [key]: value } }))
                  }

                  return (
                    <div key={day.id} className={i < activeDays.length - 1 || isExpanded ? 'border-b border-hairline' : ''}>
                      {/* Hoved-række */}
                      <div className={`grid items-center gap-md px-sm py-sm transition-colors ${!isExpanded ? 'hover:bg-[#F5F5F5]' : ''}`}
                        style={{ gridTemplateColumns: '1fr auto' }}>
                        <div>
                          <p className="font-inter text-sm font-medium text-text-primary">
                            {formatWeekday(day.date)} · {formatShortDate(day.date)}
                          </p>
                          <p className="font-inter text-xs text-text-muted">{day.tonsPlanned} tons</p>
                        </div>
                        <div className="flex items-center gap-xxxs">
                          {isPlanlagt && !isExpanded ? (
                            <div className="flex items-center gap-xs flex-wrap justify-end">
                              <span className="inline-flex items-center gap-sm px-sm py-xxxs rounded-lg bg-[#E7F4EE] font-inter text-xs font-medium text-text-primary whitespace-nowrap">
                                <span>{orders.reduce((s, o) => s + o.antal, 0)} biler bestilt</span>
                                <span className="text-text-muted">·</span>
                                <span>Interval {params.intervalMinutes} min</span>
                                <span className="text-text-muted">·</span>
                                <span>Første læs {params.firstLoadTime}</span>
                              </span>
                              {/* Vognmand status badge */}
                              {bekraeftelse ? (
                                <span className="inline-flex items-center gap-[5px] px-xs py-xxxs rounded-lg bg-[#2E9E65] font-inter text-xs font-semibold text-white whitespace-nowrap">
                                  <CheckCircle2 size={11} className="flex-shrink-0" />
                                  Bekræftet vognmand
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-[5px] px-xs py-xxxs rounded-lg bg-yellow/25 font-inter text-xs font-semibold text-[#8A6A00] whitespace-nowrap">
                                  <span className="w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0" />
                                  Afventer vognmand
                                </span>
                              )}
                              <div className="flex">
                                <button
                                  onClick={() => setKørselExpandedId(day.id)}
                                  className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-lg border border-hairline bg-white font-inter text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                                >
                                  <Pencil size={11} />
                                  Ret
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (isExpanded) {
                                  setKørselPlanlagtIds(prev => new Set([...prev, day.id]))
                                  setKørselExpandedId(null)
                                } else {
                                  setKørselExpandedId(day.id)
                                  if ((kørselOrders[day.id] ?? []).length === 0) {
                                    setKørselOrders(prev => ({
                                      ...prev,
                                      [day.id]: [{ id: `vo-${Date.now()}`, type: '', antal: 1 }],
                                    }))
                                  }
                                }
                              }}
                              className="inline-flex items-center gap-xxxs font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                            >
                              {isExpanded ? 'Gem kørsel' : 'Planlæg kørsel'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expand */}
                      {isExpanded && (
                        <div className="mx-sm mb-lg rounded-xl border border-dark-teal/20 bg-[#F5F9FA] shadow-sm flex flex-col gap-sm p-sm">

                          {/* Biler */}
                          <div>
                            <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Biler</p>
                            <div className="flex flex-col gap-xs">
                              {orders.map(o => {
                                const vt = VEHICLE_TYPES.find(v => v.label === o.type)
                                return (
                                  <div key={o.id} className="flex flex-col gap-xxxs">
                                    <div className="flex items-center gap-xs">
                                      <select
                                        value={o.type}
                                        onChange={e => updateOrder(o.id, 'type', e.target.value)}
                                        className="flex-1 font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                      >
                                        <option value="">Vælg biltype</option>
                                        <option value="Egen bil">Egen bil</option>
                                        {VEHICLE_TYPES.map(v => (
                                          <option key={v.label} value={v.label}>{v.label} · {v.tons} tons</option>
                                        ))}
                                      </select>
                                      <div className="flex items-center border border-hairline rounded-lg overflow-hidden bg-white">
                                        <button
                                          onClick={() => updateOrder(o.id, 'antal', Math.max(1, o.antal - 1))}
                                          className="px-xs py-xs font-inter text-sm text-text-muted hover:bg-[#F5F5F5] transition-colors"
                                        >−</button>
                                        <span className="px-xs font-inter text-xs font-semibold text-text-primary w-[28px] text-center">{o.antal}</span>
                                        <button
                                          onClick={() => updateOrder(o.id, 'antal', o.antal + 1)}
                                          className="px-xs py-xs font-inter text-sm text-text-muted hover:bg-[#F5F5F5] transition-colors"
                                        >+</button>
                                      </div>
                                      <span className="font-inter text-xs text-text-muted w-[70px] text-right tabular-nums whitespace-nowrap">
                                        {vt ? vt.tons * o.antal : 0} Tons
                                      </span>
                                      <button onClick={() => removeOrder(o.id)} className="text-text-muted hover:text-bad transition-colors">
                                        <X size={14} />
                                      </button>
                                    </div>
                                    {o.type === 'Grab' && (
                                      <label className="inline-flex items-center gap-xxxs cursor-pointer ml-xxxs">
                                        <input
                                          type="checkbox"
                                          checked={o.foersteLaes ?? false}
                                          onChange={e => updateOrder(o.id, 'foersteLaes', e.target.checked)}
                                          className="accent-dark-teal w-[14px] h-[14px]"
                                        />
                                        <span className="font-inter text-xs text-text-secondary">Angiv som første læs</span>
                                      </label>
                                    )}
                                  </div>
                                )
                              })}
                              <button
                                onClick={addOrder}
                                className="inline-flex items-center gap-xs font-inter text-sm font-medium text-dark-teal border border-dark-teal/40 rounded-lg px-sm py-xs hover:bg-dark-teal hover:text-white transition-colors self-start mt-sm"
                              >
                                <Plus size={15} />
                                Tilføj biltype
                              </button>
                            </div>
                            {orders.length > 0 && (
                              <div className="flex flex-col gap-xs mt-md">
                                <div className={`flex items-center gap-xs px-xs py-xxxs rounded-lg border ${capacityOk ? 'bg-[#E7F4EE] border-[#1F8A5B]/20' : 'bg-[#FBECEA] border-[#C8372D]/20'}`}>
                                  <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${capacityOk ? 'bg-[#1F8A5B]' : 'bg-[#C8372D]'}`} />
                                  <span className={`font-inter text-xs font-medium tabular-nums ${capacityOk ? 'text-text-primary' : 'text-[#C8372D]'}`}>
                                    {capacityOk ? 'Kapacitet dækket' : `${day.tonsPlanned - totalCapacity} tons á forventet ${day.tonsPlanned} tons mangler disponering`}
                                  </span>
                                </div>
                                {roundsPerTruck > 0 && (
                                  <div className="flex items-center gap-xs px-xs py-xxxs rounded-lg bg-[#F0F4FF] border border-[#4A6FBF]/15">
                                    <span className="font-inter text-xs text-text-primary tabular-nums">
                                      Rundtid <span className="font-semibold">{roundTime} min</span>
                                    </span>
                                    <span className="text-text-muted">·</span>
                                    <span className="font-inter text-xs text-text-primary tabular-nums">
                                      <span className="font-semibold">{roundsPerTruck}</span> runder/bil
                                    </span>
                                    <span className="text-text-muted">·</span>
                                    {(() => {
                                      const avgTons = (totalTrucks > 0 && singleLoadCapacity > 0)
                                        ? Math.round(singleLoadCapacity / totalTrucks)
                                        : 30
                                      const recommended = Math.ceil(day.tonsPlanned / (avgTons * roundsPerTruck))
                                      return (
                                        <span className="font-inter text-xs text-text-primary tabular-nums">
                                          Anbefalet: <span className="font-semibold">{recommended}</span> biler (á gns {avgTons} tons)
                                        </span>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <hr className="border-hairline" />

                          {/* Første læs + Interval */}
                          <div>
                            <p className="font-inter text-xs font-semibold text-text-primary mb-xs">
                              Kørsel: {activeProduct.factory.name} – Søvej 6D, 4900 Nakskov
                            </p>
                            <div className="grid grid-cols-2 gap-xs">
                              <div className="flex flex-col gap-xxxs">
                                <label className="font-inter text-xxs text-text-muted">Første læs</label>
                                <input
                                  type="time"
                                  value={params.firstLoadTime}
                                  onChange={e => updateParam('firstLoadTime', e.target.value)}
                                  className="font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                />
                              </div>
                              <div className="flex flex-col gap-xxxs">
                                <label className="font-inter text-xxs text-text-muted">Interval</label>
                                <div className="flex items-center gap-xxxs bg-white border border-hairline rounded-lg px-xs py-xs focus-within:border-dark-teal">
                                  <input
                                    type="number"
                                    value={params.intervalMinutes}
                                    onChange={e => updateParam('intervalMinutes', Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full font-inter text-xs text-text-primary bg-transparent border-none outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="font-inter text-xxs text-text-muted">min</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Info-linje */}
                          <div className="grid grid-cols-2 gap-xs">
                            <div className="flex flex-col gap-xxxs bg-white border border-hairline rounded-lg px-xs py-xs">
                              <span className="font-inter text-xxs text-text-muted">Afstand til fabrik</span>
                              <div className="flex items-center gap-xxxs">
                                <input
                                  type="number"
                                  value={factoryKm}
                                  onChange={e => setFactoryKm(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-[48px] font-inter text-xs font-semibold text-text-primary bg-transparent border-none outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="font-inter text-xxs text-text-muted">km → {factoryKm} min</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-xxxs bg-white border border-hairline rounded-lg px-xs py-xs">
                              <span className="font-inter text-xxs text-text-muted">Forventet sidste bil</span>
                              <span className="font-inter text-xs font-semibold text-text-primary tabular-nums">
                                {(() => {
                                  if (!totalTrucks || !params.firstLoadTime || roundsPerTruck === 0) return '–'
                                  const [h, m] = params.firstLoadTime.split(':').map(Number)
                                  const lastDeparture = h * 60 + m + (totalTrucks - 1) * params.intervalMinutes + (roundsPerTruck - 1) * roundTime
                                  const lastArrival = lastDeparture + factoryKm
                                  return `${String(Math.floor(lastArrival / 60)).padStart(2, '0')}:${String(lastArrival % 60).padStart(2, '0')}`
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Kommentar til vognmand */}
                          <div className="flex flex-col gap-xxxs">
                            <label className="font-inter text-xxs text-text-muted">Kommentar til vognmand</label>
                            <textarea
                              value={kørselKommentar[day.id] ?? ''}
                              onChange={e => setKørselKommentar(prev => ({ ...prev, [day.id]: e.target.value }))}
                              rows={2}
                              placeholder="Særlige forhold, adgang, tidsvinduer..."
                              className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal transition-colors resize-none leading-relaxed"
                            />
                          </div>

                          {/* Gem */}
                          <div className="flex justify-end gap-xs pt-xxxs">
                            <button
                              onClick={() => setKørselExpandedId(null)}
                              className="font-inter text-xs text-text-muted hover:text-text-primary px-xs py-xxxs"
                            >Annullér</button>
                            <button
                              onClick={() => { setKørselPlanlagtIds(prev => new Set([...prev, day.id])); setKørselExpandedId(null) }}
                              className="font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90"
                            >Gem kørsel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          {/* ── Dokumentation ───────────────────────────────────── */}
          <section>
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Dokumentation</h2>

            <div className="bg-white border border-hairline rounded-xl overflow-hidden">
              {/* Toggle-header */}
              <button
                onClick={() => setDocsOpen(o => !o)}
                className="w-full flex items-center justify-between px-sm py-sm hover:bg-[#F5F5F5] transition-colors"
              >
                <span className="flex items-center gap-md">
                  <span className="font-poppins font-semibold text-sm text-text-primary">Dokumentation</span>
                  <span className="flex items-center gap-sm font-inter text-xs text-text-muted">
                    {[
                      { label: 'Opmåling', ok: true },
                      { label: 'Billeder', ok: true },
                      { label: 'Noter', ok: false },
                    ].map(item => (
                      <span key={item.label} className="flex items-center gap-xxxs">
                        <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${item.ok ? 'bg-[#1F8A5B]' : 'bg-[#C8372D]'}`} />
                        <span className={item.ok ? 'text-text-muted' : 'text-[#C8372D] font-medium'}>{item.label}</span>
                      </span>
                    ))}
                  </span>
                </span>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${docsOpen ? 'rotate-180' : ''}`} />
              </button>

              {docsOpen && (
                <div className="border-t border-hairline">

                  {/* Opmåling */}
                  <DocRow
                    title="Opmåling af område"
                    meta="PDF · 2,1 MB"
                    status="ok"
                    open={opmaalingOpen}
                    onToggle={() => setOpmaalingOpen(o => !o)}
                  >
                    <div className="flex flex-col gap-sm">
                      <img src="/opmaalings-kort.png" alt="Opmåling af område" className="w-full rounded-lg border border-hairline grayscale-[30%]" />
                      <label className="flex items-center justify-center gap-xs border border-dashed border-hairline-2 rounded-lg py-sm cursor-pointer hover:border-dark-teal hover:bg-[#F5F9FA] transition-colors group">
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                          onChange={e => { if (e.target.files?.length) { /* TODO: håndter upload */ } }}
                        />
                        <Plus size={14} className="text-text-muted group-hover:text-dark-teal transition-colors" />
                        <span className="font-inter text-xs text-text-muted group-hover:text-dark-teal transition-colors">Upload fil (PDF eller billede)</span>
                      </label>
                    </div>
                  </DocRow>

                  {/* Billeder */}
                  <DocRow
                    title="Billedmateriale"
                    meta={`${photos.length} billeder`}
                    status="ok"
                    open={photosOpen}
                    onToggle={() => setPhotosOpen(o => !o)}
                  >
                    <div className="grid grid-cols-4 gap-xs">
                      {photos.map(photo => (
                        <div key={photo.id} className={`aspect-square rounded-lg ${photo.color} flex flex-col items-center justify-center relative group border border-hairline overflow-hidden`}>
                          <span className="font-inter text-xxs text-text-muted text-center px-xxxs leading-tight">{photo.label}</span>
                          {photo.source === 'forundersoegelse' && (
                            <span className="absolute bottom-0 left-0 right-0 bg-dark-teal/80 font-inter text-[9px] font-semibold text-white text-center py-[2px] leading-none">
                              Forundersøgelse
                            </span>
                          )}
                          <button
                            onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                            className="absolute top-[4px] right-[4px] w-[16px] h-[16px] bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={8} className="text-bad" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-lg border border-dashed border-hairline-2 flex flex-col items-center justify-center cursor-pointer hover:border-text-muted hover:bg-[#F5F5F5] transition-colors">
                        <input type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={e => {
                            if (e.target.files?.length) {
                              setPhotos(prev => [...prev, { id: `ph${Date.now()}`, color: 'bg-yellow/20', label: `Foto ${prev.length + 1}` }])
                            }
                          }}
                        />
                        <Camera size={16} className="text-text-muted" />
                        <span className="font-inter text-xxs text-text-muted mt-xxxs">Kamera</span>
                      </label>
                      <label className="aspect-square rounded-lg border border-dashed border-hairline-2 flex flex-col items-center justify-center cursor-pointer hover:border-text-muted hover:bg-[#F5F5F5] transition-colors">
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => {
                            if (e.target.files?.length) {
                              setPhotos(prev => [...prev, { id: `ph${Date.now()}`, color: 'bg-light-aqua/30', label: `Foto ${prev.length + 1}` }])
                            }
                          }}
                        />
                        <Plus size={16} className="text-text-muted" />
                        <span className="font-inter text-xxs text-text-muted mt-xxxs">Upload</span>
                      </label>
                    </div>
                  </DocRow>

                  {/* Noter */}
                  <DocRow
                    title="Noter til opgave"
                    meta={`${noteComments.length} noter`}
                    status="bad"
                    open={notesOpen}
                    onToggle={() => setNotesOpen(o => !o)}
                    isLast
                  >
                    <div className="flex flex-col gap-sm">
                      {noteComments.map(c => (
                        <div key={c.id} className="flex gap-xs">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${c.initials === 'OJ' ? 'bg-deep-teal' : 'bg-[#F5F5F5]'}`}>
                            <span className={`font-inter font-bold text-[9px] ${c.initials === 'OJ' ? 'text-white' : 'text-deep-teal'}`}>{c.initials}</span>
                          </div>
                          <div className="flex-1 bg-[#F5F5F5] rounded-xl px-xs py-xs">
                            <div className="flex items-baseline gap-xs mb-xxxs">
                              <b className="font-inter font-semibold text-xs text-text-primary">{c.name}</b>
                              <time className="font-inter text-xxs text-text-muted">{c.timestamp}</time>
                            </div>
                            <p className="font-inter text-xs text-text-secondary leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-xs">
                        <div className="w-7 h-7 rounded-full bg-deep-teal flex items-center justify-center flex-shrink-0">
                          <span className="font-inter font-bold text-[9px] text-white">OJ</span>
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <textarea
                              value={besigtigelseComment}
                              onChange={e => setBesigtigelseComment(e.target.value)}
                              placeholder="Tilføj bemærkning..."
                              rows={2}
                              className="w-full rounded-xl border border-hairline bg-white px-xs py-xs pr-[40px]
                                         font-inter text-xs text-text-primary placeholder:text-text-muted
                                         focus:outline-none focus:border-dark-teal resize-none"
                            />
                            <button
                              className="absolute bottom-[10px] right-[10px] w-7 h-7 rounded-full bg-dark-teal
                                         flex items-center justify-center hover:bg-deep-teal transition-colors"
                              aria-label="Dikter bemærkning"
                            >
                              <Mic size={12} className="text-white" />
                            </button>
                          </div>
                          {besigtigelseComment.trim().length > 0 && (
                            <button
                              onClick={() => {
                                setNoteComments(prev => [...prev, { id: `nc${Date.now()}`, initials: 'OJ', name: 'Ole Jensen', timestamp: 'Nu', text: besigtigelseComment.trim() }])
                                setBesigtigelseComment('')
                              }}
                              className="mt-xxxs self-end float-right bg-dark-teal text-white font-inter font-semibold text-xxs px-sm py-xxxs rounded-lg hover:bg-deep-teal transition-colors"
                            >
                              Gem
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </DocRow>

                </div>
              )}
            </div>
          </section>

          {/* ── Materiel ─────────────────────────────────────────── */}
          <section>
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Materiellevering</h2>

            {/* Samleordre: vis sub-header pr. ordre */}
            {isSamleordreMode && samleordreCtx && (
              <>
                {samleordreCtx.children.map((child, childIdx) => (
                  <div key={child.orderNumber} className={childIdx > 0 ? 'mt-md' : undefined}>
                    {/* Sub-header pr. ordre */}
                    <div className="flex items-center gap-xs mb-xs">
                      <span
                        className={[
                          'w-[8px] h-[8px] rounded-full flex-shrink-0',
                          child.isAnchor
                            ? 'bg-yellow shadow-[0_0_0_2px_rgba(254,238,50,0.35)]'
                            : 'bg-transparent border-2 border-hairline-2',
                        ].join(' ')}
                        aria-hidden="true"
                      />
                      <h3 className="font-poppins font-semibold text-md text-deep-teal">
                        {child.udfoerelseSted}
                      </h3>
                    </div>

                    {child.resources.length > 0 ? (
                      <div className="bg-white border border-hairline rounded-xl overflow-hidden mb-sm">
                        {child.resources.map((r, i) => (
                          <div key={r.id} className={i < child.resources.length - 1 ? 'border-b border-hairline' : ''}>
                            <div
                              className="grid items-center gap-md px-sm py-sm"
                              style={{ gridTemplateColumns: '36px 1fr auto' }}
                            >
                              <div className="w-9 h-9 rounded-md bg-[#F5F5F5] flex items-center justify-center text-deep-teal">
                                <Truck size={16} />
                              </div>
                              <div>
                                <p className="font-inter text-sm font-medium text-text-primary">{r.description}</p>
                                <div className="flex items-center gap-xs mt-xxxs">
                                  <span className="font-inter text-xs text-text-muted tabular-nums">{r.plantNumber}</span>
                                  <TransportBadge tag={r.transportTag} />
                                </div>
                              </div>
                              <div>
                                <span className={[
                                  'inline-flex items-center gap-[5px] px-xs py-xxxs rounded-lg font-inter text-xs font-semibold whitespace-nowrap',
                                  r.status === 'planlagt'
                                    ? 'bg-yellow/25 text-[#8A6A00]'
                                    : 'bg-[#F5F5F5] text-text-muted',
                                ].join(' ')}>
                                  {r.status === 'planlagt' ? 'Afventer vognmand' : 'Ikke planlagt'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-hairline rounded-xl px-sm py-sm mb-sm flex items-center gap-xs text-text-muted">
                        <span className="font-inter text-sm">Ingen materiel planlagt</span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Normal mode: eksisterende fulde materiel-liste */}
            {!isSamleordreMode && (
            <div className="bg-white border border-hairline rounded-xl overflow-hidden mb-sm">
              {resources.map((r, i) => {
                const isExpanded = expandedResourceId === r.id
                const isUdlaant = udlaantIds.has(r.id)
                const erFørste = i === 0
                const firstResource = resources[0]
                const sammeAflæsningValg = sammeAflæsning[r.id] ?? null
                return (
                  <div key={r.id} className={i < resources.length - 1 || isExpanded ? 'border-b border-hairline' : ''}>
                    {/* Hoved-række */}
                    <div
                      className={`grid items-center gap-md px-sm py-sm transition-colors ${!isExpanded ? 'hover:bg-[#F5F5F5]' : ''}`}
                      style={{ gridTemplateColumns: '36px 1fr auto' }}
                    >
                      <div className="w-9 h-9 rounded-md bg-[#F5F5F5] flex items-center justify-center text-deep-teal">
                        <Truck size={16} />
                      </div>
                      <div>
                        <p className="font-inter text-sm font-medium text-text-primary">{r.description}</p>
                        <div className="flex items-center gap-xs mt-xxxs">
                          <span className="font-inter text-xs text-text-muted tabular-nums">{r.plantNumber}</span>
                          <TransportBadge tag={r.transportTag} />
                        </div>
                      </div>
                      <div className="flex items-center gap-xs">
                        {r.status === 'planlagt' && !isExpanded ? (
                          <>
                            {vognmandMaterielBekraeftelse.items.some(it => it.resourceId === r.id) ? (
                              <span className="inline-flex items-center gap-[5px] px-xs py-xxxs rounded-lg bg-[#2E9E65] font-inter text-xs font-semibold text-white whitespace-nowrap">
                                <CheckCircle2 size={11} className="flex-shrink-0" />
                                Bekræftet vognmand
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-[5px] px-xs py-xxxs rounded-lg bg-yellow/25 font-inter text-xs font-semibold text-[#8A6A00] whitespace-nowrap">
                                <span className="w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0" />
                                Afventer vognmand
                              </span>
                            )}
                            <button
                              onClick={() => setExpandedResourceId(r.id)}
                              className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-lg border border-hairline font-inter text-xs font-medium text-dark-teal hover:bg-[#F5F5F5] transition-colors whitespace-nowrap"
                            >
                              <Pencil size={11} />
                              Ret
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => isExpanded ? (markTransportPlanlagt(r.id), setExpandedResourceId(null)) : setExpandedResourceId(r.id)}
                            className="inline-flex items-center gap-xxxs font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                          >
                            {isExpanded ? 'Gem transport' : 'Planlæg transport'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expand — transport-planlægning */}
                    {isExpanded && (
                      <div className="mx-sm mb-lg rounded-xl border border-dark-teal/20 bg-[#F5F9FA] shadow-sm flex flex-col gap-sm p-sm">

                        {/* Udlånt */}
                        <div className="flex flex-col gap-xs">
                          <div className="flex items-center gap-xs flex-wrap">
                            <span className="font-inter text-xs text-text-secondary">Er <span className="font-medium text-text-primary">{r.description}</span> udlånt fra anden afdeling?</span>
                            <div className="flex gap-xxxs">
                              <button
                                onClick={() => setUdlaantIds(prev => { const s = new Set(prev); s.add(r.id); return s })}
                                className={`px-xs py-xxxs rounded-full font-inter text-xs font-medium border transition-colors ${isUdlaant ? 'bg-dark-teal text-white border-dark-teal' : 'bg-white text-text-muted border-hairline hover:border-dark-teal hover:text-dark-teal'}`}
                              >Ja</button>
                              <button
                                onClick={() => setUdlaantIds(prev => { const s = new Set(prev); s.delete(r.id); return s })}
                                className={`px-xs py-xxxs rounded-full font-inter text-xs font-medium border transition-colors ${!isUdlaant ? 'bg-dark-teal text-white border-dark-teal' : 'bg-white text-text-muted border-hairline hover:border-dark-teal hover:text-dark-teal'}`}
                              >Nej</button>
                            </div>
                          </div>

                          {isUdlaant && (
                            <div className="flex flex-col gap-xxxs">
                              <div className="flex items-center gap-sm bg-white border border-hairline rounded-xl px-sm py-xs">
                                <span className="font-inter text-xs text-text-secondary whitespace-nowrap">Kender du ordrenummeret som skal faktureres?</span>
                                <input
                                  type="text"
                                  value={fakturaOrdre[r.id] ?? ''}
                                  onChange={e => setFakturaOrdre(prev => ({ ...prev, [r.id]: e.target.value }))}
                                  placeholder="Ordrenummer"
                                  className="flex-1 font-inter text-xs text-text-primary bg-transparent border-none outline-none placeholder:text-text-muted min-w-0"
                                />
                              </div>
                              {!fakturaOrdre[r.id] && (
                                <p className="font-inter text-xxs text-text-muted italic px-xxxs">Udfyldes af projektleder hvis ikke angivet</p>
                              )}
                            </div>
                          )}
                        </div>

                        <hr className="border-hairline" />

                        {/* Afhentning */}
                        <div className="flex flex-col gap-xs">
                          <p className="font-inter text-xs font-semibold text-text-primary">Afhentningssted</p>

                          <div className="grid grid-cols-2 gap-xs">
                            <div className="flex flex-col gap-xxxs col-span-2">
                              <label className="font-inter text-xxs text-text-muted">Adresse</label>
                              <input
                                type="text"
                                value={afhentningAdresse[r.id] ?? ''}
                                onChange={e => setAfhentningAdresse(prev => ({ ...prev, [r.id]: e.target.value }))}
                                placeholder="Vejnavn og nummer"
                                className="font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal placeholder:text-text-muted"
                              />
                            </div>
                            <div className="flex flex-col gap-xxxs">
                              <label className="font-inter text-xxs text-text-muted">Postnummer</label>
                              <input
                                type="text"
                                value={afhentningPostnr[r.id] ?? ''}
                                onChange={e => setAfhentningPostnr(prev => ({ ...prev, [r.id]: e.target.value }))}
                                placeholder="0000"
                                className="font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal placeholder:text-text-muted"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-xs">
                            <div className="flex flex-col gap-xxxs">
                              <label className="font-inter text-xxs text-text-muted">Klar til afhentning</label>
                              <input
                                type="datetime-local"
                                value={afhentningKlar[r.id] ?? ''}
                                onChange={e => setAfhentningKlar(prev => ({ ...prev, [r.id]: e.target.value }))}
                                className="font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                              />
                            </div>
                            <div className="flex flex-col gap-xxxs">
                              <label className="font-inter text-xxs text-text-muted">Skal være på lokation</label>
                              <input
                                type="datetime-local"
                                value={afhentningLevering[r.id] ?? ''}
                                onChange={e => setAfhentningLevering(prev => ({ ...prev, [r.id]: e.target.value }))}
                                className="font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-xxxs">
                            <label className="font-inter text-xxs text-text-muted">Kommentar til vognmand</label>
                            <textarea
                              value={materielKommentar[r.id] ?? ''}
                              onChange={e => setMaterielKommentar(prev => ({ ...prev, [r.id]: e.target.value }))}
                              rows={2}
                              placeholder="Særlige forhold, adgang, tidsvinduer..."
                              className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal transition-colors resize-none leading-relaxed"
                            />
                          </div>

                          {/* Kort til markering af afhentningssted */}
                          <div className="w-full h-[140px] rounded-xl bg-[#E8EFF5] border border-hairline flex flex-col items-center justify-center gap-xs text-text-muted">
                            <div className="w-8 h-8 rounded-full bg-dark-teal/10 flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-teal"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                            </div>
                            <p className="font-inter text-xs text-text-muted">Kortintegration tilgængelig efter opsætning</p>
                            <p className="font-inter text-xxs text-text-muted opacity-60">Klik for at markere afhentningssted</p>
                          </div>
                        </div>

                        <hr className="border-hairline" />

                        {/* Aflæsning */}
                        <div className="flex flex-col gap-xs">
                          <p className="font-inter text-xs font-semibold text-text-primary">Aflæsningssted</p>

                          {/* Spørg fra 2. materiel og frem */}
                          {!erFørste && sammeAflæsningValg === null && (
                            <div className="flex items-center gap-sm bg-white border border-hairline rounded-xl px-sm py-xs">
                              <span className="font-inter text-xs text-text-secondary flex-1">
                                Samme aflæsningssted som <span className="font-medium text-text-primary">{firstResource.description}</span>?
                              </span>
                              <div className="flex gap-xxxs">
                                <button
                                  onClick={() => setSammeAflæsning(prev => ({ ...prev, [r.id]: true }))}
                                  className="px-xs py-xxxs rounded-full font-inter text-xs font-medium border bg-white text-text-muted border-hairline hover:border-dark-teal hover:text-dark-teal transition-colors"
                                >Ja</button>
                                <button
                                  onClick={() => setSammeAflæsning(prev => ({ ...prev, [r.id]: false }))}
                                  className="px-xs py-xxxs rounded-full font-inter text-xs font-medium border bg-white text-text-muted border-hairline hover:border-dark-teal hover:text-dark-teal transition-colors"
                                >Nej</button>
                              </div>
                            </div>
                          )}

                          {/* Arvet aflæsningssted */}
                          {!erFørste && sammeAflæsningValg === true && (
                            <div className="flex items-center justify-between bg-[#E7F4EE] border border-[#1F8A5B]/20 rounded-xl px-sm py-xs">
                              <div className="flex items-center gap-xs">
                                <span className="w-[6px] h-[6px] rounded-full bg-[#1F8A5B] flex-shrink-0" />
                                <span className="font-inter text-xs text-text-secondary">
                                  Arver aflæsningssted fra <span className="font-medium text-text-primary">{firstResource.description}</span>
                                </span>
                              </div>
                              <button
                                onClick={() => setSammeAflæsning(prev => ({ ...prev, [r.id]: null }))}
                                className="font-inter text-xxs text-text-muted hover:text-text-primary transition-colors"
                              >Ændre</button>
                            </div>
                          )}

                          {/* Vis kort: altid for første, eller hvis valgt "nej" */}
                          {(erFørste || sammeAflæsningValg === false) && (
                            <div className="w-full h-[140px] rounded-xl bg-[#E8EFF5] border border-hairline flex flex-col items-center justify-center gap-xs text-text-muted">
                              <div className="w-8 h-8 rounded-full bg-dark-teal/10 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-teal"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                              </div>
                              <p className="font-inter text-xs text-text-muted">Kortintegration tilgængelig efter opsætning</p>
                              <p className="font-inter text-xxs text-text-muted opacity-60">Klik for at markere aflæsningssted</p>
                            </div>
                          )}
                        </div>

                        {/* Gem-knap */}
                        <div className="flex justify-end gap-xs pt-xxxs">
                          <button
                            onClick={() => setExpandedResourceId(null)}
                            className="font-inter text-xs text-text-muted hover:text-text-primary px-xs py-xxxs"
                          >
                            Annullér
                          </button>
                          <button
                            onClick={() => { markTransportPlanlagt(r.id); setExpandedResourceId(null) }}
                            className="font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90"
                          >
                            Gem transport
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              <button className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border-t border-hairline bg-[#F5F5F5] hover:bg-hairline transition-colors">
                <Plus size={14} />
                Tilføj materiel
              </button>
            </div>
            )}

          </section>

          </div>
          )}

          {activeMode === 'udfoersel' && (
            <UdfoerselContent
              forundersoegelseFotos={photos.filter(p => p.source === 'forundersoegelse')}
              onAddPhotos={(newPhotos) => setPhotos(prev => [...prev, ...newPhotos])}
              vognmandBekraeftelse={activeDays[0] ? vognmandBekraeftelser[activeDays[0].id] : undefined}
              vognmandMaterielBekraeftelse={vognmandMaterielBekraeftelse}
              todayDay={activeDays[0]}
              products={products}
              isSamleordreMode={isSamleordreMode}
              samleordreCtx={samleordreCtx}
              ordredetaljerCard={ordredetaljerCard}
            />
          )}

        </main>
      </div>


      {/* ── Fjern-modal ──────────────────────────────────────────────── */}
      {fjernModalResource && (
        <FjernModal
          resource={fjernModalResource}
          onConfirm={() => removeResource(fjernModalResource.id)}
          onCancel={() => setFjernModalId(null)}
        />
      )}

      {/* ── Bekræftelses-modal: Send til fabrik ────────────────────── */}
      {/* Genbrug af Dagsoversigt-modal-mønster (DagsoversigtScreen linje 675-720) */}
      {showConfirmSend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-modal-title"
        >
          <button
            type="button"
            aria-label="Luk dialog"
            onClick={() => { setShowConfirmSend(false); setKommentar('') }}
            className="absolute inset-0 bg-deep-teal/40"
          />
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-lg flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <h2
                id="send-modal-title"
                className="font-poppins font-semibold text-lg text-deep-teal leading-tight"
              >
                Send bestilling til fabrik?
              </h2>
              <p className="font-inter text-sm text-text-secondary leading-relaxed">
                Ordren afsendes til fabrikken nu. Når den er afsendt kan morgen tons og forventede tons ikke længere rettes i appen — eventuelle rettelser skal ske pr. telefon til fabrikken.
              </p>
            </div>
            <div className="flex flex-col gap-xxs">
              <label className="font-inter font-medium text-sm text-deep-teal">
                Vil du knytte en kommentar til ordren inden afsendelse?
              </label>
              <span className="font-inter text-xs text-text-muted leading-relaxed">
                Kommentaren sendes med til fabrikken sammen med bestillingen.
              </span>
              <textarea
                value={kommentar}
                onChange={e => setKommentar(e.target.value)}
                rows={3}
                placeholder="Fx ekstra holdtid pga. mange biler i morgenmyldretid"
                className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-lg px-sm py-xs resize-none focus:outline-none focus:border-deep-teal transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-xs">
              <button
                type="button"
                onClick={() => { setShowConfirmSend(false); setKommentar('') }}
                className="font-inter font-medium text-sm text-text-secondary bg-white border border-hairline rounded-lg px-md py-xs hover:bg-surface-2 transition-colors"
              >
                Annullér
              </button>
              <button
                type="button"
                onClick={() => {
                  sendAlleForSelectedDate()
                  setShowConfirmSend(false)
                  setKommentar('')
                }}
                className="font-poppins font-medium text-sm text-white bg-good rounded-lg px-md py-xs hover:opacity-90 transition-opacity"
              >
                Send til fabrik
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar
        activeTab={activeTab}
        onTabPress={tab => {
          if (tab === 'mine-opgaver') { navigate('/prototyper/gantt'); return }
          if (tab === 'dagens-opgaver') { navigate('/prototyper/dagsoversigt'); return }
          setActiveTab(tab)
        }}
        messageCount={2}
      />
    </div>
  )
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
// 24px statusrække der vises under produkt- og ekstra-bokse i stedet for en
// individuel send-knap. Forretningslogik: vi har én delt "Send til fabrik" knap;
// status-pillen bekræfter blot om denne boks er afsendt.
function StatusPill({ kind, afventerLabel }: {
  kind: 'sendt' | 'aflyst' | 'afventer'
  afventerLabel?: string
}) {
  if (kind === 'sendt') {
    return (
      <div className="w-[160px] h-[24px] inline-flex items-center justify-center gap-[5px] rounded-md bg-[#E7F4EE] border border-[#1F8A5B]/25">
        <span className="w-[5px] h-[5px] rounded-full bg-[#1F8A5B] flex-shrink-0" />
        <span className="font-inter text-xxs font-semibold text-[#1F8A5B]">Sendt til fabrik</span>
      </div>
    )
  }
  if (kind === 'aflyst') {
    return (
      <div className="w-[160px] h-[24px] inline-flex items-center justify-center gap-[5px] rounded-md bg-bad/10 border border-bad/30">
        <span className="font-inter text-xxs font-semibold text-bad">Aflyst</span>
      </div>
    )
  }
  return (
    <div className="w-[160px] h-[24px] inline-flex items-center justify-center rounded-md border border-dashed border-hairline">
      <span className="font-inter text-xxs font-medium text-text-muted">{afventerLabel ?? 'Afventer'}</span>
    </div>
  )
}

// ─── ProductBoxV2 ─────────────────────────────────────────────────────────────
// Boks for ét produkt på den valgte dag — afløser DayPillV2 i dato-først-modellen.
// Beholder dimensions (w-[160px] min-h-[172px]) + felt-mønster (Forventet/Morgen) +
// vejr/aflys-knapper fra DayPillV2 — kun header-rækken og signatur er ny.

function ProductBoxV2({
  product, day, isFocused, isSelectingReason, isSent,
  onFocus, onUpdateTons, onUpdateMorgenTons,
  onCancel, onAbortCancel, onConfirmCancel, onRestore,
  ordreTagLabels, tonsHint,
}: {
  product: MockProduct
  day: DayPlan
  isFocused: boolean
  isSelectingReason: boolean
  isSent: boolean                      // når true: Forventet + Morgen tons låst (read-only)
  onFocus: () => void
  onUpdateTons: (v: number) => void
  onUpdateMorgenTons: (v: number | undefined) => void
  onCancel: () => void                 // åbn årsags-picker
  onAbortCancel: () => void            // luk årsags-picker uden at aflyse
  onConfirmCancel: (r: CancelReason) => void
  onRestore: () => void
  /** Samleordre: labels for de ordrer dette produkt tilhører, fx ['Søvej', 'Strandvejen'] */
  ordreTagLabels?: string[]
  /** Samleordre: fordeling-hint, fx 'Søvej 250t · Strandvejen 200t' */
  tonsHint?: string
}) {
  const [weatherActive, setWeatherActive] = useState(false)

  if (day.cancelled) {
    return (
      <div className="w-[160px] min-h-[172px] flex-1 bg-white rounded-xl border border-bad/30 flex flex-col items-center justify-center gap-xxxs opacity-60 p-sm">
        <p className="font-poppins font-semibold text-sm text-text-muted">{product.recipeCode}</p>
        <p className="font-inter text-xxs text-text-muted">{product.recipeName}</p>
        <p className="font-inter font-semibold text-xs text-bad mt-xxxs">Aflyst</p>
        {day.cancelReason && <p className="font-inter text-xxs text-text-muted capitalize">{day.cancelReason}</p>}
        <button onClick={onRestore} className="mt-xxxs font-inter text-xxs text-dark-teal underline">Fortryd</button>
      </div>
    )
  }

  if (isSelectingReason) {
    return (
      <div className="w-[160px] min-h-[172px] flex-1 bg-white rounded-xl border border-bad/20 p-xs flex flex-col gap-xxxs shadow-md">
        <div className="flex items-center justify-between mb-xxxs">
          <p className="font-inter text-xxs font-medium text-text-muted">Årsag til aflysning</p>
          {/* Fortryd hvis krydset blev klikket ved en fejl */}
          <button
            type="button"
            onClick={onAbortCancel}
            aria-label="Fortryd aflysning"
            className="w-5 h-5 rounded-full flex items-center justify-center text-text-muted hover:bg-[#F5F5F5] hover:text-text-primary transition-colors"
          >
            <X size={12} />
          </button>
        </div>
        {CANCEL_REASONS.map(r => (
          <button key={r.value} onClick={() => onConfirmCancel(r.value)}
            className="w-full text-left px-xs py-[6px] rounded-lg font-inter text-xs text-text-secondary hover:bg-[#F5F5F5] hover:text-text-primary transition-colors">
            {r.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onAbortCancel}
          className="mt-auto w-full text-center px-xs py-[6px] rounded-lg font-inter text-xs font-medium text-dark-teal hover:bg-soft-aqua transition-colors"
        >
          Fortryd
        </button>
      </div>
    )
  }

  return (
    <div className={[
      'relative w-[160px] min-h-[172px] flex-1 bg-white rounded-xl flex flex-col p-sm pb-lg gap-xs transition-all border',
      isFocused ? 'border-dark-teal ring-1 ring-dark-teal/20' : 'border-hairline hover:border-hairline-2',
    ].join(' ')}>
      {/* Aflys-knap (lille X) */}
      <button
        onClick={onCancel}
        aria-label="Aflys dag"
        className="absolute top-[8px] right-[8px] w-5 h-5 rounded-full flex items-center justify-center text-text-muted hover:bg-bad/10 hover:text-bad transition-colors"
      >
        <X size={12} />
      </button>

      {/* Vejr-knap — z-10 så den ligger foran morgen-tons boksen (samme placering) */}
      <div className="absolute bottom-[12px] right-[8px] z-10 group/weather">
        <button
          onClick={() => setWeatherActive(w => !w)}
          className={[
            'w-7 h-7 rounded-lg flex items-center justify-center border transition-all',
            weatherActive
              ? 'bg-dark-teal text-white border-dark-teal'
              : 'bg-[#F5F5F5] text-dark-teal border-hairline hover:bg-dark-teal hover:text-white hover:border-dark-teal',
          ].join(' ')}
          aria-label="Markér vejrrisiko"
          aria-pressed={weatherActive}
        >
          <CloudRain size={14} />
        </button>
        <div className="absolute bottom-full right-0 mb-xxxs opacity-0 group-hover/weather:opacity-100 transition-opacity pointer-events-none">
          <span className="whitespace-nowrap bg-[#1D1D1D] text-white font-inter text-xxs px-xs py-xxxs rounded-md">
            Minus regn
          </span>
        </div>
      </div>

      {/* Produkt-header — klikbar for fokus (driver Spec-grid) */}
      <button
        onClick={onFocus}
        aria-pressed={isFocused}
        className="flex flex-col items-start text-left pr-md"
      >
        <span className="font-poppins font-semibold text-sm text-text-primary leading-tight">{product.recipeCode}</span>
        <span className="font-inter text-xxs text-text-muted">{product.recipeName} · {product.thicknessMm} mm</span>
        {/* Samleordre: ordre-tags der viser hvilke ordrer dette produkt tilhører */}
        {ordreTagLabels && ordreTagLabels.length > 0 && (
          <div className="flex flex-wrap gap-xxxs mt-xxxs">
            {ordreTagLabels.map(label => (
              <span
                key={label}
                className="bg-soft-aqua text-deep-teal font-inter text-xxs px-xs py-xxxs rounded-full inline-flex items-center gap-xxxs"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* Forventet — låses efter send (per unified planning model) */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Forventet</span>
        <div className={[
          'flex items-center gap-xxxs border rounded-lg px-xs py-xxxs transition-colors',
          isSent
            ? 'bg-[#F5F5F5] border-hairline opacity-70 cursor-not-allowed'
            : 'bg-[#F5F5F5] border-hairline focus-within:border-dark-teal focus-within:bg-white',
        ].join(' ')}>
          <input
            type="number"
            value={day.tonsPlanned || ''}
            onChange={e => onUpdateTons(Math.max(0, parseInt(e.target.value, 10) || 0))}
            disabled={isSent}
            readOnly={isSent}
            className="font-poppins font-semibold text-lg text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:cursor-not-allowed"
            placeholder="0"
          />
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
      </div>

      {/* Morgen — låses efter send (per unified planning model) */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Morgen tons</span>
        <div className={[
          'flex items-center gap-xxxs border rounded-lg px-xs py-xxxs transition-colors',
          isSent
            ? 'bg-[#E7F4EE] border-[#1F8A5B]/25 opacity-70 cursor-not-allowed'
            : day.morgenTons == null
              ? 'bg-[#FBECEA] border-[#C8372D]/25 focus-within:border-dark-teal focus-within:bg-white'
              : 'bg-[#E7F4EE] border-[#1F8A5B]/25 focus-within:border-dark-teal focus-within:bg-white',
        ].join(' ')}>
          <input
            type="number"
            value={day.morgenTons ?? ''}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              onUpdateMorgenTons(isNaN(v) ? undefined : Math.max(0, v))
            }}
            disabled={isSent}
            readOnly={isSent}
            className="font-poppins font-semibold text-lg text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:cursor-not-allowed"
            placeholder="–"
          />
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
        {/* Samleordre: fordeling-hint under morgen-tons */}
        {tonsHint && (
          <p className="font-inter text-xxs text-text-muted mt-xxxs leading-tight">{tonsHint}</p>
        )}
      </div>

    </div>
  )
}

// ─── EkstraBestillingBox ──────────────────────────────────────────────────────
// Drip-bestilling boks — samme dimensioner som ProductBoxV2, gul accent for at
// signalere at det er en tilføjelse løbende på dagen, ikke morgen-planlægning.
// Indeholder to scope-toggles:
//   - Puljelæs: implicit gruppe med andre puljelæs-ON ekstras (samme ordre+date)
//   - Multilæs: udvider scope til andre ordrer på dagen via picker

function EkstraBestillingBox({
  ekstra, products,
  andreOrdrer, otherPuljelaesCount,
  onUpdate, onRemove,
}: {
  ekstra: EkstraBestilling
  products: MockProduct[]
  andreOrdrer: AndenOrdre[]
  otherPuljelaesCount: number          // andre puljelæs-ON ekstras på samme dato
  onUpdate: (patch: Partial<EkstraBestilling>) => void
  onRemove: () => void
}) {
  // Union af produkter (ordrens egne + valgte andre ordrers) når multilæs ON
  const valgteAndreOrdrer = andreOrdrer.filter(o => ekstra.andreOrdrer.includes(o.id))
  const produktOptions = ekstra.multilaes
    ? [
        ...products.map(p => ({ value: p.id, label: p.recipeCode, kilde: 'Denne ordre' })),
        ...valgteAndreOrdrer.flatMap(o =>
          o.products.map(p => ({ value: `${o.id}:${p.id}`, label: p.recipeCode, kilde: o.orderNumber }))
        ),
      ]
    : products.map(p => ({ value: p.id, label: p.recipeCode, kilde: 'Denne ordre' }))

  function toggleAndenOrdre(ordreId: string) {
    const exists = ekstra.andreOrdrer.includes(ordreId)
    onUpdate({
      andreOrdrer: exists
        ? ekstra.andreOrdrer.filter(id => id !== ordreId)
        : [...ekstra.andreOrdrer, ordreId],
    })
  }

  if (ekstra.sent) {
    return (
      <div className="relative w-[160px] min-h-[172px] flex-1 bg-warn-bg rounded-xl flex flex-col p-sm pb-lg gap-xs border border-yellow/40">
        <div className="flex items-center gap-xxxs">
          <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-yellow text-deep-teal font-poppins font-bold text-xxs">E</span>
          <span className="font-poppins font-semibold text-xs text-deep-teal">Ekstra</span>
        </div>
        <div>
          <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Produkt</span>
          <span className="font-poppins font-semibold text-sm text-text-primary">
            {products.find(p => p.id === ekstra.productId)?.recipeCode ?? '–'}
          </span>
        </div>
        <div>
          <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Sendt</span>
          <span className="font-poppins font-bold text-lg text-text-primary tabular-nums">{ekstra.tons}t</span>
        </div>
        {ekstra.puljelaes && (
          <span className="inline-flex items-center gap-[5px] font-inter text-xxs text-deep-teal">
            <Layers size={10} />
            Puljelæs {otherPuljelaesCount > 0 ? `(+${otherPuljelaesCount} ekstra på samme bil)` : ''}
          </span>
        )}
        {ekstra.multilaes && (
          <span className="inline-flex items-center gap-[5px] font-inter text-xxs text-deep-teal">
            <Layers size={10} />
            Multilæs ({ekstra.andreOrdrer.length + 1} ordrer)
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-[160px] min-h-[172px] flex-1 bg-warn-bg rounded-xl flex flex-col p-sm pb-lg gap-xs transition-all border border-yellow/40 hover:border-yellow">
      {/* Slet-knap */}
      <button
        onClick={onRemove}
        aria-label="Fjern ekstra-bestilling"
        className="absolute top-[8px] right-[8px] w-5 h-5 rounded-full flex items-center justify-center text-text-muted hover:bg-bad/10 hover:text-bad transition-colors"
      >
        <X size={12} />
      </button>

      <div className="flex items-center gap-xxxs">
        <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-yellow text-deep-teal font-poppins font-bold text-xxs">E</span>
        <span className="font-poppins font-semibold text-xs text-deep-teal">Ekstra</span>
      </div>

      {/* Produkt-dropdown — union når multilæs ON */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Produkt</span>
        <select
          value={ekstra.productId}
          onChange={e => onUpdate({ productId: e.target.value })}
          className="w-full bg-white border border-hairline rounded-lg px-xs py-xxxs font-poppins font-semibold text-xs text-text-primary focus:border-dark-teal outline-none"
        >
          {produktOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}{ekstra.multilaes ? ` (${opt.kilde})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Tons-input */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Tons</span>
        <div className="flex items-center gap-xxxs bg-white border border-hairline rounded-lg px-xs py-xxxs focus-within:border-dark-teal transition-colors">
          <input
            type="number"
            value={ekstra.tons || ''}
            onChange={e => onUpdate({ tons: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            className="font-poppins font-semibold text-lg text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="0"
          />
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
      </div>

      {/* ── Scope-toggles ────────────────────────────────────────── */}
      <div className="flex flex-col gap-xxxs pt-xxxs border-t border-yellow/30">
        {/* Puljelæs-toggle — kan slås ON proaktivt selv ved 1 ekstra-bestilling */}
        <button
          onClick={() => onUpdate({ puljelaes: !ekstra.puljelaes })}
          aria-pressed={ekstra.puljelaes}
          className="flex items-center gap-xxxs text-left transition-colors hover:opacity-80"
        >
          <span className={[
            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
            ekstra.puljelaes ? 'bg-deep-teal border-deep-teal' : 'bg-white border-hairline',
          ].join(' ')}>
            {ekstra.puljelaes && <CheckCircle2 size={10} className="text-yellow" strokeWidth={3} />}
          </span>
          <span className="font-inter text-xxs font-medium text-text-secondary flex items-center gap-[3px]">
            <Layers size={10} className="text-deep-teal" />
            Puljelæs
          </span>
        </button>
        {/* Status — implicit gruppe */}
        {ekstra.puljelaes && otherPuljelaesCount > 0 && (
          <span className="font-inter text-xxs text-text-muted pl-[20px] leading-tight">
            Pakket med {otherPuljelaesCount} anden ekstra
          </span>
        )}

        {/* Multilæs-toggle */}
        <button
          onClick={() => onUpdate({ multilaes: !ekstra.multilaes })}
          aria-pressed={ekstra.multilaes}
          className="flex items-center gap-xxxs text-left transition-colors hover:opacity-80"
        >
          <span className={[
            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
            ekstra.multilaes ? 'bg-deep-teal border-deep-teal' : 'bg-white border-hairline',
          ].join(' ')}>
            {ekstra.multilaes && <CheckCircle2 size={10} className="text-yellow" strokeWidth={3} />}
          </span>
          <span className="font-inter text-xxs font-medium text-text-secondary flex items-center gap-[3px]">
            <Truck size={10} className="text-deep-teal" />
            Multilæs
          </span>
        </button>
      </div>

      {/* Multilæs ordre-picker — vises kun når toggle ON */}
      {ekstra.multilaes && (
        <div className="flex flex-col gap-xxxs pt-xxs border-t border-yellow/30">
          <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block">Andre ordrer</span>
          {andreOrdrer.length === 0 ? (
            <span className="font-inter text-xxs text-text-muted italic">Ingen andre ordrer i dag</span>
          ) : (
            andreOrdrer.map(o => {
              const isChecked = ekstra.andreOrdrer.includes(o.id)
              return (
                <button
                  key={o.id}
                  onClick={() => toggleAndenOrdre(o.id)}
                  aria-pressed={isChecked}
                  className="flex items-start gap-xxxs text-left hover:opacity-80 transition-colors"
                >
                  <span className={[
                    'w-3 h-3 mt-[3px] rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                    isChecked ? 'bg-deep-teal border-deep-teal' : 'bg-white border-hairline',
                  ].join(' ')}>
                    {isChecked && <CheckCircle2 size={8} className="text-yellow" strokeWidth={3} />}
                  </span>
                  <div className="flex flex-col gap-0 min-w-0 flex-1">
                    <span className="font-inter text-xxs font-semibold text-text-primary leading-tight truncate">
                      {o.orderNumber}
                    </span>
                    <span className="font-inter text-xxs text-text-muted leading-tight truncate">
                      {o.jobnummer.replace(/^\d+\.\s*/, '')}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── CommentCell ──────────────────────────────────────────────────────────────

function CommentCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const LIMIT = 80
  const isTruncatable = text.length > LIMIT

  return (
    <div className="p-sm">
      <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Kommentar</span>
      <p className="font-inter text-sm text-text-secondary leading-relaxed">
        {isTruncatable && !expanded ? text.slice(0, LIMIT).trimEnd() + '…' : text}
        {isTruncatable && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="ml-xs font-inter text-xs font-medium text-dark-teal hover:underline"
          >
            {expanded ? 'Vis mindre' : 'Vis mere'}
          </button>
        )}
      </p>
    </div>
  )
}

// ─── DocRow ───────────────────────────────────────────────────────────────────

function DocRow({ title, meta, status, open, onToggle, children, isLast = false }: {
  title: string
  meta: string
  status: 'ok' | 'bad'
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div className={!isLast ? 'border-b border-hairline' : undefined}>
      <button
        onClick={onToggle}
        className={`w-full grid items-center gap-md px-sm py-sm transition-colors ${!open ? 'hover:bg-[#F5F5F5]' : ''}`}
        style={{ gridTemplateColumns: '1fr auto auto auto' }}
      >
        <span className="font-inter text-sm font-medium text-text-primary text-left">{title}</span>
        <span className="font-inter text-xs text-text-muted">{meta}</span>
        <span className="inline-flex items-center gap-[5px] w-[80px]">
          <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${status === 'ok' ? 'bg-[#1F8A5B]' : 'bg-[#C8372D]'}`} />
          <span className={`font-inter text-xs font-medium ${status === 'ok' ? 'text-text-muted' : 'text-[#C8372D]'}`}>
            {status === 'ok' ? 'OK' : 'Mangler'}
          </span>
        </span>
        <ChevronDown size={14} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-sm pt-sm pb-sm border-t border-hairline">{children}</div>
      )}
    </div>
  )
}

// ─── FjernModal ───────────────────────────────────────────────────────────────

function FjernModal({ resource, onConfirm, onCancel }: {
  resource: MockResource
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-md">
      <div className="bg-white rounded-2xl shadow-md p-md w-full max-w-sm border border-hairline">
        <p className="font-poppins font-semibold text-md text-text-primary mb-xxxs">Fjern maskine?</p>
        <p className="font-inter text-sm text-text-secondary mb-md leading-relaxed">
          <span className="font-medium">{resource.description}</span> fjernes fra ordren.
          Husk at opdatere transport hvis nødvendigt.
        </p>
        <div className="flex gap-xs">
          <button onClick={onCancel} className="flex-1 py-xs rounded-xl border border-hairline font-inter font-semibold text-sm text-text-secondary hover:border-hairline-2 transition-colors">
            Annuller
          </button>
          <button onClick={onConfirm} className="flex-1 py-xs rounded-xl bg-bad text-white font-inter font-semibold text-sm hover:opacity-90 transition-opacity">
            Fjern
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TransportBadge ───────────────────────────────────────────────────────────

const TRANSPORT_TAG_STYLES: Record<MockResource['transportTag'], string> = {
  'blokvogn':    'bg-[#F5F5F5] text-text-secondary',
  'kran-baand':  'bg-warn-bg text-deep-teal',
  'egen-korsel': 'bg-[#F5F5F5] text-text-secondary',
}

const TRANSPORT_TAG_LABEL: Record<MockResource['transportTag'], string> = {
  'blokvogn':    'Blokvogn',
  'kran-baand':  'Kran-Bånd',
  'egen-korsel': 'Egen kørsel',
}

function TransportBadge({ tag }: { tag: MockResource['transportTag'] }) {
  return (
    <span className={`inline-block px-xs py-[2px] rounded-md font-inter text-xxs font-medium ${TRANSPORT_TAG_STYLES[tag]}`}>
      {TRANSPORT_TAG_LABEL[tag]}
    </span>
  )
}

// ─── Forundersøgelse data ─────────────────────────────────────────────────────

const EKSTRA_OPTIONS = [
  'Regulering af fast rendestensrist',
  'Regulering af fast stophane',
  'Regulering af fast Ø 300',
  'Regulering af fast Ø 600 dæksel',
  'Regulering af flydende rist',
  'Regulering af flydende stophane',
  'Regulering af flydende Ø 300 dæksel',
  'Regulering af flydende Ø 600 dæksel',
  'Udskiftning af dæksel excl. brøndgods',
  'Udskiftning af dæksel incl. brøndgods',
  'Udskiftning af rist excl. brøndgods',
  'Udskiftning af rist incl. brøndgods',
  'Ø 300 flydende rendestensrist',
  'Ø 300 overtopstykke (beton) 30 mm',
  'Ø 300 overtopstykke (beton) 50 mm',
  'Ø 300 overtopstykke (beton) 100 mm',
  'Ø 325 kombinringe (plast)',
  'Ø 475 mellemlægsskiver',
  'Ø 600 dæksel (40t)',
  'Ø 600 flydende karm (40t)',
  'Ø 600 kombinringe (plast)',
  'Ø 600 topringe (beton) h. 30 mm',
  'Ø 600 topringe (beton) h. 50 mm',
  'Ø 600 topringe (beton) h. 100 mm',
  'Ø 750 mellemlægsskiver',
]

interface EkstraLinje {
  id: string
  type: string
  beskrivelse: string
  antal: number
}

const UNDERLAG_OPTIONS: { value: UnderlagType; label: string }[] = [
  { value: 'asfalt',  label: 'Asfalt'  },
  { value: 'grus',    label: 'Grus'    },
  { value: 'beton',   label: 'Beton'   },
  { value: 'fraeset', label: 'Fræset'  },
  { value: 'andet',   label: 'Andet'   },
]

const AARSAG_OPTIONS: { value: UnderlaegsAarsag; label: string }[] = [
  { value: 'revner',       label: 'Revner'      },
  { value: 'sporkoert',    label: 'Sporkørt'    },
  { value: 'krakeleret',   label: 'Krakeleret'  },
  { value: 'ujaevn',       label: 'Ujævn'       },
  { value: 'saetninger',   label: 'Sætninger'   },
  { value: 'snavs',        label: 'Snavs'       },
  { value: 'bloed',        label: 'Blød'        },
  { value: 'graes-ukrudt', label: 'Græs/ukrudt' },
]

// ─── ForCheckbox ──────────────────────────────────────────────────────────────

function ForCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      role="checkbox"
      aria-checked={checked}
      className={[
        'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer',
        checked
          ? 'bg-deep-teal border-deep-teal'
          : 'bg-white border-slate-300 hover:border-dark-teal',
      ].join(' ')}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

// ─── UdfoerselContent ─────────────────────────────────────────────────────────

// PLAN-felt — styrer timeafregnings-flow for materiel-sektionen
// TODO: Erstat med Supabase når klar — timeafregning-feltet kommer fra orders.plan_timeafregning
type TimeafregningFraPlan = 'ja' | 'nej'

// Materiel-enhed (anlæg fra holdpakken) — genbruger anlægsinfo fra INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE
interface MaterielEnhed {
  anlaegsNr: string
  beskrivelse: string
}

// De tre anlæg fra holdpakken — data fra INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE
// TODO: Erstat med Supabase når klar — anlæg kommer fra holdpakke knyttet til ordren
const MATERIEL_ENHEDER: MaterielEnhed[] = [
  { anlaegsNr: '5-0034', beskrivelse: 'HAMM HD10 VT' },
  { anlaegsNr: '3-0112', beskrivelse: 'VÖGELE 1900-3I' },
  { anlaegsNr: '7-0078', beskrivelse: 'HAMM DV70VV' },
]

function UdfoerselContent({ forundersoegelseFotos, onAddPhotos, vognmandBekraeftelse, vognmandMaterielBekraeftelse, todayDay, products, isSamleordreMode, samleordreCtx, ordredetaljerCard }: {
  forundersoegelseFotos: MockPhoto[]
  onAddPhotos: (p: MockPhoto[]) => void
  vognmandBekraeftelse?: VognmandBekraeftelse
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  todayDay?: DayPlan
  /** Alle produkter i ordren — bruges til produkt+dato-selector */
  products: MockProduct[]
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Genbrugt Ordredetaljer-visning fra Planlægning-mode (samme JSX som vises der) */
  ordredetaljerCard: ReactNode
}) {
  // ── Produkt + dato selector state ───────────────────────────────────────────
  // TODO (produktion): Selector-state (selectedProductId + selectedDate) skal huskes
  //   pr. ordre i URL eller user-state. Default er dagens dato + dagens aktive produkt.
  // selectedProductId bruges til getMockDataForProductDate — produkt-tabs er fjernet men
  // intern mock-data-kobling kræver stadig en valgt produkt-id (default: dagen aktive)
  const [selectedProductId] = useState<string>(() => {
    const todayStr = TODAY.toISOString().split('T')[0]
    const activeToday = products.find(p =>
      p.startDate !== undefined && p.endDate !== undefined &&
      p.startDate <= todayStr && p.endDate >= todayStr
    )
    return (activeToday ?? products[0]).id
  })
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return TODAY.toISOString().split('T')[0]
  })

  // Mock-variation per (produkt, dato) — værdier ændrer sig deterministisk med valg
  // TODO: Erstat med Supabase når klar — hent faktiske dagtal fra plan_vejebilag og dagplan
  function getMockDataForProductDate(productId: string, date: string) {
    const hash = (productId + date).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const selectedProduct = products.find(p => p.id === productId)
    const baseArea = selectedProduct?.m2 ?? 1000
    return {
      tonsAnkommet: 50 + (hash % 200),
      areal: Math.round(baseArea * 0.3 + (hash % Math.round(baseArea * 0.5))),
      forventetUdlagtM2: Math.round(baseArea * 0.4 + (hash % Math.round(baseArea * 0.4))),
    }
  }

  // ── Dagsdata — hardcoded for demo, TODO: hent fra ordre-objekt når Supabase klar ───
  const DEMO_ORDRE_ID = '260423891'
  const DEMO_DATO = new Date().toISOString().slice(0, 10)
  const DEMO_AREAL_I_DAG = 1339      // m² — TODO: beregn fra dagplan-tons × 1000/kg_per_m2
  const DEMO_TONS_I_DAG = 251        // t   — TODO: hent fra dagplan
  const DEMO_TYKKELSE = 45           // mm  — TODO: hent fra ordre.planlaegning.tykkelse
  const DEMO_ORDRE_TOTAL_AREAL = 4017 // m² — TODO: hent fra ordre
  const DEMO_ORDRE_TOTAL_TONS = 752   // t  — TODO: hent fra ordre

  const { recept } = useRecept('82101H') // SMA 11S — TODO: Erstat med Supabase når klar
  const { vejesedler } = useVejesedler(DEMO_ORDRE_ID, DEMO_DATO)
  const { tonsAnkommet, forventetUdlagtM2, faktiskRegistrering, gemFaktisk } = useDagsoverblik(
    DEMO_ORDRE_ID,
    DEMO_DATO,
    recept
  )

  const [underlaegsType, setUnderlaegsType] = useState<UnderlagType | ''>('asfalt')
  const [underlaegsAndet, setUnderlaegsAndet] = useState('')
  const [tilfredsstillende, setTilfredsstillende] = useState<boolean | null>(null)
  const [underlaegsAarsager, setUnderlaegsAarsager] = useState<Set<UnderlaegsAarsag>>(new Set())
  const [aftaltMed, setAftaltMed] = useState('')
  const [forbehold, setForbehold] = useState('')
  const [saved, setSaved] = useState(false)
  const [forundersoegelseOpen, setForundersoegelseOpen] = useState(false)
  const [ekstraOpen, setEkstraOpen] = useState(false)
  const [ekstraLinjer, setEkstraLinjer] = useState<EkstraLinje[]>([])
  const [ekstraSent, setEkstraSent] = useState(false)

  // ── Materiel / timeafregning state ──────────────────────────────────────────
  // TODO: Fjernes — kun til demo. I produktion kommer feltet fra PLAN
  const [timeafregningFraPlan, setTimeafregningFraPlan] = useState<TimeafregningFraPlan>('nej')
  // Case A (nej): samlet timer for hele holdpakken
  const [holdpakkeTimer, setHoldpakkeTimer] = useState<number>(7.5)
  // Case A (nej): afkrydsning per anlæg — default alle anvendt
  const [materielAnvendt, setMaterielAnvendt] = useState<Record<string, boolean>>(
    () => Object.fromEntries(MATERIEL_ENHEDER.map(e => [e.anlaegsNr, true]))
  )
  // Case B (ja): timer per anlæg
  const [materielTimer, setMaterielTimer] = useState<Record<string, number>>(
    () => ({ '5-0034': 8.5, '3-0112': 7.0, '7-0078': 2.0 })
  )

  // ── Afregning state ──────────────────────────────────────────────────────────
  // Key: reg.nr (biler) eller chauffoer-navn (materiel)
  const [afregningOpen, setAfregningOpen] = useState<Set<string>>(new Set())

  const [materielAfregningGodkendt, setMaterielAfregningGodkendt] = useState(false)

  // ── Vejeseddel-fordeling state ───────────────────────────────────────────────
  // TODO: Erstat med Supabase når klar — fordeling skrives til vejesedler[].fordeling[]
  // Keyed by vejeseddel.id — initialiseres fra pre_fordeling
  const [vejeseddelFordelinger, setVejeseddelFordelinger] = useState<Record<string, { ordre_id: string; tons: number }[]>>(() => {
    const initial: Record<string, { ordre_id: string; tons: number }[]> = {}
    const biler = INITIAL_VOGNMAND_BEKRAEFTELSER['d2-1']?.biler ?? []
    for (const bil of biler) {
      for (const vs of bil.vejesedler ?? []) {
        if (vs.multilaes_flag) {
          initial[vs.id] = vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
        }
      }
    }
    return initial
  })
  // Hvilke multilæs-vejesedler har åben fordeling-expander
  const [vejeseddelExpanded, setVejeseddelExpanded] = useState<Set<string>>(new Set())
  // Reg.nr'er hvor formand har bekræftet 1.5t-skift til timeløn
  const [et5tBekraeftet, setEt5tBekraeftet] = useState<Set<string>>(new Set())

  // Lokal kopi af afregnings-felter per chauffør-nøgle
  const [afregningData, setAfregningData] = useState<Record<string, ChauffoerAfregning>>(() => {
    // Initialiser fra mock — biler
    // TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
    const initial: Record<string, ChauffoerAfregning> = {}
    const bilerData = INITIAL_VOGNMAND_BEKRAEFTELSER['d2-1']?.biler ?? []
    for (const bil of bilerData) {
      if (bil.afregning) {
        initial[bil.regnr] = {
          chauffoer_navn: bil.chauffoer,
          reg_nr: bil.regnr,
          ...bil.afregning,
        }
      }
    }
    // Materiel-biler er nu en del af bilerData — ingen separat init nødvendig
    // TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app
    return initial
  })

  const [visUdlaegningInput, setVisUdlaegningInput] = useState(false)
  // Mini-strip: om fuld spec-grid er åben
  const [detailsExpanded, setDetailsExpanded] = useState(false)

  function toggleAfregning(key: string) {
    setAfregningOpen(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  function updateAfregningField(key: string, field: keyof ChauffoerAfregning, value: number | string | boolean | undefined) {
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  function godkendAfregning(key: string) {
    const now = new Date()
    const tids = `${now.getDate()}. ${['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'][now.getMonth()]} · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], godkendt_af_formand: true, godkendt_tidspunkt: tids },
    }))
    setAfregningOpen(prev => { const next = new Set(prev); next.delete(key); return next })
  }

  function genaabnAfregning(key: string) {
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], godkendt_af_formand: false, godkendt_tidspunkt: undefined },
    }))
    setAfregningOpen(prev => new Set([...prev, key]))
  }

  function addEkstraLinje() {
    setEkstraLinjer(prev => [...prev, { id: `el-${Date.now()}`, type: '', beskrivelse: '', antal: 1 }])
  }

  function updateEkstraLinje(id: string, field: keyof EkstraLinje, value: string | number) {
    setEkstraLinjer(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    setEkstraSent(false)
  }

  function removeEkstraLinje(id: string) {
    setEkstraLinjer(prev => prev.filter(l => l.id !== id))
  }

  const PHOTO_COLORS = ['bg-dark-teal/20', 'bg-yellow/20', 'bg-light-aqua/40']

  function toggleAarsag(a: UnderlaegsAarsag) {
    setUnderlaegsAarsager(prev => {
      const next = new Set(prev)
      if (next.has(a)) next.delete(a); else next.add(a)
      return next
    })
    setSaved(false)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const newPhotos: MockPhoto[] = files.map((file, i) => ({
      id: `fo-${Date.now()}-${i}`,
      color: PHOTO_COLORS[(forundersoegelseFotos.length + i) % PHOTO_COLORS.length],
      label: file.name.replace(/\.[^.]+$/, ''),
      source: 'forundersoegelse',
      url: URL.createObjectURL(file),
    }))
    onAddPhotos(newPhotos)
    // Reset så samme fil kan vælges igen
    e.target.value = ''
  }

  const antalBiler = vognmandBekraeftelse?.biler.length ?? 0

  // Beregn alle udførelses-datoer på tværs af alle produkter
  const udfoerselDays = useMemo(() => {
    const allDates = new Set<string>()
    for (const p of products) {
      if (!p.startDate || !p.endDate) continue
      const start = new Date(p.startDate + 'T00:00:00')
      const end = new Date(p.endDate + 'T00:00:00')
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        allDates.add(d.toISOString().split('T')[0])
      }
    }
    return Array.from(allDates).sort()
  }, [products])

  return (
    <div className="flex flex-col gap-[48px]">

      {/* ── Dato-piller (Udførsel) — alt indkapslet i én pille ────────── */}
      {/* "Udføres i perioden" label + datoer ligger i samme rounded-full container */}
      {udfoerselDays.length > 0 && (
        <div className="inline-flex items-center gap-xs bg-white border border-hairline rounded-full pl-md pr-xxxs py-xxxs self-start">
          <span className="font-poppins font-semibold text-sm text-text-primary whitespace-nowrap">
            Udføres i perioden
          </span>
          <div className="flex items-center gap-xxxs flex-wrap">
            {udfoerselDays.map(ds => {
              const isSelected = ds === selectedDate
              // Overstået dag = rød skravering så formanden ser at den er passeret
              const isPast = ds < dateToString(TODAY)
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  aria-pressed={isSelected}
                  aria-label={`${formatLongDate(ds)}${isPast ? ' (overstået)' : ''}`}
                  className={[
                    'flex items-center gap-xxxs px-sm py-xs rounded-full font-poppins font-semibold text-sm transition-colors',
                    isSelected
                      ? 'bg-deep-teal text-white shadow-sm'
                      : isPast
                        ? 'bg-bad/15 text-bad hover:bg-bad/20'
                        : 'bg-surface-2 text-text-muted hover:bg-soft-aqua hover:text-deep-teal',
                  ].join(' ')}
                >
                  {formatLongDate(ds)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Dagens overblik — status-bokse ───────────────────────────── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <div className="flex flex-col gap-xs">
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Dagens overblik</h2>
        {/* Alle 7 bokse i ét fælles grid — samme bredde og højde via auto-rows-fr */}
        {(() => {
          const fmtTal = (n: number, max = 0) =>
            new Intl.NumberFormat('da-DK', { maximumFractionDigits: max }).format(n)
          const materielBekraeftet2 = !!(vognmandMaterielBekraeftelse && vognmandMaterielBekraeftelse.items.length > 0)
          const antalMateriel2 = vognmandMaterielBekraeftelse?.items.length ?? 0
          const forundersoegelseForetaget2 = underlaegsType && tilfredsstillende !== null && tilfredsstillende !== undefined
          // Hent mock-variation baseret på valgt produkt + dato
          const mockData = getMockDataForProductDate(selectedProductId, selectedDate)
          const selectedProductObj = products.find(p => p.id === selectedProductId)
          return (
            <div className={isSamleordreMode ? 'grid grid-cols-3 gap-xs auto-rows-fr' : 'grid grid-cols-3 xl:grid-cols-7 gap-xs auto-rows-fr'}>
              {/* Biler */}
              <div className={`flex flex-col items-start min-w-0 w-full min-h-[120px] px-sm py-xs rounded-xl border ${vognmandBekraeftelse ? 'bg-good-bg border-good/30' : 'bg-surface border-hairline'}`}>
                <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">
                  Biler
                </span>
                <div className="flex-1 flex items-end pb-xxxs">
                  <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">
                    {antalBiler}
                  </span>
                </div>
                <span className="font-inter text-xs text-text-muted min-h-[1em]">
                  {vognmandBekraeftelse ? 'Bekræftet vognmand' : 'Afventer bekræftelse'}
                </span>
              </div>
              {/* Materiel transport */}
              <div className={`flex flex-col items-start min-w-0 w-full min-h-[120px] px-sm py-xs rounded-xl border ${materielBekraeftet2 ? 'bg-good-bg border-good/30' : 'bg-surface border-hairline'}`}>
                <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">
                  Materiel transport
                </span>
                <div className="flex-1 flex items-end pb-xxxs">
                  <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">
                    {antalMateriel2}
                  </span>
                </div>
                <span className="font-inter text-xs text-text-muted min-h-[1em]">
                  {materielBekraeftet2 ? 'Bekræftet vognmand' : 'Afventer bekræftelse'}
                </span>
              </div>
              {/* Forundersøgelse */}
              <div className={`flex flex-col items-start min-w-0 w-full min-h-[120px] px-sm py-xs rounded-xl border ${forundersoegelseForetaget2 ? 'bg-good-bg border-good/30' : 'bg-bad-bg border-bad/30'}`}>
                <span className={`font-inter text-xxs font-medium tracking-widest uppercase ${forundersoegelseForetaget2 ? 'text-text-muted' : 'text-bad/70'}`}>
                  Forundersøgelse
                </span>
                <div className="flex-1 flex items-end pb-xxxs">
                  <span className={`font-poppins font-semibold text-xl tabular-nums ${forundersoegelseForetaget2 ? 'text-text-primary' : 'text-bad'}`}>
                    {forundersoegelseForetaget2 ? 'OK' : '–'}
                  </span>
                </div>
                <span className={`font-inter text-xs min-h-[1em] ${forundersoegelseForetaget2 ? 'text-text-muted' : 'text-bad/80'}`}>
                  {forundersoegelseForetaget2 ? (tilfredsstillende ? 'Tilfredsstillende' : 'Ikke tilfredsstillende') : 'Mangler vurdering'}
                </span>
              </div>
              {/* 4 OrdreInfoCards — KUN for enkelt-ordre. Areal/Produkt/Tykkelse/Tons giver ikke mening
                  for samleordre (flere ordrer, flere produkter). Brug Ordredetaljer-mini-strippen i stedet. */}
              {/* TODO (produktion): Kortene bruger mockData koblet til (selectedProductId, selectedDate) */}
              {recept && !isSamleordreMode && (
                <>
                  <OrdreInfoCard
                    label="AREAL I DAG"
                    value={fmtTal(mockData.areal)}
                    unit="m²"
                    subtekst={`á ${fmtTal(selectedProductObj?.m2 ?? DEMO_ORDRE_TOTAL_AREAL)} m²`}
                  />
                  <OrdreInfoCard
                    label="PRODUKT"
                    value={selectedProductObj?.recipeCode ?? recept.navn}
                    subtekst={selectedProductObj?.recipeName ?? recept.kode}
                  />
                  <OrdreInfoCard
                    label="TYKKELSE"
                    value={fmtTal(selectedProductObj?.thicknessMm ?? DEMO_TYKKELSE)}
                    unit="mm"
                  />
                  <OrdreInfoCard
                    label="TONS I DAG"
                    value={fmtTal(mockData.tonsAnkommet)}
                    subtekst={`á ${fmtTal(selectedProductObj?.tonsTotal ?? DEMO_ORDRE_TOTAL_TONS)} t`}
                  />
                </>
              )}
            </div>
          )
        })()}
        {/* REPLACED: old 2-row layout (inline-flex + DagsoverblikSection) replaced by unified grid above.
              <span>dead_code_placeholder–'}
              </span>
              <span className={`font-inter text-xs ${forundersoegelseForetaget ? 'text-text-muted' : 'text-bad/80'}`}>
                {forundersoegelseForetaget ? (tilfredsstillende ? 'Tilfredsstillende' : 'Ikke tilfredsstillende') : 'Mangler vurdering'}
              </span>
              {/* NOTE:
                {forundersoegelseForetaget ? (tilfredsstillende ? 'Tilfredsstillende' : 'Ikke tilfredsstillende') : ' '}
              </span>
        */}
      </div>

      {/* ── Ordredetaljer mini-strip (collapsed) — placeret over Forundersøgelse ─── */}
      {/* Collapsed label = "Ordredetaljer" (genvej til kontekst). Expander genbruger
          ordredetaljerCard fra Planlægning-mode, så samleordre-tab-split også vises korrekt. */}
      <div className="flex flex-col gap-xxxs">
        <div className="flex items-center gap-sm bg-white border border-hairline rounded-lg px-sm py-xs">
          <span className="font-inter text-xs font-semibold text-text-primary flex-shrink-0">
            Ordredetaljer
          </span>
          {isSamleordreMode && samleordreCtx ? (
            <>
              <span className="inline-flex items-center gap-xxxs bg-warn-bg border border-yellow text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider whitespace-nowrap">
                Samleordre
              </span>
              <span className="font-inter text-xs text-text-primary truncate">
                {samleordreCtx.children.map(c => c.stedLabel).join(' + ')}
              </span>
            </>
          ) : (
            <span className="font-inter text-xs text-text-primary truncate">
              Søvej 6D, Nakskov
            </span>
          )}
          {/* Produkt-badges */}
          <div className="flex items-center gap-xxxs flex-wrap">
            {products.map(p => (
              <span
                key={p.id}
                className="bg-soft-aqua text-deep-teal font-inter text-xxs px-xs py-xxxs rounded-md"
              >
                {p.recipeCode} {p.tonsTotal}t
              </span>
            ))}
          </div>
          {/* Vis detaljer-knap */}
          <button
            onClick={() => setDetailsExpanded(e => !e)}
            className="ml-auto flex items-center gap-xxxs font-inter text-xs font-medium text-dark-teal hover:text-deep-teal transition-colors flex-shrink-0"
          >
            {detailsExpanded ? 'Skjul' : 'Vis detaljer'}
            {detailsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        {/* Expander: genbrug af ordredetaljerCard fra Planlægning-mode */}
        {detailsExpanded && (
          <div className="mt-xs">
            {ordredetaljerCard}
          </div>
        )}
      </div>

      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <section>
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Forundersøgelse</h2>
        <div className={`w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm`}>
          <button
            type="button"
            onClick={() => setForundersoegelseOpen(o => !o)}
            className="w-full flex items-start justify-between px-md py-sm cursor-pointer hover:border-hairline-2 transition-colors"
            aria-expanded={forundersoegelseOpen}
          >
            <div className="flex flex-col gap-xxxs items-start">
              {!forundersoegelseOpen && (
                <div className="text-xs text-text-muted font-inter">
                  {underlaegsType ? (
                    <>
                      <span className="font-semibold text-text-secondary">
                        {underlaegsType === 'asfalt' ? 'Asfalt'
                          : underlaegsType === 'beton' ? 'Beton'
                          : underlaegsType === 'grus' ? 'Grus'
                          : underlaegsType === 'andet' ? (underlaegsAndet || 'Andet')
                          : underlaegsType}
                      </span>
                      {' · '}
                      {tilfredsstillende === true ? 'Tilfredsstillende' : tilfredsstillende === false ? 'Ikke tilfredsstillende' : 'Tilstand ikke vurderet'}
                      {' · '}
                      {forundersoegelseFotos.length} {forundersoegelseFotos.length === 1 ? 'billede' : 'billeder'}
                      {ekstraLinjer.length > 0 && <> · {ekstraLinjer.length} ekstraarbejde</>}
                    </>
                  ) : (
                    <span className="italic">Ikke udfyldt endnu</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-xs">
              {!forundersoegelseOpen && (
                underlaegsType && tilfredsstillende !== null && tilfredsstillende !== undefined ? (
                  <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-good-bg text-good border border-good/30">
                    Vurderet
                  </span>
                ) : (
                  <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-bad-bg text-bad border border-bad/30">
                    Mangler vurdering
                  </span>
                )
              )}
              {forundersoegelseOpen ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
            </div>
          </button>

        {forundersoegelseOpen && <div className="flex flex-col gap-sm p-md pt-sm">

          {/* ── Række 1: Underlag + Tilstand ─────────────────────── */}
          <div className="grid grid-cols-2 divide-x divide-hairline rounded-xl border border-hairline overflow-hidden">

            {/* Underlag dropdown */}
            <div className="p-md">
              <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
                Underlag / Bund
              </p>
              <div className="relative">
                <select
                  value={underlaegsType}
                  onChange={e => { setUnderlaegsType(e.target.value as UnderlagType); setSaved(false) }}
                  className="w-full font-inter text-sm text-text-primary bg-[#F5F5F5] border border-hairline rounded-xl px-sm py-xs pr-[32px] focus:outline-none focus:border-dark-teal focus:bg-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Vælg underlag...</option>
                  {UNDERLAG_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              {underlaegsType === 'andet' && (
                <input
                  type="text"
                  value={underlaegsAndet}
                  onChange={e => { setUnderlaegsAndet(e.target.value); setSaved(false) }}
                  placeholder="Beskriv underlag..."
                  className="mt-xs w-full font-inter text-sm text-text-primary bg-[#F5F5F5] border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal focus:bg-white transition-colors"
                />
              )}
            </div>

            {/* Tilstand */}
            <div className="p-md">
              <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
                Underlagets tilstand
              </p>
              <div className="flex items-center gap-xs mb-xs">
                <span className="font-inter text-sm text-text-secondary">Tilfredsstillende:</span>
                {([true, false] as const).map(val => (
                  <button
                    key={String(val)}
                    onClick={() => { setTilfredsstillende(val); setSaved(false) }}
                    className={[
                      'px-sm py-[5px] rounded-xl font-inter text-sm font-semibold border-2 transition-all min-w-[56px]',
                      tilfredsstillende === val
                        ? val
                          ? 'bg-[#2E9E65] border-[#2E9E65] text-white'
                          : 'bg-[#C8372D] border-[#C8372D] text-white'
                        : 'bg-white border-hairline text-text-secondary hover:border-dark-teal/40',
                    ].join(' ')}
                  >
                    {val ? 'Ja' : 'Nej'}
                  </button>
                ))}
              </div>

              {tilfredsstillende === false && (
                <div className="flex flex-col gap-sm pt-sm">
                  <div>
                    <p className="font-inter text-xxs font-medium text-text-muted mb-xs">Årsag:</p>
                    <div className="grid grid-cols-2 gap-xs">
                      {AARSAG_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-xs cursor-pointer">
                          <ForCheckbox
                            checked={underlaegsAarsager.has(opt.value)}
                            onChange={() => toggleAarsag(opt.value)}
                          />
                          <span className="font-inter text-xs text-text-primary select-none">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={aftaltMed}
                    onChange={e => { setAftaltMed(e.target.value); setSaved(false) }}
                    placeholder="Aftalt med (navn / firma)..."
                    className="w-full font-inter text-sm text-text-primary bg-[#F5F5F5] border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal focus:bg-white transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Række 2: Forbehold (fuld bredde) ─────────────────── */}
          <div>
            <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
              Forbehold
            </p>
            <textarea
              value={forbehold}
              onChange={e => { setForbehold(e.target.value); setSaved(false) }}
              rows={3}
              placeholder="Beskriv evt. forbehold for ordren..."
              className="w-full font-inter text-sm text-text-primary bg-[#F5F5F5] border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal focus:bg-white transition-colors resize-none leading-relaxed mb-xs"
            />
            <div className="flex gap-xs bg-[#F5F9FA] border border-dark-teal/15 rounded-xl px-sm py-xs">
              <span className="font-inter text-xxs font-semibold text-dark-teal uppercase tracking-widest flex-shrink-0 mt-[1px]">Eks.</span>
              <p className="font-inter text-xs text-text-muted leading-relaxed italic">
                Bæreevnen af den eksisterende belægning der efterfølgende kan forårsage sætninger og revnedannelse i den nye asfaltbelægning.
              </p>
            </div>
          </div>

          {/* ── Række 3: Billeder (fuld bredde) ───────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-sm">
              <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest">Billeder</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap gap-xs">
              {forundersoegelseFotos.map(foto => (
                <div
                  key={foto.id}
                  className="w-[76px] h-[76px] rounded-xl border border-hairline overflow-hidden flex-shrink-0"
                >
                  {foto.url ? (
                    <img src={foto.url} alt={foto.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${foto.color} flex flex-col items-center justify-center gap-xxxs`}>
                      <Camera size={14} className="text-text-muted" />
                      <span className="font-inter text-xxs text-text-muted text-center px-xxxs leading-tight">{foto.label}</span>
                    </div>
                  )}
                </div>
              ))}
              <div
                onClick={() => fileInputRef.current?.click()}
                role="button"
                aria-label="Tilføj billede"
                className="w-[76px] h-[76px] rounded-xl border-2 border-dashed border-hairline-2 flex flex-col items-center justify-center gap-xxxs cursor-pointer hover:border-dark-teal hover:bg-[#F5F9FA] transition-colors group flex-shrink-0"
              >
                <Plus size={18} className="text-text-muted group-hover:text-dark-teal transition-colors" />
                <span className="font-inter text-xxs text-text-muted group-hover:text-dark-teal transition-colors leading-tight text-center">
                  Tilføj
                </span>
              </div>
            </div>
          </div>

          {/* ── Ekstraarbejde (ekspanderer) ───────────────────────── */}
          {ekstraOpen && (
            <div className="flex flex-col gap-sm">
              <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest">
                Ekstraarbejde
              </p>

              {ekstraLinjer.length === 0 && (
                <p className="font-inter text-xs text-text-muted italic">Ingen linjer endnu — tilføj nedenfor.</p>
              )}

              {ekstraLinjer.map((linje, i) => (
                <div key={linje.id} className="grid gap-xs items-start" style={{ gridTemplateColumns: '1fr 1fr 72px 28px' }}>
                  {/* Type dropdown */}
                  <div className="relative">
                    <select
                      value={linje.type}
                      onChange={e => updateEkstraLinje(linje.id, 'type', e.target.value)}
                      className="w-full font-inter text-xs text-text-primary bg-[#F5F5F5] border border-hairline rounded-lg px-xs py-xs pr-[24px] focus:outline-none focus:border-dark-teal focus:bg-white transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Vælg type...</option>
                      {EKSTRA_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>

                  {/* Beskrivelse */}
                  <input
                    type="text"
                    value={linje.beskrivelse}
                    onChange={e => updateEkstraLinje(linje.id, 'beskrivelse', e.target.value)}
                    placeholder={`Beskrivelse linje ${i + 1}...`}
                    className="font-inter text-xs text-text-primary bg-[#F5F5F5] border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal focus:bg-white transition-colors"
                  />

                  {/* Antal */}
                  <div className="flex items-center border border-hairline rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => updateEkstraLinje(linje.id, 'antal', Math.max(1, linje.antal - 1))}
                      className="px-xs py-xs font-inter text-sm text-text-muted hover:bg-[#F5F5F5] transition-colors leading-none"
                    >−</button>
                    <span className="flex-1 text-center font-inter text-xs font-semibold text-text-primary tabular-nums">{linje.antal}</span>
                    <button
                      onClick={() => updateEkstraLinje(linje.id, 'antal', linje.antal + 1)}
                      className="px-xs py-xs font-inter text-sm text-text-muted hover:bg-[#F5F5F5] transition-colors leading-none"
                    >+</button>
                  </div>

                  {/* Fjern */}
                  <button
                    onClick={() => removeEkstraLinje(linje.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-[#C8372D] hover:bg-[#FBECEA] transition-colors mt-[2px]"
                    aria-label="Fjern linje"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              <button
                onClick={addEkstraLinje}
                className="inline-flex items-center gap-xs font-inter text-xs font-medium text-dark-teal border border-dashed border-dark-teal/40 rounded-lg px-sm py-xs hover:bg-[#F5F9FA] transition-colors self-start"
              >
                <Plus size={13} />
                Tilføj linje
              </button>

              <div className="flex items-center justify-between pt-xs mt-xs">
                {ekstraSent ? (
                  <div className="flex items-center gap-xs bg-[#E7F4EE] border border-[#1F8A5B]/20 rounded-xl px-sm py-xs">
                    <CheckCircle2 size={14} className="text-[#1F8A5B] flex-shrink-0" />
                    <div>
                      <p className="font-inter text-xs font-semibold text-[#1F8A5B]">Sendt til projektleder</p>
                      <p className="font-inter text-xxs text-[#1F8A5B]/70">Henrik Thor · {ekstraLinjer.length} linje{ekstraLinjer.length !== 1 ? 'r' : ''}</p>
                    </div>
                  </div>
                ) : (
                  <p className="font-inter text-xs text-text-muted">
                    Sendes som mail til projektleder ved gem
                  </p>
                )}
                <div className="flex items-center gap-xs">
                  <button
                    onClick={() => { setEkstraLinjer([]); setEkstraSent(false); setEkstraOpen(false) }}
                    className="font-inter text-sm text-text-muted hover:text-text-primary px-xs py-xs transition-colors"
                  >
                    Fortryd
                  </button>
                  <button
                    onClick={() => { if (ekstraLinjer.length > 0) setEkstraSent(true) }}
                    disabled={ekstraLinjer.length === 0}
                    className={[
                      'inline-flex items-center gap-xs font-inter text-sm font-semibold px-md py-xs rounded-xl transition-all active:scale-[0.98]',
                      ekstraSent
                        ? 'bg-[#E7F4EE] text-[#1F8A5B] border border-[#1F8A5B]/20 cursor-default'
                        : ekstraLinjer.length === 0
                          ? 'bg-[#F5F5F5] text-text-muted cursor-not-allowed'
                          : 'bg-[#2E9E65] text-white hover:bg-[#1F8A5B]',
                    ].join(' ')}
                  >
                    {ekstraSent ? <><CheckCircle2 size={14} className="mr-xxxs" />Gemt</> : 'Gem ekstraarbejde'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-sm">
            {!ekstraOpen && (
              <button
                onClick={() => { setEkstraOpen(true); if (ekstraLinjer.length === 0) addEkstraLinje() }}
                className="inline-flex items-center gap-xs font-inter text-sm font-semibold px-md py-xs rounded-xl active:scale-[0.98] transition-all text-white bg-[#2E9E65] hover:bg-[#1F8A5B]"
              >
                <Plus size={16} />
                Tilføj ekstraarbejde
              </button>
            )}

            <button
              onClick={() => setSaved(true)}
              className={[
                'inline-flex items-center gap-xs font-inter text-sm font-semibold px-md py-xs rounded-xl transition-all active:scale-[0.98]',
                saved
                  ? 'bg-[#E7F4EE] text-[#1F8A5B] border border-[#1F8A5B]/20 cursor-default'
                  : 'bg-deep-teal text-white hover:opacity-90',
              ].join(' ')}
            >
              {saved ? <><CheckCircle2 size={15} className="mr-xxxs" />Gemt</> : 'Gem forundersøgelse'}
            </button>
          </div>

        </div>}
        </div>
      </section>

      {/* ── Udlægning ────────────────────────────────────────────── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      {recept && (() => {
        const tonsProgress = DEMO_TONS_I_DAG > 0 ? Math.round((tonsAnkommet / DEMO_TONS_I_DAG) * 100) : 0
        const forventetProgress = DEMO_AREAL_I_DAG > 0 ? Math.round((forventetUdlagtM2 / DEMO_AREAL_I_DAG) * 100) : 0
        const faktiskUdlagtM2 = faktiskRegistrering?.faktiskM2 ?? null
        const faktiskProgress = faktiskUdlagtM2 !== null && DEMO_AREAL_I_DAG > 0 ? Math.round((faktiskUdlagtM2 / DEMO_AREAL_I_DAG) * 100) : 0
        const afvigelse = faktiskUdlagtM2 !== null ? Math.round(faktiskUdlagtM2 - forventetUdlagtM2) : undefined
        const faktiskVariant: 'good' | 'warn' | 'bad' = afvigelse !== undefined && afvigelse < 0 ? 'bad' : 'good'
        const fmtTal = (n: number, d = 0) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: d }).format(n)
        return (
          <section>
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Udlægning</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-xs">
              <FremdriftCard
                variant="tons-ankommet"
                label="UDVEJET FABRIK"
                value={fmtTal(tonsAnkommet, 1)}
                unit=""
                subtekst={`á ${fmtTal(DEMO_TONS_I_DAG)} t dagens plan`}
                progress={tonsProgress}
                progressVariant="good"
              />
              <FremdriftCard
                variant="forventet-udlagt"
                label="FORVENTET M2 UDLAGT"
                value={fmtTal(forventetUdlagtM2)}
                unit=""
                subtekst="beregnet fra tons × kg/m²"
                progress={forventetProgress}
                progressVariant="good"
              />
              <FremdriftCard
                variant="faktisk-udlagt"
                label="FAKTISK M2 UDLAGT"
                value={faktiskUdlagtM2 !== null ? fmtTal(faktiskUdlagtM2) : '–'}
                unit=""
                subtekst={
                  faktiskRegistrering?.gemtTidspunkt
                    ? `senest gemt ${faktiskRegistrering.gemtTidspunkt}`
                    : 'ikke registreret endnu'
                }
                progress={faktiskProgress}
                progressVariant={faktiskVariant}
                afvigelse={afvigelse}
              />
            </div>
            <div className="mt-xs">
              {!visUdlaegningInput ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setVisUdlaegningInput(true)}
                    className="bg-warning text-deep-teal font-inter font-medium text-sm px-sm py-xs rounded-lg min-h-[44px] hover:brightness-95 transition-all"
                  >
                    Registrer udlægning
                  </button>
                </div>
              ) : (
                <FremdriftInputRow
                  densitet={recept.densitet}
                  planTykkelse={DEMO_TYKKELSE}
                  initial={
                    faktiskRegistrering
                      ? { faktiskM2: faktiskRegistrering.faktiskM2!, faktiskTons: faktiskRegistrering.faktiskTons! }
                      : undefined
                  }
                  onSave={({ faktiskM2, faktiskTons }) => {
                    gemFaktisk(faktiskM2, faktiskTons)
                    setVisUdlaegningInput(false)
                  }}
                />
              )}
            </div>
          </section>
        )
      })()}

      {/* ── Vejesedler ──────────────────────────── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <section>
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Vejesedler</h2>
        <VejesedlerTable
          vejesedler={vejesedler}
          recepter={INITIAL_RECEPTER}
          minTemperatur={recept?.min_temperatur ?? 140}
          udlaeggerliste={INITIAL_UDLAEGGERE}
          onTemperatur={(_id, _temp) => { /* TODO: skriv retur til PLAN */ }}
          onUdlaegger={(_id, _materielNr) => { /* TODO: opdater vejeseddel */ }}
        />
      </section>

      {/* ── Bestilte biler ────────────────────────────────────────── */}
      {/* TODO (produktion): Sektion (Bilafregning) filtreres på (selectedProductId, selectedDate) */}
      {todayDay && (
        <section>
          <div className="mb-sm">
            <h2 className="font-poppins font-semibold text-xl text-text-primary">Bil- og tonsafregning</h2>
          </div>

          {vognmandBekraeftelse ? (
            <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
              <table className="w-full">
                    <thead>
                      <tr className="border-b border-hairline bg-surface-2">
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Reg.nr.</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Chauffør</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Tlf.</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Biltype</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Kategori</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Indeholder</th>
                        <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Afregning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vognmandBekraeftelse.biler.map((bil, i) => {
                        const afregKey = bil.regnr
                        const afrData = afregningData[afregKey]
                        const isOpen = afregningOpen.has(afregKey)
                        const isGodkendt = afrData?.godkendt_af_formand ?? false
                        // Materiel-biler afregnes ALTID på time — akkord ikke relevant
                        const effectiveType: AfregningType = bil.er_materiel_bil ? 'time' : (afrData?.afregning_type ?? 'time')
                        const isLast = i === vognmandBekraeftelse.biler.length - 1
                        const bilVejesedlerCollapsed = bil.vejesedler ?? []

                        // ── Læs-type og fordeling-blokering (collapsed) ──────────
                        const harMultilaes = bilVejesedlerCollapsed.some(vs => vs.multilaes_flag)
                        const harPuljelaes = bilVejesedlerCollapsed.some(vs => vs.puljelaes_flag && !vs.multilaes_flag)
                        // Mangler fordeling: mindst én multilæs-vejeseddel har sum != netto_tons
                        const manglerFordeling = harMultilaes && bilVejesedlerCollapsed.some(vs => {
                          if (!vs.multilaes_flag) return false
                          const fordeling = vejeseddelFordelinger[vs.id]
                            ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                          const sum = fordeling.reduce((s, f) => s + f.tons, 0)
                          return Math.abs(vs.netto_tons - sum) >= 0.05
                        })

                        return (
                          <>
                            <tr key={bil.regnr} className={(!isLast || isOpen || isGodkendt) ? 'border-b border-hairline' : ''}>
                              <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums">{bil.regnr}</td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{bil.chauffoer}</td>
                              <td className="align-middle px-xs py-xs">
                                <a href={`tel:${bil.tlf.replace(/\s/g, '')}`} className="font-inter text-xs text-dark-teal flex items-center gap-xxxs hover:text-deep-teal transition-colors">
                                  <Phone size={11} />
                                  {bil.tlf}
                                </a>
                              </td>
                              <td className="align-middle px-xs py-xs">
                                <span className="font-inter text-xs text-text-muted">{bil.biltype}</span>
                              </td>
                              <td className="align-middle px-xs py-xs">
                                {bil.er_materiel_bil ? (
                                  <span className="inline-flex items-center gap-xxxs bg-warn-bg text-text-secondary font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Kørt materiel
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Asfaltkørsel
                                  </span>
                                )}
                              </td>
                              {/* D. Læs-type kolonne — rød "Mangler fordeling" trumfer alt */}
                              <td className="align-middle px-xs py-xs">
                                {!isOpen && manglerFordeling ? (
                                  <span className="inline-flex items-center gap-xxxs bg-bad/10 border border-bad text-bad font-inter font-semibold text-xxs px-xs py-xxxs rounded-md">
                                    <AlertTriangle size={10} className="flex-shrink-0" aria-label="Mangler fordeling" />
                                    Mangler fordeling
                                  </span>
                                ) : harMultilaes ? (
                                  <span className="inline-flex items-center gap-xxxs bg-warn-bg text-text-secondary font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Multilæs
                                  </span>
                                ) : harPuljelaes ? (
                                  <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Puljelæs
                                  </span>
                                ) : null}
                              </td>
                              <td className="align-middle px-xs py-xs text-right">
                                {isGodkendt ? (
                                  <span className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md bg-good-bg text-good font-inter font-semibold text-xs">
                                    <CheckCircle2 size={11} className="flex-shrink-0" />
                                    Afregning godkendt
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => toggleAfregning(afregKey)}
                                    className="inline-flex items-center gap-xxxs bg-warning text-deep-teal font-inter font-medium text-xs py-xxxs px-xs rounded-md hover:opacity-90 transition-opacity"
                                  >
                                    {isOpen ? 'Luk' : 'Lav afregning'}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {(isOpen || isGodkendt) && (() => {
                              // ── Vejeseddel-hjælpere ──────────────────────────────────
                              const bilVejesedler = bil.vejesedler ?? []
                              // Dagens kørte tons = sum af alle vejesedler på bilen
                              const inheritedTons = bilVejesedler.reduce((s, vs) => s + vs.netto_tons, 0)
                              // 1.5t-reglen: mindst én vejeseddel har flaget + bil er akkord
                              const has1_5tRule = effectiveType === 'akkord' && bilVejesedler.some(vs => vs.aflæsset_efter_1_5t)
                              // Formand har bekræftet skift til timeløn for denne bil
                              const er1_5tBekraeftet = et5tBekraeftet.has(bil.regnr)
                              // Effective type inkl. 1.5t-override
                              const displayType: AfregningType = (has1_5tRule && er1_5tBekraeftet) ? 'time' : effectiveType

                              // B. Fordelings-blokering for godkend-knap:
                              // Multilæs-vejesedler der mangler komplet fordeling (sum != netto_tons)
                              // Puljelæs blokerer IKKE — tons går direkte til én ordre
                              const manglerFordelingExpanded = bilVejesedler.some(vs => {
                                if (!vs.multilaes_flag) return false
                                const fordeling = vejeseddelFordelinger[vs.id]
                                  ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                                const sum = fordeling.reduce((s, f) => s + f.tons, 0)
                                return Math.abs(vs.netto_tons - sum) >= 0.05
                              })

                              return (
                              <tr key={`${bil.regnr}-expand`} className={!isLast ? 'border-b border-hairline' : ''}>
                                <td colSpan={7} className="px-xs pb-xs pt-xxxs">
                                  <div className="bg-surface-2 rounded-lg p-sm mt-xxxs border border-hairline">

                                    {/* ── 1,5-times-regel banner (akkord-biler) ──────── */}
                                    {has1_5tRule && !er1_5tBekraeftet && (
                                      <div className="flex flex-wrap items-start gap-xs bg-warn-bg border border-yellow rounded-md p-xs mb-sm">
                                        <AlertTriangle size={14} className="text-text-secondary flex-shrink-0 mt-[1px]" />
                                        <div className="flex-1 min-w-0">
                                          <span className="font-inter text-xs text-text-primary font-semibold block mb-xxxs">
                                            1,5-times-reglen trådte i kraft for denne bil — foreslået skift til timeløn for hele dagen
                                          </span>
                                          <div className="flex flex-wrap items-center gap-xs mt-xxxs">
                                            <button
                                              type="button"
                                              onClick={() => setEt5tBekraeftet(prev => new Set([...prev, bil.regnr]))}
                                              className="inline-flex items-center gap-xxxs bg-warning text-deep-teal font-inter font-medium text-xs px-xs py-xxxs rounded-md hover:opacity-90 transition-opacity min-h-[28px]"
                                            >
                                              <CheckCircle2 size={11} />
                                              Bekræft skift til timeløn
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                // Overstyr — marker som bekræftet men behold akkord visuelt (simpel toggle i prototypen)
                                                // TODO: I produktion: skriv override-flag til afregning
                                              }}
                                              className="font-inter text-xs text-text-muted underline hover:text-text-primary transition-colors"
                                            >
                                              Overstyr (behold akkord)
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {has1_5tRule && er1_5tBekraeftet && (
                                      <div className="flex items-center gap-xs bg-warn-bg border border-yellow rounded-md px-xs py-xxxs mb-sm">
                                        <CheckCircle2 size={12} className="text-good flex-shrink-0" />
                                        <span className="font-inter text-xs text-text-secondary">Skiftet til timeløn (1,5-times-reglen bekræftet)</span>
                                      </div>
                                    )}

                                    {/* ── Afregnings-felter ──────────────────────────── */}
                                    <div className="flex flex-wrap gap-xs items-end">
                                      {displayType === 'time' ? (
                                        <>
                                          <div className="flex flex-col gap-xxxs">
                                            <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">
                                              {bil.er_materiel_bil ? 'Timer' : 'Køretimer'}
                                            </label>
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={afrData?.koretimer ?? ''}
                                              disabled={isGodkendt}
                                              onChange={e => updateAfregningField(afregKey, 'koretimer', parseFloat(e.target.value) || 0)}
                                              className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-xxxs">
                                            <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Ventetid</label>
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={afrData?.ventetid ?? ''}
                                              disabled={isGodkendt}
                                              onChange={e => updateAfregningField(afregKey, 'ventetid', parseFloat(e.target.value) || 0)}
                                              className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                            />
                                          </div>
                                          {/* Pause-felt kun for asfalt-biler — ikke relevant for materiel */}
                                          {!bil.er_materiel_bil && (
                                            <div className="flex flex-col gap-xxxs">
                                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Pause</label>
                                              <input
                                                type="number"
                                                step="0.5"
                                                value={afrData?.pause ?? ''}
                                                disabled={isGodkendt}
                                                onChange={e => updateAfregningField(afregKey, 'pause', parseFloat(e.target.value) || 0)}
                                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                              />
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          {/* A. Akkord — Tons arves fra vejesedler (read-only). Label: "Dagens kørte tons" */}
                                          {bilVejesedler.length > 0 ? (
                                            <div className="flex flex-col gap-xxxs">
                                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Dagens kørte tons</label>
                                              <div className="flex items-center gap-xs bg-surface border border-hairline rounded-md px-xs py-xxxs w-[180px]">
                                                <Layers size={12} className="text-text-muted flex-shrink-0" />
                                                <span className="font-inter text-sm tabular-nums font-semibold text-text-primary">
                                                  {inheritedTons.toFixed(1)}t
                                                </span>
                                                <span className="font-inter text-xxs text-text-muted">(fra vejesedler)</span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex flex-col gap-xxxs">
                                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Tons kørt</label>
                                              <input
                                                type="number"
                                                value={afrData?.tons_koert ?? ''}
                                                disabled={isGodkendt}
                                                pattern="[0-9]*[.,]?[0-9]*"
                                                onChange={e => {
                                                  // F. Filtrer non-numeric input
                                                  const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                  updateAfregningField(afregKey, 'tons_koert', parseFloat(raw) || 0)
                                                }}
                                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                              />
                                            </div>
                                          )}
                                          {/* A. "Akkord-sats"-blokken er fjernet — økonomi er ikke formands domæne */}
                                          <div className="flex flex-col gap-xxxs">
                                            <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Ventetid</label>
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={afrData?.ventetid ?? ''}
                                              disabled={isGodkendt}
                                              onChange={e => updateAfregningField(afregKey, 'ventetid', parseFloat(e.target.value) || 0)}
                                              className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                            />
                                          </div>
                                        </>
                                      )}

                                      {isGodkendt ? (
                                        <div className="flex flex-col gap-xxxs ml-xs">
                                          <span className="font-inter text-xxs text-text-muted">{afrData?.godkendt_tidspunkt}</span>
                                          <button
                                            onClick={() => genaabnAfregning(afregKey)}
                                            className="font-inter text-xs text-text-muted underline cursor-pointer hover:text-text-primary transition-colors"
                                          >
                                            Genåbn afregning
                                          </button>
                                        </div>
                                      ) : (
                                        // B. Godkend-knap disables med tooltip hvis multilæs-fordeling mangler
                                        <div className="relative self-end" title={manglerFordelingExpanded ? 'Tons skal fordeles først' : undefined}>
                                          <button
                                            onClick={() => { if (!manglerFordelingExpanded) godkendAfregning(afregKey) }}
                                            disabled={manglerFordelingExpanded}
                                            aria-disabled={manglerFordelingExpanded}
                                            className={[
                                              'inline-flex items-center gap-xs font-inter font-medium text-sm px-sm py-xxxs rounded-lg transition-opacity',
                                              manglerFordelingExpanded
                                                ? 'bg-surface border border-hairline text-text-muted cursor-not-allowed opacity-50'
                                                : 'bg-warning text-deep-teal hover:opacity-90',
                                            ].join(' ')}
                                          >
                                            <CheckCircle2 size={14} />
                                            Godkend afregning
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* A. "Beregnet beløb pr. ordre"-sektionen er fjernet — økonomi er ikke formands domæne */}

                                    {/* ── Vejesedler under afregnings-felterne ─────── */}
                                    {/* Alle vejesedler rendres ens — badgen signalerer puljelæs/multilæs. Ingen gruppering. */}
                                    {bilVejesedler.length > 0 && (
                                      <div className="mt-sm border-t border-hairline pt-sm">
                                        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xs">Vejesedler</span>
                                        <div className="flex flex-col gap-xs">

                                          {bilVejesedler.map(vs => {
                                            const isVsExpanded = vejeseddelExpanded.has(vs.id)
                                            // Fordeling-state for multilæs: fra lokal state eller pre_fordeling
                                            const fordeling = vejeseddelFordelinger[vs.id]
                                              ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                                            const fordelingSum = fordeling.reduce((s, f) => s + f.tons, 0)
                                            const rest = vs.netto_tons - fordelingSum
                                            const sumMatch = Math.abs(rest) < 0.05

                                            return (
                                              <div key={vs.id} className="bg-surface border border-hairline rounded-md overflow-hidden">
                                                {/* Vejeseddel-række — grid med kolonner der aligner badge med "Indeholder"-kolonnen og Fordel-knap med "Afregning"-kolonnen */}
                                                <div
                                                  className="grid items-center gap-xs px-xs py-xxxs"
                                                  style={{ gridTemplateColumns: '1fr auto 140px 140px' }}
                                                >
                                                  <div className="flex items-center gap-xs min-w-0">
                                                    <span className="font-inter text-xs font-semibold text-text-primary tabular-nums">{vs.product_code}</span>
                                                    <span className="font-inter text-xs text-text-muted truncate">{vs.product_name}</span>
                                                  </div>
                                                  <span className="font-inter text-xs tabular-nums font-semibold text-text-primary whitespace-nowrap">
                                                    {vs.netto_tons.toFixed(1)}t
                                                  </span>
                                                  {/* Badge alignet med "Indeholder"-kolonnen */}
                                                  <div className="w-fit">
                                                    {vs.puljelaes_flag && !vs.multilaes_flag && (
                                                      <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider whitespace-nowrap">
                                                        Puljelæs
                                                      </span>
                                                    )}
                                                    {vs.multilaes_flag && (
                                                      <span className="inline-flex items-center gap-xxxs bg-warn-bg text-text-secondary font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider whitespace-nowrap">
                                                        Multilæs
                                                      </span>
                                                    )}
                                                  </div>
                                                  {/* Fordel-knap alignet med "Afregning"-kolonnen */}
                                                  <div>
                                                    {vs.multilaes_flag && (
                                                      <button
                                                        type="button"
                                                        onClick={() => setVejeseddelExpanded(prev => {
                                                          const next = new Set(prev)
                                                          if (next.has(vs.id)) next.delete(vs.id); else next.add(vs.id)
                                                          return next
                                                        })}
                                                        className="inline-flex items-center gap-xxxs font-inter text-xs text-deep-teal font-semibold hover:opacity-80 transition-opacity whitespace-nowrap min-h-[28px] px-xs"
                                                      >
                                                        {isVsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        Fordel tons
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Fordeling-expander for multilæs */}
                                                {vs.multilaes_flag && isVsExpanded && (
                                                  <div className="border-t border-hairline px-xs pb-xs pt-xs bg-surface-2">
                                                    <div className="flex flex-col gap-xs">
                                                      {vs.pre_fordeling
                                                        .sort((a, b) => (a.is_anchor ? -1 : b.is_anchor ? 1 : 0))
                                                        .map((pf, idx) => {
                                                          const currentTons = fordeling.find(f => f.ordre_id === pf.ordre_id)?.tons ?? 0
                                                          return (
                                                            <div key={pf.ordre_id} className="flex items-center gap-xs">
                                                              {/* Anchor-markering: gul prik */}
                                                              <div className={[
                                                                'w-2 h-2 rounded-full flex-shrink-0',
                                                                pf.is_anchor ? 'bg-yellow' : 'bg-hairline-2',
                                                              ].join(' ')} title={pf.is_anchor ? 'Anchor-ordre' : ''} />
                                                              <span className={[
                                                                'font-inter text-xs flex-1 min-w-0 truncate',
                                                                idx === 0 ? 'font-semibold text-text-primary' : 'text-text-secondary',
                                                              ].join(' ')}>
                                                                {pf.ordre_label}
                                                              </span>
                                                              {/* F. Input-felter: ingen stepper-arrows, numeric-only filter */}
                                                              <input
                                                                type="number"
                                                                value={currentTons}
                                                                disabled={isGodkendt}
                                                                pattern="[0-9]*[.,]?[0-9]*"
                                                                onChange={e => {
                                                                  const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                                  const newTons = parseFloat(raw) || 0
                                                                  setVejeseddelFordelinger(prev => {
                                                                    const current = prev[vs.id] ?? vs.pre_fordeling.map(p => ({ ordre_id: p.ordre_id, tons: p.tons }))
                                                                    return {
                                                                      ...prev,
                                                                      [vs.id]: current.map(f =>
                                                                        f.ordre_id === pf.ordre_id ? { ...f, tons: newTons } : f
                                                                      ),
                                                                    }
                                                                  })
                                                                }}
                                                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                aria-label={`Tons til ${pf.ordre_label}`}
                                                              />
                                                              <span className="font-inter text-xs text-text-muted">t</span>
                                                            </div>
                                                          )
                                                        })}
                                                    </div>
                                                    {/* E. Sum-counter: til højre under det sidste input-felt */}
                                                    <div className="flex justify-end mt-xs">
                                                      <span className={[
                                                        'font-inter text-xs tabular-nums font-semibold',
                                                        sumMatch ? 'text-good' : 'text-bad',
                                                      ].join(' ')}>
                                                        {sumMatch ? (
                                                          <>Sum: {fordelingSum.toFixed(1)}/{vs.netto_tons.toFixed(1)}t</>
                                                        ) : (
                                                          <>Sum: {fordelingSum.toFixed(1)}/{vs.netto_tons.toFixed(1)}t (rest {rest > 0 ? '+' : ''}{rest.toFixed(1)}t)</>
                                                        )}
                                                      </span>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Chauffør-kommentar læs-only */}
                                    {afrData?.chauffoer_kommentar && (
                                      <div className="flex items-start gap-xs bg-warn-bg p-xs rounded-md mt-sm">
                                        <MessageSquare size={13} className="text-text-secondary flex-shrink-0 mt-[1px]" />
                                        <span className="font-inter text-xs italic text-text-secondary">{afrData.chauffoer_kommentar}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              )
                            })()}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
            </div>
          ) : (
            <p className="font-inter text-xs text-text-muted px-sm pb-sm">
              Bilbestillingen er sendt — vognmanden disponerer og bekræfter snarest.
            </p>
          )}
        </section>
      )}

      {/* ── Materiel ─────────────────────────────────────────────── */}
      {/* TODO (produktion): Sektion (Materielafregning) filtreres på (selectedProductId, selectedDate) */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-sm mb-sm">
          <div className="flex items-center gap-xs">
            <h2 className="font-poppins font-semibold text-xl text-text-primary">Materielafregning</h2>
            {materielAfregningGodkendt && (
              <span className="inline-flex items-center bg-good-bg text-good font-inter font-semibold text-xs px-sm py-xxxs rounded-full">
                Afregning godkendt
              </span>
            )}
            {/* TODO: Fjernes — kun til demo. I produktion kommer feltet fra PLAN */}
            <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">Demo:</span>
            {(['nej', 'ja'] as TimeafregningFraPlan[]).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setTimeafregningFraPlan(v)}
                className={[
                  'font-inter text-xs px-xs py-xxxs rounded-full border transition-colors',
                  timeafregningFraPlan === v
                    ? 'bg-deep-teal text-white border-deep-teal font-semibold'
                    : 'bg-surface text-text-secondary border-hairline hover:border-dark-teal',
                ].join(' ')}
              >
                Timeafregning: {v === 'ja' ? 'Ja' : 'Nej'}
              </button>
            ))}
          </div>
        </div>

        {!materielAfregningGodkendt && (
          <div className="overflow-hidden rounded-lg border border-hairline bg-surface mb-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-surface-2">
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Anlæg</th>
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Beskrivelse</th>
                    <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">
                      {timeafregningFraPlan === 'nej' ? 'Anvendt' : 'Timer brugt'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MATERIEL_ENHEDER.map((enhed, i) => {
                    const isLast = i === MATERIEL_ENHEDER.length - 1
                    return (
                      <tr
                        key={enhed.anlaegsNr}
                        className={!isLast ? 'border-b border-hairline' : ''}
                      >
                        <td className="align-middle font-inter text-xs font-semibold text-text-primary tabular-nums px-xs py-xs">{enhed.anlaegsNr}</td>
                        <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{enhed.beskrivelse}</td>
                        <td className="align-middle px-xs py-xs text-right">
                          {timeafregningFraPlan === 'nej' ? (
                            // Case A: toggle switch
                            <div className="flex justify-end">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={materielAnvendt[enhed.anlaegsNr] ?? true}
                                aria-label={`${enhed.beskrivelse} anvendt`}
                                onClick={() =>
                                  setMaterielAnvendt(prev => ({
                                    ...prev,
                                    [enhed.anlaegsNr]: !(prev[enhed.anlaegsNr] ?? true),
                                  }))
                                }
                                className={[
                                  'relative inline-flex items-center w-9 h-5 rounded-full transition-colors',
                                  (materielAnvendt[enhed.anlaegsNr] ?? true)
                                    ? 'bg-good'
                                    : 'bg-hairline-2',
                                ].join(' ')}
                              >
                                <span
                                  className={[
                                    'inline-block w-4 h-4 rounded-full bg-white shadow transition-transform',
                                    (materielAnvendt[enhed.anlaegsNr] ?? true) ? 'translate-x-[18px]' : 'translate-x-[2px]',
                                  ].join(' ')}
                                />
                              </button>
                            </div>
                          ) : (
                            // Case B: timer-input per enhed
                            <div className="flex justify-end">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={materielTimer[enhed.anlaegsNr] ?? ''}
                                onChange={e =>
                                  setMaterielTimer(prev => ({ ...prev, [enhed.anlaegsNr]: parseFloat(e.target.value) || 0 }))
                                }
                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[100px] text-right focus:outline-none focus:border-dark-teal"
                                aria-label={`Timer for ${enhed.beskrivelse}`}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-hairline">
                    <td colSpan={3} className="px-sm py-xs">
                      <div className="flex flex-wrap items-start justify-between gap-sm">
                        <div className="flex flex-col gap-xs">
                          {timeafregningFraPlan === 'nej' && (
                            <div className="flex items-center gap-xs">
                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest whitespace-nowrap">Anvendte timer for hele holdpakken</label>
                              <div className="flex items-center gap-xs">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={holdpakkeTimer}
                                  onChange={e => setHoldpakkeTimer(parseFloat(e.target.value) || 0)}
                                  className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[120px] focus:outline-none focus:border-dark-teal"
                                />
                                <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">timer</span>
                              </div>
                            </div>
                          )}
                          <span className="inline-flex items-center bg-warn-bg text-text-secondary font-inter font-medium text-xs px-sm py-xxxs rounded-full whitespace-nowrap">
                            {timeafregningFraPlan === 'nej'
                              ? 'Holdpakke fast pris — angiv samlede timer for hele pakken'
                              : 'Timeafregning — angiv timer per materiel-enhed'}
                          </span>
                        </div>
                        {!materielAfregningGodkendt && (
                          <button
                            type="button"
                            onClick={() => { setMaterielAfregningGodkendt(true) }}
                            className="min-h-[44px] shrink-0 ml-auto bg-warning text-deep-teal font-inter font-medium text-sm py-xxxs px-sm rounded-lg hover:brightness-95 transition-all"
                          >
                            Godkend afregning
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}

        {materielAfregningGodkendt && (
          <div className="flex items-center gap-xs px-sm py-xs bg-good-bg rounded-xl border border-good/20 mb-sm">
            <CheckCircle2 size={16} className="text-good" />
            <span className="font-inter text-xs text-text-secondary">Afregning godkendt</span>
            <button
              type="button"
              onClick={() => setMaterielAfregningGodkendt(false)}
              className="ml-auto font-inter text-xs text-text-muted underline cursor-pointer hover:text-text-primary"
            >
              Genåbn afregning
            </button>
          </div>
        )}
      </section>

    </div>
  )
}

