/**
 * PROTOTYPE — Ordre Planlægnings-mode (v2 layout)
 * Sprint 1 — Element 3
 * Viser dagfordeling, materiel og transport for én ordre.
 * Må ikke importeres i produktionskode.
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone,
  Truck,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Mic,
  Camera,
  CloudRain,
  CheckCircle2,
  MessageSquare,
  Check,
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
    startDate: '2026-03-19',
    endDate: '2026-03-20',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: true,
    entreprisekontrol: 1,
    temperaturmaaling: 1,
    days: [
      { id: 'd1-1', day: 1, date: '2026-03-19', tonsPlanned: 100, cancelled: false },
      { id: 'd1-2', day: 2, date: '2026-03-20', tonsPlanned: 100, cancelled: false },
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatWeekday(dateStr: string) {
  return ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'][new Date(dateStr + 'T00:00:00').getDay()]
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}



// ─── Types (mode) ─────────────────────────────────────────────────────────────

type OrderMode = 'planlaegning' | 'udfoersel' | 'evaluering'

const ORDER_MODES: { id: OrderMode; label: string; step: string }[] = [
  { id: 'planlaegning', label: 'Planlægning', step: 'Trin 1/3' },
  { id: 'udfoersel',   label: 'Udførelse',   step: 'Trin 2/3' },
  { id: 'evaluering',  label: 'Evaluering',  step: 'Trin 3/3' },
]

type UnderlagType = 'asfalt' | 'grus' | 'beton' | 'fraeset' | 'andet'
type UnderlaegsAarsag = 'revner' | 'sporkoert' | 'krakeleret' | 'ujaevn' | 'saetninger' | 'snavs' | 'bloed' | 'graes-ukrudt'

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
      },
      {
        regnr: 'CD 67 890',
        chauffoer: 'Søren Karlsen',
        tlf: '26 77 88 99',
        biltype: '6 Aks',
        // akkord-afregning med tons prædufyldt
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 148,
          ventetid: 0,
          godkendt_af_formand: false,
        },
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
  const [activeTab, setActiveTab] = useState<TabName>('dagens-opgaver')
  const [activeMode, setActiveMode] = useState<OrderMode>('planlaegning')
  const [activeProductId, setActiveProductId] = useState('p2')
  const [products, setProducts] = useState<MockProduct[]>(INITIAL_PRODUCTS)
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
  const [correctionDayIds, setCorrectionDayIds] = useState<Set<string>>(new Set())
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(null)
  const [udlaantIds, setUdlaantIds] = useState<Set<string>>(new Set())
  const [fakturaOrdre, setFakturaOrdre] = useState<Record<string, string>>({})
  const [afhentningAdresse, setAfhentningAdresse] = useState<Record<string, string>>({})
  const [afhentningPostnr, setAfhentningPostnr] = useState<Record<string, string>>({})
  const [afhentningKlar, setAfhentningKlar] = useState<Record<string, string>>({})
  const [afhentningLevering, setAfhentningLevering] = useState<Record<string, string>>({})
  // null = ikke besvaret endnu, true = samme som første, false = nyt sted
  const [sammeAflæsning, setSammeAflæsning] = useState<Record<string, boolean | null>>({})
  const [planlagtProductIds, setPlanlagtProductIds] = useState<Set<string>>(new Set())
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
  const allocated = days.filter(d => !d.cancelled).reduce((s, d) => s + d.tonsPlanned, 0)
  const remainder = activeProduct.tonsTotal - allocated
  const isFullyAllocated = remainder === 0
  const activeDays = days.filter(d => !d.cancelled)
  const morgenTonsCount = activeDays.filter(d => d.morgenTons != null).length


  function updateTons(dayId: string, value: number) {
    setProducts(prev => prev.map(p =>
      p.id === activeProductId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, tonsPlanned: value } : d) }
        : p
    ))
  }

  function updateMorgenTons(dayId: string, value: number | undefined) {
    setProducts(prev => prev.map(p =>
      p.id === activeProductId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, morgenTons: value } : d) }
        : p
    ))
  }

  function cancelDay(dayId: string, reason: CancelReason) {
    setProducts(prev => prev.map(p =>
      p.id === activeProductId
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
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
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">
              Udførselssted
            </span>
            <h1 className="font-poppins font-semibold text-xl text-text-primary leading-tight">
              Søvej 6D<br />4900 Nakskov
            </h1>
            <span className="font-inter text-xs text-text-muted mt-xxxs block">
              Ordrenummer: 1212343
            </span>
          </div>

          {/* Mode-navigation */}
          <nav className="flex flex-col gap-[2px]" aria-label="Ordre-faser">
            {ORDER_MODES.map(mode => {
              const isActive = mode.id === activeMode
              return (
                <button
                  key={mode.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveMode(mode.id)}
                  className={[
                    'flex items-center justify-between px-xs py-[10px] rounded-lg transition-colors text-left',
                    isActive
                      ? 'bg-white border border-hairline font-semibold text-text-primary'
                      : 'font-medium text-text-muted hover:bg-[#F5F5F5] hover:text-text-secondary',
                    'font-inter text-sm',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-xs">
                    <span className={[
                      'w-[6px] h-[6px] rounded-full flex-shrink-0 transition-all',
                      isActive
                        ? 'bg-yellow shadow-[0_0_0_3px_rgba(254,238,50,0.3)]'
                        : 'bg-text-muted opacity-40',
                    ].join(' ')} />
                    {mode.label}
                  </span>
                </button>
              )
            })}
          </nav>

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

          {/* Bekræft planlægning */}
          <div className="pt-md border-t border-hairline">
            {planlagtProductIds.has(activeProductId) ? (
              <div className="w-full flex items-center justify-center gap-xs px-sm py-xs rounded-xl bg-[#E7F4EE] border border-[#1F8A5B]/20">
                <CheckCircle2 size={15} className="text-[#1F8A5B] flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-inter font-semibold text-sm text-[#1F8A5B]">Planlægning bekræftet</span>
                  <span className="font-inter text-xs text-[#1F8A5B]/70">
                    {activeProduct.startDate ? formatShortDate(activeProduct.startDate) : '–'} – {activeProduct.endDate ? formatShortDate(activeProduct.endDate) : '–'} · {activeProduct.recipeName}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setPlanlagtProductIds(prev => new Set([...prev, activeProductId]))}
                className="w-full flex flex-col items-center px-sm py-xs rounded-xl transition-all bg-[#2E9E65] text-white hover:bg-[#1F8A5B] active:scale-[0.98]"
              >
                <span className="font-inter font-semibold text-sm">Bekræft planlægning</span>
                <span className="font-inter text-xs opacity-80">
                  {activeProduct.startDate ? formatShortDate(activeProduct.startDate) : '–'} – {activeProduct.endDate ? formatShortDate(activeProduct.endDate) : '–'} · {activeProduct.recipeName}
                </span>
              </button>
            )}
          </div>


        </aside>

        {/* ── Hoved-indhold ────────────────────────────────────────── */}
        <main className="px-lg pb-[120px] pt-xs">
          {activeMode === 'planlaegning' && (
          <div className="flex flex-col gap-[48px]">

          {/* ── Sektion: Udlægning ───────────────────────────────── */}
          <section>

            {/* Produkt-tabs */}
            <div className="flex flex-col gap-xs pb-sm border-b border-hairline mb-lg">
              <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Produkter der skal planlægges</span>
              <div className="flex gap-xs" role="tablist" aria-label="Produkter">
                {products.map(p => {
                  const isActive = p.id === activeProductId
                  const isPlanlagt = planlagtProductIds.has(p.id)
                  const pStart = p.startDate ? formatShortDate(p.startDate) : '–'
                  const pEnd   = p.endDate   ? formatShortDate(p.endDate)   : '–'
                  return (
                    <div
                      key={p.id}
                      className={[
                        'flex flex-col gap-xxxs items-start min-w-[150px] px-sm py-xs rounded-xl border transition-all',
                        isActive
                          ? 'bg-deep-teal border-deep-teal'
                          : isPlanlagt
                            ? 'bg-white border-hairline hover:border-hairline-2'
                            : 'bg-[#FBECEA] border-[#C8372D]/20 hover:border-[#C8372D]/40',
                      ].join(' ')}
                    >
                      <button
                        role="tab"
                        aria-pressed={isActive}
                        onClick={() => setActiveProductId(p.id)}
                        className="flex flex-col gap-xxxs items-start w-full text-left"
                      >
                        <span className={`font-inter font-bold text-xs tabular-nums ${isActive ? 'text-white' : 'text-text-primary'}`}>
                          {pStart} – {pEnd}
                        </span>
                        <span className={`font-poppins font-semibold text-sm tracking-tight ${isActive ? 'text-white' : 'text-text-primary'}`}>
                          {p.recipeCode}
                        </span>
                        <span className={`font-inter text-xs ${isActive ? 'text-white/80' : 'text-text-muted'}`}>
                          {p.recipeName} · {p.thicknessMm} mm
                        </span>
                        <span className={`font-inter text-xs tabular-nums ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
                          {p.tonsTotal} tons
                        </span>
                      </button>
                      {isPlanlagt ? (
                        <div className="flex mt-xxxs">
                          <span className="inline-flex items-center gap-[5px] px-xs py-xxxs rounded-l-full border border-r-0 border-[#1F8A5B]/30 bg-[#E7F4EE] font-inter text-xs font-medium text-text-primary whitespace-nowrap">
                            <span className="w-[5px] h-[5px] rounded-full bg-[#1F8A5B] flex-shrink-0" />
                            Planlagt
                          </span>
                          <button
                            onClick={() => setPlanlagtProductIds(prev => { const s = new Set(prev); s.delete(p.id); return s })}
                            className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-r-full border border-hairline bg-white font-inter text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                          >
                            <Pencil size={10} />
                            Ret
                          </button>
                        </div>
                      ) : (
                        <div className="mt-xxxs h-[22px]" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Planlægning-overskrift */}
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Planlægning</h2>

            {/* Spec-grid */}
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

              {/* Kommentar + PLAN-krav */}
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

            {/* Dagfordeling */}
            <div className="flex flex-col gap-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="font-poppins font-semibold text-md text-text-primary">Dagfordeling</h3>
              </div>

              <div className="flex gap-xs flex-wrap items-start">
                {days.map(day => {
                  const isSent = sentDayIds.has(day.id)
                  const isCorrection = correctionDayIds.has(day.id)
                  return (
                    <div key={day.id} className="flex flex-col gap-xs">
                      <DayPillV2
                        day={day}
                        isSelectingReason={cancellingDayId === day.id}
                        onUpdateTons={updateTons}
                        onUpdateMorgenTons={updateMorgenTons}
                        onConfirmCancel={cancelDay}
                        onRestore={restoreDay}
                      />
                      {day.cancelled ? (
                        <div className="w-[140px] rounded-xl border border-hairline bg-[#F5F5F5] flex items-center justify-center py-xs px-sm opacity-40">
                          <span className="font-inter text-xs font-medium text-text-muted">Send til fabrik</span>
                        </div>
                      ) : isSent && !isCorrection ? (
                        <div className="flex w-[140px]">
                          <span className="flex-1 inline-flex items-center justify-center gap-[5px] py-xs px-sm rounded-l-xl border border-r-0 border-hairline bg-[#E7F4EE] font-inter text-xs font-medium text-text-primary whitespace-nowrap">
                            <span className="w-[6px] h-[6px] rounded-full bg-[#1F8A5B] flex-shrink-0" />
                            Bestilt
                          </span>
                          <button
                            onClick={() => setCorrectionDayIds(prev => new Set([...prev, day.id]))}
                            className="inline-flex items-center gap-xxxs px-xs py-xs rounded-r-xl border border-hairline font-inter text-xs font-medium text-dark-teal hover:bg-[#F5F5F5] transition-colors"
                          >
                            <Pencil size={11} />
                            Ret
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!isSent) {
                              setSentDayIds(prev => new Set([...prev, day.id]))
                            } else {
                              setCorrectionDayIds(prev => { const s = new Set(prev); s.delete(day.id); return s })
                            }
                          }}
                          className={`w-[140px] rounded-xl border flex items-center justify-center py-xs px-sm transition-colors ${isCorrection ? 'bg-dark-teal border-dark-teal hover:opacity-90' : 'bg-dark-teal border-dark-teal hover:opacity-90'}`}
                        >
                          <span className="font-inter text-xs font-semibold text-white text-center">
                            {isCorrection ? 'Send rettelse' : 'Send til fabrik'}
                          </span>
                        </button>
                      )}
                    </div>
                  )
                })}
                {/* Remainder-kort */}
                <div className="flex flex-col gap-xs">
                  <div className={[
                    'w-[140px] min-h-[172px] rounded-xl border flex flex-col items-center justify-center gap-xxxs p-sm',
                    isFullyAllocated
                      ? 'bg-[#E7F4EE] border-[#1F8A5B]/20'
                      : 'bg-[#FBECEA] border-[#C8372D]/20',
                  ].join(' ')}>
                    {isFullyAllocated ? (
                      <>
                        <p className="font-inter text-xs text-text-primary font-semibold text-center">Fuldt fordelt</p>
                        <p className="font-inter text-xxs text-text-muted text-center mt-xxxs">
                          {allocated}t af {activeProduct.tonsTotal}t
                        </p>
                        <p className="font-inter text-xs text-text-primary font-semibold text-center mt-xxxs">Morgen tons</p>
                        <p className={`font-inter text-xxs text-center mt-xxxs ${morgenTonsCount === activeDays.length ? 'text-[#1F8A5B]' : 'text-[#C8372D]'}`}>
                          {morgenTonsCount} af {activeDays.length} bestilt
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-poppins font-bold text-xl text-text-primary tabular-nums">{Math.abs(remainder)}t</p>
                        <p className="font-inter text-xs text-text-primary font-semibold text-center">
                          {remainder > 0 ? 'mangler' : 'over'}
                        </p>
                        <p className="font-inter text-xxs text-text-muted text-center mt-xxxs">
                          {allocated}t af {activeProduct.tonsTotal}t
                        </p>
                      </>
                    )}
                  </div>
                </div>


              </div>
            </div>
          </section>

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

            {/* Maskiner */}
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
            />
          )}

          {activeMode === 'evaluering' && (
            <div className="p-sm">
              <section>
                <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Evalueringsområder</h2>
                <p className="text-sm text-text-secondary mb-sm">
                  Forslag til evalueringsområder — til diskussion. Hvert område kan bygges ud med data, visualiseringer og insights baseret på hvad der giver mest værdi for formanden og kunden.
                </p>
                <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-hairline">
                          <th className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs text-left w-[160px]">Område</th>
                          <th className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs text-left">Beskrivelse</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-hairline">
                          <td className="px-xs py-xs text-xs align-middle font-semibold text-text-primary">Merarbejde</td>
                          <td className="px-xs py-xs text-xs align-middle text-text-secondary">Antal poster, status (godkendt/afventer/afvist), per type-fordeling, estimeret kr-impact. Hvor formanden sikrer DB og rentabilitet på sagen.</td>
                        </tr>
                        <tr className="border-b border-hairline">
                          <td className="px-xs py-xs text-xs align-middle font-semibold text-text-primary">Tons + dagsfordeling</td>
                          <td className="px-xs py-xs text-xs align-middle text-text-secondary">Faktisk vs planlagt totalt og pr. dag. Vurdering af om morgen-tons matchede planen — kunne hele ordren have været bestilt om morgenen?</td>
                        </tr>
                        <tr className="border-b border-hairline">
                          <td className="px-xs py-xs text-xs align-middle font-semibold text-text-primary">Temperatur-kvalitet</td>
                          <td className="px-xs py-xs text-xs align-middle text-text-secondary">Andel læs over min-temp, spredning (min/max/median), tendens over dagen, evt. opdelt pr. vognmand for at spotte transport-issues.</td>
                        </tr>
                        <tr className="border-b border-hairline">
                          <td className="px-xs py-xs text-xs align-middle font-semibold text-text-primary">Timer chauffør/hold</td>
                          <td className="px-xs py-xs text-xs align-middle text-text-secondary">Estimerede vs faktisk forbrugte timer for chauffører og hold. Afvigelses-procenter med farve-indikatorer.</td>
                        </tr>
                        <tr className="border-b border-hairline">
                          <td className="px-xs py-xs text-xs align-middle font-semibold text-text-primary">Materiel-afregning vs faktisk</td>
                          <td className="px-xs py-xs text-xs align-middle text-text-secondary">Angivet timer pr. materiel-enhed (Materielafregning) sammenholdt med planlagte timer fra Planlægning. Over/underforbrug.</td>
                        </tr>
                        <tr>
                          <td className="px-xs py-xs text-xs align-middle font-semibold text-text-primary">Forundersøgelse-data</td>
                          <td className="px-xs py-xs text-xs align-middle text-text-secondary">Eksisterer allerede — fotos af underlag, valgt underlag-type, forbehold, "Aftalt med"-noter. Inkluderet her som reference.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ── Diskussionsboks: Returlæs ─────────────────────────────────── */}
              <section className="mt-lg">
                <div className="rounded-lg border border-hairline bg-warn-bg p-sm">
                  <div className="flex items-center gap-xs mb-xs">
                    <span className="inline-flex items-center justify-center w-[24px] h-[24px] rounded-full bg-yellow text-deep-teal font-poppins font-bold text-xs">R</span>
                    <h2 className="font-poppins font-semibold text-xl text-text-primary">Returlæs — til afklaring med kunde</h2>
                  </div>

                  <p className="text-sm text-text-secondary mb-sm">
                    Vognmandens chauffører kan ifølge aftale tage <strong>returlæs</strong> når de kører tomme fra
                    udførselsstedet — fx hente et læs grus fra en grusgrav til fabrikken. Opgaven oprettes af
                    fabrikken og afregnes uden for Colas-ordren. Den skal være synlig for alle roller, men kun
                    chaufføren udfører den — formand og vognmand kan ikke disponere på den.
                  </p>

                  <h3 className="font-poppins font-semibold text-sm text-text-primary mt-sm mb-xxs">Forslag til datamodel</h3>
                  <p className="text-xs text-text-secondary mb-sm">
                    <strong>Returopgave</strong> som selvstændig entitet — sidestillet med Læs, ikke en del af Ordren.
                    Ejes af fabrikken, tildeles vognmand+chauffør, lever på chaufførens tidslinje. Holder ordrens
                    regnskab rent og giver én samlet kilde til "chaufførens disponible tid".
                  </p>

                  <h3 className="font-poppins font-semibold text-sm text-text-primary mb-xxs">Hvad ser hver rolle?</h3>
                  <div className="grid grid-cols-3 gap-xs mb-sm">
                    <div className="rounded-md border border-hairline bg-surface p-xs">
                      <p className="font-poppins font-semibold text-xs text-text-primary mb-xxxs">Formand</p>
                      <p className="text-xxs text-text-secondary">
                        Lille <span className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full bg-yellow text-deep-teal font-bold text-[10px] align-middle">R</span> på
                        chaufførens "på vej til fabrik"-pille. Signal om at chauffør er optaget — ingen detaljer, ingen disponering.
                      </p>
                    </div>
                    <div className="rounded-md border border-hairline bg-surface p-xs">
                      <p className="font-poppins font-semibold text-xs text-text-primary mb-xxxs">Vognmand</p>
                      <p className="text-xxs text-text-secondary">
                        Tidsblok i disponerings-Gantt med bestiller + sats. Read-only på selve opgaven, men ser
                        økonomi (det er hans forretning). Evt. mulighed for at afvise før chauffør får tilbud.
                      </p>
                    </div>
                    <div className="rounded-md border border-hairline bg-surface p-xs">
                      <p className="font-poppins font-semibold text-xs text-text-primary mb-xxxs">Chauffør</p>
                      <p className="text-xxs text-text-secondary">
                        Fuld task på telefonen med distinct styling (stiplet kant + R-ikon). Accept/afvis, derefter
                        normal workflow: ankomst grusgrav → læsset → afleveret.
                      </p>
                    </div>
                  </div>

                  <h3 className="font-poppins font-semibold text-sm text-text-primary mb-xxs">Åbne spørgsmål til kunden</h3>
                  <ol className="text-xs text-text-secondary list-decimal pl-md space-y-xxxs">
                    <li><strong>Accept-flow:</strong> Skal chauffør acceptere hver returopgave aktivt, eller har vognmand stående aftale så de bare dukker op?</li>
                    <li><strong>Konflikt:</strong> Hvad sker hvis returlæs forsinker næste ordre? Kan formand kontakte chauffør? Kan returlæs "trumfes"?</li>
                    <li><strong>Genplanlægning:</strong> Hvis formand flytter en ordre 30 min, hvem flytter den planlagte returopgave?</li>
                    <li><strong>Annullering:</strong> Kan fabrikken trække returlæs tilbage? Med hvilket varsel? Hvem får besked?</li>
                    <li><strong>Synlighed af økonomi:</strong> Skal vognmand kunne se sats per returlæs, eller kun aggregeret periodevis?</li>
                    <li><strong>Matching:</strong> Skubber fabrikken returlæs til en konkret chauffør, eller broadcaster systemet til alle ledige i nærheden?</li>
                  </ol>
                </div>
              </section>
            </div>
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

      <BottomTabBar
        activeTab={activeTab}
        onTabPress={tab => {
          if (tab === 'mine-opgaver') { navigate('/prototyper/gantt'); return }
          setActiveTab(tab)
        }}
        messageCount={2}
      />
    </div>
  )
}

// ─── DayPillV2 ────────────────────────────────────────────────────────────────

function DayPillV2({
  day, isSelectingReason,
  onUpdateTons, onUpdateMorgenTons,
  onConfirmCancel, onRestore,
}: {
  day: DayPlan
  isSelectingReason: boolean
  onUpdateTons: (id: string, v: number) => void
  onUpdateMorgenTons: (id: string, v: number | undefined) => void
  onConfirmCancel: (id: string, r: CancelReason) => void
  onRestore: (id: string) => void
}) {
  const [weatherActive, setWeatherActive] = useState(false)
  if (day.cancelled) {
    return (
      <div className="w-[140px] min-h-[140px] bg-white rounded-xl border border-bad/30 flex flex-col items-center justify-center gap-xxxs opacity-60 p-sm">
        <p className="font-inter text-xxs font-semibold text-text-muted">{formatWeekday(day.date)}</p>
        <p className="font-inter text-xxs text-text-muted tabular-nums">{formatShortDate(day.date)}</p>
        <p className="font-inter font-semibold text-xs text-bad mt-xxxs">Aflyst</p>
        {day.cancelReason && <p className="font-inter text-xxs text-text-muted capitalize">{day.cancelReason}</p>}
        <button onClick={() => onRestore(day.id)} className="mt-xxxs font-inter text-xxs text-dark-teal underline">Fortryd</button>
      </div>
    )
  }

  if (isSelectingReason) {
    return (
      <div className="w-[152px] bg-white rounded-xl border border-bad/20 p-xs flex flex-col gap-xxxs shadow-md">
        <p className="font-inter text-xxs font-medium text-text-muted mb-xxxs">Årsag til aflysning</p>
        {CANCEL_REASONS.map(r => (
          <button key={r.value} onClick={() => onConfirmCancel(day.id, r.value)}
            className="w-full text-left px-xs py-[6px] rounded-lg font-inter text-xs text-text-secondary hover:bg-[#F5F5F5] hover:text-text-primary transition-colors">
            {r.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative w-[140px] min-h-[172px] bg-white rounded-xl flex flex-col p-sm pb-lg gap-xs transition-all border border-hairline hover:border-hairline-2">


      {/* Vejr-knap */}
      <div className="absolute bottom-[12px] right-[8px] group/weather">
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

      <div className="flex justify-between items-center">
        <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">{formatWeekday(day.date)}</span>
        <span className="font-inter text-xs font-semibold text-text-secondary tabular-nums">{formatShortDate(day.date)}</span>
      </div>

      {/* Forventet */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Forventet</span>
        <div className="flex items-center gap-xxxs bg-[#F5F5F5] border border-hairline rounded-lg px-xs py-xxxs focus-within:border-dark-teal focus-within:bg-white transition-colors">
          <input
            type="number"
            value={day.tonsPlanned || ''}
            onChange={e => onUpdateTons(day.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="font-poppins font-semibold text-lg text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="0"
          />
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
      </div>

      {/* Morgen */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Morgen tons</span>
        <div className={[
          'flex items-center gap-xxxs border rounded-lg px-xs py-xxxs transition-colors focus-within:border-dark-teal focus-within:bg-white',
          day.morgenTons == null
            ? 'bg-[#FBECEA] border-[#C8372D]/25'
            : 'bg-[#E7F4EE] border-[#1F8A5B]/25',
        ].join(' ')}>
          <input
            type="number"
            value={day.morgenTons ?? ''}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              onUpdateMorgenTons(day.id, isNaN(v) ? undefined : Math.max(0, v))
            }}
            className="font-poppins font-semibold text-lg text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="–"
          />
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
      </div>

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

function UdfoerselContent({ forundersoegelseFotos, onAddPhotos, vognmandBekraeftelse, vognmandMaterielBekraeftelse, todayDay }: {
  forundersoegelseFotos: MockPhoto[]
  onAddPhotos: (p: MockPhoto[]) => void
  vognmandBekraeftelse?: VognmandBekraeftelse
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  todayDay?: DayPlan
}) {
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

  return (
    <div className="flex flex-col gap-[48px]">
      {/* ── Dagens overblik — status-bokse ───────────────────────────── */}
      <div className="flex flex-col gap-xs">
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Dagens overblik</h2>
        {/* Alle 7 bokse i ét fælles grid — samme bredde og højde via auto-rows-fr */}
        {(() => {
          const fmtTal = (n: number, max = 0) =>
            new Intl.NumberFormat('da-DK', { maximumFractionDigits: max }).format(n)
          const materielBekraeftet2 = !!(vognmandMaterielBekraeftelse && vognmandMaterielBekraeftelse.items.length > 0)
          const antalMateriel2 = vognmandMaterielBekraeftelse?.items.length ?? 0
          const forundersoegelseForetaget2 = underlaegsType && tilfredsstillende !== null && tilfredsstillende !== undefined
          return (
            <div className="grid grid-cols-3 xl:grid-cols-7 gap-xs auto-rows-fr">
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
              {/* 4 OrdreInfoCards — kun når recept er klar */}
              {recept && (
                <>
                  <OrdreInfoCard
                    label="AREAL I DAG"
                    value={fmtTal(DEMO_AREAL_I_DAG)}
                    unit="m²"
                    subtekst={`á ${fmtTal(DEMO_ORDRE_TOTAL_AREAL)} m²`}
                  />
                  <OrdreInfoCard
                    label="PRODUKT"
                    value={recept.navn}
                    subtekst={recept.kode}
                  />
                  <OrdreInfoCard
                    label="TYKKELSE"
                    value={fmtTal(DEMO_TYKKELSE)}
                    unit="mm"
                  />
                  <OrdreInfoCard
                    label="TONS I DAG"
                    value={fmtTal(DEMO_TONS_I_DAG)}
                    subtekst={`á ${fmtTal(DEMO_ORDRE_TOTAL_TONS)} t`}
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
                label="TONS ANKOMMET"
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
                    className="bg-yellow text-deep-teal font-inter font-semibold text-sm px-sm py-xs rounded-lg min-h-[44px] hover:brightness-95 transition-all"
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

      {/* ── Vejesedler og indkomne tons ──────────────────────────── */}
      <section>
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Vejesedler og indkomne tons</h2>
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
      {todayDay && (
        <section>
          <div className="mb-sm">
            <h2 className="font-poppins font-semibold text-xl text-text-primary">Bilafregning</h2>
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
                                {bil.er_materiel_bil && (
                                  <span className="inline-flex items-center gap-xxxs bg-warn-bg text-text-secondary font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Kørt materiel
                                  </span>
                                )}
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
                                    className="inline-flex items-center gap-xxxs bg-yellow text-deep-teal font-inter font-semibold text-xs py-xxxs px-xs rounded-md hover:opacity-90 transition-opacity"
                                  >
                                    {isOpen ? 'Luk' : 'Lav afregning'}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {(isOpen || isGodkendt) && (
                              <tr key={`${bil.regnr}-expand`} className={!isLast ? 'border-b border-hairline' : ''}>
                                <td colSpan={6} className="px-xs pb-xs pt-xxxs">
                                  <div className="bg-surface-2 rounded-lg p-sm mt-xxxs border border-hairline">
                                    {/* Afregnings-felter */}
                                    <div className="flex flex-wrap gap-xs items-end">
                                      {effectiveType === 'time' ? (
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
                                          <div className="flex flex-col gap-xxxs">
                                            <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Tons kørt</label>
                                            <input
                                              type="number"
                                              step="1"
                                              value={afrData?.tons_koert ?? ''}
                                              disabled={isGodkendt}
                                              onChange={e => updateAfregningField(afregKey, 'tons_koert', parseFloat(e.target.value) || 0)}
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
                                        <button
                                          onClick={() => godkendAfregning(afregKey)}
                                          className="inline-flex items-center gap-xs bg-yellow text-deep-teal font-inter font-semibold text-sm px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity self-end"
                                        >
                                          <CheckCircle2 size={14} />
                                          Godkend afregning
                                        </button>
                                      )}
                                    </div>

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
                            )}
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
                            // Case A: simpel checkbox
                            <div className="flex justify-end">
                              <label className="flex items-center justify-center w-[18px] h-[18px] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={materielAnvendt[enhed.anlaegsNr] ?? true}
                                  onChange={e =>
                                    setMaterielAnvendt(prev => ({ ...prev, [enhed.anlaegsNr]: e.target.checked }))
                                  }
                                  className="sr-only"
                                  aria-label={`${enhed.beskrivelse} anvendt`}
                                />
                                <span className={[
                                  'w-4 h-4 rounded-sm border flex items-center justify-center',
                                  (materielAnvendt[enhed.anlaegsNr] ?? true)
                                    ? 'bg-surface border-hairline-2'
                                    : 'bg-surface border-hairline-2',
                                ].join(' ')}>
                                  {(materielAnvendt[enhed.anlaegsNr] ?? true) && (
                                    <Check size={11} className="text-text-primary" strokeWidth={3} />
                                  )}
                                </span>
                              </label>
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
                            className="min-h-[44px] shrink-0 ml-auto bg-yellow text-deep-teal font-inter font-semibold text-sm py-xxxs px-sm rounded-lg hover:brightness-95 transition-all"
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

