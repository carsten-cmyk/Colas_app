/**
 * PROTOTYPE — Ordre Planlægnings-mode (v2 layout)
 * Sprint 1 — Element 3
 * Viser dagfordeling, materiel og transport for én ordre.
 * Må ikke importeres i produktionskode.
 */
import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Truck,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Mic,
  Camera,
  CloudRain,
  CheckCircle2,
  MessageSquare,
  Layers,
  AlertTriangle,
  Info,
  ArrowDown,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { TabName } from '@/types/navigation'
import { FremdriftCard } from '@/components/ui/FremdriftCard'
import { FremdriftInputRow } from '@/components/ui/FremdriftInputRow'
import { VejesedlerTable } from '@/components/ui/VejesedlerTable'
import { useRecept } from '@/hooks/useRecept'
import { useVejesedler } from '@/hooks/useVejesedler'
import { useDagsoverblik } from '@/hooks/useDagsoverblik'
import { INITIAL_RECEPTER } from '@/mocks/recepter'
import { INITIAL_UDLAEGGERE } from '@/mocks/udlaeggere'
import { formatWeekday, formatLongDate } from '@/utils/date'
import { clusterEtaper, getMaterielUiState, DEMO_TRANSPORT_PLANER, transportKey } from './etape'
import type { Etape, MaterielUiState, MaterielTransportPlan } from './etape'
import {
  MaterielPaaPladsenTilstand,
  MaterielDvaleTilstand,
  MaterielPlanlaegTilstand,
  MaterielNyEtapeTilstand,
} from './MaterielTilstande'
import type { MaterielEnhed as MaterielEnhedTilstand } from './MaterielTilstande'
import type { TransportPlanPatch } from './MaterielTilstande'
import { formatPhone, toE164 } from '@shared/utils/phone'
import { formatRegnr } from '@shared/utils/regnr'
import type { DagsoverblikRegistrering } from '@/types/order'

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
  /**
   * Flow 9b (OPDATERET 2026-06-09): PLAN-pushet ekstra-bestilling fra fabrik.
   * Indeholder KUN delta-mængden — ikke totalen. Vises som synlig
   * `EkstraBestillingBox` ved siden af produktet i Asfaltbestilling-rækken.
   * Tons lægges OVENI tonsPlanned i alle downstream-beregninger via getEffectiveTons().
   */
  // TODO: Erstat med Supabase når klar — hent fra plan_dag_opdatering-tabel
  ekstraTons?: {
    tons: number              // delta — KUN ekstra-mængden, ikke totalen
    bekraeftetAf: 'fabrik'
    tidspunkt: string         // ISO — hvornår PLAN registrerede
  }
}

/**
 * Effektive tons = original planlagt + evt. ekstra-bestilling fra PLAN.
 * Bruges ALLE steder hvor produkt-tons summeres (Vejesedler, Dagsoverblik,
 * Afregning, Ordredetaljer/Mængde tons).
 */
function getEffectiveTons(d: DayPlan): number {
  return d.tonsPlanned + (d.ekstraTons?.tons ?? 0)
}

/** HH:MM (24-timer) fra ISO-string — lokal helper til EkstraBestillingBox */
function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Produkt-total tons inkl. evt. ekstra-bestillinger fra PLAN på produktets dage.
 * Bruges i Ordredetaljer/Mængde tons-cellen og lignende per-produkt aggregater.
 */
function getEffectiveProductTotalTons(p: { tonsTotal: number; days?: { ekstraTons?: { tons: number } }[] }): number {
  const ekstra = (p.days ?? []).reduce((sum, d) => sum + (d.ekstraTons?.tons ?? 0), 0)
  return p.tonsTotal + ekstra
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
  afregning_type?: 'time' | 'akkord'
}

// TODO: Erstat med PLAN/Supabase standard-materiel-katalog når klar
const STANDARD_MATERIEL_KATALOG: Array<{ plantNumber: string; description: string; transportTag: MockResource['transportTag'] }> = [
  { plantNumber: 'A-3042', description: 'HAMM HD+ 140i Tromle (vibrations)', transportTag: 'blokvogn' },
  { plantNumber: 'A-1187', description: 'VÖGELE SUPER 1900-3i Asfaltudlægger', transportTag: 'blokvogn' },
  { plantNumber: 'A-2205', description: 'WIRTGEN W 100 CFi Fræser', transportTag: 'blokvogn' },
  { plantNumber: 'A-3081', description: 'HAMM HD 12 VV Tandemtromle', transportTag: 'blokvogn' },
  { plantNumber: 'A-4412', description: 'DYNAPAC CC1200 Gummitromle', transportTag: 'blokvogn' },
  { plantNumber: 'A-2019', description: 'WIRTGEN W 220 CFi Stor fræser', transportTag: 'blokvogn' },
  { plantNumber: 'A-5503', description: 'VÖGELE SUPER 700-3i Lille udlægger', transportTag: 'kran-baand' },
  { plantNumber: 'A-6110', description: 'Broddpacker / Stamper BOMAG BT 65', transportTag: 'egen-korsel' },
  { plantNumber: 'A-7021', description: 'Fejemaskine Johnston VS651', transportTag: 'egen-korsel' },
  { plantNumber: 'A-7305', description: 'Skæremaskine Husqvarna K 6500', transportTag: 'egen-korsel' },
  { plantNumber: 'A-8801', description: 'BOMAG BW 120 AD-5 Tandemtromle', transportTag: 'blokvogn' },
  { plantNumber: 'A-9044', description: 'Vandvogn 8.000 l (kørende vandforsyning)', transportTag: 'kran-baand' },
]

// Bil-ordrenumre (<ordrenr>-DDMMYY-NN) genereres backend-side ved send til vognmand
// (LÅST 2026-06-13, se DATA_FIELDS.md confirmed_vehicles[].bil_ordre_nr). Vises ikke i
// asfaltkørsel-UI'en, men er fortsat væsentlig for vognmandens bestilling.

interface KørselPause {
  id: string
  time: string
  durationMin: number
}

interface KørselDayParams {
  driveMinutes: number
  loadMinutes: number
  deliverMinutes: number
  intervalMinutes?: number
  firstLoadTime?: string
  lastLoadTime: string
  pauses: KørselPause[]
}

/** Per-produkt kørselsfelter — formand styrer overgange (FUNCTIONAL_FLOWS § "Per-produkt kørselsfelter") */
// TODO: Erstat med Supabase når klar — gemmes på plan_dag_produkt-rækken
interface ProduktKørselParams {
  /** HH:mm — null = "starter sekventielt efter forrige produkt" */
  foersteLaesPaaPlads: string | null
  /** Minutter mellem hvert læs for dette produkt */
  intervalMin: number | null
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

// TODO: Erstat med Supabase når klar — vognmænd fra vognmand-tabel; primær fra ordrens aftale
const MOCK_VOGNMAEND = [
  { id: 'vm-1', navn: 'Kloster A/S' },                          // primær (default)
  { id: 'vm-2', navn: 'Vestsjællands Transport A/S' },
  { id: 'vm-3', navn: 'Roskilde Vognmandsforretning' },
]
const DEFAULT_VOGNMAND_ID = 'vm-1'

const DEFAULT_KØRSEL_PARAMS: KørselDayParams = {
  driveMinutes:    36,
  loadMinutes:     15,
  deliverMinutes:  10,
  intervalMinutes: undefined,
  firstLoadTime:   undefined,
  lastLoadTime:    '15:00',
  pauses:          [],
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

// Bevaret til fremtidig brug — andre ordrer på dagen kan genbruges i samleordre-flow
// @ts-ignore TS6133 — bruges ikke i UI pt., men mock-data bevares til næste iteration
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
    endDate: '2026-07-07',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: true,
    entreprisekontrol: 1,
    temperaturmaaling: 1,
    days: [
      {
        id: 'd1-1', day: 1, date: '2026-03-17', tonsPlanned: 70, cancelled: false,
        // Flow 9b (OPDATERET 2026-06-09): PLAN-push fra fabrik — +5 tons ekstra
        ekstraTons: { tons: 5, bekraeftetAf: 'fabrik', tidspunkt: '2026-03-17T08:42:00+01:00' },
      },
      { id: 'd1-2', day: 2, date: '2026-03-18', tonsPlanned: 70, cancelled: false },
      { id: 'd1-3', day: 3, date: '2026-03-19', tonsPlanned: 60, cancelled: false },
      // Etape 1 — juli (matcher DEMO_PLANLAGTE_DAGE fra etape.ts for seed-konsistens)
      // TODO: Erstat med Supabase når klar — dage fra PLAN plan_dag-tabel
      { id: 'd1-4', day: 4, date: '2026-07-06', tonsPlanned: 80, cancelled: false },
      { id: 'd1-5', day: 5, date: '2026-07-07', tonsPlanned: 80, cancelled: false },
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
      {
        id: 'd2-2', day: 2, date: '2026-03-17', tonsPlanned: 250, cancelled: false,
        // Flow 9b (OPDATERET 2026-06-09): PLAN-push fra fabrik — +10 tons ekstra
        ekstraTons: { tons: 10, bekraeftetAf: 'fabrik', tidspunkt: '2026-03-17T09:15:00+01:00' },
      },
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
    timestamp: '14. marts · 08:42',
    text: 'Området er opmålt og klargjort. Underlag ser fornuftigt ud — mindre ujævnheder ved indkørslen mod nord er udbedret. Koordination med skolens vicevært er på plads, adgang sikret fra kl. 06:00.',
  },
  {
    id: 'nc2',
    initials: 'HT',
    name: 'Henrik Thor',
    timestamp: '14. marts · 11:15',
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
  projektleder: string
  projektlederTlf: string
  fabrik: string
  fabrikTlf: string
  kundeVirksomhed: string
  kundekontakt: string
  kundekontaktTlf: string
  /** Antal biler planlagt for denne ordre */
  antalBiler: number
  /** Om vognmand har bekræftet biler for denne ordre */
  vognmandBekraeftet: boolean
  /** Antal materiel-stykker til transport for denne ordre */
  antalMateriel: number
  /** Om vognmand har bekræftet materiel-transport for denne ordre */
  materielBekraeftet: boolean
  /** Om forundersøgelse er foretaget OG tilfredsstillende */
  forundersoegelseOK: boolean
  /** Status for forundersøgelse — 'OK' | 'IKKE_OK' | 'MANGLER' */
  forundersoegelseStatus: 'OK' | 'IKKE_OK' | 'MANGLER'
  /** Per-child Forundersøgelse-detaljer — vises i Udførsel-mode */
  // TODO: Erstat med Supabase når klar — hent fra forundersoegelse-tabel pr. ordre
  forundersoegelseDetails?: {
    underlaegsType: 'asfalt' | 'beton' | 'grus' | null
    tilfredsstillende: boolean | null
    besigtigelseComment: string
    photoCount: number
  }
  /** Per-child Udlægning-detaljer — vises i Udførsel-mode */
  // TODO: Erstat med Supabase når klar — hent fra udlaegning-tabel pr. ordre
  udlaegningDetails?: {
    status: 'ikke-startet' | 'i-gang' | 'færdig'
    startTid?: string
    sluttId?: string
    noter: string
  }
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
      // TODO: Erstat med Supabase når klar
      projektleder: 'Henrik Thor',
      projektlederTlf: '40 50 60 70',
      fabrik: 'Køge Fabrik',
      fabrikTlf: '56 78 12 34',
      kundeVirksomhed: 'Uddannelsescenter Syd',
      kundekontakt: 'Jens Christensen',
      kundekontaktTlf: '21 34 56 78',
      // TODO: Erstat med Supabase når klar — per-child dagsoverblik
      antalBiler: 4,
      vognmandBekraeftet: true,
      antalMateriel: 3,
      materielBekraeftet: true,
      forundersoegelseOK: true,
      forundersoegelseStatus: 'OK',
      // TODO: Erstat med Supabase når klar — per-child forundersøgelse
      forundersoegelseDetails: {
        underlaegsType: 'asfalt',
        tilfredsstillende: true,
        besigtigelseComment: 'Underlag er fast og jævnt',
        photoCount: 3,
      },
      // TODO: Erstat med Supabase når klar — per-child udlægning
      udlaegningDetails: {
        status: 'i-gang',
        startTid: '07:15',
        noter: 'Starter med GAB I',
      },
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
      // TODO: Erstat med Supabase når klar
      projektleder: 'Mette Lund',
      projektlederTlf: '31 67 92 14',
      fabrik: 'Køge Vest Fabrik',
      fabrikTlf: '44 32 11 55',
      kundeVirksomhed: 'Greve Erhvervspark',
      kundekontakt: 'Lars Madsen',
      kundekontaktTlf: '28 91 44 02',
      // TODO: Erstat med Supabase når klar — per-child dagsoverblik
      antalBiler: 2,
      vognmandBekraeftet: false,
      antalMateriel: 1,
      materielBekraeftet: false,
      forundersoegelseOK: false,
      forundersoegelseStatus: 'MANGLER',
      // TODO: Erstat med Supabase når klar — per-child forundersøgelse
      forundersoegelseDetails: {
        underlaegsType: null,
        tilfredsstillende: null,
        besigtigelseComment: 'Skal besigtiges efter morgenens regn',
        photoCount: 0,
      },
      // TODO: Erstat med Supabase når klar — per-child udlægning
      udlaegningDetails: {
        status: 'ikke-startet',
        noter: '',
      },
    },
  ],
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

// Date-format helpers (formatLongDate, formatDateRange, formatWeekday) er
// centraliseret i `@/utils/date` — SINGLE SOURCE OF TRUTH for alle dato-visninger.
// Når dato-formatet skal ændres globalt — RET DER. Ingen inline-formatting i UI.

const DA_MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']

// Timestamp-formatter — "DD. måned · HH:MM" — til godkendt/kommentar/bekræftet-stempler.
// Lokal helper fordi den blander dato + tid (ikke en pure date-display).
function formatTimestamp(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getDate()}. ${DA_MONTHS[dt.getMonth()]} · ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

// Frozen "today" for prototype — bruger mock-dato svarende til produkternes range
// TODO (produktion): Erstat med new Date() og tilpas INITIAL_PRODUCTS til rigtige datoer
const TODAY = new Date('2026-03-17T00:00:00')

function dateToString(d: Date): string {
  return d.toISOString().slice(0, 10)
}




// ─── Types (mode) ─────────────────────────────────────────────────────────────

type OrderMode = 'planlaegning' | 'udfoersel' | 'afregning'

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
  // TODO: Erstat med Supabase når klar — fra plan_vejebilag (vejeseddel-/bilagsnummer)
  vejeseddelNr: string       // fx "1042801"
  product_code: string        // fx "ABB 11"
  product_name: string        // fx "ABB 11 toplag"
  netto_tons: number
  // TODO: Erstat med Supabase når klar — tara/brutto fra plan_vejebilag
  tara_tons: number           // bils tomvægt (typisk 14-15 tons pr. 6-7 aks bil)
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

/** STATUS_VOKABULAR #13 — LÅST 2026-06-15. Fase 2: aendret_siden_afsendelse bruges ikke endnu. */
type ChauffoerSmsStatus = 'ikke_sendt' | 'sendt' | 'aendret_siden_afsendelse'

type AfregningType = 'time' | 'akkord'

interface ChauffoerAfregning {
  chauffoer_navn: string
  reg_nr?: string                // null for materiel
  afregning_type?: AfregningType // undefined → fallback time + banner
  // Prædufyldte fra chauffør-app (alle valgfrie)
  // TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
  koretimer?: number
  ventetid?: number
  hviletid?: number
  tons_koert?: number            // fra PLAN vejebilag (mock for nu)
  chauffoer_kommentar?: string
  // State
  godkendt_af_formand: boolean
  godkendt_tidspunkt?: string
  /** Sat af auto-godkend-logik (FF Flow 4 Trin 5a): akkord uden ventetid auto-godkendes.
   *  false/undefined = manuelt godkendt eller ikke godkendt endnu. */
  auto_godkendt?: boolean
}

interface ConfirmedTruck {
  regnr: string
  chauffoer: string
  tlf: string
  biltype: string
  /** HH:MM — bekræftet ankomst på plads fra vognmand (jf. FF Flow 1 Trin 4). */
  ankomst_plads_tid?: string
  /** Læs-nummer 1, 2, 3… — bestemt af drop-rækkefølge i vognmands disponering (jf. FF Trin 4). */
  laes_nummer?: number
  /** HH:MM — tilbageregnet mødetid på fabrik (jf. FF Trin 4: ankomst_plads − driveTimeMinutes). */
  moedetid_fabrik?: string
  /** SMS-status til chauffør (STATUS_VOKABULAR #13). Default: 'ikke_sendt'. */
  sms_status?: ChauffoerSmsStatus
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
  bekraeftetTidspunkt: string // "DD. måned · HH:MM" — via formatTimestamp()
}

interface ConfirmedMaterielItem {
  resourceId: string
  anlaegsNr: string
  beskrivelse: string
  regnr: string
  chauffoer: string
  tlf: string
  transportType: string
  /** HH:MM — bekræftet ankomst på plads fra vognmand (jf. FF Flow 2). Maks. de 3 første vises i Udførsel-dashboardet. */
  ankomst_plads_tid?: string
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
  bekraeftetTidspunkt: '15. marts · 17:05',
  items: [
    {
      resourceId: 'r1',
      anlaegsNr: '5-0034',
      beskrivelse: 'HAMM HD10 VT',
      regnr: 'BL77331',
      chauffoer: 'Lars Pedersen',
      tlf: '20 30 40 50',
      transportType: 'Blokvogn',
      ankomst_plads_tid: '06:15',
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
      ankomst_plads_tid: '07:00',
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
    bekraeftetTidspunkt: '15. marts · 16:42',
    biler: [
      {
        regnr: 'AB 12 345',
        chauffoer: 'Morten Lund',
        tlf: '22 33 44 55',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:30',
        laes_nummer: 1,
        moedetid_fabrik: '05:54',
        sms_status: 'sendt',
        // time-afregning med prædufyldte værdier fra chauffør-app
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 0.5,
          hviletid: 0.5,
          chauffoer_kommentar: 'Ventet 30 min ved fabrikken pga. kø ved indvejning.',
          godkendt_af_formand: false,
        },
        // TODO: Erstat med Supabase når klar — vejesedler fra plan_vejebilag-tabel
        vejesedler: [
          {
            id: 'vsb-1',
            vejeseddelNr: '25-1013-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 28.0,
            tara_tons: 14.5,
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
        ankomst_plads_tid: '06:50',
        laes_nummer: 2,
        moedetid_fabrik: '06:14',
        sms_status: 'ikke_sendt',
        // akkord-afregning — tons arves fra vejesedler (49.2t multilæs)
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 49.2,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        // TODO: Erstat med Supabase når klar — vejesedler fra plan_vejebilag-tabel
        vejesedler: [
          {
            id: 'vsb-2',
            vejeseddelNr: '25-1014-A',
            product_code: 'ABB 11',
            product_name: 'ABB 11 toplag',
            netto_tons: 49.2,
            tara_tons: 15.0,
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
        ],
      },
      {
        regnr: 'EF 11 223',
        chauffoer: 'Lars Holm',
        tlf: '40 12 56 78',
        biltype: '7 Aks',
        ankomst_plads_tid: '07:10',
        laes_nummer: 3,
        moedetid_fabrik: '06:34',
        sms_status: 'ikke_sendt',
        // INGEN afregning_type → trigger fallback-banner + default time
        afregning: {
          afregning_type: undefined,
          koretimer: 8,
          ventetid: 0,
          hviletid: 0,
          godkendt_af_formand: true,
          godkendt_tidspunkt: '16. marts · 09:14',
        },
      },
      // Akkord-bil med 1,5-times-reglen triggered
      // TODO: Erstat med Supabase når klar — vejesedler og 1.5t-flag fra plan_vejebilag-tabel
      {
        regnr: 'GH 33 441',
        chauffoer: 'Kim Vestergaard',
        tlf: '51 62 73 84',
        biltype: '7 Aks',
        ankomst_plads_tid: '07:30',
        laes_nummer: 4,
        moedetid_fabrik: '06:54',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 35.0,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-6',
            vejeseddelNr: '25-1015-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 35.0,
            tara_tons: 14.5,
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
      // Bil 5 — interval-fremskrevet (ikke pinned), sms_status: ikke_sendt
      // TODO: Erstat med Supabase når klar
      {
        regnr: 'JK 55 678',
        chauffoer: 'Peter Hansen',
        tlf: '60 71 82 93',
        biltype: '6 Aks',
        ankomst_plads_tid: '07:50',
        laes_nummer: 5,
        moedetid_fabrik: '07:14',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 32.4,
          ventetid: 0,
          godkendt_af_formand: false,
        },
      },
      // Bil 6 — interval-fremskrevet, sms allerede sendt (demo af sendt-tilstand)
      // TODO: Erstat med Supabase når klar
      {
        regnr: 'LM 88 901',
        chauffoer: 'Thomas Nielsen',
        tlf: '42 53 64 75',
        biltype: '7 Aks',
        ankomst_plads_tid: '08:10',
        laes_nummer: 6,
        moedetid_fabrik: '07:34',
        sms_status: 'sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 38.0,
          ventetid: 0,
          godkendt_af_formand: false,
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
  // TODO: Erstat med Supabase når klar — d2-2 og d2-3 mock-bekræftelser
  'd2-2': {
    dayId: 'd2-2',
    bekraeftetTidspunkt: '16. marts · 15:30',
    biler: [
      {
        regnr: 'NP 21 654',
        chauffoer: 'Jesper Madsen',
        tlf: '+4541527836',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:20',
        laes_nummer: 1,
        moedetid_fabrik: '05:44',
        sms_status: 'ikke_sendt',
        // time-afregning (matcher kørselOrders d2-2: 6 Aks → 'time')
        afregning: {
          afregning_type: 'time',
          koretimer: 8.0,
          ventetid: 0.5,
          hviletid: 0.5,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-d22-1',
            vejeseddelNr: '25-1016-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 30.5,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 30.5, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'QR 44 782',
        chauffoer: 'Anders Kristiansen',
        tlf: '+4553748291',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:40',
        laes_nummer: 2,
        moedetid_fabrik: '06:04',
        sms_status: 'sendt',
        // time-afregning (6 Aks → 'time' pr. d2-2 kørselOrders)
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 0,
          hviletid: 0.5,
          godkendt_af_formand: true,
          godkendt_tidspunkt: '17. marts · 14:22',
        },
        vejesedler: [
          {
            id: 'vsb-d22-2',
            vejeseddelNr: '25-1017-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 29.8,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 29.8, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'ST 66 319',
        chauffoer: 'Ole Brandt',
        tlf: '+4562839471',
        biltype: 'Sideudlægger',
        ankomst_plads_tid: '07:00',
        laes_nummer: 3,
        moedetid_fabrik: '06:24',
        sms_status: 'ikke_sendt',
        // akkord (Sideudlægger → 'akkord' pr. d2-2 kørselOrders)
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 45.2,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-d22-3',
            vejeseddelNr: '25-1018-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 45.2,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212344', ordre_label: '1212344 · Havnevej 12', tons: 45.2, is_anchor: true },
            ],
          },
        ],
      },
      // Materiel-bil (Blokvogn) — er_materiel_bil: true
      // TODO: Erstat med Supabase når klar
      {
        regnr: 'BL44219',
        chauffoer: 'Frank Olesen',
        tlf: '+4571829364',
        biltype: 'Blokvogn',
        er_materiel_bil: true,
        koert_materiel: ['HAMM HD10 VT (5-0034)'],
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 0,
          godkendt_af_formand: false,
        },
      },
    ],
  },
  'd2-3': {
    dayId: 'd2-3',
    bekraeftetTidspunkt: '17. marts · 16:05',
    biler: [
      {
        regnr: 'UV 12 537',
        chauffoer: 'Niels Dalgaard',
        tlf: '+4544617293',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:30',
        laes_nummer: 1,
        moedetid_fabrik: '05:54',
        sms_status: 'ikke_sendt',
        // akkord (6 Aks → 'akkord' pr. d2-3 kørselOrders)
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 33.6,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-d23-1',
            vejeseddelNr: '25-1019-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 33.6,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 33.6, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'XY 89 064',
        chauffoer: 'Claus Friis',
        tlf: '+4573948512',
        biltype: '7 Aks',
        ankomst_plads_tid: '06:50',
        laes_nummer: 2,
        moedetid_fabrik: '06:14',
        sms_status: 'ikke_sendt',
        // time (7 Aks → 'time' pr. d2-3 kørselOrders)
        afregning: {
          afregning_type: 'time',
          koretimer: 8.5,
          ventetid: 1.0,
          hviletid: 0.5,
          chauffoer_kommentar: 'Lang ventetid ved losseplads.',
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-d23-2',
            vejeseddelNr: '25-1020-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 38.4,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 38.4, is_anchor: true },
            ],
          },
        ],
      },
    ],
  },
}

// ─── OrdredetaljerSection ─────────────────────────────────────────────────────
// Genbrugbar wrapper for "Ordredetaljer". Matcher Forundersøgelse-mønsteret:
// h2 står FRIT ovenover (ingen ramme om overskriften), og kun selve indholdet er
// indrammet. Ingen ydre kort-ramme — collapsed-pillen og spec-grid'et har hver
// deres egen rounded-xl ramme, så der er aldrig dobbelt-indramning.
// Bruges identisk i Planlægning, Udførsel og Afregning. State holdes hos kalderen.

function OrdredetaljerSection({
  expanded,
  onToggle,
  renderCard,
  renderCollapsedPille,
}: {
  expanded: boolean
  onToggle: () => void
  renderCard: () => ReactNode
  renderCollapsedPille: () => ReactNode
}) {
  return (
    <section className="mb-sm">
      {/* Fri sektions-titel UDENFOR kortet — identisk med Forundersøgelse-h2'en.
          HELE header-rækken (overskrift + toggle) er klikbar, så man kan
          collapse/expande uanset hvor på rækken man rammer. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Skjul ordredetaljer' : 'Vis ordredetaljer'}
        className="group w-full flex items-center gap-sm mb-sm text-left"
      >
        <h2 className="font-poppins font-semibold text-xl text-text-primary leading-tight group-hover:text-deep-teal transition-colors">Ordredetaljer</h2>
        <span className="flex items-center gap-xxxs font-inter text-xs font-medium text-dark-teal group-hover:text-deep-teal transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Skjul detaljer' : 'Vis detaljer'}
        </span>
      </button>

      {expanded ? (
        // Spec-grid har sin egen rounded-xl ramme — ingen ekstra ydre ramme.
        // Hele kortet er klikbart-til-collapse, men klik på interaktive felter
        // (dropdown, knapper, input, links i fx Aflysning-cellen) collapser IKKE.
        <div
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('select, button, input, textarea, a, [role="button"], [role="combobox"]')) return
            onToggle()
          }}
          className="cursor-pointer"
        >
          {renderCard()}
        </div>
      ) : (
        // Collapsed-pille: hele kortet klikbart, samme rounded-xl ramme som spec-grid'et.
        <button
          type="button"
          onClick={onToggle}
          aria-label="Vis ordredetaljer"
          className="w-full text-left bg-surface border border-hairline rounded-xl overflow-hidden hover:bg-surface-2 transition-colors"
        >
          {renderCollapsedPille()}
        </button>
      )}
    </section>
  )
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
  // Samleordre-context er state så formanden kan tilføje ekstra ordrer på dagen
  // TODO: Erstat med Supabase når klar — mutationer skal persisteres til samleordre_children
  const [samleordreCtx, setSamleordreCtx] = useState<SamleordreContext | null>(
    isSamleordreMode ? MOCK_SAMLEORDRE : null
  )
  const [activeTab, setActiveTab] = useState<TabName>('dagens-opgaver')
  // Samleordre Ordredetaljer tab: hvilken child-ordre vises i spec-grid
  const [samleordreTabOrderNr, setSamleordreTabOrderNr] = useState<string>(() =>
    MOCK_SAMLEORDRE.children.find(c => c.isAnchor)?.orderNumber ?? MOCK_SAMLEORDRE.children[0].orderNumber
  )
  const [activeMode, setActiveMode] = useState<OrderMode>('planlaegning')
  const [activeProductId, setActiveProductId] = useState('p2')
  // "Skjul detaljer"-toggle for Ordredetaljer-spec-grid i Planlægning-mode
  const [planlaegningOrdredetaljerExpanded, setPlanlaegningOrdredetaljerExpanded] = useState(true)
  const [products, setProducts] = useState<MockProduct[]>(INITIAL_PRODUCTS)
  // Valgt dag i Bestilling-rækken (driver produkt-bokse + planlægning for ordren)
  // Prototype-default: 17. marts 2026 — den dag der har ekstra-bestillinger i mock,
  // så feature-præsentationen er umiddelbart synlig. Override via location.state.initialPlanDate
  // (fx fra Dagsoversigt-navigation).
  const [selectedPlanDate, setSelectedPlanDate] = useState<string>(
    initialPlanDate ?? '2026-03-17'
  )
  // "Samles på en bil" per produkt+dag: key = `${productId}__${dayId}`
  // TODO: Erstat med Supabase når klar
  const [productSamlesFlags, setProductSamlesFlags] = useState<Record<string, boolean>>({})

  function setProductSamles(productId: string, dayId: string, value: boolean) {
    setProductSamlesFlags(prev => ({ ...prev, [`${productId}__${dayId}`]: value }))
  }
  // Bekræftelses-modal før afsendelse til fabrik
  const [showConfirmSend, setShowConfirmSend] = useState(false)
  // "Bestilling for sent"-flag: deadline = kl 11 DAGEN FØR udlægningsdagen (selectedPlanDate).
  // Efter deadline kan ordren stadig sendes, men formanden skal ringe til fabrik for at sikre
  // produktionskapacitet. Vises pr. DEFAULT i prototypen så flowet kan ses uden tidssimulering.
  // TODO: Erstat med Supabase/PLAN — reel beregning: nu > (selectedPlanDate − 1 dag, kl 11:00).
  const bestillingForSent = true
  // TODO: Erstat med Supabase når klar — kommentar gemmes på ordren ved afsendelse
  const [kommentar, setKommentar] = useState('')
  // TODO: Erstat med Supabase når klar — kommentarer gemmes på ordren/dagen
  const [sentKommentarer, setSentKommentarer] = useState<Record<string, string>>({})
  const [resources, setResources] = useState<MockResource[]>(INITIAL_RESOURCES)
  const [tilfoejMaterielOpen, setTilfoejMaterielOpen] = useState(false)
  const [materielSoeg, setMaterielSoeg] = useState('')
  const [fjernModalId, setFjernModalId] = useState<string | null>(null)
  const [cancellingDayId, setCancellingDayId] = useState<string | null>(null)
  // Aflys-celle (i ordredetalje-grid): inline picker-state — uafhængig pr. produkt
  const [aflysPickerProductId, setAflysPickerProductId] = useState<string | null>(null)
  const [aflysPickerDayId, setAflysPickerDayId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<MockPhoto[]>(INITIAL_PHOTOS)
  const [opmaalingOpen, setOpmaalingOpen] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [besigtigelseComment, setBesigtigelseComment] = useState('')
  const [noteComments, setNoteComments] = useState<NoteComment[]>(INITIAL_COMMENTS)
  const [sentDayIds, setSentDayIds] = useState<Set<string>>(new Set())
  // afhentningAdresse, afhentningPostnr, afhentningKlarDato/Tid, afhentningLeveringDato/Tid,
  // sammeAflæsning og materielKommentar er MIGRERET til transportPlaner (MaterielTransportPlan
  // pr. enhed × etape). Se transportPlaner-state nedenfor.
  // TODO Round 4b: swap til faktiskPlanlagteDage + reel transport-state fra Supabase.
  const [kørselExpandedId, setKørselExpandedId] = useState<string | null>(null)
  // TODO: Erstat med Supabase når klar — afsendelsesgate for ASFALT-biler til vognmand, keyed på selectedPlanDate (ISO-dato-streng).
  // Seeder demo-dage som "Sendt til vognmand" (planlægnings-end-state: d2-1 = 16. marts, d2-2 = 17. marts).
  const [sendtTilVognmandDates, setSendtTilVognmandDates] = useState<Set<string>>(new Set(['2026-03-16', '2026-03-17']))
  // TODO: Erstat med Supabase når klar — afsendelsesgate for MATERIELLEVERING til vognmand.
  // Re-keyed til transportKey(resourceId, etapeId) (Round 4a).
  // Seeder r1×etape0 som "Sendt til vognmand" svarende til DEMO_TRANSPORT_PLANER (sendt:true, bekraeftet:true).
  const [materielSendteEnhederIds, setMaterielSendteEnhederIds] = useState<Set<string>>(
    () => new Set(
      INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE.items.map(it => transportKey(it.resourceId, 0))
    )
  )
  // TODO: Erstat med Supabase når klar — fabrik-bestilling sendt pr. dag, keyed på selectedPlanDate (ISO-dato-streng)
  const [fabrikSendtDates, setFabrikSendtDates] = useState<Set<string>>(new Set())
  // TODO: Erstat med Supabase — d2-1 og d2-2 er forudfyldte til demo
  const [kørselPlanlagtIds, setKørselPlanlagtIds] = useState<Set<string>>(new Set(['d2-1', 'd2-2']))
  // TODO: Erstat med Supabase — forudfyldte kørselordre til demo
  const [kørselOrders, setKørselOrders] = useState<Record<string, VehicleOrder[]>>({
    'd2-1': [
      { id: 'vo-d21-1', type: '6 Aks', antal: 2, afregning_type: 'akkord' },
      { id: 'vo-d21-2', type: '7 Aks', antal: 1, afregning_type: 'time' },
    ],
    'd2-2': [
      { id: 'vo-d22-1', type: '6 Aks', antal: 2, afregning_type: 'time' },
      { id: 'vo-d22-2', type: 'Sideudlægger', antal: 1, afregning_type: 'akkord' },
    ],
    'd2-3': [
      { id: 'vo-d23-1', type: '6 Aks', antal: 1, afregning_type: 'akkord' },
      { id: 'vo-d23-2', type: '7 Aks', antal: 1, afregning_type: 'time' },
    ],
  })
  // TODO: Erstat med Supabase når klar — anbefaling gemmes på ordrens dag-post
  // Demo: d2-1 (2026-03-16) viser anbefaling til vognmand-siden
  const [startRaekkefoelge, setStartRaekkefoelge] = useState<Record<string, [string | null, string | null, string | null]>>({
    'd2-1': ['6 Aks', '7 Aks', null],
  })

  function updateStartRaekkefoelge(dayId: string, position: 0 | 1 | 2, value: string | null) {
    setStartRaekkefoelge(prev => ({
      ...prev,
      [dayId]: (() => {
        const current = prev[dayId] ?? [null, null, null] as [string | null, string | null, string | null]
        const next = [...current] as [string | null, string | null, string | null]
        next[position] = value
        return next
      })()
    }))
  }

  // TODO: Erstat med Supabase når klar — starttider gemmes på ordrens dag-post
  // Demo: d2-1 har realistiske tider for de 2 første positioner
  const [startTider, setStartTider] = useState<Record<string, [string | null, string | null, string | null]>>({
    'd2-1': ['06:39', '06:54', null],
  })

  function updateStartTid(dayId: string, position: 0 | 1 | 2, value: string | null) {
    setStartTider(prev => ({
      ...prev,
      [dayId]: (() => {
        const current = prev[dayId] ?? [null, null, null] as [string | null, string | null, string | null]
        const next = [...current] as [string | null, string | null, string | null]
        next[position] = value
        return next
      })()
    }))
    // Bil 1's starttid spejles til "Første læs" — holder downstream (gantt-summary m.m.) i sync
    if (position === 0) {
      setKørselParams(prev => ({
        ...prev,
        [dayId]: { ...(prev[dayId] ?? DEFAULT_KØRSEL_PARAMS), firstLoadTime: value ?? undefined },
      }))
    }
  }

  const [kørselParams, setKørselParams] = useState<Record<string, KørselDayParams>>({})
  // TODO: Erstat med Supabase når klar — km-værdi gemmes på ordren, default fra Google API
  const GOOGLE_KM = 36 // Google-beregnet køreafstand — bruges som hint hvis formand redigerer
  const factoryKm = GOOGLE_KM // display-only — km fra Google-integration (drivetid = km × 1 min)
  const [kørselKommentar, setKørselKommentar] = useState<Record<string, string>>({})
  // materielKommentar MIGRERET til transportPlaner[key].kommentar — fjernet her.
  // TODO: Erstat med Supabase når klar — gemmes på plan_dag per ordre
  const [dagVognmand, setDagVognmand] = useState<Record<string, string>>({})             // dayId -> vognmandId
  const [dagAfregning, setDagAfregning] = useState<Record<string, 'time' | 'akkord'>>({}) // dayId -> 'time' | 'akkord'

  const [vognmandBekraeftelser] = useState<Record<string, VognmandBekraeftelse>>(INITIAL_VOGNMAND_BEKRAEFTELSER)
  // TODO: Erstat med Supabase når klar — opdateres via Realtime når vognmand bekræfter pr. dag.
  // Bekræftelse seedes IKKE i planlægnings-demoen — den er downstream (Udførsel).
  // Planlægnings-end-state = "Sendt til vognmand". Badge-lifecycle: gem → "Sendt til vognmand", vognmand-retur → "Bekræftet vognmand".
  const [bekraeftedeDagIds, setBekraeftedeDagIds] = useState<Set<string>>(
    () => new Set<string>()
  )
  const [vognmandMaterielBekraeftelse] = useState<VognmandMaterielBekraeftelse>(INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE)
  // TODO: Erstat med Supabase når klar — opdateres via Realtime når vognmand bekræfter pr. enhed.
  // Re-keyed til transportKey(resourceId, etapeId) (Round 4a).
  // Bekræftelse seedes IKKE i planlægnings-demoen — den er downstream (Udførsel).
  // Planlægnings-end-state = "Sendt til vognmand". Badge-lifecycle: gem → "Sendt til vognmand", vognmand-retur → "Bekræftet vognmand".
  const [bekraeftedeEnhederIds, setBekraeftedeEnhederIds] = useState<Set<string>>(
    () => new Set<string>()
  )

  // Per-produkt kørselsfelter — key = `${productId}__${dayId}`
  // TODO: Erstat med Supabase når klar — gemmes på plan_dag_produkt per ordre
  // Demo: d1-1 (GAB I 2026-03-17) har foersteLaesPaaPlads=07:15, intervalMin=20
  //       d2-2 (SMA 11S 2026-03-17) har foersteLaesPaaPlads=null (sekventielt), intervalMin=15
  const [produktKørselParams, setProduktKørselParams] = useState<Record<string, ProduktKørselParams>>({
    'p1__d1-1': { foersteLaesPaaPlads: '07:15', intervalMin: 20 },
    'p2__d2-2': { foersteLaesPaaPlads: null,    intervalMin: 15 },
  })

  function updateProduktKørsel(productId: string, dayId: string, field: keyof ProduktKørselParams, value: string | number | null) {
    const key = `${productId}__${dayId}`
    setProduktKørselParams(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { foersteLaesPaaPlads: null, intervalMin: null }), [field]: value },
    }))
  }

  // ── Udlægning state (løftet til root så AfregningContent + UdfoerselContent deler det) ──
  // TODO: Erstat med Supabase når klar — hent fra plan_vejebilag + dagplan
  const DEMO_TONS_I_DAG = 251        // t   — TODO: hent fra dagplan
  const DEMO_AREAL_I_DAG = 1339      // m² — TODO: beregn fra dagplan-tons × 1000/kg_per_m2
  const DEMO_TYKKELSE = 45           // mm  — TODO: hent fra ordre.planlaegning.tykkelse
  const DEMO_ORDRE_ID_UDLAEGNING = '260423891'
  const DEMO_DATO_UDLAEGNING = new Date().toISOString().slice(0, 10)
  const { recept } = useRecept('82101H') // SMA 11S — TODO: Erstat med Supabase når klar
  const { tonsAnkommet, forventetUdlagtM2, faktiskRegistrering, gemFaktisk } = useDagsoverblik(
    DEMO_ORDRE_ID_UDLAEGNING,
    DEMO_DATO_UDLAEGNING,
    recept
  )
  const [visUdlaegningInput, setVisUdlaegningInput] = useState(false)

  // ── Ekstraarbejde-state (løftet fra UdfoerselContent → deles med AfregningContent) ──
  // TODO: Erstat med Supabase når klar
  const [ekstraLinjer, setEkstraLinjer] = useState<EkstraLinje[]>([])
  const [ekstraSent, setEkstraSent] = useState(false)

  const activeProduct = products.find(p => p.id === activeProductId)!
  const days = activeProduct.days
  const activeDays = days.filter(d => !d.cancelled)

  // ─── Etape-bevidst materiel-model (Round 4c — LÅST 2026-06-23) ──────────────
  //
  // Datakilde: ordrens faktisk-planlagte dage fra ALLE produkters day-array,
  // filtreret på tonsPlanned > 0 && !cancelled — IKKE et contiguous dag-fill.
  // Dette spejler "Udføres i perioden = kun PLAN-planlagte dage"-reglen (FF Flow 1).
  //
  // TODO: Erstat med Supabase når klar — planlagte dage hentes fra plan_dag-tabellen.

  /** Faktisk-planlagte dage på tværs af alle produkter — deduplikeret og sorteret. */
  const faktiskPlanlagteDage = useMemo<string[]>(() => {
    const datoSet = new Set<string>()
    for (const p of products) {
      for (const d of p.days) {
        if (d.tonsPlanned > 0 && !d.cancelled) {
          datoSet.add(d.date)
        }
      }
    }
    return [...datoSet].sort()
  }, [products])

  // ── Dato-først model ──────────────────────────────────────────────────────
  // Dato-piller i Planlægning-mode: faktisk-planlagte dage + én demo-dvale-dag
  // så alle fire materiel-UX-tilstande kan nås via datovælgeren i prototype.
  //
  // DEMO_DVALE_DAG er en dag i gap'et mellem etape 0 (marts) og etape 1 (juli)
  // — giver 'dvale'-tilstand i materiel-sektionen.
  //
  // TODO: Erstat med Supabase når klar — i produktion er alle PLAN-dage synlige
  //   i datovælgeren; dvale-tilstanden opstår naturligt ved at vælge en dag uden
  //   planlagte produkter (eller via notifikations-flow for næste etape).
  const DEMO_DVALE_DAG = '2026-05-04'
  const planDays = useMemo(() => {
    const all = new Set([...faktiskPlanlagteDage, DEMO_DVALE_DAG])
    return [...all].sort()
  }, [faktiskPlanlagteDage])

  // Produkter for valgt dag (med deres day-objekt for den dag)
  // Frasorterer produkter med 0 tons i hele deres udlægningsperiode (ikke blot på valgt dag).
  // TODO: Erstat med Supabase når klar — periode-tjek: frasortér kun hvis 0 tons i HELE udførelsesperioden
  const productsForSelectedDate = useMemo(() => {
    return products
      .filter(p => p.days.some(d => d.tonsPlanned > 0))
      .map(p => ({ product: p, day: p.days.find(d => d.date === selectedPlanDate) }))
      .filter((x): x is { product: MockProduct; day: DayPlan } => !!x.day)
  }, [products, selectedPlanDate])

  /**
   * Etaper klynget fra faktisk-planlagte dage (Round 4c: kilde = faktiskPlanlagteDage).
   * Weekend-tolerant: lørdags-/søndagsgab bryder IKKE en etape.
   *
   * Med INITIAL_PRODUCTS' to etaper (marts + juli) giver dette:
   *   etape 0: 2026-03-16 … 2026-03-19 (union p1+p2, firstDay = 2026-03-16)
   *   etape 1: 2026-07-06 … 2026-07-07 (p1 july-dage, firstDay = 2026-07-06)
   *
   * TODO: Erstat med Supabase når klar — planlagte dage hentes fra plan_dag-tabellen.
   */
  const etaper = useMemo<Etape[]>(
    () => clusterEtaper(faktiskPlanlagteDage),
    [faktiskPlanlagteDage],
  )

  /**
   * Aktuel materiel-UX-tilstand for den valgte dag.
   */
  const materielUiState = useMemo<MaterielUiState>(
    () => getMaterielUiState(selectedPlanDate, etaper),
    [selectedPlanDate, etaper],
  )

  /**
   * Transport-planer keyed på transportKey(resourceId, etapeId).
   * Mutable container-state — presentere opdaterer via onTransportChange/onTransportGem.
   *
   * Seed: DEMO_TRANSPORT_PLANER (etape 0: r1 planlagt, r2+r3 ikke-planlagt; etape 1: alle blank).
   * Etape-id'erne 0 og 1 matcher clusterEtaper(faktiskPlanlagteDage) output ovenfor.
   *
   * TODO: Erstat med Supabase når klar — fra materiel_transport_plan-tabellen.
   */
  const [transportPlaner, setTransportPlaner] = useState<Record<string, MaterielTransportPlan>>(
    () => ({ ...DEMO_TRANSPORT_PLANER })
  )

  /**
   * Den etape der indeholder den valgte dag — bruges til transportKey-opslag i presentere.
   * Undefined hvis dagen falder i et dvale-gap (dvale-tilstand viser ingen transport-planer).
   */
  const aktivEtape = useMemo<Etape | undefined>(
    () => etaper.find(e => e.dates.includes(selectedPlanDate)),
    [etaper, selectedPlanDate],
  )

  /**
   * Pakke-ressourcer som MaterielEnhed-liste (subset til presentere).
   * Udelukker 'egen-korsel'-enheder, da de ikke transporteres via vognmand.
   */
  const materielResources: MaterielEnhedTilstand[] = useMemo(
    () =>
      resources
        .filter(r => r.transportTag !== 'egen-korsel')
        .map(r => ({ id: r.id, plantNumber: r.plantNumber, description: r.description })),
    [resources],
  )

  // ─── Round 4b: Auto-opret blanke transport-pladser ved ny etape ─────────────
  //
  // Idempotent effekt: når materielUiState er 'ny-etape' og aktivEtape er defineret,
  // sikres at transportPlaner har en blank MaterielTransportPlan for HVER enhed i
  // materielResources for den givne etape. Eksisterende planer overskrives IKKE.
  //
  // TODO: Erstat med Supabase når klar — auto-insert i materiel_transport_plan-tabellen
  //   når en ny etape oprettes i PLAN (Supabase trigger eller server-action).
  useEffect(() => {
    if (materielUiState !== 'ny-etape' || !aktivEtape) return

    setTransportPlaner(prev => {
      let changed = false
      const next = { ...prev }

      for (const r of materielResources) {
        const key = transportKey(r.id, aktivEtape.id)
        if (!next[key]) {
          changed = true
          next[key] = {
            resourceId: r.id,
            etapeId: aktivEtape.id,
            status: 'ikke-planlagt',
            afhentning: { vejnavn: '', nummer: '', postnr: '' },
            klar: { dato: '', tid: '' },
            lokation: { dato: '', tid: '' },
            aflaesning: '',
            kommentar: '',
            sendt: false,
            bekraeftet: false,
          }
        }
      }

      return changed ? next : prev
    })
  }, [materielUiState, aktivEtape, materielResources])

  // ─── End etape-model Round 4b ────────────────────────────────────────────

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

  // Samleordrens dato — bruges af 'Tilføj ordre'-flow til at kalde Dagsoversigt
  // med korrekt dato-filter. TODO: hent fra samleordre.date i Supabase.
  const samleordreDate = '2026-03-17'

  // Når Dagsoversigt sender brugeren tilbage med location.state.addedChildren,
  // betyder det at en eller flere ordrer skal tilføjes til samleordren.
  // Vi læser ved mount og opdaterer samleordreCtx-state.
  // TODO: Erstat med Supabase når klar — server-side mutation på samleordre_children
  useEffect(() => {
    const state = location.state as { addedChildren?: SamleordreChild[] } | null
    const addedChildren = state?.addedChildren
    if (!addedChildren || addedChildren.length === 0 || !samleordreCtx) return
    const eksisterendeOrdrenumre = new Set(samleordreCtx.children.map(c => c.orderNumber))
    const newChildren = addedChildren.filter(c => !eksisterendeOrdrenumre.has(c.orderNumber))
    if (newChildren.length === 0) return
    setSamleordreCtx({ ...samleordreCtx, children: [...samleordreCtx.children, ...newChildren] })
    // Ryd location.state så refresh ikke gentager tilføjelsen
    navigate(location.pathname + location.search, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Send alle ikke-sendte morgen-bestillinger for valgt dag samtidigt
  function sendAlleForSelectedDate() {
    const dayIds = productsForSelectedDate
      .filter(({ day }) => !sentDayIds.has(day.id))
      .map(({ day }) => day.id)
    setSentDayIds(prev => new Set([...prev, ...dayIds]))
  }

  function removeResource(id: string) {
    setResources(prev => prev.filter(r => r.id !== id))
    setFjernModalId(null)
  }

  /**
   * Gem transport for én enhed i én etape.
   * Opdaterer: resources.status → 'planlagt', transportPlaner[key].status → 'planlagt',
   * og fjerner nøglen fra bekræftede/sendte sæt (revert-on-edit).
   */
  function markTransportPlanlagt(resourceId: string, etapeId: number) {
    const key = transportKey(resourceId, etapeId)
    setResources(prev => prev.map(r =>
      r.id === resourceId ? { ...r, status: 'planlagt' } : r
    ))
    // Opdater transport-planens status til 'planlagt'
    setTransportPlaner(prev => {
      const existing = prev[key]
      if (!existing) return prev
      return { ...prev, [key]: { ...existing, status: 'planlagt' } }
    })
    // Gem → "Planlagt" (fjern fra bekræftet-sæt).
    // "Bekræftet vognmand" gensættes kun når vognmand returnerer bekræftelse via Supabase Realtime.
    setBekraeftedeEnhederIds(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    // Revert-on-edit: rettelse efter afsendelse → tilbage til "Planlagt".
    // Vognmandens kopi er forældet når formanden ændrer — sendt-status nulstilles.
    setMaterielSendteEnhederIds(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  /**
   * Handler til presentere: opdaterer ét felt på én transport-plan.
   * Keyer automatisk på transportKey(resourceId, etapeId).
   */
  function handleTransportChange(resourceId: string, etapeId: number, patch: TransportPlanPatch) {
    const key = transportKey(resourceId, etapeId)
    setTransportPlaner(prev => {
      const existing = prev[key]
      if (!existing) return prev
      return { ...prev, [key]: { ...existing, ...patch } }
    })
  }

  /**
   * Handler til presentere: "Send til vognmand" section-level for alle planlagte usendte enheder
   * i den givne etape. Keyer sendt-sæt med transportKey.
   */
  function handleMaterielSend(etape: Etape) {
    const nyeSendte: string[] = []
    for (const r of resources) {
      const key = transportKey(r.id, etape.id)
      const plan = transportPlaner[key]
      if (plan?.status === 'planlagt' && !plan.sendt) {
        nyeSendte.push(key)
      }
    }
    if (nyeSendte.length === 0) return
    // Enkelt state-opdatering for alle enheder (undgår batch-stale-closure problem)
    setTransportPlaner(prev => {
      const next = { ...prev }
      for (const key of nyeSendte) {
        next[key] = { ...next[key], sendt: true }
      }
      return next
    })
    setMaterielSendteEnhederIds(prev => new Set([...prev, ...nyeSendte]))
  }

  function gemKørsel(dayId: string) {
    setKørselPlanlagtIds(prev => new Set([...prev, dayId]))
    // Gem → "Planlagt" (fjern fra bekræftet-sæt). "Bekræftet vognmand" gensættes
    // kun når vognmand returnerer bekræftelse via Supabase Realtime.
    setBekraeftedeDagIds(prev => { const next = new Set(prev); next.delete(dayId); return next })
    // Rettelse efter afsendelse → tilbage til "Planlagt": vognmandens kopi er forældet når
    // formanden ændrer bestillingen, så sendt-status nulstilles og dagen skal sendes igen.
    const dayDate = days.find(d => d.id === dayId)?.date
    if (dayDate) setSendtTilVognmandDates(prev => { const next = new Set(prev); next.delete(dayDate); return next })
    setKørselExpandedId(null)
  }

  const fjernModalResource = fjernModalId ? resources.find(r => r.id === fjernModalId) : null

  // Genbrugbar Ordredetaljer-visning: samleordre split-view med tabs ELLER fuld bredde Spec-grid.
  // Bruges både på Planlægning-mode (direkte synlig) og Udførsel-mode (i collapsed-expander).
  // hideTabs=true skjuler tab-rækken — bruges i Udførsel-mode hvor tabs er på selve Ordredetaljer-rækken.
  const makeOrdredetaljerCard = (
    hideTabs?: boolean,
  ) => (
    isSamleordreMode && samleordreCtx ? (
      <div className="mb-lg">
        {/* Tabs ovenpå spec-grid — skjules i Udførsel-mode (tabs er på Ordredetaljer-rækken) */}
        {!hideTabs && (
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
                    aria-label="Primær ordre"
                  />
                )}
                <span>{child.stedLabel}</span>
              </button>
            )
          })}
        </div>
        )}
        {/* Hjørner: rounded-tr-xl kun når tabs vises (de danner en "browser-tab" kant); fuldt rounded ved hideTabs */}
        <div className={`bg-white border border-hairline overflow-hidden ${hideTabs ? 'rounded-xl' : 'rounded-tr-xl rounded-b-xl'}`}>
          {(() => {
            const tabChild = samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
            if (!tabChild) return null
            const tabProduct = tabChild.isAnchor ? activeProduct : null
            return (
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-5 auto-rows-fr divide-x divide-hairline bg-white items-stretch">
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Mængde tons</span>
                    <span className="font-poppins font-semibold text-md text-text-primary tabular-nums mt-auto">
                      {/* effective tons = produkt-total + evt. ekstra fra PLAN på produktets dage */}
                      {tabProduct ? getEffectiveProductTotalTons(tabProduct) : tabChild.products.reduce((s, p) => s + p.tonsTotal, 0)}
                    </span>
                  </div>
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Produkt</span>
                    <div className="mt-auto flex flex-col gap-xxxs">
                    {tabChild.products.map(p => (
                      <div key={p.id}>
                        <span className="font-poppins font-semibold text-md text-text-primary block leading-tight">
                          {p.recipeName}
                        </span>
                      </div>
                    ))}
                    </div>
                  </div>
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Tykkelse</span>
                    <span className="font-poppins font-semibold text-md text-text-primary tabular-nums mt-auto">
                      {tabProduct?.thicknessMm != null ? `${tabProduct.thicknessMm} mm` : '–'}
                    </span>
                  </div>
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
                    {tabProduct ? (
                      <div className="mt-auto flex flex-col gap-xxxs">
                        <span className="font-inter text-xs text-text-muted">
                          {tabProduct.factory.driveTimeMinutes} min til plads
                        </span>
                        <span className="font-poppins font-semibold text-sm text-text-primary leading-tight block">
                          {tabProduct.factory.name}
                        </span>
                      </div>
                    ) : (
                      <span className="font-inter text-xs text-text-muted mt-auto">–</span>
                    )}
                  </div>
                  {/* AFLYSNING-celle (6. kolonne) — kun aktiv når der er et tabProduct.
                      Ikke-anchor children har ikke selvstændige days. */}
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Aflysning</span>
                    {tabProduct ? (
                      <AflysningCell
                        product={tabProduct}
                        udfoerselSelectedDate={selectedPlanDate}
                        pickerOpenForDayId={aflysPickerProductId === tabProduct.id ? aflysPickerDayId : null}
                        onOpenPicker={(dayId) => { setAflysPickerProductId(tabProduct.id); setAflysPickerDayId(dayId) }}
                        onClosePicker={() => { setAflysPickerProductId(null); setAflysPickerDayId(null) }}
                        onCancelDay={(dayId, reason) => {
                          cancelDay(tabProduct.id, dayId, reason)
                          setAflysPickerProductId(null)
                          setAflysPickerDayId(null)
                        }}
                      />
                    ) : (
                      <span className="font-inter text-xs text-text-muted mt-auto">–</span>
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
        <div className="grid grid-cols-5 auto-rows-fr divide-x divide-hairline bg-white items-stretch">
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Mængde tons</span>
            <span className="font-poppins font-semibold text-md text-text-primary tabular-nums mt-auto">
              {/* effective tons = produkt-total + evt. ekstra fra PLAN på produktets dage */}
              {getEffectiveProductTotalTons(activeProduct)}
            </span>
          </div>
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Produkt</span>
            <div className="mt-auto flex flex-col gap-xxxs">
              <span className="font-poppins font-semibold text-md text-text-primary block leading-tight">
                {activeProduct.recipeName}
              </span>
            </div>
          </div>
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Tykkelse</span>
            <span className="font-poppins font-semibold text-md text-text-primary tabular-nums mt-auto">
              {activeProduct.thicknessMm != null ? `${activeProduct.thicknessMm} mm` : '–'}
            </span>
          </div>
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
            <div className="mt-auto flex flex-col gap-xxxs">
              <span className="font-inter text-xs text-text-muted">
                {activeProduct.factory.driveTimeMinutes} min til plads
              </span>
              <span className="font-poppins font-semibold text-sm text-text-primary leading-tight block">
                {activeProduct.factory.name}
              </span>
            </div>
          </div>
          {/* AFLYSNING-celle (6. kolonne) */}
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Aflysning</span>
            <AflysningCell
              product={activeProduct}
              udfoerselSelectedDate={selectedPlanDate}
              pickerOpenForDayId={aflysPickerProductId === activeProduct.id ? aflysPickerDayId : null}
              onOpenPicker={(dayId) => { setAflysPickerProductId(activeProduct.id); setAflysPickerDayId(dayId) }}
              onClosePicker={() => { setAflysPickerProductId(null); setAflysPickerDayId(null) }}
              onCancelDay={(dayId, reason) => {
                cancelDay(activeProduct.id, dayId, reason)
                setAflysPickerProductId(null)
                setAflysPickerDayId(null)
              }}
            />
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

  // Kompakt hvid pille der vises UNDER Ordredetaljer-toggle'en når sektionen er collapsed.
  // Viser 3 felter: dato-range, mængde tons, produkt. Bruges på alle 3 modes (Planlægning/Udførsel/Afregning).
  // Samleordre: bruger tabProduct (fra samleordreCtx.children) i stedet for activeProduct — matcher
  // makeOrdredetaljerCard-patternet. Ikke-anchor children har ikke selvstændige days/dato/tons-felter,
  // så vi fallback'er til child.products-aggregat når tabChild ikke er anchor.
  const renderOrdredetaljerCollapsedPille = () => {
    // Find aktuelt produkt afhængigt af samleordre-mode (matcher makeOrdredetaljerCard linje 1182-1184)
    const tabChild = isSamleordreMode && samleordreCtx
      ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
      : undefined
    const tabProduct = tabChild ? (tabChild.isAnchor ? activeProduct : null) : activeProduct

    if (!activeProduct) return null

    // Mængde tons: effektiv total inkl. ekstra fra PLAN; ikke-anchor children → summer over products
    const totalTons = tabProduct
      ? getEffectiveProductTotalTons(tabProduct)
      : (tabChild ? tabChild.products.reduce((s, p) => s + p.tonsTotal, 0) : 0)

    // Produkt: tabChild har products[]-array; ellers activeProduct.recipeName
    const produktLabel = tabChild
      ? tabChild.products.map(p => p.recipeName).join(', ')
      : activeProduct.recipeName

    return (
      // Container-styling (bg-surface/border/rounded/shadow) ligger nu på OrdredetaljerSection's
      // <button>-wrapper, så vi returnerer KUN det indre indhold (3 felter).
      <div className="flex items-center justify-between px-md py-sm gap-md">
        <div className="flex flex-col gap-xxxs items-start">
          <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Mængde tons</span>
          <span className="font-poppins font-semibold text-sm text-text-primary tabular-nums">{totalTons}</span>
        </div>
        <div className="flex flex-col gap-xxxs items-start">
          <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Produkt</span>
          <span className="font-poppins font-semibold text-sm text-text-primary">{produktLabel}</span>
        </div>
      </div>
    )
  }

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
                {/* Tilføj-ordre-knap: sender brugeren til Dagsoversigt i 'tilføj-mode'
                    hvor det eksisterende checkbox-flow genbruges. Dagsoversigt navigerer
                    tilbage med ?addOrderNumbers=... når brugeren bekræfter via FAB. */}
                <button
                  type="button"
                  onClick={() => navigate(`/prototyper/dagsoversigt?date=${encodeURIComponent(samleordreDate)}&addToSamleordreId=${samleordreCtx!.id}`)}
                  className="mt-sm inline-flex items-center gap-xxxs px-sm py-xs font-inter text-xs font-medium text-dark-teal bg-white border border-dashed border-hairline-2 rounded-lg hover:text-deep-teal hover:bg-soft-aqua hover:border-deep-teal/40 transition-colors w-fit"
                  aria-label="Tilføj ordre til samleordre"
                >
                  <Plus size={14} />
                  Tilføj ordre
                </button>
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

          {/* Kontakter — skifter med aktiv samleordre-tab når isSamleordreMode */}
          {(() => {
            const activeChild = isSamleordreMode && samleordreCtx
              ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
              : null
            const projektleder     = activeChild ? activeChild.projektleder     : 'Henrik Thor'
            const projektlederTlf  = activeChild ? activeChild.projektlederTlf  : '40 50 60 70'
            const fabrik           = activeChild ? activeChild.fabrik           : 'Køge Fabrik'
            const fabrikTlf        = activeChild ? activeChild.fabrikTlf        : '56 78 12 34'
            const kundeVirksomhed  = activeChild ? activeChild.kundeVirksomhed  : 'Uddannelsescenter Syd'
            const kundekontakt     = activeChild ? activeChild.kundekontakt     : 'Jens Christensen'
            const kundekontaktTlf  = activeChild ? activeChild.kundekontaktTlf  : '21 34 56 78'
            return (
              <div className="flex flex-col border-t border-hairline pt-xs">
                <div className="flex flex-col gap-xxxs px-xs pb-xs">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Projektleder</span>
                  <p className="font-inter text-sm font-semibold text-text-primary leading-tight">{projektleder}</p>
                  <a href={`tel:${toE164(projektlederTlf) ?? projektlederTlf.replace(/\s/g, '')}`} className="font-inter text-sm text-dark-teal hover:text-deep-teal transition-colors">
                    {formatPhone(projektlederTlf)}
                  </a>
                </div>
                <div className="flex flex-col gap-xxxs px-xs py-xs border-t border-hairline">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
                  <p className="font-inter text-sm font-semibold text-text-primary leading-tight">{fabrik}</p>
                  <a href={`tel:${toE164(fabrikTlf) ?? fabrikTlf.replace(/\s/g, '')}`} className="font-inter text-sm text-dark-teal hover:text-deep-teal transition-colors">
                    {formatPhone(fabrikTlf)}
                  </a>
                </div>
                <div className="flex flex-col gap-xxxs px-xs pt-xs border-t border-hairline">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Kundekontakt</span>
                  <p className="font-inter text-xxs text-text-muted leading-tight mb-xxxs">{kundeVirksomhed}</p>
                  <p className="font-inter text-sm font-semibold text-text-primary leading-tight">{kundekontakt}</p>
                  <a href={`tel:${toE164(kundekontaktTlf) ?? kundekontaktTlf.replace(/\s/g, '')}`} className="font-inter text-sm text-dark-teal hover:text-deep-teal transition-colors">
                    {formatPhone(kundekontaktTlf)}
                  </a>
                </div>
              </div>
            )
          })()}

        </aside>

        {/* ── Hoved-indhold ────────────────────────────────────────── */}
        <main className="px-lg pb-[120px] pt-xs">

          {/* ── Mode-toggle + tilbage-link på samme række ──────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-sm mb-md">
            <div className="inline-flex bg-white border border-hairline rounded-full p-xxxs gap-xxxs shadow-sm">
              {([ 'planlaegning', 'udfoersel', 'afregning' ] as OrderMode[]).map(mode => {
                const isActive = mode === activeMode
                const label = mode === 'planlaegning' ? 'Planlægning' : mode === 'udfoersel' ? 'Udførsel' : 'Afregning'
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

          {/* ── Asfaltbestilling — unified datovælger i toppen (matcher Udførsel/Afregning) ──
              Flyttet hertil 2026-06-15: datovælgeren placeres øverst på alle tre modes for
              ensartethed. 1:1 samme picker som Udførsels "Udføres i perioden" — fuld ordre-
              periode, overståede dage gennemstreget, ingen grøn afsendt-state. */}
          {planDays.length > 0 && (
            <section>
              <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Udføres i perioden</h2>
              <div className="flex items-center gap-xs flex-wrap">
                {planDays.map(ds => {
                  const isSelected = ds === selectedPlanDate
                  // Dato-pille-konvention (2026-06-05): passerede dage → hvid + gennemstreget
                  const isPast = ds < dateToString(TODAY)
                  return (
                    <button
                      key={ds}
                      onClick={() => setSelectedPlanDate(ds)}
                      aria-pressed={isSelected}
                      aria-label={`${formatLongDate(ds)}${isPast ? ' (overstået)' : ''}`}
                      className={[
                        'flex items-center gap-xxxs px-sm py-xs rounded-full font-poppins font-semibold text-sm transition-colors',
                        isSelected
                          ? 'bg-deep-teal text-white shadow-sm'
                          : isPast
                            ? 'bg-white border border-hairline text-text-muted line-through hover:border-dark-teal'
                            : 'bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal',
                      ].join(' ')}
                    >
                      {formatLongDate(ds)}
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Sektion: Udlægning ───────────────────────────────── */}
          <div>

            {/* Header-row (h2 + Skjul/Vis-toggle) + spec-grid/collapsed-pille
                indkapslet i OrdredetaljerSection. Identisk markup på tværs af
                Planlægning/Udførsel/Afregning — kun state og renderCard()-args
                varierer per mode. */}
            <OrdredetaljerSection
              expanded={planlaegningOrdredetaljerExpanded}
              onToggle={() => setPlanlaegningOrdredetaljerExpanded(prev => !prev)}
              renderCard={() => makeOrdredetaljerCard()}
              renderCollapsedPille={renderOrdredetaljerCollapsedPille}
            />

            {planlaegningOrdredetaljerExpanded && (
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
            )}

            <hr className="my-lg border-t border-hairline" />

            {/* ── Bestillings-række for valgt dag ──────────────────────── */}
            {/* Produkter (én boks pr. produkt) + "Send alle"-knap */}
            {/* Samleordre: produkter samles per recipeCode på tværs af ordrer */}
            {/* TODO: Erstat med Supabase når klar — produktdata fra samleordre-join */}
            <div className="flex flex-col gap-sm">
              <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Asfaltbestilling</h2>
              {/* Datovælgeren er flyttet til toppen af Planlægning-mode (unified picker —
                  se sektionen øverst). Bestillings-rækken viser produkterne for den valgte dato. */}
              {productsForSelectedDate.length === 0 && (
                <span className="font-inter text-xs text-text-muted">Ingen produkter denne dag</span>
              )}

              {/* Flow 9b (OPDATERET 2026-06-09): "Tons opdateret af Fabrik"-banner ERSTATTET
                  af synlig EkstraBestillingBox + "Bekræftet fabrik"-pille per produkt med ekstra-tons.
                  Se EkstraBestillingBox-komponenten.
                  Bevaret som dokumentation: ./v1/TonsOpdateretBanner.v1.tsx */}

              {/* items-stretch + flex-1 på bokse: alle kolonner stretcher til samme højde
                  (drevet af højeste boks). */}
              <div className="flex gap-xs flex-wrap items-stretch">
                {/* Produkt-bokse for valgt dag — status-pill under (ingen send-knap, kun statusfelt) */}
                {(() => {
                  // Samleordre: beregn ordre-tags per recipeCode
                  // Produkter samles per recipeCode — vises KUN ÉN gang selv om begge ordrer har det
                  // TODO: Erstat med Supabase når klar
                  const samleordreTags: Record<string, string[]> = {}
                  if (isSamleordreMode && samleordreCtx) {
                    // Byg map: recipeCode → [stedLabel] for alle ordrer der har produktet
                    const rcToChildren: Record<string, { stedLabel: string }[]> = {}
                    for (const child of samleordreCtx.children) {
                      for (const cp of child.products) {
                        if (!rcToChildren[cp.recipeCode]) rcToChildren[cp.recipeCode] = []
                        rcToChildren[cp.recipeCode].push({ stedLabel: child.stedLabel })
                      }
                    }
                    for (const [rc, entries] of Object.entries(rcToChildren)) {
                      samleordreTags[rc] = entries.map(e => e.stedLabel)
                    }
                  }
                  return productsForSelectedDate.flatMap(({ product, day }) => {
                    const isSent = sentDayIds.has(day.id)
                    const isFocused = product.id === activeProductId
                    const ordreTagLabels = isSamleordreMode ? (samleordreTags[product.recipeCode] ?? [product.recipeName]) : undefined
                    const nodes = [
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
                          samlesPaaEnBil={productSamlesFlags[`${product.id}__${day.id}`] ?? false}
                          onSamlesPaaEnBilChange={(v) => setProductSamles(product.id, day.id, v)}
                        />
                        {/* Status-pills fjernet 2026-06-19: aflyst-tilstand vises af ProductBoxV2 selv
                            (rød kant + "Aflyst"-tekst + Fortryd-link). Sendt/afventer-status
                            afspejles af den fælles "Send til fabrik"-knap nedenfor. */}
                      </div>,
                    ]
                    // Flow 9b (OPDATERET 2026-06-09): PLAN-pushet ekstra-bestilling vises som
                    // selvstændig boks ved siden af produktet — med "Bekræftet fabrik"-pille under.
                    if (day.ekstraTons) {
                      nodes.push(
                        <div key={`${product.id}-ekstra`} className="flex flex-col gap-xs">
                          <EkstraBestillingBox product={product} day={day} />
                          {/* "Bekræftet fabrik"-pille fjernet 2026-06-19: bekræftelsestilstand
                              håndteres nu af den fælles fabrikSendtDates-state nedenfor */}
                        </div>
                      )
                    }
                    return nodes
                  })
                })()}

                {/* "Send til fabrik" CTA — gul knap → grøn sendt-tilstand + Ret-link (samme model som bilbestilling) */}
                {productsForSelectedDate.length > 0 && (
                  /* h-full + flex-1: wrapper stretcher til samme højde som items-stretch-parent.
                     flex flex-col + flex-1 på boksen: boksen fylder wrapperens fulde højde → matcher ProductBoxV2. */
                  <div className="relative flex flex-col gap-xs">
                    {fabrikSendtDates.has(selectedPlanDate) ? (
                      /* ── Sendt-tilstand: grøn ikon-boks (ingen Ret — afsendelse til fabrik er endelig) ── */
                      <div className="w-[160px] min-h-[172px] flex-1 rounded-xl flex flex-col items-center justify-center gap-xs p-sm border border-good/30 bg-good/5">
                        <div className="my-auto flex flex-col items-center gap-xs">
                          <div className="w-10 h-10 rounded-full bg-good/15 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-good" />
                          </div>
                          <span className="font-poppins font-medium text-sm text-good text-center leading-tight">
                            Sendt til fabrik
                          </span>
                          <span className="font-inter text-xxs text-text-muted text-center px-xxs leading-tight">
                            PROD A EAST KØGE PH
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* ── Ikke sendt: gul boks-knap (beholder boks-form + ikon) ── */
                      (() => {
                        const ikkeSendteProdukter = productsForSelectedDate.filter(({ day }) => !sentDayIds.has(day.id))
                        const disabled = ikkeSendteProdukter.length === 0
                        return (
                          <button
                            onClick={() => setShowConfirmSend(true)}
                            disabled={disabled}
                            className={[
                              'w-[160px] min-h-[172px] flex-1 rounded-xl flex flex-col items-center p-sm transition-all border',
                              disabled
                                ? 'bg-surface border-hairline opacity-40 cursor-not-allowed'
                                : 'bg-yellow border-yellow hover:opacity-90 active:scale-[0.98]',
                            ].join(' ')}
                          >
                            <div className="my-auto flex flex-col items-center gap-xs">
                              <div className={`w-10 h-10 rounded-full ${disabled ? 'bg-white' : 'bg-deep-teal/15'} flex items-center justify-center`}>
                                <Truck size={20} className="text-deep-teal" />
                              </div>
                              <span className="font-poppins font-medium text-sm text-deep-teal text-center leading-tight">
                                Send til fabrik
                              </span>
                              <span className="font-inter text-xxs text-deep-teal/70 text-center px-xxs leading-tight">
                                {disabled ? 'Intet at sende' : 'Bestilling skal ske inden kl 11'}
                              </span>
                            </div>
                            <span className="font-inter text-xxs text-deep-teal/70 text-center leading-tight">
                              PROD A EAST KØGE PH
                            </span>
                          </button>
                        )
                      })()
                    )}
                    {/* Kommentar-/placeholder-række tages UD af flow (absolut, under boksen) så
                        send-boksen kan fylde wrapperens fulde højde og matche produktboksene. */}
                    <div className="absolute top-full inset-x-0 mt-xxxs flex justify-center">
                    {sentKommentarer[selectedPlanDate] ? (
                      <span
                        className="group relative inline-flex items-center gap-xxxs px-xs py-xxxs font-inter text-xs font-medium text-text-muted hover:text-deep-teal cursor-help w-[180px] justify-center"
                        aria-label={`Kommentarer sendt til fabrik: ${sentKommentarer[selectedPlanDate]}`}
                      >
                        <MessageSquare size={12} />
                        Kommentarer sendt til fabrik
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full right-0 mb-xxxs z-50 hidden group-hover:block bg-deep-teal text-white text-xs font-inter font-normal px-sm py-xs rounded-md shadow-lg whitespace-pre-line max-w-[280px] min-w-[180px] text-left leading-snug"
                        >
                          {sentKommentarer[selectedPlanDate]}
                        </span>
                      </span>
                    ) : (
                      <div className="w-[180px] h-[24px]" aria-hidden="true" />
                    )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

            {/* Kørsel */}
            <div className="mt-lg">
              <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Asfalt kørsel</h2>
              <div className="bg-white border border-hairline rounded-xl overflow-hidden">
                {activeDays.filter(day => day.date === selectedPlanDate).length === 0 && (
                  <p className="font-inter text-xs text-text-muted px-sm py-sm">Ingen kørsel denne dag</p>
                )}
                {activeDays.filter(day => day.date === selectedPlanDate).map((day, i, shownDays) => {
                  const isExpanded = kørselExpandedId === day.id
                  const isPlanlagt = kørselPlanlagtIds.has(day.id)
                  const erBekraeftet = bekraeftedeDagIds.has(day.id)
                  const orders = kørselOrders[day.id] ?? []
                  const params = kørselParams[day.id] ?? DEFAULT_KØRSEL_PARAMS
                  const singleLoadCapacity = orders.reduce((sum, o) => {
                    const vt = VEHICLE_TYPES.find(v => v.label === o.type)
                    return sum + (vt ? vt.tons * o.antal : 0)
                  }, 0)
                  const totalTrucks = orders.reduce((s, o) => s + o.antal, 0)
                  // Køretid = Google Maps-køreafstand (km × 1 min) + 10% buffer (reel kørsel vs. Google-estimat).
                  // FUNCTIONAL_FLOWS Flow 1, Trin 1 (Bilbehov-dashboard): +10% er kanonisk køretid og slår
                  // igennem i ALLE afledte tal (Afstand, Rundtid, Anbefalet).
                  const koeretidMin = Math.round(factoryKm * 1.1)
                  // Rundtid = 2× køretid + 15 min læsning + 15 min aflæsning
                  const roundTime = koeretidMin * 2 + 30
                  const [rsh, rsm] = (params.firstLoadTime || '07:00').split(':').map(Number)
                  const workEndMinutes = 15 * 60 + 30 // 15:30
                  const roundsPerTruck = Math.max(0, Math.floor((workEndMinutes - (rsh * 60 + rsm)) / roundTime))

                  // effective tons = planlagt + evt. ekstra fra PLAN
                  const dayTons = getEffectiveTons(day)

                  function updateOrder(id: string, field: 'type' | 'antal' | 'afregning_type', value: string | number) {
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
                    <div key={day.id} className={i < shownDays.length - 1 || isExpanded ? 'border-b border-hairline' : ''}>
                      {/* Hoved-række */}
                      <div className={`grid items-center gap-md px-sm py-sm transition-colors ${!isExpanded ? 'hover:bg-[#F5F5F5]' : ''}`}
                        style={{ gridTemplateColumns: '1fr auto' }}>
                        <div>
                          <p className="font-inter text-sm font-medium text-text-primary">
                            {formatWeekday(day.date)} · {formatLongDate(day.date)}
                          </p>
                          {/* effective tons = planlagt + evt. ekstra fra PLAN */}
                          <p className="font-inter text-xs text-text-muted">{dayTons} tons</p>
                        </div>
                        <div className="flex items-center gap-xxxs">
                          {isPlanlagt && !isExpanded ? (
                            <div className="flex items-center gap-xs flex-wrap justify-end">
                              <span className="inline-flex items-center gap-sm px-sm py-xxxs rounded-lg bg-[#E7F4EE] font-inter text-xs font-medium text-text-primary whitespace-nowrap">
                                <span>{orders.reduce((s, o) => s + o.antal, 0)} biler bestilt</span>
                                {/* Multi-produkt: vis "Multi-produkt" i stedet for ét sæt tal */}
                                {(() => {
                                  const dagProdukter = products.filter(p => p.days.some(d => d.date === day.date))
                                  if (dagProdukter.length >= 2) {
                                    return (
                                      <>
                                        <span className="text-text-muted">·</span>
                                        <span>{dagProdukter.length} produkter · per-produkt interval</span>
                                      </>
                                    )
                                  }
                                  return (
                                    <>
                                      <span className="text-text-muted">·</span>
                                      <span>Interval {params.intervalMinutes != null ? `${params.intervalMinutes} min` : '–'}</span>
                                      <span className="text-text-muted">·</span>
                                      <span>Første læs {params.firstLoadTime || '–'}</span>
                                    </>
                                  )
                                })()}
                              </span>
                              {/* Vognmand status badge — 3-state: Planlagt / Sendt til vognmand / Bekræftet */}
                              {erBekraeftet ? (
                                // downstream/Udførsel-tilstand — ikke seedet i planlægnings-demoen
                                <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good font-inter text-xs font-semibold text-white whitespace-nowrap">
                                  Bekræftet vognmand
                                </span>
                              ) : sendtTilVognmandDates.has(day.date) ? (
                                <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-yellow/25 font-inter text-xs font-semibold text-[#8A6A00] whitespace-nowrap">
                                  Sendt til vognmand
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-[#F5F5F5] font-inter text-xs font-semibold text-text-muted whitespace-nowrap">
                                  Planlagt
                                </span>
                              )}
                              {/* Ret-knap skjules når dagen er bekræftet af vognmand (FUNCTIONAL_FLOWS Trin 2) */}
                              {!erBekraeftet && (
                                <div className="flex">
                                  <button
                                    onClick={() => setKørselExpandedId(day.id)}
                                    className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-lg border border-hairline font-inter text-xs font-medium text-dark-teal hover:bg-surface-2 transition-colors whitespace-nowrap min-h-touch"
                                  >
                                    Ret
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (isExpanded) {
                                  gemKørsel(day.id)
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
                        <div className="mx-sm mb-lg rounded-xl border border-dark-teal/20 bg-soft-aqua shadow-sm flex flex-col gap-md p-md">

                          {/* Bilbehov — read-only beregningsoverblik (FLYTTET ØVERST 2026-06-15). FUNCTIONAL_FLOWS Flow 1, Trin 1 — LÅST 2026-06-10 */}
                          {orders.length > 0 && (() => {
                            const harBiler = totalTrucks > 0 && singleLoadCapacity > 0
                            // avgTons fra de faktisk valgte biler; 30 = synligt fallback (FF Flow 1 Trin 1, præcisering 2026-06-15)
                            const avgTons = harBiler ? Math.round(singleLoadCapacity / totalTrucks) : 30
                            const recommended = roundsPerTruck > 0 ? Math.ceil(dayTons / (avgTons * roundsPerTruck)) : 0
                            // Kapacitet-dækket: valgte bilers kapacitet over dagen = kapacitet/runde × runder pr. bil
                            const totalCapacity = singleLoadCapacity * roundsPerTruck
                            const capacityOk = harBiler && totalCapacity >= dayTons
                            const tonsMangler = Math.max(0, dayTons - totalCapacity)
                            const dagProdukter = products
                              .map(p => ({ product: p, dayEntry: p.days.find(d => d.date === day.date) }))
                              .filter((x): x is { product: MockProduct; dayEntry: DayPlan } => !!x.dayEntry)
                            // Forventet sidste bil pr. produkt — KRÆVER kendt starttid + interval (FF Flow 1 Trin 1, 2026-06-15).
                            // Samme biler kører alle produkter sekventielt. P1: starttid = første bils starttid (startTider[0])
                            // + dag-interval (params.intervalMinutes). P2+: egen starttid (fx pause til maskinflytning) + eget
                            // interval — tidligst når forrige produkts biler er fri (max); 'direkte i forlængelse' → forrige slut.
                            // startMin = null når input mangler → slut = null → boksen udfyldes ikke for det produkt.
                            let cursorMin: number | null = null
                            const slutPerProdukt = dagProdukter.map(({ product, dayEntry }, pi) => {
                              const tons = getEffectiveTons(dayEntry)
                              const runder = harBiler ? Math.ceil(tons / singleLoadCapacity) : 0
                              let startMin: number | null = null
                              if (pi === 0) {
                                // Produkt 1: kræver første bils starttid + dag-interval
                                const t0 = (startTider[day.id] ?? [null, null, null])[0]
                                if (t0 && params.intervalMinutes != null) {
                                  const [h, m] = t0.split(':').map(Number)
                                  startMin = h * 60 + m
                                }
                              } else {
                                const pp = produktKørselParams[`${product.id}__${day.id}`]
                                if (pp?.foersteLaesPaaPlads) {
                                  // Egen starttid — kræver eget interval; tidligst når forrige biler er fri
                                  if (pp.intervalMin != null) {
                                    const [h, m] = pp.foersteLaesPaaPlads.split(':').map(Number)
                                    const egen = h * 60 + m
                                    startMin = cursorMin != null ? Math.max(egen, cursorMin) : egen
                                  }
                                } else {
                                  // 'Direkte i forlængelse' — kendt hvis forrige produkt er kendt
                                  startMin = cursorMin
                                }
                              }
                              const slut = (harBiler && startMin != null) ? startMin + runder * roundTime : null
                              cursorMin = slut
                              return { product, slut }
                            })
                            const nogenKendt = slutPerProdukt.some(s => s.slut != null)
                            const fmtTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`
                            return (
                              <div>
                                <div className="flex items-center gap-sm mb-xs flex-wrap">
                                  <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest">Bilbehov</p>
                                  <span className="inline-flex items-center gap-xxxs font-inter text-xxs text-text-muted">
                                    <Info size={13} className="text-light-aqua" />
                                    Beregnet ud fra tonnage, fabrik og rundtid
                                  </span>
                                  {/* Kapacitet-dækket-indikator — grøn når valgte biler dækker forventet tons (genindført 2026-06-15) */}
                                  <span className={`inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md border font-inter text-xxs font-semibold ${capacityOk ? 'bg-good-bg border-good/30 text-good' : 'bg-bad-bg border-bad/30 text-bad'}`}>
                                    <span className={`w-xxxs h-xxxs rounded-full flex-shrink-0 ${capacityOk ? 'bg-good' : 'bg-bad'}`} />
                                    {capacityOk ? 'Kapacitet dækket' : `${tonsMangler} Tons mangler`}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-xs">
                                  {/* Forventet tons (inkl. ekstra-bestilling fra PLAN) */}
                                  <div className="bg-white border border-hairline rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Forventet tons</span>
                                    <span className="font-poppins text-xl font-bold text-deep-teal tabular-nums leading-none mt-auto">{dayTons}<span className="font-inter text-xs font-medium text-text-muted ml-xxxs">Tons</span></span>
                                    <span className="font-inter text-xxs text-text-muted">incl. ekstra bestilling</span>
                                  </div>
                                  {/* Anbefalet */}
                                  <div className="bg-white border border-hairline rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Anbefalet</span>
                                    <span className="font-poppins text-xl font-bold text-deep-teal tabular-nums leading-none mt-auto">{recommended}<span className="font-inter text-xs font-medium text-text-muted ml-xxxs">biler</span></span>
                                    <span className="font-inter text-xxs text-text-muted">{harBiler ? `á gns. ${avgTons} Tons` : `antaget gns. ${avgTons} Tons`}</span>
                                  </div>
                                  {/* Runder */}
                                  <div className="bg-white border border-hairline rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Runder</span>
                                    <span className="font-poppins text-xl font-bold text-deep-teal tabular-nums leading-none mt-auto">{roundsPerTruck}<span className="font-inter text-xs font-medium text-text-muted ml-xxxs">pr. bil</span></span>
                                    <span className="font-inter text-xxs text-text-muted">{roundTime} Minutter pr. runde</span>
                                  </div>
                                  {/* Afstand til fabrik (Google Maps + 10%) */}
                                  <div className="bg-white border border-hairline rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Afstand til fabrik</span>
                                    <span className="font-poppins text-xl font-bold text-deep-teal tabular-nums leading-none mt-auto">{factoryKm}<span className="font-inter text-xs font-medium text-text-muted ml-xxxs">km</span></span>
                                    <span className="font-inter text-xxs text-text-muted">{koeretidMin} Minutter køretur</span>
                                  </div>
                                  {/* Forventet sidste bil (genbrug af vejesedler-prognose) */}
                                  <div className="bg-white border border-hairline rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Forventet sidste bil</span>
                                    {!harBiler ? (
                                      <span className="font-inter text-xs text-text-muted mt-auto">Vælg biler først</span>
                                    ) : !nogenKendt ? (
                                      <span className="font-inter text-xs text-text-muted mt-auto leading-snug">Afventer starttider og interval</span>
                                    ) : (
                                      <div className="flex flex-col gap-xxs mt-auto">
                                        {slutPerProdukt.map((s, i) => (
                                          <div key={s.product.id} className="flex items-center gap-xs">
                                            <span className="font-inter text-xxs font-bold text-white bg-deep-teal rounded-sm px-xxxs tracking-wide">P{i + 1}</span>
                                            <span className="font-poppins text-md font-bold text-deep-teal tabular-nums leading-none">{s.slut != null ? fmtTime(s.slut) : '–'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}

                          <hr className="border-hairline" />

                          {/* Vognmand + Afregning — på én række */}
                          <div className="flex items-end gap-sm">
                            {/* Vognmand */}
                            <div className="flex-1">
                              <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Vognmand</p>
                              <select
                                value={dagVognmand[day.id] ?? DEFAULT_VOGNMAND_ID}
                                onChange={e => setDagVognmand(prev => ({ ...prev, [day.id]: e.target.value }))}
                                className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                              >
                                {MOCK_VOGNMAEND.map(vm => (
                                  <option key={vm.id} value={vm.id}>{vm.navn}{vm.id === DEFAULT_VOGNMAND_ID ? ' (primær)' : ''}</option>
                                ))}
                              </select>
                            </div>

                            {/* Afregning */}
                            <div>
                              <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Afregning</p>
                              {/* Segmented control — samme mønster som Produkt 2+ direktekørsel-toggle */}
                              <div className="flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit">
                                {(['akkord', 'time'] as const).map(type => {
                                  const isActive = (dagAfregning[day.id] ?? 'akkord') === type
                                  const label = type === 'akkord' ? 'Akkord' : 'Timeløn'
                                  return (
                                    <button
                                      key={type}
                                      onClick={() => setDagAfregning(prev => ({ ...prev, [day.id]: type }))}
                                      aria-pressed={isActive}
                                      className={[
                                        'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                                        isActive
                                          ? 'bg-dark-teal text-white'
                                          : 'text-text-muted hover:bg-soft-aqua',
                                      ].join(' ')}
                                    >
                                      {label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Biler — vognmandens flåde (kompakt liste) */}
                          <div>
                            <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-xxxs">Biler — vognmandens flåde</p>
                            {/* Hver bestilt bil får et unikt bil-ordrenummer (ordrenr-DDMMYY-NN, løbenr pr. dag) der
                                sendes til vognmanden — som behandler hver bil som en separat ordre. LÅST 2026-06-13. */}
                            <p className="font-inter text-xxs text-text-muted mb-xs">Hver bil sendes som separat ordre med eget nummer til vognmanden.</p>
                            {orders.length > 0 && (
                              <div className="rounded-lg border border-hairline overflow-hidden bg-white">
                                {orders.map((o, idx) => {
                                  const vt = VEHICLE_TYPES.find(v => v.label === o.type)
                                  return (
                                    <div
                                      key={o.id}
                                      className={idx < orders.length - 1 ? 'border-b border-hairline' : ''}
                                    >
                                      <div
                                        className="grid items-center gap-xs px-xs"
                                        style={{ gridTemplateColumns: '2rem 1fr 5.625rem 4rem 7.5rem 2rem' }}
                                      >
                                        <span className="w-8 h-8 rounded-md bg-soft-aqua text-deep-teal flex items-center justify-center flex-shrink-0">
                                          <Truck size={16} />
                                        </span>
                                        {/* Biltype — én linje */}
                                        <div className="min-w-0 py-xs">
                                          <select
                                            value={o.type}
                                            onChange={e => updateOrder(o.id, 'type', e.target.value)}
                                            className="min-w-0 font-inter text-xs font-medium text-text-primary bg-transparent border-none outline-none cursor-pointer focus:text-deep-teal"
                                          >
                                            <option value="">Vælg biltype</option>
                                            <option value="Egen bil">Egen bil</option>
                                            {VEHICLE_TYPES.map(v => (
                                              <option key={v.label} value={v.label}>{v.label} · {v.tons} Tons</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex items-center border border-hairline rounded-md overflow-hidden bg-white">
                                          <button onClick={() => updateOrder(o.id, 'antal', Math.max(1, o.antal - 1))} className="w-8 h-8 font-inter text-sm text-text-muted hover:bg-soft-aqua transition-colors" aria-label="Færre">−</button>
                                          <span className="px-xxs font-inter text-xs font-semibold text-text-primary w-[26px] text-center tabular-nums">{o.antal}</span>
                                          <button onClick={() => updateOrder(o.id, 'antal', o.antal + 1)} className="w-8 h-8 font-inter text-sm text-text-muted hover:bg-soft-aqua transition-colors" aria-label="Flere">+</button>
                                        </div>
                                        <span className="font-poppins text-xs font-semibold text-deep-teal tabular-nums w-[64px] text-right whitespace-nowrap">
                                          {vt ? vt.tons * o.antal : 0} Tons
                                        </span>
                                        {/* Per-række afregnings-toggle — arver dag-default, sticky override ved klik.
                                            FF-regel: Egen bil = altid timeløn (disabled). Placeret som selvst. grid-kolonne til højre for Tons. */}
                                        {(() => {
                                          const isEgenBil = o.type === 'Egen bil'
                                          const rowAfr: 'akkord' | 'time' = isEgenBil
                                            ? 'time'
                                            : (o.afregning_type ?? (dagAfregning[day.id] ?? 'akkord'))
                                          return (
                                            <div className={['flex bg-surface-2 rounded-md p-xxxs border border-hairline justify-self-end', isEgenBil ? 'opacity-60' : ''].join(' ').trim()}>
                                              {(['akkord', 'time'] as const).map(type => {
                                                const isActive = rowAfr === type
                                                const label = type === 'akkord' ? 'Akkord' : 'Timeløn'
                                                return (
                                                  <button
                                                    key={type}
                                                    disabled={isEgenBil}
                                                    onClick={() => !isEgenBil && updateOrder(o.id, 'afregning_type', type)}
                                                    aria-pressed={isActive}
                                                    className={[
                                                      'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                                                      isActive
                                                        ? 'bg-dark-teal text-white'
                                                        : 'text-text-muted hover:bg-soft-aqua',
                                                      isEgenBil ? 'cursor-not-allowed' : '',
                                                    ].join(' ')}
                                                  >
                                                    {label}
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          )
                                        })()}
                                        <button onClick={() => removeOrder(o.id)} className="w-8 h-8 rounded-md text-text-muted hover:bg-bad-bg hover:text-bad flex items-center justify-center transition-colors" aria-label="Fjern">
                                          <X size={15} />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            <button
                              onClick={addOrder}
                              className="inline-flex items-center gap-xs font-inter text-xs font-semibold text-dark-teal bg-white border border-dashed border-light-aqua rounded-full px-sm py-xs hover:bg-soft-aqua hover:border-dark-teal transition-colors mt-xs"
                            >
                              <Plus size={15} />
                              Tilføj biltype
                            </button>
                          </div>

                          {/* Starttider og intervaller — produkter stablet LODRET med connector (skalerer til 3+) */}
                          {orders.length > 0 && (() => {
                            const dagProdukter = products
                              .map(p => ({ product: p, dayEntry: p.days.find(d => d.date === day.date) }))
                              .filter((x): x is { product: MockProduct; dayEntry: DayPlan } => !!x.dayEntry)
                            if (dagProdukter.length === 0) return null
                            const availableTypes = Array.from(new Set(orders.filter(o => o.antal > 0).map(o => o.type)))
                            return (
                              <>
                                <hr className="border-hairline" />
                                <div>
                                  <h4 className="font-poppins text-lg font-semibold text-deep-teal">Starttider og intervaller</h4>
                                  <p className="font-inter text-xs text-text-muted mb-sm">Anbefaling til vognmand for de første biler. Ikke bindende — vognmand kan afvige.</p>
                                  <div className="flex flex-col">
                                    {dagProdukter.map(({ product, dayEntry }, pi) => {
                                      const tons = getEffectiveTons(dayEntry)
                                      const isFirst = pi === 0
                                      return (
                                        <div key={product.id}>
                                          {/* Lodret connector — mellem stablede produkter */}
                                          {!isFirst && (
                                            <div className="flex flex-col items-center py-xxs">
                                              <span className="w-px h-xs bg-light-aqua" />
                                              <span className="w-7 h-7 rounded-full bg-deep-teal text-white flex items-center justify-center shadow-md">
                                                <ArrowDown size={15} />
                                              </span>
                                              <span className="w-px h-xs bg-light-aqua" />
                                            </div>
                                          )}
                                          <div className="bg-white border border-hairline rounded-lg p-sm">
                                            {/* Samlet blød pille: Produkt N · navn · tons */}
                                            <div className="mb-sm">
                                              <span className="inline-flex items-center bg-soft-aqua rounded-full px-sm py-xxs font-inter text-xs">
                                                <span className="font-semibold text-deep-teal">Produkt {pi + 1}</span>
                                                <span className="text-light-aqua mx-xxs">·</span>
                                                <span className="font-poppins font-semibold text-text-primary">{product.recipeName}</span>
                                                <span className="text-light-aqua mx-xxs">·</span>
                                                <span className="font-poppins font-semibold text-deep-teal tabular-nums">{tons} Tons</span>
                                              </span>
                                            </div>

                                            {isFirst ? (
                                              /* Produkt 1: start-rækkefølge (3 første biler) + interval */
                                              <div className="flex flex-col gap-xs">
                                                {([0, 1, 2] as const).map(pos => {
                                                  const currentValue = (startRaekkefoelge[day.id] ?? [null, null, null])[pos]
                                                  const currentTid = (startTider[day.id] ?? [null, null, null])[pos]
                                                  return (
                                                    <div key={pos} className="grid gap-xs items-end" style={{ gridTemplateColumns: '1fr 130px' }}>
                                                      <div className="min-w-0">
                                                        <p className="font-inter text-xxs text-text-muted mb-xxxs">Bil nr. {pos + 1}</p>
                                                        <select
                                                          value={currentValue ?? ''}
                                                          onChange={e => updateStartRaekkefoelge(day.id, pos, e.target.value || null)}
                                                          className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                                        >
                                                          <option value="">Ingen anbefaling</option>
                                                          {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                      </div>
                                                      <div>
                                                        <p className="font-inter text-xxs text-text-muted mb-xxxs">Starttid plads</p>
                                                        <input
                                                          type="time"
                                                          value={currentTid ?? ''}
                                                          onChange={e => updateStartTid(day.id, pos, e.target.value || null)}
                                                          className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                                        />
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                                <div className="grid gap-xs items-end" style={{ gridTemplateColumns: '1fr 130px' }}>
                                                  <p className="font-inter text-xxs font-semibold text-text-secondary text-right pb-xs">Herefter — interval</p>
                                                  <div>
                                                    <p className="font-inter text-xxs text-text-muted mb-xxxs">Minutter</p>
                                                    <input
                                                      type="number"
                                                      min={1}
                                                      value={params.intervalMinutes ?? ''}
                                                      onChange={e => updateParam('intervalMinutes', e.target.value === '' ? undefined : Math.max(1, parseInt(e.target.value) || 1))}
                                                      className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs tabular-nums focus:outline-none focus:border-dark-teal [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              /* Produkt 2+: kobling til forrige produkt */
                                              (() => {
                                                const ppKey = `${product.id}__${dayEntry.id}`
                                                const pp = produktKørselParams[ppKey] ?? { foersteLaesPaaPlads: null, intervalMin: null }
                                                const erDirekte = pp.foersteLaesPaaPlads === null
                                                const defaultTidVedNej = (): string => {
                                                  const prev = dagProdukter[pi - 1]
                                                  const prevKey = `${prev.product.id}__${prev.dayEntry.id}`
                                                  const prevTid = produktKørselParams[prevKey]?.foersteLaesPaaPlads
                                                  if (prevTid) {
                                                    const [h, m] = prevTid.split(':').map(Number)
                                                    const t = h * 60 + m + 120
                                                    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
                                                  }
                                                  return '10:00'
                                                }
                                                return (
                                                  <div className="flex flex-col gap-sm">
                                                    <div className="flex items-center gap-sm flex-wrap">
                                                      <span className="font-inter text-xs text-text-secondary">
                                                        Køres <b className="text-text-primary font-semibold">direkte i forlængelse</b> af Produkt {pi}?
                                                      </span>
                                                      <div className="flex bg-white border border-hairline rounded-md p-xxxs gap-xxxs">
                                                        <button
                                                          onClick={() => updateProduktKørsel(product.id, dayEntry.id, 'foersteLaesPaaPlads', null)}
                                                          aria-pressed={erDirekte}
                                                          className={['px-sm py-xxxs rounded-sm font-inter text-xs font-semibold transition-colors', erDirekte ? 'bg-deep-teal text-white' : 'text-text-muted hover:bg-soft-aqua'].join(' ')}
                                                        >Ja</button>
                                                        <button
                                                          onClick={() => updateProduktKørsel(product.id, dayEntry.id, 'foersteLaesPaaPlads', defaultTidVedNej())}
                                                          aria-pressed={!erDirekte}
                                                          className={['px-sm py-xxxs rounded-sm font-inter text-xs font-semibold transition-colors', !erDirekte ? 'bg-deep-teal text-white' : 'text-text-muted hover:bg-soft-aqua'].join(' ')}
                                                        >Nej</button>
                                                      </div>
                                                    </div>
                                                    {erDirekte ? (
                                                      <div className="flex items-center gap-xs font-inter text-xs text-text-muted">
                                                        <ArrowDown size={14} className="text-light-aqua flex-shrink-0" />
                                                        Kører direkte efter Produkt {pi} — ingen separat starttid nødvendig.
                                                      </div>
                                                    ) : (
                                                      <div className="grid grid-cols-2 gap-xs">
                                                        <div>
                                                          <p className="font-inter text-xxs text-text-muted mb-xxxs">Starttid plads</p>
                                                          <input
                                                            type="time"
                                                            value={pp.foersteLaesPaaPlads ?? ''}
                                                            onChange={e => updateProduktKørsel(product.id, dayEntry.id, 'foersteLaesPaaPlads', e.target.value || null)}
                                                            className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                                          />
                                                        </div>
                                                        <div>
                                                          <p className="font-inter text-xxs text-text-muted mb-xxxs">Interval</p>
                                                          <div className="flex items-center bg-white border border-hairline rounded-lg px-xs py-xs focus-within:border-dark-teal">
                                                            <input
                                                              type="number"
                                                              min={1}
                                                              value={pp.intervalMin ?? ''}
                                                              onChange={e => updateProduktKørsel(product.id, dayEntry.id, 'intervalMin', e.target.value === '' ? null : Math.max(1, parseInt(e.target.value) || 1))}
                                                              className="w-full font-inter text-xs text-text-primary bg-transparent border-none outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                            <span className="font-inter text-xxs text-text-muted ml-xs">Minutter</span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )
                                              })()
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </>
                            )
                          })()}

                          {/* Kommentar til chauffør — sendes med ordren til chauffør-appen (se FUNCTIONAL_FLOWS Flow 1 Trin 8) */}
                          <div className="flex flex-col gap-xxxs">
                            <label className="font-inter text-xxs text-text-muted">Kommentar til chauffør</label>
                            <textarea
                              value={kørselKommentar[day.id] ?? ''}
                              onChange={e => setKørselKommentar(prev => ({ ...prev, [day.id]: e.target.value }))}
                              rows={2}
                              placeholder="Fx 'Brug bagvejen', 'Aflæsningssted flyttet 50m mod vest', 'Støjrestriktion efter 22'..."
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
                              onClick={() => gemKørsel(day.id)}
                              className="font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90"
                            >Gem kørsel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Send til vognmand — section-level afledt tilstand.
                    Vises KUN når der er mindst én planlagt dag.
                    Gul = usendte planlagte dage findes; grøn = alle planlagte dage er sendt.
                    Klik sender ALLE usendte planlagte dage (allerede-sendte røres ikke).
                    TODO: Erstat med Supabase når klar — insert i vognmand_bestilling-tabel */}
                {(() => {
                  const planlagteDage = activeDays.filter(d => kørselPlanlagtIds.has(d.id))
                  if (planlagteDage.length === 0) return null
                  const usendteDage = planlagteDage.filter(d => !sendtTilVognmandDates.has(d.date))
                  const harUsendte = usendteDage.length > 0
                  return (
                    <div className="border-t border-hairline px-sm py-sm flex items-center justify-between">
                      {harUsendte ? (
                        <button
                          type="button"
                          onClick={() => setSendtTilVognmandDates(prev => new Set([...prev, ...usendteDage.map(d => d.date)]))}
                          className="inline-flex items-center font-inter text-sm font-semibold text-deep-teal bg-yellow px-sm py-xs rounded-lg hover:opacity-90 active:scale-[0.98] transition-all min-h-[44px]"
                        >
                          Send til vognmand
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center font-inter text-sm font-semibold text-white bg-good px-sm py-xs rounded-lg min-h-[44px] cursor-default"
                        >
                          Sendt til vognmand
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

          {/* ── Materiel ─────────────────────────────────────────── */}
          <section>
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Materiellevering</h2>

            {/* Ny-etape container-niveau notifikation.
                NOTE: MaterielNyEtapeTilstand (presenter) indeholder allerede et internt
                warn-bg-banner med samme budskab ("Planlæg materiel-transport for etape N").
                Det banner er synligt øverst i presenter-kortet, umiddelbart under denne
                overskrift — et yderligere container-banner her ville være redundant.
                Vi stoler på presenter-banneret og tilføjer i stedet kun en diskret
                sektion-label-tilføjelse via mb-justering nedenfor.
                Kilde: Round 4b-opgave, kriterium (b). */}
            {!isSamleordreMode && materielUiState === 'ny-etape' && (
              <p className="font-inter text-xs text-text-muted mb-xs">
                Ny etape planlagt — materiel-transport skal planlægges
              </p>
            )}

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
                              <div className="w-9 h-9 rounded-md bg-soft-aqua flex items-center justify-center text-deep-teal">
                                <Truck size={16} />
                              </div>
                              <div>
                                <p className="font-inter text-sm font-medium text-text-primary">{r.description}</p>
                                <div className="flex items-center gap-xs mt-xxxs">
                                  <span className="font-inter text-xs text-text-muted tabular-nums">{r.plantNumber}</span>
                                </div>
                              </div>
                              <div>
                                {/* Vognmand status badge — 3-state — re-keyed til transportKey(resourceId, etapeId) (Round 4a). */}
                                {(() => {
                                  const etapeId = aktivEtape?.id ?? 0
                                  const key = transportKey(r.id, etapeId)
                                  if (r.status !== 'planlagt') {
                                    return (
                                      <span className="inline-flex items-center px-xs py-xxxs rounded-lg font-inter text-xs font-semibold whitespace-nowrap bg-surface-2 text-text-muted">
                                        Ikke planlagt
                                      </span>
                                    )
                                  }
                                  if (bekraeftedeEnhederIds.has(key)) {
                                    return (
                                      <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good-bg font-inter text-xs font-semibold text-good whitespace-nowrap">
                                        Bekræftet vognmand
                                      </span>
                                    )
                                  }
                                  if (materielSendteEnhederIds.has(key)) {
                                    return (
                                      <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-warn-bg font-inter text-xs font-semibold text-text-secondary whitespace-nowrap">
                                        Sendt til vognmand
                                      </span>
                                    )
                                  }
                                  return (
                                    <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-surface-2 font-inter text-xs font-semibold text-text-muted whitespace-nowrap">
                                      Planlagt
                                    </span>
                                  )
                                })()}
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

            {/* Normal mode: etape-bevidste presentere (Round 4a) */}
            {!isSamleordreMode && (() => {
              // Brancher på materielUiState — afledt af selectedPlanDate + etaper
              if (materielUiState === 'planlaeg' && aktivEtape) {
                return (
                  <>
                    <MaterielPlanlaegTilstand
                      resources={materielResources}
                      etape={aktivEtape}
                      transportPlaner={transportPlaner}
                      onChange={(resourceId, patch) =>
                        handleTransportChange(resourceId, aktivEtape.id, patch)
                      }
                      onGem={(resourceId) =>
                        markTransportPlanlagt(resourceId, aktivEtape.id)
                      }
                      onSend={() => handleMaterielSend(aktivEtape)}
                    />
                    <button
                      type="button"
                      onClick={() => { setTilfoejMaterielOpen(true); setMaterielSoeg('') }}
                      className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border border-hairline rounded-xl bg-surface hover:bg-surface-2 transition-colors mt-xxxs"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Tilføj materiel
                    </button>
                  </>
                )
              }
              if (materielUiState === 'ny-etape' && aktivEtape) {
                return (
                  <>
                    <MaterielNyEtapeTilstand
                      resources={materielResources}
                      etape={aktivEtape}
                      transportPlaner={transportPlaner}
                      onChange={(resourceId, patch) =>
                        handleTransportChange(resourceId, aktivEtape.id, patch)
                      }
                      onGem={(resourceId) =>
                        markTransportPlanlagt(resourceId, aktivEtape.id)
                      }
                      onSend={() => handleMaterielSend(aktivEtape)}
                    />
                    <button
                      type="button"
                      onClick={() => { setTilfoejMaterielOpen(true); setMaterielSoeg('') }}
                      className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border border-hairline rounded-xl bg-surface hover:bg-surface-2 transition-colors mt-xxxs"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Tilføj materiel
                    </button>
                  </>
                )
              }
              if (materielUiState === 'paa-pladsen' && aktivEtape) {
                return (
                  <MaterielPaaPladsenTilstand
                    resources={materielResources}
                    etape={aktivEtape}
                    transportPlaner={transportPlaner}
                  />
                )
              }
              // dvale (gap mellem etaper eller dag uden etape)
              const naestEtape = etaper.find(e => e.firstDay > selectedPlanDate)
              return (
                <MaterielDvaleTilstand
                  naestEtapeStartDato={naestEtape?.firstDay}
                />
              )
            })()}

          </section>

          </div>
          )}

          {activeMode === 'udfoersel' && (
            <UdfoerselContent
              forundersoegelseFotos={photos.filter(p => p.source === 'forundersoegelse')}
              onAddPhotos={(newPhotos) => setPhotos(prev => [...prev, ...newPhotos])}
              // Bekræftelsen følger den valgte dato-pille — dashboardet hænger sammen med datoen (LÅST 2026-06-13).
              // Hver dag har sin egen vognmand-bekræftelse; matcher selectedDate ingen aktiv dag → undefined (= "Afventer").
              vognmandBekraeftelse={(() => {
                const d = activeDays.find(day => day.date === selectedPlanDate)
                return d ? vognmandBekraeftelser[d.id] : undefined
              })()}
              vognmandMaterielBekraeftelse={vognmandMaterielBekraeftelse}
              products={products}
              isSamleordreMode={isSamleordreMode}
              samleordreCtx={samleordreCtx}
              samleordreTabOrderNr={samleordreTabOrderNr}
              makeOrdredetaljerCard={makeOrdredetaljerCard}
              renderOrdredetaljerCollapsedPille={renderOrdredetaljerCollapsedPille}
              selectedDate={selectedPlanDate}
              onSelectDate={setSelectedPlanDate}
              ekstraLinjer={ekstraLinjer}
              setEkstraLinjer={setEkstraLinjer}
              ekstraSent={ekstraSent}
              setEkstraSent={setEkstraSent}
              materielUiState={materielUiState}
              etaper={etaper}
              transportPlaner={transportPlaner}
            />
          )}

          {activeMode === 'afregning' && (
            <AfregningContent
              vognmandBekraeftelse={(() => {
                // Følger valgt dato-pille — identisk mønster som UdfoerselContent (LÅST 2026-06-22).
                const afrDay = activeDays.find(d => d.date === selectedPlanDate) ?? activeDays[0]
                return afrDay ? vognmandBekraeftelser[afrDay.id] : undefined
              })()}
              vognmandMaterielBekraeftelse={vognmandMaterielBekraeftelse}
              todayDay={activeDays.find(d => d.date === selectedPlanDate) ?? activeDays[0]}
              biltypeAfregning={(() => {
                // Fase 2: udled biltype→afregningsform fra Planlægningens kørselOrders for afregningsdagen.
                // Slår igennem i AfregningContent som base-form pr. bil (ovenpå: materiel + 1,5-times-override).
                // TODO: Erstat med Supabase når klar — afregningsform pr. biltype gemmes på kørselordre-rækken
                const afrDay = activeDays.find(d => d.date === selectedPlanDate) ?? activeDays[0]
                const dayId = afrDay?.id
                if (!dayId) return {}
                const map: Record<string, 'time' | 'akkord'> = {}
                for (const o of kørselOrders[dayId] ?? []) {
                  map[o.type] = o.type === 'Egen bil' ? 'time' : (o.afregning_type ?? dagAfregning[dayId] ?? 'akkord')
                }
                return map
              })()}
              isSamleordreMode={isSamleordreMode}
              samleordreCtx={samleordreCtx}
              samleordreTabOrderNr={samleordreTabOrderNr}
              recept={recept}
              tonsAnkommet={tonsAnkommet}
              forventetUdlagtM2={forventetUdlagtM2}
              faktiskRegistrering={faktiskRegistrering}
              visUdlaegningInput={visUdlaegningInput}
              onSetVisUdlaegningInput={setVisUdlaegningInput}
              onGemFaktisk={gemFaktisk}
              demoTonsIDag={DEMO_TONS_I_DAG}
              demoArealIDag={DEMO_AREAL_I_DAG}
              demoTykkelse={DEMO_TYKKELSE}
              makeOrdredetaljerCard={makeOrdredetaljerCard}
              renderOrdredetaljerCollapsedPille={renderOrdredetaljerCollapsedPille}
              products={products}
              selectedDate={selectedPlanDate}
              onSelectDate={setSelectedPlanDate}
              harEkstraarbejde={ekstraSent && ekstraLinjer.length > 0}
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

      {/* ── Tilføj materiel-modal ─────────────────────────────────── */}
      {tilfoejMaterielOpen && (() => {
        const soegLower = materielSoeg.toLowerCase()
        const filtered = STANDARD_MATERIEL_KATALOG.filter(m =>
          m.description.toLowerCase().includes(soegLower) ||
          m.plantNumber.toLowerCase().includes(soegLower)
        )
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tilfoej-materiel-modal-title"
          >
            {/* Luk på klik udenfor */}
            <button
              type="button"
              aria-label="Luk dialog"
              onClick={() => setTilfoejMaterielOpen(false)}
              className="absolute inset-0 bg-deep-teal/40"
            />
            <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-md flex flex-col gap-md p-lg max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between gap-sm">
                <h2
                  id="tilfoej-materiel-modal-title"
                  className="font-poppins font-semibold text-lg text-deep-teal leading-tight"
                >
                  Tilføj materiel
                </h2>
                <button
                  type="button"
                  aria-label="Luk"
                  onClick={() => setTilfoejMaterielOpen(false)}
                  className="flex items-center justify-center w-[44px] h-[44px] rounded-xl border border-hairline text-text-muted hover:text-text-primary hover:border-hairline-2 transition-colors"
                >
                  ✕
                </button>
              </div>
              {/* Søgefelt */}
              <input
                type="search"
                placeholder="Søg på navn eller anlægsnr."
                value={materielSoeg}
                onChange={e => setMaterielSoeg(e.target.value)}
                className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-lg px-sm py-xs focus:outline-none focus:border-deep-teal transition-colors"
              />
              {/* Katalog-liste */}
              <div className="flex flex-col divide-y divide-hairline overflow-y-auto -mx-lg px-lg">
                {filtered.length === 0 && (
                  <p className="font-inter text-sm text-text-muted py-sm text-center">Ingen maskiner matcher søgningen.</p>
                )}
                {filtered.map(mat => (
                  <button
                    key={mat.plantNumber}
                    type="button"
                    onClick={() => {
                      setResources(prev => [...prev, {
                        id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        plantNumber: mat.plantNumber,
                        description: mat.description,
                        transportTag: mat.transportTag,
                        status: 'ikke-planlagt',
                      }])
                      setTilfoejMaterielOpen(false)
                    }}
                    className="flex items-center justify-between gap-sm py-xs min-h-[44px] text-left hover:bg-surface-2 transition-colors rounded-lg -mx-xs px-xs"
                  >
                    <div className="flex flex-col gap-xxs min-w-0">
                      <span className="font-inter text-sm font-semibold text-text-primary truncate">{mat.description}</span>
                      <span className="font-inter text-xxs text-text-muted">{mat.plantNumber}</span>
                    </div>
                  </button>
                ))}
              </div>
              {/* Annuller-knap */}
              <button
                type="button"
                onClick={() => setTilfoejMaterielOpen(false)}
                className="w-full py-xs rounded-xl border border-hairline font-inter font-semibold text-sm text-text-secondary hover:border-hairline-2 transition-colors"
              >
                Annuller
              </button>
            </div>
          </div>
        )
      })()}

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
              {bestillingForSent ? (
                <p className="font-inter text-sm text-bad leading-relaxed bg-bad-bg border border-bad/30 rounded-lg px-sm py-xs">
                  Bestillingen er lavet efter kl 11. Du skal derfor ringe til fabrikken for at sikre produktionskapacitet.
                </p>
              ) : (
                <p className="font-inter text-sm text-text-secondary leading-relaxed">
                  Ordren afsendes til fabrikken nu.
                </p>
              )}
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
                  if (kommentar.trim().length > 0) {
                    setSentKommentarer(prev => ({ ...prev, [selectedPlanDate]: kommentar.trim() }))
                  }
                  sendAlleForSelectedDate()
                  setFabrikSendtDates(prev => new Set([...prev, selectedPlanDate]))
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

// ─── AflysningCell ────────────────────────────────────────────────────────────
// 6. celle i ordredetalje-grid'et. UNIFIED — identisk adfærd i alle modes
// (Planlægning, Udførsel, Afregning). Tre tilstande:
//   A) Ingen aflyste dage      → "Aflys dag"-knap
//   B) 1+ aflyste, men flere tilbage → liste af aflyste + "Aflys flere"-knap
//   C) Alle dage aflyst        → liste af aflyste — ingen knap
// Picker-flow: vælg dato → vælg årsag → bekræft med OK (Fortryd annullerer).
// Pickeren defaulter til den aktuelt valgte dato (udfoerselSelectedDate) hvis
// den ikke er aflyst, ellers første aktive dag.
function AflysningCell({
  product,
  udfoerselSelectedDate,
  pickerOpenForDayId,
  onOpenPicker,
  onClosePicker,
  onCancelDay,
}: {
  product: MockProduct
  /** Aktuelt valgt dato (bruges som default i pickeren — gælder alle modes) */
  udfoerselSelectedDate?: string
  /** dayId som pickeren er åben for — null hvis lukket */
  pickerOpenForDayId: string | null
  onOpenPicker: (defaultDayId: string) => void
  onClosePicker: () => void
  onCancelDay: (dayId: string, reason: CancelReason) => void
}) {
  // Lokal state: valgt dag + valgt årsag i pickeren (vælg → bekræft med OK)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [selectedReason, setSelectedReason] = useState<CancelReason | null>(null)

  const sortedDays = [...product.days].sort((a, b) => a.date.localeCompare(b.date))
  const cancelledDays = sortedDays.filter(d => d.cancelled)
  const aktiveDays = sortedDays.filter(d => !d.cancelled)
  const isOpen = pickerOpenForDayId !== null

  // Default-valgt dag når pickeren åbnes: aktuelt valgt dato hvis aktiv, ellers første aktive
  const selectedDateDay = udfoerselSelectedDate
    ? sortedDays.find(d => d.date === udfoerselSelectedDate)
    : null
  const defaultDayId = selectedDateDay && !selectedDateDay.cancelled
    ? selectedDateDay.id
    : aktiveDays[0]?.id

  function closePicker() {
    setSelectedDayId(null)
    setSelectedReason(null)
    onClosePicker()
  }

  function openPicker() {
    if (!defaultDayId) return
    setSelectedDayId(defaultDayId)
    setSelectedReason(null)
    onOpenPicker(defaultDayId)
  }

  function confirmCancel(dayId: string) {
    if (!selectedReason) return
    onCancelDay(dayId, selectedReason) // parent lukker pickeren
    setSelectedDayId(null)
    setSelectedReason(null)
  }

  // ── Picker (åben) — vælg dato → vælg årsag → OK ─────────────────────────────
  if (isOpen) {
    const pickerOptions = aktiveDays.length > 0 ? aktiveDays : sortedDays
    const currentDayId = selectedDayId ?? pickerOpenForDayId ?? pickerOptions[0]?.id ?? ''
    return (
      <div className="mt-auto flex flex-col gap-xs">
        <div className="flex flex-col gap-xxxs">
          <span className="font-inter text-xxs font-medium text-text-muted">Vælg dato</span>
          <select
            value={currentDayId}
            onChange={(e) => setSelectedDayId(e.target.value)}
            className="w-full px-xs py-xxs rounded-md border border-hairline font-inter text-xs bg-white"
          >
            {pickerOptions.map(d => (
              <option key={d.id} value={d.id}>
                {formatLongDate(d.date)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-xxxs">
          <span className="font-inter text-xxs font-medium text-text-muted">Vælg årsag</span>
          <div className="flex flex-wrap gap-xxxs">
            {CANCEL_REASONS.map(r => {
              const aktiv = selectedReason === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedReason(r.value)}
                  aria-pressed={aktiv}
                  className={[
                    'px-xs py-xxs rounded-md font-inter text-xxs font-medium transition-colors border',
                    aktiv
                      ? 'bg-bad/10 text-bad border-bad/40'
                      : 'bg-surface-2 text-text-secondary border-transparent hover:bg-bad/10 hover:text-bad',
                  ].join(' ')}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>
        <p className="font-inter text-xxs text-text-muted leading-snug">
          Aflysning gælder fra det valgte tidspunkt og resten af dagen. Allerede registreret timeforbrug og tons gemmes.
        </p>
        <div className="flex items-center gap-xs">
          <button
            type="button"
            disabled={!selectedReason || !currentDayId}
            onClick={() => confirmCancel(currentDayId)}
            className="flex-1 inline-flex items-center justify-center px-sm py-xs rounded-md bg-bad text-white font-inter text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            OK
          </button>
          <button
            type="button"
            onClick={closePicker}
            className="flex-1 inline-flex items-center justify-center px-sm py-xs rounded-md bg-white border border-hairline text-text-secondary font-inter text-xs font-semibold hover:border-dark-teal hover:text-deep-teal transition-colors"
          >
            Fortryd
          </button>
        </div>
      </div>
    )
  }

  // ── Tilstand A: ingen aflyste dage ──────────────────────────────────────────
  if (cancelledDays.length === 0) {
    return (
      <div className="mt-auto flex flex-col gap-xs">
        {defaultDayId && (
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-xxxs w-fit px-xs py-xxs rounded-md bg-bad/10 text-bad font-inter text-xs font-semibold hover:bg-bad/20 transition-colors"
          >
            <CloudRain size={12} />
            Aflys dag
          </button>
        )}
      </div>
    )
  }

  // ── Tilstand B+C: 1+ dage aflyst (med eller uden flere tilbage) ─────────────
  const visAflysFlereKnap = aktiveDays.length > 0
  return (
    <div className="mt-auto flex flex-col gap-xs">
      <div className="flex flex-col gap-xxxs">
        {cancelledDays.map(d => {
          const reasonLabel = CANCEL_REASONS.find(r => r.value === d.cancelReason)?.label
          return (
            <div key={d.id} className="flex flex-col">
              <span className="font-inter text-xs text-bad font-semibold">
                {formatLongDate(d.date)}
              </span>
              {reasonLabel && (
                <span className="font-inter text-xxs text-text-muted">(pga. {reasonLabel})</span>
              )}
            </div>
          )
        })}
      </div>
      {visAflysFlereKnap && defaultDayId && (
        <button
          type="button"
          onClick={openPicker}
          className="inline-flex items-center gap-xxxs w-fit px-xs py-xxs rounded-md bg-bad/10 text-bad font-inter text-xs font-semibold hover:bg-bad/20 transition-colors"
        >
          <CloudRain size={12} />
          Aflys flere
        </button>
      )}
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
  onCancel: _onCancel, onAbortCancel, onConfirmCancel, onRestore,
  ordreTagLabels,
  samlesPaaEnBil, onSamlesPaaEnBilChange,
}: {
  product: MockProduct
  day: DayPlan
  isFocused: boolean
  isSelectingReason: boolean
  isSent: boolean                      // når true: Forventet + Morgen tons låst (read-only)
  onFocus: () => void
  onUpdateTons: (v: number) => void
  onUpdateMorgenTons: (v: number | undefined) => void
  /** Tidligere: åbn årsags-picker fra X-knap. X-knap fjernet 2026-06-09 — bevares for bagudkompat indtil call-sites er ryddet. */
  onCancel: () => void
  onAbortCancel: () => void            // luk årsags-picker uden at aflyse
  onConfirmCancel: (r: CancelReason) => void
  onRestore: () => void
  /** Samleordre: labels for de ordrer dette produkt tilhører, fx ['Søvej', 'Strandvejen'] */
  ordreTagLabels?: string[]
  /** Angiver om dette produkt/dag skal samles på én bil */
  samlesPaaEnBil?: boolean
  /** Callback ved ændring af "Samles på en bil" */
  onSamlesPaaEnBilChange?: (v: boolean) => void
}) {
  const [weatherActive, setWeatherActive] = useState(false)

  if (day.cancelled) {
    return (
      <div className="w-[160px] min-h-[172px] flex-1 bg-white rounded-xl border border-bad/30 flex flex-col items-center justify-center gap-xxxs opacity-60 p-sm">
        <p className="font-poppins font-semibold text-sm text-text-muted">{product.recipeName}</p>
        <p className="font-inter text-xxs text-text-muted">{product.recipeCode}</p>
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
    <div
      onClick={onFocus}
      className={[
        'relative w-[160px] min-h-[172px] flex-1 bg-white rounded-xl flex flex-col p-sm pb-lg gap-xs transition-all border cursor-pointer',
        isFocused ? 'border-dark-teal ring-1 ring-dark-teal/20' : 'border-hairline hover:border-hairline-2',
      ].join(' ')}>
      {/* Tidligere X-knap til aflysning er fjernet 2026-06-09 — aflysning sker nu via
          AFLYSNING-celle i ordredetalje-grid'et. Gammel kode bevares i v1-folder:
          ./v1/ProductBoxV2.v1.tsx */}

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

      {/* Produkt-header — klikbar for fokus (driver Spec-grid). */}
      <button
        onClick={onFocus}
        aria-pressed={isFocused}
        className="flex flex-col items-start text-left pr-md"
      >
        <span className="font-poppins font-semibold text-sm text-text-primary leading-tight">{product.recipeName}</span>
        <span className="font-inter text-xxs text-text-muted">{product.thicknessMm} mm</span>
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

      {/* Spacer — skubber Forventet + Morgen + checkbox til bunden, så de
          aligner på tværs af bokse uanset header-højde (med/uden ordre-tags). */}
      <div className="flex-1" />

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
      </div>

      {/* "Samles på en bil"-checkbox — per produkt+dag (sidder direkte efter Morgen — bottom-aligned via flex-1 spacer øverst) */}
      <label className="inline-flex items-center gap-xxxs cursor-pointer">
        <input
          type="checkbox"
          checked={samlesPaaEnBil ?? false}
          onChange={e => onSamlesPaaEnBilChange?.(e.target.checked)}
          disabled={isSent}
          className="w-3 h-3 accent-deep-teal disabled:cursor-not-allowed"
        />
        <span className="font-inter text-xxs text-text-muted">Samles på en bil</span>
      </label>

    </div>
  )
}

// ─── EkstraBestillingBox ─────────────────────────────────────────────────────
// Flow 9b (OPDATERET 2026-06-09): Synlig boks ved siden af produktet i Asfaltbestilling-
// rækken når PLAN har pushet en ekstra-bestilling fra fabrik (formand ringer fabrik →
// fabrik indfører i PLAN → app'en pull'er). Boksen viser KUN delta-mængden — totalen
// sammensættes via getEffectiveTons() i alle downstream-beregninger (Vejesedler,
// Dagsoverblik, Afregning, Ordredetaljer/Mængde tons).
// Dimensioner matcher ProductBoxV2 (w-[160px] min-h-[172px]) så de aligner i rækken.

function EkstraBestillingBox({ product, day }: { product: MockProduct; day: DayPlan }) {
  if (!day.ekstraTons) return null
  return (
    // Layout speljer ProductBoxV2 EKSAKT: p-sm pb-lg + gap-xs + flex-1 spacer + 3 sektioner
    // (label+input-boks, label+timestamp, usynligt checkbox-placeholder) så "Ekstra"-labelen
    // lander på samme højde som "Forventet"-labelen i naboboksen.
    <div className="relative w-[160px] min-h-[172px] flex-1 bg-warning rounded-xl border border-warning flex flex-col p-sm pb-lg gap-xs">
      {/* Header — matcher ProductBoxV2 header-blok (recipeName + tykkelse) */}
      <div className="flex flex-col items-start text-left pr-md">
        <span className="font-poppins font-semibold text-sm text-text-primary leading-tight">
          {product.recipeName}
        </span>
        <span className="font-inter text-xxs text-text-muted">{product.thicknessMm} mm</span>
      </div>

      {/* Spacer — matcher ProductBoxV2's flex-1 spacer */}
      <div className="flex-1" />

      {/* "Forventet"-equivalent: "Ekstra"-label + +N tons inder-boks */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Ekstra</span>
        <div className="flex items-center gap-xxxs border border-hairline rounded-lg px-xs py-xxxs bg-white/60">
          <span className="font-poppins font-semibold text-lg text-text-primary tabular-nums w-full">
            +{day.ekstraTons.tons}
          </span>
          <span className="font-inter text-xxs text-text-muted flex-shrink-0">tons</span>
        </div>
      </div>

      {/* "Morgen"-equivalent: Bekræftet-label + timestamp i input-stilet boks (samme højde som Morgen-boks i ProductBoxV2) */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xxxs">Bekræftet</span>
        <div className="flex items-center gap-xxxs border border-hairline rounded-lg px-xs py-xxxs bg-white/60">
          <span className="font-poppins font-semibold text-md text-text-primary tabular-nums w-full">
            kl. {formatTime(day.ekstraTons.tidspunkt)}
          </span>
        </div>
      </div>

      {/* "Samles på en bil"-equivalent: usynlig checkbox-label med EKSAKT samme højde */}
      <label className="invisible inline-flex items-center gap-xxxs" aria-hidden="true">
        <input type="checkbox" disabled />
        <span className="font-inter text-xxs">Samles på en bil</span>
      </label>
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

// ─── KS-rapportering helper-komponenter ──────────────────────────────────────

// Fælles felt-styling — bruges i begge skemaer
const KS_INPUT_CLS = 'border border-hairline rounded-md px-xs py-xxxs font-inter text-xs text-text-primary focus:ring-2 focus:ring-dark-teal/30 focus:outline-none bg-white w-full'
const KS_LABEL_CLS = 'font-inter text-xs text-text-muted'


/** Øvrige oplysninger til 3a — PLAN-blanket 3a */
function OvrigeOplysningerSkema3a({
  products,
}: {
  products: MockProduct[]
  selectedDate: string
}) {
  const [produktIdx, setProduktIdx] = useState<number | null>(0)

  // Strækning kontrolleret
  const [afmTidMorgen, setAfmTidMorgen] = useState('00:00')
  const [afmTidAften, setAfmTidAften] = useState('00:00')
  const [afmNej, setAfmNej] = useState(true)

  // TODO: Erstat med Supabase når klar — Bygherre præudfyldes fra ordrens kunde (kundeVirksomhed)
  const [bygherre, setBygherre] = useState('Uddannelsescenter Syd')

  // Udfyldes af EL / DL
  const [bygherretilsyn, setBygherretilsyn] = useState('')
  const [proeveUdtaget, setProeveUdtaget] = useState<'ja' | 'nej' | null>(null)
  const [komprimering, setKomprimering] = useState<'ja' | 'nej' | null>(null)
  const [laboratoriekontrol, setLaboratoriekontrol] = useState<'ja' | 'nej' | null>(null)

  // Materialer — 4 temperaturmålinger (blanket-sektion "3. Materialer")
  // TODO: Erstat med Supabase når klar — tidspunkterne auto-præudfyldes i produktion
  // fra dagens afsluttede læs ved dagens afslutning; temperatur indtastes manuelt af formanden.
  const [materialeMaalinger, setMaterialeMaalinger] = useState<
    { uensartede: 'ja' | 'nej' | null; temperaturC: string; klokkeslaet: string }[]
  >([
    { uensartede: 'nej', temperaturC: '', klokkeslaet: '20:30' },
    { uensartede: 'nej', temperaturC: '', klokkeslaet: '22:00' },
    { uensartede: 'nej', temperaturC: '', klokkeslaet: '00:00' },
    { uensartede: 'nej', temperaturC: '', klokkeslaet: '03:00' },
  ])

  function updateMaaling(
    idx: number,
    field: 'uensartede' | 'temperaturC' | 'klokkeslaet',
    value: 'ja' | 'nej' | null | string
  ) {
    setMaterialeMaalinger(prev =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    )
  }

  const [saved3a, setSaved3a] = useState(false)

  return (
    <div className="space-y-md">
      <p className="font-poppins font-semibold text-sm text-text-primary">Øvrige oplysninger til 3a</p>

      {/* Øverste boks — Strækning, Bygherre, Afmærkning */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs sr-only">Generelle oplysninger</legend>
        <div className="space-y-sm mt-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            <div className="flex flex-col gap-xxxs">
              <label className={KS_LABEL_CLS}>Strækning</label>
              <input type="text" defaultValue="" placeholder="fx Rådhuspladsen – Nørreport" className={KS_INPUT_CLS} />
            </div>
            <div className="flex flex-col gap-xxxs">
              <label className={KS_LABEL_CLS}>Bygherre</label>
              <input type="text" value={bygherre} onChange={e => setBygherre(e.target.value)} placeholder="fx Vejdirektoratet" className={KS_INPUT_CLS} />
            </div>
          </div>

          {/* Afmærkning kontrolleret */}
          <div className="flex flex-wrap items-center gap-sm">
            <span className={KS_LABEL_CLS}>Strækning kontrolleret</span>
            <div className="flex flex-wrap items-center gap-sm">
              <label className="inline-flex items-center gap-xs">
                <span className={KS_LABEL_CLS}>Morgen</span>
                <span className={KS_LABEL_CLS}>Kl.</span>
                <input
                  type="time"
                  value={afmTidMorgen}
                  onChange={e => setAfmTidMorgen(e.target.value)}
                  className={KS_INPUT_CLS + ' w-28'}
                />
              </label>
              <label className="inline-flex items-center gap-xs">
                <span className={KS_LABEL_CLS}>Aften</span>
                <span className={KS_LABEL_CLS}>Kl.</span>
                <input
                  type="time"
                  value={afmTidAften}
                  onChange={e => setAfmTidAften(e.target.value)}
                  className={KS_INPUT_CLS + ' w-28'}
                />
              </label>
              <label className="inline-flex items-center gap-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={afmNej}
                  onChange={e => setAfmNej(e.target.checked)}
                  className="accent-deep-teal w-4 h-4"
                />
                <span className={KS_LABEL_CLS}>Nej</span>
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Materialer — blanket-sektion "3. Materialer": 4 temperaturmålinger som 4 kolonner */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Materialer</legend>
        <div className="mt-xs space-y-xs">
          {/* Række-label + 4-kolonne grid */}
          <div className="grid grid-cols-4 gap-sm">
            {materialeMaalinger.map((m, idx) => (
              <div key={idx} className="flex flex-col gap-xxxs">
                <span className={KS_LABEL_CLS + ' text-center'}>Måling {idx + 1}</span>
                {/* Uensartede — separat JaNejToggle pr. kolonne */}
                <div className="flex flex-col gap-xxxs">
                  <span className={KS_LABEL_CLS}>Uensartede</span>
                  <JaNejToggle
                    value={m.uensartede}
                    onChange={val => updateMaaling(idx, 'uensartede', val)}
                  />
                </div>
                {/* Temperatur */}
                <div className="flex flex-col gap-xxxs">
                  <label className={KS_LABEL_CLS}>°C</label>
                  <input
                    type="number"
                    value={m.temperaturC}
                    onChange={e => updateMaaling(idx, 'temperaturC', e.target.value)}
                    placeholder="–"
                    className={KS_INPUT_CLS}
                  />
                </div>
                {/* Klokkeslæt — præudfyldt med jævnt fordelte tidspunkter for aften/nat-udlægning */}
                <div className="flex flex-col gap-xxxs">
                  <label className={KS_LABEL_CLS}>Kl</label>
                  <input
                    type="time"
                    value={m.klokkeslaet}
                    onChange={e => updateMaaling(idx, 'klokkeslaet', e.target.value)}
                    className={KS_INPUT_CLS}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Produktoplysninger — sektion-overskrift + segmented control */}
      <div className="space-y-xs">
        <p className="font-poppins text-xs font-semibold text-text-primary">Produktoplysninger</p>
        <div className="flex flex-col gap-xxxs">
          <span className={KS_LABEL_CLS}>Vælg produkt</span>
          <div className="flex flex-wrap bg-surface-2 rounded-md p-xxxs border border-hairline w-fit gap-xxxs">
          {products.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProduktIdx(idx)}
              className={
                'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors ' +
                (produktIdx === idx
                  ? 'bg-dark-teal text-white'
                  : 'text-text-muted hover:bg-soft-aqua')
              }
            >
              {p.recipeCode ?? p.recipeName}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Udfyldes af EL / DL */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Udfyldes af EL / DL</legend>
        <div className="space-y-sm mt-xs">
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Bygherretilsyn</label>
            <input
              type="text"
              value={bygherretilsyn}
              onChange={e => setBygherretilsyn(e.target.value)}
              placeholder="Navn på tilsynsførende"
              className={KS_INPUT_CLS}
            />
          </div>
          <div className="flex flex-col gap-xxxs">
            <span className={KS_LABEL_CLS}>Prøve udtaget ved anlæg (tilsyn)</span>
            <JaNejToggle value={proeveUdtaget} onChange={setProeveUdtaget} />
          </div>
          <div className="flex flex-col gap-xxxs">
            <span className={KS_LABEL_CLS}>Komprimeringskontrol bestilt</span>
            <JaNejToggle value={komprimering} onChange={setKomprimering} />
          </div>
          <div className="flex flex-col gap-xxxs">
            <span className={KS_LABEL_CLS}>Laboratoriekontrol bestilt</span>
            <JaNejToggle value={laboratoriekontrol} onChange={setLaboratoriekontrol} />
          </div>
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Bemærkninger</label>
            <textarea
              rows={3}
              defaultValue=""
              placeholder="Skriv eventuelle bemærkninger her…"
              className={KS_INPUT_CLS + ' resize-y'}
            />
          </div>
        </div>
      </fieldset>

      {/* Gem-knap */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSaved3a(true)}
          className={
            'font-poppins font-semibold text-xs px-md py-xs rounded-md transition-colors ' +
            (saved3a
              ? 'bg-good text-white cursor-default'
              : 'bg-yellow text-deep-teal hover:opacity-90 active:scale-[0.98]')
          }
        >
          {saved3a ? 'Gemt' : 'Gem'}
        </button>
      </div>
    </div>
  )
}

/** A3 / A4 — Øvrige oplysninger (ØVR. 3.a og ØVR. 4.a) — identisk struktur, kun label varierer */
function OvrigeOplysningerSkema({
  variant,
  products,
  selectedDate: _selectedDate,
}: {
  variant: '3a' | '4a'
  products: MockProduct[]
  /** YYYY-MM-DD — bevaret i props-interface for fremtidig brug */
  selectedDate: string
}) {
  // Produkt-navigation — 0 = første produkt valgt som default
  const [lagProduktIdx, setLagProduktIdx] = useState<number | null>(0)

  // Live-beregnede felter — TODO: Erstat med Supabase når klar
  const [udlagtTons, setUdlagtTons] = useState('48.5')
  const [laengde, setLaengde] = useState('120')
  const [bredde, setBredde] = useState('4.5')
  const [tillaeg, setTillaeg] = useState('12')
  const areal = (parseFloat(laengde) || 0) * (parseFloat(bredde) || 0)
  const arealIalt = areal + (parseFloat(tillaeg) || 0)
  const gennsnForbrug = arealIalt > 0 ? ((parseFloat(udlagtTons) || 0) * 1000) / arealIalt : 0

  const [skitseVedlagt, setSkitseVedlagt] = useState<'ja' | 'nej' | null>('nej')
  const [ovrSaved, setOvrSaved] = useState(false)
  const lagLegend = lagProduktIdx === null ? '0. Lag' : `${lagProduktIdx + 1}. Lag`
  const felterAktive = lagProduktIdx !== null

  return (
    <div className="space-y-md">
      <p className="font-poppins font-semibold text-sm text-text-primary">
        Øvrige oplysninger til {variant}
      </p>

      {/* Lag-fieldset med produkt-navigation */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">{lagLegend}</legend>
        <div className="space-y-sm mt-xs">

          {/* Produkt-navigation — segmented control, ét produkt pr. knap */}
          <div className="flex flex-col gap-xxxs">
            <span className={KS_LABEL_CLS}>Vælg produkt</span>
            <div className="flex flex-wrap bg-surface-2 rounded-md p-xxxs border border-hairline w-fit gap-xxxs">
            {products.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLagProduktIdx(idx)}
                className={
                  'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors ' +
                  (lagProduktIdx === idx
                    ? 'bg-dark-teal text-white'
                    : 'text-text-muted hover:bg-soft-aqua')
                }
              >
                {p.recipeCode ?? p.recipeName}
              </button>
            ))}
            </div>
          </div>

          {/* Felter — disabled + dæmpet når intet produkt er valgt */}
          <div className={felterAktive ? undefined : 'opacity-60 pointer-events-none'}>
            <div className="space-y-sm">

              {/* Stationering */}
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Stationering</label>
                <input
                  type="text"
                  defaultValue=""
                  placeholder="fx 0+000 – 0+120"
                  disabled={!felterAktive}
                  className={KS_INPUT_CLS}
                />
              </div>

              {/* Udlagt antal tons */}
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Udlagt antal tons</label>
                <input
                  type="number"
                  value={udlagtTons}
                  onChange={e => setUdlagtTons(e.target.value)}
                  step="0.1"
                  min="0"
                  disabled={!felterAktive}
                  className={KS_INPUT_CLS + ' w-32'}
                />
              </div>

              {/* Udlægningsareal */}
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Udlægningsareal (l × b)</label>
                <div className="flex items-center gap-xs">
                  <input
                    type="number"
                    value={laengde}
                    onChange={e => setLaengde(e.target.value)}
                    step="0.1"
                    min="0"
                    placeholder="Længde"
                    disabled={!felterAktive}
                    className={KS_INPUT_CLS + ' w-24'}
                  />
                  <span className="font-inter text-xs text-text-muted">×</span>
                  <input
                    type="number"
                    value={bredde}
                    onChange={e => setBredde(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="Bredde"
                    disabled={!felterAktive}
                    className={KS_INPUT_CLS + ' w-24'}
                  />
                  <span className="font-inter text-xs text-text-muted shrink-0">
                    → {areal.toFixed(1).replace('.', ',')} m²
                  </span>
                </div>
              </div>

              {/* Tillægsareal */}
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Tillægsareal (m²)</label>
                <input
                  type="number"
                  value={tillaeg}
                  onChange={e => setTillaeg(e.target.value)}
                  step="0.1"
                  min="0"
                  disabled={!felterAktive}
                  className={KS_INPUT_CLS + ' w-32'}
                />
              </div>

              {/* Read-only beregnede felter */}
              <div className="grid grid-cols-2 gap-sm">
                <div className="flex flex-col gap-xxxs">
                  <span className={KS_LABEL_CLS}>Areal i alt</span>
                  <span className="font-inter text-xs font-semibold text-text-primary">
                    {arealIalt.toFixed(1).replace('.', ',')} m²
                  </span>
                </div>
                <div className="flex flex-col gap-xxxs">
                  <span className={KS_LABEL_CLS}>Gennemsnitsforbrug</span>
                  <span className="font-inter text-xs font-semibold text-text-primary">
                    {gennsnForbrug.toFixed(1).replace('.', ',')} kg/m²
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </fieldset>

      {/* Skitse vedlagt */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Skitse vedlagt</legend>
        <div className="mt-xs">
          <JaNejToggle value={skitseVedlagt} onChange={setSkitseVedlagt} />
        </div>
      </fieldset>

      {/* Bemærkninger */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Bemærkninger</legend>
        <textarea
          defaultValue=""
          placeholder="Skriv eventuelle bemærkninger her…"
          rows={3}
          className={KS_INPUT_CLS + ' mt-xs resize-none'}
        />
      </fieldset>

      {/* Gem-knap */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOvrSaved(true)}
          className={
            'font-poppins font-semibold text-xs px-md py-xs rounded-md transition-colors ' +
            (ovrSaved
              ? 'bg-good text-white cursor-default'
              : 'bg-yellow text-deep-teal hover:opacity-90 active:scale-[0.98]')
          }
        >
          {ovrSaved ? 'Gemt' : 'Gem'}
        </button>
      </div>
    </div>
  )
}

// ─── EkstraarbejdeBlok ───────────────────────────────────────────────────────
// Genbrugskomponent — bruges i Forundersøgelse (UdfoerselContent) og i MKS-skema.
// `open`-state er intern så de to instanser åbner/lukker uafhængigt.
// `ekstraLinjer` + `ekstraSent` er delt state (hejst til UdfoerselContent).

interface EkstraarbejdeBlokProps {
  linjer: EkstraLinje[]
  onAdd: () => void
  onUpdate: (id: string, field: keyof EkstraLinje, value: string | number) => void
  onRemove: (id: string) => void
  sent: boolean
  onSend: () => void
  onReset: () => void
  /** Skjul Fortryd + "Gem ekstraarbejde"-knapper — bruges i Forundersøgelse hvor "Gem forundersøgelse" samler begge. */
  hideSaveFooter?: boolean
}

function EkstraarbejdeBlok({ linjer, onAdd, onUpdate, onRemove, sent, onSend, onReset, hideSaveFooter }: EkstraarbejdeBlokProps) {
  const [open, setOpen] = useState(false)

  function handleOpen() {
    setOpen(true)
    if (linjer.length === 0) onAdd()
  }

  return (
    <div className="flex flex-col gap-sm">
      {open && (
        <div className="flex flex-col gap-sm">
          <p className="font-inter text-xxs font-semibold text-text-muted">
            Ekstraarbejde
          </p>

          {linjer.length === 0 && (
            <p className="font-inter text-xs text-text-muted italic">Ingen linjer endnu — tilføj nedenfor.</p>
          )}

          {linjer.map((linje, i) => (
            <div key={linje.id} className="grid gap-xs items-start" style={{ gridTemplateColumns: '1fr 1fr 72px 28px' }}>
              {/* Type dropdown */}
              <div className="relative">
                <select
                  value={linje.type}
                  onChange={e => onUpdate(linje.id, 'type', e.target.value)}
                  className="w-full font-inter text-xs text-text-primary bg-surface-2 border border-hairline rounded-lg px-xs py-xs pr-[24px] focus:outline-none focus:border-dark-teal focus:bg-white transition-colors appearance-none cursor-pointer"
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
                onChange={e => onUpdate(linje.id, 'beskrivelse', e.target.value)}
                placeholder={`Beskrivelse linje ${i + 1}...`}
                className="font-inter text-xs text-text-primary bg-surface-2 border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal focus:bg-white transition-colors"
              />

              {/* Antal */}
              <div className="flex items-center border border-hairline rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => onUpdate(linje.id, 'antal', Math.max(1, linje.antal - 1))}
                  className="px-xs py-xs font-inter text-sm text-text-muted hover:bg-surface-2 transition-colors leading-none"
                >−</button>
                <span className="flex-1 text-center font-inter text-xs font-semibold text-text-primary tabular-nums">{linje.antal}</span>
                <button
                  onClick={() => onUpdate(linje.id, 'antal', linje.antal + 1)}
                  className="px-xs py-xs font-inter text-sm text-text-muted hover:bg-surface-2 transition-colors leading-none"
                >+</button>
              </div>

              {/* Fjern */}
              <button
                onClick={() => onRemove(linje.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-bad hover:bg-bad-bg transition-colors mt-[2px]"
                aria-label="Fjern linje"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          <button
            onClick={onAdd}
            className="inline-flex items-center gap-xs font-inter text-xs font-medium text-dark-teal border border-dashed border-dark-teal/40 rounded-lg px-sm py-xs hover:bg-soft-aqua transition-colors self-start"
          >
            Tilføj linje
          </button>

          <div className="flex items-center justify-between pt-xs mt-xs">
            {!sent && (
              <p className="font-inter text-xs text-text-muted">
                Sendes som mail til projektleder ved gem
              </p>
            )}
            {!hideSaveFooter && (
              <div className="flex items-center gap-xs ml-auto">
                <button
                  onClick={() => { onReset(); setOpen(false) }}
                  className="font-inter text-sm text-text-muted hover:text-text-primary px-xs py-xs transition-colors"
                >
                  Fortryd
                </button>
                <button
                  onClick={() => { if (linjer.length > 0) onSend() }}
                  disabled={linjer.length === 0}
                  className={[
                    'font-inter text-sm font-semibold px-md py-xs rounded-xl transition-all active:scale-[0.98]',
                    sent
                      ? 'bg-good text-white cursor-default'
                      : linjer.length === 0
                        ? 'bg-surface-2 text-text-muted cursor-not-allowed'
                        : 'bg-yellow text-deep-teal hover:opacity-90',
                  ].join(' ')}
                >
                  {sent ? 'Gemt' : 'Gem ekstraarbejde'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={handleOpen}
          className="self-start inline-flex items-center gap-xs font-inter text-sm font-semibold px-md py-xs rounded-xl active:scale-[0.98] transition-all bg-yellow text-deep-teal hover:opacity-90"
        >
          Tilføj ekstraarbejde
        </button>
      )}
    </div>
  )
}

/** MKS-skema — vejr, klæbning, udlægning-krav og færdiggørelse */
// Lokal helper — kun MksSkema bruger denne. Genbrug Afregning-togglens eksakte Tailwind-klasser.
function JaNejToggle({
  value,
  onChange,
}: {
  value: 'ja' | 'nej' | null
  onChange: (v: 'ja' | 'nej') => void
}) {
  return (
    <div className="flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit">
      {(['ja', 'nej'] as const).map(v => {
        const isActive = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={isActive}
            className={[
              'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
              isActive ? 'bg-dark-teal text-white' : 'text-text-muted hover:bg-soft-aqua',
            ].join(' ')}
          >
            {v === 'ja' ? 'Ja' : 'Nej'}
          </button>
        )
      })}
    </div>
  )
}

function MksSkema({
  products,
  selectedDate: _selectedDate,
  ekstraarbejde,
}: {
  products: MockProduct[]
  selectedDate: string
  /** Delt ekstraarbejde-state fra UdfoerselContent — vises i eget fieldset under Færdiggørelse */
  ekstraarbejde: EkstraarbejdeBlokProps
}) {
  // Ingen state-persist — visuel mockup, TODO: Erstat med Supabase når klar
  void products // bruges ikke direkte i mockup, men sendes med for fremtidig Supabase-binding

  // Controlled state for toggles (kun toggles + årsag er controlled — øvrige felter forbliver uncontrolled)
  const [intakt, setIntakt] = useState<'ja' | 'nej' | null>(null)
  const [aarsag, setAarsag] = useState('')
  const [aarsagDirty, setAarsagDirty] = useState(false)

  // Klæbning type — default emulsion, aldrig null
  const [klæbningType, setKlæbningType] = useState<'emulsion' | 'andet'>('emulsion')
  const [klæbningAndet, setKlæbningAndet] = useState('')
  const [klæbningAndetDirty, setKlæbningAndetDirty] = useState(false)

  const [kravSamlinger, setKravSamlinger] = useState<'ja' | 'nej' | null>(null)
  const [kravProfil, setKravProfil] = useState<'ja' | 'nej' | null>(null)
  const [mksSaved, setMksSaved] = useState(false)
  const [kravJaevnhed, setKravJaevnhed] = useState<'ja' | 'nej' | null>(null)

  const [konstRivninger, setKonstRivninger] = useState<'ja' | 'nej' | null>(null)
  const [konstSvedninger, setKonstSvedninger] = useState<'ja' | 'nej' | null>(null)
  const [konstDriftsstop, setKonstDriftsstop] = useState<'ja' | 'nej' | null>(null)

  const [rensningDaeksler, setRensningDaeksler] = useState<'ja' | 'nej' | null>(null)
  const [rensningDandfang, setRensningDandfang] = useState<'ja' | 'nej' | null>(null)

  // Valideringsfejl: vis kun fejl når bruger har valgt Nej OG har rørt feltet
  const visAarsagFejl = intakt === 'nej' && (aarsagDirty || aarsag.length > 0) && aarsag.trim() === ''

  // Valideringsfejl for Hvis Andet: vis først efter bruger har rørt feltet (Emulsion er default → ingen fejl ved start)
  const visAndetFejl = klæbningType === 'andet' && klæbningAndetDirty && klæbningAndet.trim() === ''

  return (
    <div className="space-y-md">
      <p className="font-poppins font-semibold text-sm text-text-primary">Oplysninger til brug for MKS</p>

      {/* Vejrforhold */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Vejrforhold</legend>
        {/* Mobile-first: stak på smal skærm, 2-kolonne fra tablet (sm ≥640) og op */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-xs">

          {/* Lufttemperatur + klokkeslæt */}
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Lufttemperatur (°C)</label>
            <input type="number" defaultValue="" placeholder="fx 18" step="0.1" className={KS_INPUT_CLS} />
          </div>
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Kl.</label>
            <input type="time" defaultValue="" className={KS_INPUT_CLS} />
          </div>

          {/* Vind */}
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Vind</label>
            <div className="relative">
              <select defaultValue="" className={KS_INPUT_CLS + ' appearance-none pr-[24px]'}>
                <option value="" disabled>— Vælg —</option>
                {['Stærk', 'Svag', 'Skiftende', 'Ingen'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Regn */}
          <div className="flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Regn</label>
            <div className="relative">
              <select defaultValue="" className={KS_INPUT_CLS + ' appearance-none pr-[24px]'}>
                <option value="" disabled>— Vælg —</option>
                {['Stærk', 'Svag', 'Skiftende', 'Ingen'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Vejoverfladens tilstand */}
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-xxxs">
            <label className={KS_LABEL_CLS}>Vejoverfladens tilstand</label>
            <div className="relative">
              <select defaultValue="" className={KS_INPUT_CLS + ' appearance-none pr-[24px]'}>
                <option value="" disabled>— Vælg —</option>
                {['Tør', 'Våd', 'Optørrende'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Klæbning */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Klæbning</legend>
        <div className="space-y-sm mt-xs">

          {/* 2-kolonne gruppe: Klæbning intakt (venstre) + Type (højre) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">

            {/* Kolonne 1: Klæbning intakt + Årsag */}
            <div className="flex flex-col gap-xs">
              <div className="flex items-center gap-md">
                <span className={KS_LABEL_CLS + ' shrink-0'}>Klæbning intakt</span>
                <JaNejToggle value={intakt} onChange={v => { setIntakt(v); if (v !== 'nej') setAarsagDirty(false) }} />
              </div>
              <div className="flex flex-col gap-xxxs">
                <span className={KS_LABEL_CLS}>Årsag{intakt === 'nej' ? ' *' : ''}</span>
                <textarea
                  rows={2}
                  value={aarsag}
                  onChange={e => setAarsag(e.target.value)}
                  onBlur={() => { if (intakt === 'nej') setAarsagDirty(true) }}
                  placeholder="Beskriv årsag…"
                  className={KS_INPUT_CLS + ' resize-y' + (visAarsagFejl ? ' border-bad' : '')}
                />
                {visAarsagFejl && (
                  <span className="font-inter text-xxs text-bad">
                    Årsag skal udfyldes når klæbning ikke er intakt
                  </span>
                )}
              </div>
            </div>

            {/* Kolonne 2: Type + Hvis Andet */}
            <div className="flex flex-col gap-xs">
              <div className="flex items-center gap-md">
                <label className={KS_LABEL_CLS + ' shrink-0'}>Type</label>
                {/* OptionToggle: samme styling som JaNejToggle, options Emulsion/Andet, default emulsion */}
                <div className="flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit">
                  {(['emulsion', 'andet'] as const).map(opt => {
                    const isActive = klæbningType === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setKlæbningType(opt)
                          if (opt !== 'andet') setKlæbningAndetDirty(false)
                        }}
                        aria-pressed={isActive}
                        className={[
                          'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                          isActive ? 'bg-dark-teal text-white' : 'text-text-muted hover:bg-soft-aqua',
                        ].join(' ')}
                      >
                        {opt === 'emulsion' ? 'Emulsion' : 'Andet'}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-xxxs">
                <label className={KS_LABEL_CLS}>Hvis Andet{klæbningType === 'andet' ? ' *' : ''}</label>
                <textarea
                  rows={2}
                  value={klæbningAndet}
                  onChange={e => setKlæbningAndet(e.target.value)}
                  onBlur={() => { if (klæbningType === 'andet') setKlæbningAndetDirty(true) }}
                  placeholder="Specificér…"
                  className={KS_INPUT_CLS + ' resize-y' + (visAndetFejl ? ' border-bad' : '')}
                />
                {visAndetFejl && (
                  <span className="font-inter text-xxs text-bad">
                    Specifikation skal udfyldes når type er Andet
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Mængde */}
          <div className="flex items-center gap-xs">
            <div className="flex flex-col gap-xxxs flex-1 max-w-[140px]">
              <label className={KS_LABEL_CLS}>Mængde (Kg/m²)</label>
              <input type="number" defaultValue="" step="0.01" min="0" placeholder="0,00" className={KS_INPUT_CLS} />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Udlægning + konstateret */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Udlægning og konstateret</legend>
        <div className="mt-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-lg gap-y-xs">
            {/* Venstre: Krav opfyldt */}
            <div className="space-y-xs">
              <p className="font-inter text-xs font-semibold text-text-muted">Krav opfyldt</p>
              {([
                { label: 'Samlinger', value: kravSamlinger, set: setKravSamlinger },
                { label: 'Profil',    value: kravProfil,    set: setKravProfil    },
                { label: 'Jævnhed',  value: kravJaevnhed,  set: setKravJaevnhed  },
              ] as const).map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-sm">
                  <span className={KS_LABEL_CLS + ' w-20 shrink-0'}>{label}</span>
                  <JaNejToggle value={value} onChange={set} />
                </div>
              ))}
            </div>

            {/* Højre: Er der konstateret */}
            <div className="space-y-xs">
              <p className="font-inter text-xs font-semibold text-text-muted">Er der konstateret</p>
              {([
                { label: 'Rivninger',  value: konstRivninger,  set: setKonstRivninger  },
                { label: 'Svedninger', value: konstSvedninger, set: setKonstSvedninger },
                { label: 'Driftsstop', value: konstDriftsstop, set: setKonstDriftsstop },
              ] as const).map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-sm">
                  <span className={KS_LABEL_CLS + ' w-20 shrink-0'}>{label}</span>
                  <JaNejToggle value={value} onChange={set} />
                </div>
              ))}
            </div>
          </div>

          {/* Forklaring — spænder over begge kolonner */}
          <div className="flex flex-col gap-xxxs mt-sm">
            <label className={KS_LABEL_CLS}>Forklaring</label>
            <input
              type="text"
              defaultValue=""
              placeholder="Beskriv eventuelle afvigelser…"
              className={KS_INPUT_CLS}
            />
          </div>
        </div>
      </fieldset>

      {/* Færdiggørelse */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Færdiggørelse</legend>
        <div className="space-y-xs mt-xs">
          {/* Toggles i fælles grid: kolonne 1 sizer til længste tekst → begge toggles
              står justeret under hinanden, tæt på teksten (ikke ved yderkanten). */}
          <div className="grid grid-cols-[auto_auto] gap-x-md gap-y-xs items-center w-fit">
            {([
              { label: 'Rensning af dæksler og riste', value: rensningDaeksler, set: setRensningDaeksler },
              { label: 'Rensning af sandfang',          value: rensningDandfang, set: setRensningDandfang },
            ] as const).flatMap(({ label, value, set }) => [
              <span key={`${label}-label`} className={KS_LABEL_CLS}>{label}</span>,
              <JaNejToggle key={`${label}-toggle`} value={value} onChange={set} />,
            ])}
          </div>

          {/* Ingen MKS krav */}
          <div className="flex items-center gap-xs">
            <input
              type="checkbox"
              id="mks-ingen-krav"
              className="accent-deep-teal w-4 h-4 rounded"
            />
            <label htmlFor="mks-ingen-krav" className="font-inter text-xs text-text-primary cursor-pointer">
              Ingen MKS krav
            </label>
          </div>

          {/* Aftalt med */}
          <div className="flex flex-col gap-xxxs">
            <label htmlFor="mks-aftalt-med" className={KS_LABEL_CLS}>Aftalt med</label>
            <input
              id="mks-aftalt-med"
              type="text"
              defaultValue=""
              placeholder="Navn på kontaktperson…"
              className={KS_INPUT_CLS}
            />
          </div>
        </div>
      </fieldset>

      {/* Ekstraarbejde */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Ekstraarbejde</legend>
        <div className="mt-xs">
          <EkstraarbejdeBlok {...ekstraarbejde} />
        </div>
      </fieldset>

      {/* Bemærkninger */}
      <fieldset className="border border-hairline rounded-lg p-sm">
        <legend className="font-poppins text-xs font-semibold text-text-primary px-xs">Bemærkninger</legend>
        <textarea
          defaultValue=""
          placeholder="Skriv eventuelle bemærkninger her…"
          rows={3}
          className={KS_INPUT_CLS + ' mt-xs resize-none'}
        />
      </fieldset>

      {/* Gem-knap */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setMksSaved(true)}
          className={
            mksSaved
              ? 'font-poppins font-semibold text-xs px-md py-xs rounded-md transition-colors bg-good text-white cursor-default'
              : 'font-poppins font-semibold text-xs px-md py-xs rounded-md transition-colors bg-yellow text-deep-teal hover:opacity-90 active:scale-[0.98]'
          }
        >
          {mksSaved ? 'Gemt' : 'Gem'}
        </button>
      </div>
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

function UdfoerselContent({ forundersoegelseFotos, onAddPhotos, vognmandBekraeftelse, vognmandMaterielBekraeftelse, products, isSamleordreMode, samleordreCtx, samleordreTabOrderNr, makeOrdredetaljerCard, renderOrdredetaljerCollapsedPille, selectedDate, onSelectDate, ekstraLinjer, setEkstraLinjer, ekstraSent, setEkstraSent, materielUiState, etaper, transportPlaner }: {
  forundersoegelseFotos: MockPhoto[]
  onAddPhotos: (p: MockPhoto[]) => void
  vognmandBekraeftelse?: VognmandBekraeftelse
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  /** Alle produkter i ordren — bruges til produkt+dato-selector */
  products: MockProduct[]
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Aktivt ordrenummer i samleordre-tab — bruges til per-child dagsoverblik */
  samleordreTabOrderNr?: string
  /** Factory-funktion til Ordredetaljer-visning — kald med hideTabs=true for at skjule tab-rækken.
   *  cardMode='udfoersel' viser AFLYSNING-cellen i dag-kontekst (selectedDate). */
  makeOrdredetaljerCard: (
    hideTabs?: boolean,
    cardMode?: 'planlaegning' | 'udfoersel',
    udfoerselSelectedDate?: string,
  ) => ReactNode
  /** Renderer kompakt hvid pille der vises når Ordredetaljer-sektionen er collapsed.
   *  Indeholder dato-range, mængde tons og produkt — matcher Forundersøgelse-pillen visuelt. */
  renderOrdredetaljerCollapsedPille: () => ReactNode
  /** Valgt dato — hejst til OrdrePlanScreen-root så Udførsel + Afregning deler state */
  selectedDate: string
  /** Setter for valgt dato — kaldes ved klik på dato-pille */
  onSelectDate: (date: string) => void
  /** Ekstralinjer — løftet til root så AfregningContent kan aflæse dem */
  ekstraLinjer: EkstraLinje[]
  setEkstraLinjer: React.Dispatch<React.SetStateAction<EkstraLinje[]>>
  /** Om ekstraarbejde er sendt (godkendt) — løftet til root */
  ekstraSent: boolean
  setEkstraSent: (b: boolean) => void
  /** Etape-bevidst UX-tilstand for materiel-sektionen — afledt af selectedDate + etaper i root */
  materielUiState: MaterielUiState
  /** Klyngede etaper for ordren (fra root) */
  etaper: Etape[]
  /** Transport-planer keyed på transportKey(resourceId, etapeId) (fra root) */
  transportPlaner: Record<string, MaterielTransportPlan>
}) {
  const setSelectedDate = onSelectDate

  // ── Dagsdata — hardcoded for demo, TODO: hent fra ordre-objekt når Supabase klar ───
  const DEMO_ORDRE_ID = '260423891'
  const DEMO_DATO = new Date().toISOString().slice(0, 10)

  const { recept } = useRecept('82101H') // SMA 11S — TODO: Erstat med Supabase når klar — bruges i spec-grid
  const { vejesedler } = useVejesedler(DEMO_ORDRE_ID, DEMO_DATO)
  // Udlægning-state (tonsAnkommet, forventetUdlagtM2, faktiskRegistrering, gemFaktisk)
  // er løftet til OrdrePlanScreen-root så AfregningContent kan bruge det direkte.

  const [underlaegsType, setUnderlaegsType] = useState<UnderlagType | ''>('asfalt')
  const [underlaegsAndet, setUnderlaegsAndet] = useState('')
  const [tilfredsstillende, setTilfredsstillende] = useState<boolean | null>(null)
  const [underlaegsAarsager, setUnderlaegsAarsager] = useState<Set<UnderlaegsAarsag>>(new Set())
  const [aftaltMed, setAftaltMed] = useState('')
  const [forbehold, setForbehold] = useState('')
  const [saved, setSaved] = useState(false)
  const [forundersoegelseOpen, setForundersoegelseOpen] = useState(false)

  // ── KS-rapportering state ────────────────────────────────────────────────────
  const [ksExpanded, setKsExpanded] = useState(false)
  const [ksActiveTab, setKsActiveTab] = useState<'a3' | 'a4' | 'mks'>('mks')
  // Ekstraarbejde-state er løftet til OrdrePlanScreen-root (deles med AfregningContent via props)

  // ── Samleordre per-ordre vejeseddel-state ────────────────────────────────────
  // Kun aktiv i samleordre-mode: formanden kan logge temperatur + udlægger separat pr. ordre pr. vejeseddel.
  // Default: anchor-ordre (første child med isAnchor). TODO: Erstat med Supabase når klar
  const [vejeseddelSelectedOrdre, setVejeseddelSelectedOrdre] = useState<Record<string, string>>({})
  const [vejeseddelTempPerOrdre, setVejeseddelTempPerOrdre] = useState<Record<string, Record<string, number>>>({})
  const [vejeseddelUdlaeggerPerOrdre, setVejeseddelUdlaeggerPerOrdre] = useState<Record<string, Record<string, string>>>({})

  /** Returnerer aktuelt valgt ordrenummer for en vejeseddel — fallback til anchor-child */
  function getSelectedOrdreForVs(vsId: string): string {
    return (
      vejeseddelSelectedOrdre[vsId] ??
      samleordreCtx?.children.find((c) => c.isAnchor)?.orderNumber ??
      samleordreCtx?.children[0]?.orderNumber ??
      ''
    )
  }

  // Mini-strip: om fuld spec-grid er åben
  const [detailsExpanded, setDetailsExpanded] = useState(true)

  // ── SMS-status state — per regnr (nøgle). Initialiseres fra mock-data.
  // TODO: Erstat med Supabase når klar — confirmed_vehicles[].sms_status pr. (ordre, dag, reg_nr)
  const [smsStatusMap, setSmsStatusMap] = useState<Record<string, ChauffoerSmsStatus>>(() => {
    const map: Record<string, ChauffoerSmsStatus> = {}
    const biler = vognmandBekraeftelse?.biler ?? []
    for (const b of biler) {
      if (!b.er_materiel_bil) {
        map[b.regnr] = b.sms_status ?? 'ikke_sendt'
      }
    }
    return map
  })

  /** Send SMS → sætter status 'sendt' for det givne regnr. */
  function sendSms(regnr: string) {
    setSmsStatusMap(prev => ({ ...prev, [regnr]: 'sendt' }))
  }

  // ── Materiel SMS-status state — pr. chauffør-nøgle (regnr på transport-bilen).
  // Kører samme chauffør flere materiel-enheder, vises kun ÉN knap (konsolideret SMS).
  // Nøgle = regnr (unikt pr. transport-bil; samme bil = samme chauffør for materiel).
  // TODO: Erstat med Supabase når klar — materiel_transport[].sms_status pr. (ordre, dag, regnr)
  const [materielSmsStatusMap, setMaterielSmsStatusMap] = useState<Record<string, ChauffoerSmsStatus>>(() => {
    const map: Record<string, ChauffoerSmsStatus> = {}
    const items = vognmandMaterielBekraeftelse?.items ?? []
    // Første unikke regnr (øverste transport-bil) vises som 'sendt' — demo-default
    let foerste = true
    for (const item of items) {
      if (!(item.regnr in map)) {
        map[item.regnr] = foerste ? 'sendt' : 'ikke_sendt'
        foerste = false
      }
    }
    return map
  })

  /** Send materiel SMS → sætter status 'sendt' for transport-bilens regnr (dækker alle enheder på bilen). */
  function sendMaterielSms(regnr: string) {
    setMaterielSmsStatusMap(prev => ({ ...prev, [regnr]: 'sendt' }))
  }

  // ── Expand-state for tabeller (biler + materiel)
  const [bilerTableExpanded, setBilerTableExpanded] = useState(false)
  const [materielTableExpanded, setMaterielTableExpanded] = useState(false)

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

  // Dato-piller: faktisk-planlagte dage (tonsPlanned > 0 && !cancelled) — ikke contiguous fill.
  // Spejler "Udføres i perioden = kun PLAN-planlagte dage"-reglen (FF Flow 1, LÅST 2026-06-23).
  // TODO: Erstat med Supabase når klar — dage fra plan_dag-tabellen.
  const udfoerselDays = useMemo<string[]>(() => {
    const datoSet = new Set<string>()
    for (const p of products) {
      for (const d of p.days) {
        if (d.tonsPlanned > 0 && !d.cancelled) datoSet.add(d.date)
      }
    }
    return [...datoSet].sort()
  }, [products])

  return (
    <div className="flex flex-col gap-[48px]">

      {/* ── Udføres i perioden — første sektion på Udførsel-mode (flyttet 2026-06-05) ── */}
      {udfoerselDays.length > 0 && (
        <section>
          <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Udføres i perioden</h2>
          <div className="flex items-center gap-xs flex-wrap">
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
                        ? 'bg-white border border-hairline text-text-muted line-through hover:border-dark-teal'
                        : 'bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal',
                  ].join(' ')}
                >
                  {formatLongDate(ds)}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Ordredetaljer-section — identisk med Planlægning-mode ───────
          Indkapslet i OrdredetaljerSection. cardMode='udfoersel' aktiverer
          dag-kontekst i AFLYSNING-cellen via makeOrdredetaljerCard-args. */}
      <OrdredetaljerSection
        expanded={detailsExpanded}
        onToggle={() => setDetailsExpanded(e => !e)}
        renderCard={() => makeOrdredetaljerCard(false, 'udfoersel')}
        renderCollapsedPille={renderOrdredetaljerCollapsedPille}
      />

      {/* ── Status-bokse ────────────────────────────────────────────────
          Kun synlige når Ordredetaljer er expanded.
          Én toggle styrer både Ordredetaljer OG status-boksene. */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      {detailsExpanded && (
      <>
      <div className="flex flex-col gap-xs -mt-[48px]">
        <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Bekræftede biler</h2>
        {/* Alle 7 bokse i ét fælles grid — samme bredde og højde via auto-rows-fr */}
        {(() => {
          // Per-child værdier når i samleordre-mode — fallback til global state for enkelt-ordre
          const activeChild = isSamleordreMode && samleordreCtx
            ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
            : undefined

          const displayBilerBekraeftet = activeChild !== undefined ? activeChild.vognmandBekraeftet : !!vognmandBekraeftelse
          const displayAntalMateriel = activeChild !== undefined ? activeChild.antalMateriel : (vognmandMaterielBekraeftelse?.items.length ?? 0)
          const displayMaterielBekraeftet = activeChild !== undefined ? activeChild.materielBekraeftet : !!(vognmandMaterielBekraeftelse && vognmandMaterielBekraeftelse.items.length > 0)
          // ── Bekræftet detalje (LÅST 2026-06-13) ──────────────────────────
          // Bilbestillingen er en ønskeliste; vognmandens bekræftede data kan afvige.
          // Vises kun i enkelt-ordre (samleordre har ikke per-child bil-liste i mock).
          // TODO: Erstat med Supabase — confirmed_vehicles[] pr. (ordre, dag).
          const optælTyper = (typer: string[]): string => {
            const m = new Map<string, number>()
            typer.forEach(t => m.set(t, (m.get(t) ?? 0) + 1))
            return Array.from(m.entries()).map(([t, n]) => `${n}× ${t}`).join(' · ')
          }
          const byTid = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

          // Biler-boks: asfalt-biler (materiel-biler hører til Materiel-boksen)
          const asfaltBiler = (vognmandBekraeftelse?.biler ?? []).filter(b => !b.er_materiel_bil)
          const bilerTypeTekst = optælTyper(asfaltBiler.map(b => b.biltype))
          const visBilDetalje = activeChild === undefined && displayBilerBekraeftet && asfaltBiler.length > 0

          // Materiel-boks: unik transport-bil pr. reg.nr (én bil kan bære flere enheder)
          const materielItems = vognmandMaterielBekraeftelse?.items ?? []
          const materielTypeTekst = optælTyper(materielItems.map(m => m.transportType))
          const seenRegnr = new Set<string>()
          const materielBilerUnik = materielItems.filter(m => {
            if (seenRegnr.has(m.regnr)) return false
            seenRegnr.add(m.regnr)
            return true
          })
          const materielSorted = [...materielBilerUnik].sort((a, b) => byTid(a.ankomst_plads_tid ?? '', b.ankomst_plads_tid ?? ''))
          const visMaterielDetalje = activeChild === undefined && displayMaterielBekraeftet && materielItems.length > 0

          // Tabel-slice: vis 3 default; knap folder resten ud
          const TABEL_DEFAULT = 3
          const bilerSorted = [...asfaltBiler].sort((a, b) => (a.laes_nummer ?? 99) - (b.laes_nummer ?? 99))
          const bilerVis = bilerTableExpanded ? bilerSorted : bilerSorted.slice(0, TABEL_DEFAULT)
          const materielVis = materielTableExpanded ? materielSorted : materielSorted.slice(0, TABEL_DEFAULT)

          return (
            <div className="flex flex-col gap-sm">
              {/* Biler — tabel i enkelt-ordre bekræftet-tilstand; status-kort ellers */}
              {visBilDetalje ? (
                /* ── Biler-tabel (bekræftet, enkelt-ordre) — FF Trin 7 + 7b (LÅST 2026-06-15) ── */
                <div className="overflow-hidden rounded-xl border border-good/30 bg-good-bg">
                  {/* Tabel-header */}
                  <div className="flex items-center justify-between px-sm py-xs border-b border-good/20">
                    <div className="flex items-center gap-xs">
                      <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Biler</span>
                    </div>
                    <span className="font-poppins font-semibold text-sm text-text-primary">{bilerTypeTekst}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-good/15 bg-good-bg/60">
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Reg.nr</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Biltype</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Chauffør</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Telefon</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Ankomst plads</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Mødetid fabrik</th>
                          <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">SMS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bilerVis.map((b, i) => {
                          const isLast = i === bilerVis.length - 1 && !(!bilerTableExpanded && bilerSorted.length > TABEL_DEFAULT)
                          const smsStatus = smsStatusMap[b.regnr] ?? 'ikke_sendt'
                          const erSendt = smsStatus === 'sendt'
                          return (
                            <tr key={b.regnr} className={isLast ? '' : 'border-b border-good/15'}>
                              <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">{formatRegnr(b.regnr)}</td>
                              <td className="align-middle font-inter text-xs text-text-muted px-xs py-xs whitespace-nowrap">{b.biltype}</td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{b.chauffoer}</td>
                              <td className="align-middle px-xs py-xs">
                                <a
                                  href={`tel:${toE164(b.tlf) ?? b.tlf.replace(/\s/g, '')}`}
                                  className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors whitespace-nowrap"
                                >
                                  {formatPhone(b.tlf)}
                                </a>
                              </td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                                {b.ankomst_plads_tid ?? '—'}
                              </td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                                {b.moedetid_fabrik ?? '—'}
                              </td>
                              <td className="align-middle px-xs py-xs text-right">
                                <span className="inline-flex items-center gap-xxxs justify-end">
                                  {erSendt ? (
                                    <>
                                      <span
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-good bg-good-bg border border-good/40 rounded-md px-xs min-h-[44px] min-w-[44px]"
                                        aria-label={`Ordre sendt til chauffør ${b.chauffoer}`}
                                      >
                                        Ordre sendt til chauffør
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => sendSms(b.regnr)}
                                        aria-label={`Gensend ordre til ${b.chauffoer}`}
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-[44px] min-w-[44px]"
                                      >
                                        Gensend ordre
                                      </button>
                                    </>
                                  ) : smsStatus === 'aendret_siden_afsendelse' ? (
                                    <>
                                      <span
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-warning bg-warning-bg border border-warning/40 rounded-md px-xs min-h-[44px] min-w-[44px]"
                                        aria-label={`Ordre opdateret siden afsendelse — ${b.chauffoer}`}
                                      >
                                        Ordre opdateret
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => sendSms(b.regnr)}
                                        aria-label={`Gensend ordre til ${b.chauffoer}`}
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-[44px] min-w-[44px]"
                                      >
                                        Gensend ordre
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs text-text-muted border border-hairline rounded-md px-xs min-h-[44px] min-w-[44px]"
                                        aria-label={`Ordre afventer afsendelse — ${b.chauffoer}`}
                                      >
                                        Afventer afsendelse
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => sendSms(b.regnr)}
                                        aria-label={`Send ordre til ${b.chauffoer} nu`}
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-[44px] min-w-[44px]"
                                      >
                                        Send ordre nu
                                      </button>
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Expand-knap — kun synlig når der er >3 biler */}
                  {bilerSorted.length > TABEL_DEFAULT && (
                    <div className="border-t border-good/15 px-xs py-xxxs">
                      <button
                        type="button"
                        onClick={() => setBilerTableExpanded(e => !e)}
                        className="w-full flex items-center justify-center gap-xxxs font-inter text-xxs font-medium text-text-muted hover:text-deep-teal transition-colors min-h-touch"
                        aria-expanded={bilerTableExpanded}
                      >
                        {bilerTableExpanded ? (
                          <>
                            <ChevronUp size={13} aria-hidden="true" /> Vis færre
                          </>
                        ) : (
                          <>
                            <ChevronDown size={13} aria-hidden="true" /> Vis alle ({bilerSorted.length})
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {/* ── Materiel transport — etape-bewidst branch (Round 3 — LÅST 2026-06-23) ─────────
                  'planlaeg' | 'ny-etape' → eksisterende tabel (transport sker denne dag)
                  'paa-pladsen'           → read-only MaterielPaaPladsenTilstand (transport afsluttet)
                  'dvale'                 → MaterielDvaleTilstand (gap mellem etaper)
                  Asfalt-biler-sektionen OVENFOR er urørt — den er IKKE etape-branchet.
                  TODO: Erstat MATERIEL_ENHEDER med Supabase-data når klar. */}
              {(materielUiState === 'paa-pladsen') ? (() => {
                // Find aktiv etape for selectedDate
                const aktivEtape = etaper.find(e => e.dates.includes(selectedDate))
                if (!aktivEtape) return null
                // Map lokale MaterielEnhed → MaterielEnhedTilstand (id, plantNumber, description)
                const tilstandEnheder: MaterielEnhedTilstand[] = MATERIEL_ENHEDER.map(m => ({
                  id: m.anlaegsNr,
                  plantNumber: m.anlaegsNr,
                  description: m.beskrivelse,
                }))
                return (
                  <MaterielPaaPladsenTilstand
                    resources={tilstandEnheder}
                    etape={aktivEtape}
                    transportPlaner={transportPlaner}
                  />
                )
              })() : (materielUiState === 'dvale') ? (() => {
                // Find næste etapes startdato — vis til formanden hvis planlagt
                const naestEtape = etaper.find(e => e.startDate > selectedDate)
                return (
                  <MaterielDvaleTilstand
                    naestEtapeStartDato={naestEtape?.startDate}
                  />
                )
              })() : (
              /* 'planlaeg' | 'ny-etape' — eksisterende materiel-transport-tabel (uændret) */
              /* Materiel transport — tabel i enkelt-ordre bekræftet-tilstand; status-kort ellers */
              visMaterielDetalje ? (
                /* ── Materiel-tabel (bekræftet, enkelt-ordre) — FF Trin 7 (LÅST 2026-06-15) ── */
                <div className="overflow-hidden rounded-xl border border-good/30 bg-good-bg">
                  <div className="flex items-center justify-between px-sm py-xs border-b border-good/20">
                    <div className="flex items-center gap-xs">
                      <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Materiel transport</span>
                    </div>
                    <span className="font-poppins font-semibold text-sm text-text-primary">{materielTypeTekst}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-good/15 bg-good-bg/60">
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Anlæg</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Beskrivelse</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Transport</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Chauffør</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Telefon</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Ankomst</th>
                          <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">SMS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Saml alle items der hører til de synlige transport-biler (én bil kan bære flere anlæg)
                          const synligeRegnr = new Set(materielVis.map(m => m.regnr))
                          const synligeItems = materielItems.filter(m => synligeRegnr.has(m.regnr))
                          // Konsolideringsnøgle = regnr (unikt pr. transport-bil; samme bil = samme chauffør).
                          // SMS-knap vises KUN på første række pr. regnr — øvrige rækker er tom td (rowspan emuleret).
                          const seenSmsRegnr = new Set<string>()
                          return synligeItems.map((m, i) => {
                            const isLast = i === synligeItems.length - 1 && !(!materielTableExpanded && materielSorted.length > TABEL_DEFAULT)
                            // Er dette den første enhed for denne transport-bil (chauffør)?
                            const erFoersteForChauffoer = !seenSmsRegnr.has(m.regnr)
                            if (erFoersteForChauffoer) seenSmsRegnr.add(m.regnr)
                            // SMS-status keyed by regnr (chauffør-niveau)
                            const materielSmsStatus = materielSmsStatusMap[m.regnr] ?? 'ikke_sendt'
                            const erSendt = materielSmsStatus === 'sendt'
                            return (
                              <tr key={m.resourceId} className={isLast ? '' : 'border-b border-good/15'}>
                                <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs whitespace-nowrap">{m.anlaegsNr}</td>
                                <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{m.beskrivelse}</td>
                                <td className="align-middle px-xs py-xs whitespace-nowrap">
                                  <span className="font-inter text-xs tabular-nums text-text-primary">{formatRegnr(m.regnr)}</span>
                                  <span className="font-inter text-xs text-text-muted ml-xxxs">({m.transportType})</span>
                                </td>
                                <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{m.chauffoer}</td>
                                <td className="align-middle px-xs py-xs">
                                  <a
                                    href={`tel:${toE164(m.tlf) ?? m.tlf.replace(/\s/g, '')}`}
                                    className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors whitespace-nowrap"
                                  >
                                    {formatPhone(m.tlf)}
                                  </a>
                                </td>
                                <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                                  {m.ankomst_plads_tid ?? '—'}
                                </td>
                                {/* SMS-kolonne — konsolideret pr. chauffør (regnr-nøgle).
                                    Kun første række pr. chauffør viser knap/pille; øvrige rækker er tomme. */}
                                <td className="align-middle px-xs py-xs text-right">
                                  {erFoersteForChauffoer ? (
                                    <span className="inline-flex items-center gap-xxxs justify-end">
                                      {erSendt ? (
                                        <>
                                          <span
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-good bg-good-bg border border-good/40 rounded-md px-xs min-h-touch min-w-touch"
                                            aria-label={`Ordre sendt til chauffør ${m.chauffoer}`}
                                          >
                                            Ordre sendt til chauffør
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => sendMaterielSms(m.regnr)}
                                            aria-label={`Gensend ordre til ${m.chauffoer}`}
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                          >
                                            Gensend ordre
                                          </button>
                                        </>
                                      ) : materielSmsStatus === 'aendret_siden_afsendelse' ? (
                                        <>
                                          <span
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-warning bg-warning-bg border border-warning/40 rounded-md px-xs min-h-touch min-w-touch"
                                            aria-label={`Ordre opdateret siden afsendelse — ${m.chauffoer}`}
                                          >
                                            Ordre opdateret
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => sendMaterielSms(m.regnr)}
                                            aria-label={`Gensend ordre til ${m.chauffoer}`}
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                          >
                                            Gensend ordre
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <span
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs text-text-muted border border-hairline rounded-md px-xs min-h-touch min-w-touch"
                                            aria-label={`Ordre afventer afsendelse — ${m.chauffoer}`}
                                          >
                                            Afventer afsendelse
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => sendMaterielSms(m.regnr)}
                                            aria-label={`Send ordre til ${m.chauffoer} nu`}
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                          >
                                            Send ordre nu
                                          </button>
                                        </>
                                      )}
                                    </span>
                                  ) : null}
                                </td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {materielSorted.length > TABEL_DEFAULT && (
                    <div className="border-t border-good/15 px-xs py-xxxs">
                      <button
                        type="button"
                        onClick={() => setMaterielTableExpanded(e => !e)}
                        className="w-full flex items-center justify-center gap-xxxs font-inter text-xxs font-medium text-text-muted hover:text-deep-teal transition-colors min-h-touch"
                        aria-expanded={materielTableExpanded}
                      >
                        {materielTableExpanded ? (
                          <>
                            <ChevronUp size={13} aria-hidden="true" /> Vis færre
                          </>
                        ) : (
                          <>
                            <ChevronDown size={13} aria-hidden="true" /> Vis alle ({materielSorted.length})
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Materiel status-kort (ikke-bekræftet eller samleordre) — uændret ── */
                <div className={`flex flex-col items-start min-w-0 w-full min-h-[120px] px-sm py-xs rounded-xl border ${displayMaterielBekraeftet ? 'bg-good-bg border-good/30' : 'bg-surface border-hairline'}`}>
                  <div className="w-full flex items-center justify-between gap-xs">
                    <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Materiel transport</span>
                    {displayMaterielBekraeftet && (
                      <span className="font-inter text-xxs font-semibold text-good">Bekræftet</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-end pb-xxxs">
                    <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">{displayAntalMateriel}</span>
                  </div>
                  <span className="font-inter text-xs text-text-muted min-h-[1em]">
                    {displayMaterielBekraeftet ? 'Bekræftet vognmand' : 'Afventer bekræftelse'}
                  </span>
                </div>
              /* visMaterielDetalje-ternary slutter */
              )
              /* planlaeg/ny-etape-branch slutter */
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

      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <section>
        {/* Header: vis aktiv child-sted i samleordre-mode så formanden ser hvilken ordre detaljer tilhører */}
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">
          Forundersøgelse
          {isSamleordreMode && samleordreCtx && (() => {
            const activeChildForHeader = samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
            return activeChildForHeader ? (
              <span className="font-inter text-sm font-normal text-text-muted ml-xs">— {activeChildForHeader.stedLabel}</span>
            ) : null
          })()}
        </h2>
        {/* Hint-banner fjernet — aktiv ordre er synlig via tabs på Ordredetaljer-rækken */}
        <div className={`w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm`}>
          <button
            type="button"
            onClick={() => setForundersoegelseOpen(o => !o)}
            className="w-full flex items-start justify-between px-md py-sm cursor-pointer hover:border-hairline-2 transition-colors"
            aria-expanded={forundersoegelseOpen}
          >
            {/* Collapsed preview — per-child i samleordre-mode, global i enkelt-ordre */}
            {(() => {
              const activeChildForF = isSamleordreMode && samleordreCtx
                ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
                : undefined
              const childDetails = activeChildForF?.forundersoegelseDetails
              // I samleordre-mode bruger vi per-child details til preview; globale felter bruges kun i enkelt-ordre
              const displayUnderlaegsType = childDetails !== undefined ? childDetails.underlaegsType : underlaegsType
              const displayTilfredsstillende = childDetails !== undefined ? childDetails.tilfredsstillende : tilfredsstillende
              const displayPhotoCount = childDetails !== undefined ? childDetails.photoCount : forundersoegelseFotos.length
              const displayComment = childDetails !== undefined ? childDetails.besigtigelseComment : ''
              const displayVurderet = displayUnderlaegsType !== null && displayUnderlaegsType !== undefined && displayUnderlaegsType !== ''
                && displayTilfredsstillende !== null && displayTilfredsstillende !== undefined
              return (
                <>
                  <div className="flex flex-col gap-xxxs items-start">
                    {!forundersoegelseOpen && (
                      <div className="text-xs text-text-muted font-inter">
                        {displayUnderlaegsType ? (
                          <>
                            <span className="font-semibold text-text-secondary">
                              {displayUnderlaegsType === 'asfalt' ? 'Asfalt'
                                : displayUnderlaegsType === 'beton' ? 'Beton'
                                : displayUnderlaegsType === 'grus' ? 'Grus'
                                : displayUnderlaegsType}
                            </span>
                            {' · '}
                            {displayTilfredsstillende === true ? 'Tilfredsstillende' : displayTilfredsstillende === false ? 'Ikke tilfredsstillende' : 'Tilstand ikke vurderet'}
                            {' · '}
                            {displayPhotoCount} {displayPhotoCount === 1 ? 'billede' : 'billeder'}
                            {displayComment ? <> · {displayComment}</> : null}
                            {!childDetails && ekstraLinjer.length > 0 && <> · {ekstraLinjer.length} ekstraarbejde</>}
                          </>
                        ) : (
                          <span className="italic">Ikke udfyldt endnu</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-xs">
                    {!forundersoegelseOpen && (
                      displayVurderet ? (
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
                </>
              )
            })()}
          </button>

        {forundersoegelseOpen && <div className="flex flex-col gap-sm p-md pt-sm">

          {/* ── Række 1: Underlag + Tilstand ─────────────────────── */}
          <div className="grid grid-cols-2 rounded-xl border border-hairline overflow-hidden">

            {/* Underlag dropdown */}
            <div className="p-md">
              <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
                Underlag / Bund
              </p>
              <div className="relative">
                <select
                  value={underlaegsType}
                  onChange={e => { setUnderlaegsType(e.target.value as UnderlagType); setSaved(false) }}
                  className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs pr-[32px] focus:outline-none focus:border-dark-teal transition-colors appearance-none cursor-pointer"
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
                  className="mt-xs w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors"
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
                <JaNejToggle
                  value={tilfredsstillende === true ? 'ja' : tilfredsstillende === false ? 'nej' : null}
                  onChange={v => { setTilfredsstillende(v === 'ja'); setSaved(false) }}
                />
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
                    className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors"
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
              className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors resize-none leading-relaxed mb-xs"
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

          {/* ── Ekstraarbejde (delt state — se også MKS-skema) ──────── */}
          <EkstraarbejdeBlok
            linjer={ekstraLinjer}
            onAdd={addEkstraLinje}
            onUpdate={updateEkstraLinje}
            onRemove={removeEkstraLinje}
            sent={ekstraSent}
            onSend={() => { if (ekstraLinjer.length > 0) setEkstraSent(true) }}
            onReset={() => { setEkstraLinjer([]); setEkstraSent(false) }}
            hideSaveFooter
          />

          {/* ── Footer ────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-sm">
            <button
              onClick={() => { setSaved(true); if (ekstraLinjer.length > 0) setEkstraSent(true) }}
              className={[
                'font-inter text-sm font-semibold px-md py-xs rounded-xl transition-all active:scale-[0.98]',
                saved
                  ? 'bg-good text-white cursor-default'
                  : 'bg-yellow text-deep-teal hover:opacity-90',
              ].join(' ')}
            >
              {saved ? 'Gemt' : 'Gem forundersøgelse'}
            </button>
          </div>

        </div>}
        </div>
      </section>

      {/* ── Udlægning ── (flyttet til AfregningContent — vises under Afregning-mode) */}

      {/* ── KS-rapportering ──────────────────────────────────────────────────────
          Conditional: vises kun når mindst ét produkt har entreprisekontrol eller
          temperaturmaaling sat (1 eller 2). Union på tværs af alle produkter —
          strengeste vinder (2 > 1 > undefined).
          TODO: Erstat med Supabase når klar — hent fra PLAN-system pr. produkt
      ─────────────────────────────────────────────────────────────────────────── */}
      {(() => {
        // Beregn union af krav på tværs af alle produkter — strengeste vinder
        const maxEntreprisekontrol = products.reduce<1 | 2 | undefined>((max, p) => {
          if (p.entreprisekontrol === 2) return 2
          if (p.entreprisekontrol === 1 && max !== 2) return 1
          return max
        }, undefined)
        const maxTemperaturmaaling = products.reduce<1 | 2 | undefined>((max, p) => {
          if (p.temperaturmaaling === 2) return 2
          if (p.temperaturmaaling === 1 && max !== 2) return 1
          return max
        }, undefined)

        // Ingen krav → skjul hele sektionen
        if (!maxEntreprisekontrol && !maxTemperaturmaaling) return null

        // Niveau 2 (mindst ét produkt kræver det) → alle 3 tabs
        const showAllTabs = maxEntreprisekontrol === 2 || maxTemperaturmaaling === 2

        return (
          <section>
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">KS-rapportering</h2>
            <div className="w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm">
              <button
                type="button"
                onClick={() => setKsExpanded(o => !o)}
                className="w-full flex items-start justify-between px-md py-sm cursor-pointer hover:border-hairline-2 transition-colors"
                aria-expanded={ksExpanded}
              >
                {/* Venstre: collapsed preview-tekst */}
                <div className="flex flex-col gap-xxxs items-start">
                  {!ksExpanded && (
                    <div className="text-xs text-text-muted font-inter italic">
                      {showAllTabs ? 'A3, A4, MKS skal udfyldes' : 'MKS skal udfyldes'}
                    </div>
                  )}
                </div>

                {/* Højre: status-pille + chevron */}
                <div className="flex items-center gap-xs">
                  {!ksExpanded && (
                    <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-bad-bg text-bad border border-bad/30">
                      Mangler vurdering
                    </span>
                  )}
                  {ksExpanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                </div>
              </button>

            {ksExpanded && (
              <div className="p-md pt-sm">
                {/* Tab-rækken — identisk styling med makeOrdredetaljerCard-tabs (linje 1102-1128) */}
                <div className="inline-flex gap-xxxs">
                  {showAllTabs && (
                    <>
                      <button
                        onClick={() => setKsActiveTab('a3')}
                        aria-pressed={ksActiveTab === 'a3'}
                        className={[
                          'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                          ksActiveTab === 'a3'
                            ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                            : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                        ].join(' ')}
                      >
                        3a
                      </button>
                      <button
                        onClick={() => setKsActiveTab('a4')}
                        aria-pressed={ksActiveTab === 'a4'}
                        className={[
                          'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                          ksActiveTab === 'a4'
                            ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                            : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                        ].join(' ')}
                      >
                        4a
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setKsActiveTab('mks')}
                    aria-pressed={ksActiveTab === 'mks'}
                    className={[
                      'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                      ksActiveTab === 'mks'
                        ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                        : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                    ].join(' ')}
                  >
                    MKS
                  </button>
                </div>

                {/* Tab-content — box-pattern identisk med Udlægning-tab-content */}
                <div className="bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl p-md space-y-md">
                  {ksActiveTab === 'a3' && showAllTabs && (
                    <OvrigeOplysningerSkema3a
                      products={products}
                      selectedDate={selectedDate}
                    />
                  )}
                  {ksActiveTab === 'a4' && showAllTabs && (
                    <OvrigeOplysningerSkema
                      variant="4a"
                      products={products}
                      selectedDate={selectedDate}
                    />
                  )}
                  {ksActiveTab === 'mks' && (
                    <MksSkema
                      products={products}
                      selectedDate={selectedDate}
                      ekstraarbejde={{
                        linjer: ekstraLinjer,
                        onAdd: addEkstraLinje,
                        onUpdate: updateEkstraLinje,
                        onRemove: removeEkstraLinje,
                        sent: ekstraSent,
                        onSend: () => { if (ekstraLinjer.length > 0) setEkstraSent(true) },
                        onReset: () => { setEkstraLinjer([]); setEkstraSent(false) },
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            </div>
          </section>
        )
      })()}
      </>
      )}

      {/* ── Kørsel (synlig overskrift; tidl. "Vejesedler" — datanavnet Vejeseddel beholdes internt) ── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <section>
        <div className="flex items-center justify-between mb-sm">
          <h2 className="font-poppins font-semibold text-xl text-text-primary">Kørsel</h2>
          {/* Kompakt produkt-statusbar — pulje-læs-guard (Carsten 2026-06-05) */}
          {/* Logik: 1 aktivt produkt på dato → vis, 2+ → skjul (pulje-læs-risiko), 0 → skjul */}
          {/* TODO: Erstat med Supabase ordre-estimat pr. dag når klar */}
          {(() => {
            const aktiveProdukter = products.filter((p) =>
              p.days.some((d) => d.date === selectedDate && !d.cancelled)
            )
            if (aktiveProdukter.length !== 1) return null

            const produkt = aktiveProdukter[0]
            const dagsplan = produkt.days.find((d) => d.date === selectedDate && !d.cancelled)
            // effective tons = planlagt + evt. ekstra fra PLAN
            const estimat = dagsplan ? getEffectiveTons(dagsplan) : produkt.tonsTotal
            const udlagt = vejesedler
              .filter((v) => v.receptkode === produkt.recipeCode && v.status === 'udlagt')
              .reduce((sum, v) => sum + (v.tons ?? 0), 0)
            const pct = estimat > 0 ? Math.min(100, Math.round((udlagt / estimat) * 100)) : 0
            const produktNavn = INITIAL_RECEPTER[produkt.recipeCode]?.navn ?? produkt.recipeCode

            return (
              <div className="inline-flex items-center gap-xs bg-surface-2 rounded-full px-md py-xs">
                <span className="font-inter text-xxs font-semibold uppercase tracking-widest text-text-muted">
                  Status
                </span>
                <span className="font-poppins text-xs font-semibold text-text-primary">
                  {produktNavn}
                </span>
                <div className="h-2 w-28 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-good rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-poppins text-xs font-semibold text-text-secondary whitespace-nowrap">
                  {udlagt % 1 === 0 ? udlagt : udlagt.toFixed(1)} Tons af {estimat} Tons · {pct}%
                </span>
              </div>
            )
          })()}
        </div>
        <VejesedlerTable
          vejesedler={vejesedler}
          recepter={INITIAL_RECEPTER}
          minTemperatur={recept?.min_temperatur ?? 140}
          udlaeggerliste={INITIAL_UDLAEGGERE}
          onTemperatur={(vsId, temp) => {
            if (isSamleordreMode && samleordreCtx) {
              // Samleordre-mode: skriv temperatur til den valgte ordre på denne vejeseddel
              const ordreNr = getSelectedOrdreForVs(vsId)
              setVejeseddelTempPerOrdre(prev => ({
                ...prev,
                [vsId]: { ...(prev[vsId] ?? {}), [ordreNr]: temp },
              }))
            }
            // TODO (produktion): skriv retur til PLAN pr. ordre
          }}
          onUdlaegger={(vsId, materielNr) => {
            if (isSamleordreMode && samleordreCtx) {
              // Samleordre-mode: skriv udlægger-valg til den valgte ordre på denne vejeseddel
              const ordreNr = getSelectedOrdreForVs(vsId)
              setVejeseddelUdlaeggerPerOrdre(prev => ({
                ...prev,
                [vsId]: { ...(prev[vsId] ?? {}), [ordreNr]: materielNr },
              }))
            }
            // TODO (produktion): opdater vejeseddel pr. ordre
          }}
          samleordreChildren={
            isSamleordreMode && samleordreCtx && samleordreCtx.children.length > 1
              ? samleordreCtx.children.map(c => ({ orderNumber: c.orderNumber, stedLabel: c.stedLabel }))
              : undefined
          }
          vejeseddelSelectedOrdre={vejeseddelSelectedOrdre}
          onSelectOrdreForVs={(vsId, orderNumber) =>
            setVejeseddelSelectedOrdre(prev => ({ ...prev, [vsId]: orderNumber }))
          }
          vejeseddelTempPerOrdre={vejeseddelTempPerOrdre}
          vejeseddelUdlaeggerPerOrdre={vejeseddelUdlaeggerPerOrdre}
        />
      </section>

      {/* ── Bil- og tonsafregning + Materielafregning ─────────────────────────── */}
      {/* Sektionerne er flyttet til AfregningContent nedenfor (Afregning-mode i toggle). */}

    </div>
  )
}

// ─── AfregningContent ─────────────────────────────────────────────────────────
// Vises i Afregning-mode (tre-mode toggle). Indeholder Bil- og tonsafregning
// + Materielafregning (klipset fra UdfoerselContent 2026-05-22).

function AfregningContent({ vognmandBekraeftelse, todayDay, isSamleordreMode, samleordreCtx, samleordreTabOrderNr,
  recept, tonsAnkommet, forventetUdlagtM2, faktiskRegistrering,
  visUdlaegningInput, onSetVisUdlaegningInput, onGemFaktisk,
  demoTonsIDag, demoArealIDag, demoTykkelse, makeOrdredetaljerCard, renderOrdredetaljerCollapsedPille,
  products, selectedDate, onSelectDate, harEkstraarbejde, biltypeAfregning,
}: {
  vognmandBekraeftelse?: VognmandBekraeftelse
  /** Ubrugt nu — tilgængelig til fremtidig materiel-per-hold expansion */
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  todayDay?: DayPlan
  isSamleordreMode?: boolean
  samleordreCtx?: SamleordreContext | null
  samleordreTabOrderNr?: string
  /** Recept-objekt fra useRecept — bruges til Udlægning-sektion */
  recept?: ReturnType<typeof useRecept>['recept']
  /** Ankomne tons — fra useDagsoverblik */
  tonsAnkommet?: number
  /** Forventet udlagt m² — fra useDagsoverblik */
  forventetUdlagtM2?: number
  /** Faktisk m²/tons-registrering — fra useDagsoverblik */
  faktiskRegistrering?: DagsoverblikRegistrering | null
  /** Viser Udlægning-inputfelter inline */
  visUdlaegningInput?: boolean
  onSetVisUdlaegningInput?: (vis: boolean) => void
  /** Gem faktisk udlagt m² + tons */
  onGemFaktisk?: (m2: number, tons: number) => void
  /** Demo-konstanter — TODO: Erstat med Supabase når klar */
  demoTonsIDag?: number
  demoArealIDag?: number
  demoTykkelse?: number
  /** Renderer Ordredetaljer-spec-grid med tabs — identisk med Planlægning + Udførelse */
  makeOrdredetaljerCard: (
    hideTabs?: boolean,
    cardMode?: 'planlaegning' | 'udfoersel',
    udfoerselSelectedDate?: string,
  ) => ReactNode
  /** Renderer kompakt hvid pille der vises når Ordredetaljer-sektionen er collapsed.
   *  Indeholder dato-range, mængde tons og produkt — matcher Forundersøgelse-pillen visuelt. */
  renderOrdredetaljerCollapsedPille: () => ReactNode
  /** Alle produkter på ordren — bruges til Udlægning per-produkt tabs */
  products?: MockProduct[]
  /** Valgt dato — hejst til OrdrePlanScreen-root så Udførsel + Afregning deler state */
  selectedDate: string
  /** Setter for valgt dato — kaldes ved klik på dato-pille */
  onSelectDate: (date: string) => void
  /** Viser ekstraarbejde-flag i Udlagt-fanen — true når ekstraSent && ekstraLinjer.length > 0 */
  harEkstraarbejde?: boolean
  /** Fase 2: biltype→afregningsform fra Planlægningens kørselOrders for dagen.
   *  Bruges som base-form pr. bil — ovenpå: materiel-override + 1,5-times-override.
   *  Udledt i root fra kørselOrders[dayId] og dagAfregning[dayId]. */
  biltypeAfregning?: Record<string, 'time' | 'akkord'>
}) {
  // ── Ordredetaljer state (separat fra UdfoerselContent's detailsExpanded) ────
  const [detailsExpandedAfregning, setDetailsExpandedAfregning] = useState(true)

  // ── Afregningsperiode dato-piller — faktisk-planlagte dage ──────────────────
  // Matcher Udførsel-mode's sparse "Udføres i perioden"-sektion.
  // Bruger samme selectedDate (hejst til root) så valg deles med Udførsel + Afregning.
  // Spejler "Udføres i perioden = kun PLAN-planlagte dage"-reglen (FF Flow 1).
  // TODO: Erstat med Supabase når klar — dage fra plan_dag-tabellen.
  const afregningDays = useMemo<string[]>(() => {
    const datoSet = new Set<string>()
    for (const p of (products ?? [])) {
      for (const d of p.days) {
        if (d.tonsPlanned > 0 && !d.cancelled) datoSet.add(d.date)
      }
    }
    return [...datoSet].sort()
  }, [products])

  // ── Udlægning per-produkt tabs state ─────────────────────────────────────────
  // Bestemmer hvilke produkter der vises tabs for i Udlægning-sektionen.
  // I samleordre-mode: produkter på den aktuelt valgte child-ordre (samleordreTabOrderNr).
  // I normal mode: produkter på ordren (products-prop).
  const produkterForUdlaegning = (() => {
    if (isSamleordreMode && samleordreCtx && samleordreTabOrderNr) {
      const child = samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
      return child?.products ?? []
    }
    return (products ?? []).map(p => ({ id: p.id, recipeCode: p.recipeCode, recipeName: p.recipeName }))
  })()
  const [selectedAfregningProductId, setSelectedAfregningProductId] = useState<string | null>(
    () => produkterForUdlaegning[0]?.id ?? null
  )

  // Per-produkt udlægnings-mock — TODO: Erstat med Supabase per-produkt udlægnings-data
  // Værdier er prototype-fiktive; produktion henter fra plan_vejebilag per recipeCode+dato
  const perProduktUdlaegning: Record<string, {
    tonsAnkommet: number
    forventetM2: number
    faktiskM2: number | null
    tonsIDag: number
    arealIDag: number
    tykkelseMm: number
    tonsRegistreret4A: number
    tillaegsarealM2: number
    arealRegistreret4A: number
  }> = {
    'p1': { tonsAnkommet: 68, forventetM2: 363, faktiskM2: 355, tonsIDag: 70,  arealIDag: 374,  tykkelseMm: 80, tonsRegistreret4A: 70,  tillaegsarealM2: 12, arealRegistreret4A: 540 },
    'p2': { tonsAnkommet: 243, forventetM2: 2170, faktiskM2: null, tonsIDag: 251, arealIDag: 2241, tykkelseMm: 45, tonsRegistreret4A: 251, tillaegsarealM2: 0,  arealRegistreret4A: 2170 },
    // Samleordre child-produkter (bruger samme id som SamleordreChild.products[].id)
    'sp2': { tonsAnkommet: 94, forventetM2: 839, faktiskM2: null, tonsIDag: 100, arealIDag: 893, tykkelseMm: 45, tonsRegistreret4A: 100, tillaegsarealM2: 8,  arealRegistreret4A: 839 },
    'sp3': { tonsAnkommet: 47, forventetM2: 540, faktiskM2: 510, tonsIDag: 50,  arealIDag: 574,  tykkelseMm: 40, tonsRegistreret4A: 50,  tillaegsarealM2: 0,  arealRegistreret4A: 510 },
  }

  // ── Afregning state ──────────────────────────────────────────────────────────
  const [afregningOpen, setAfregningOpen] = useState<Set<string>>(new Set())
  const [materielAfregningGodkendt, setMaterielAfregningGodkendt] = useState(false)
  /** Per-bil override af afregningsform — key = bil.regnr (samme som afregKey).
   *  Overstyre Planlægningens biltypeAfregning-default. Materiel + 1,5-times-tvang forbliver oven på. */
  const [bilAfregningOverride, setBilAfregningOverride] = useState<Record<string, AfregningType>>({})

  // ── Vejeseddel-fordeling state ───────────────────────────────────────────────
  // TODO: Erstat med Supabase når klar
  const [vejeseddelFordelinger, setVejeseddelFordelinger] = useState<Record<string, { ordre_id: string; tons: number }[]>>(() => {
    const initial: Record<string, { ordre_id: string; tons: number }[]> = {}
    const biler = vognmandBekraeftelse?.biler ?? []
    for (const bil of biler) {
      for (const vs of bil.vejesedler ?? []) {
        if (vs.multilaes_flag) {
          initial[vs.id] = vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
        }
      }
    }
    return initial
  })
  const [vejeseddelExpanded, setVejeseddelExpanded] = useState<Set<string>>(new Set())
  const [vejeseddelVentetidFordelinger, setVejeseddelVentetidFordelinger] = useState<Record<string, Record<string, number>>>({})

  // ── Timer-fordeling state ─────────────────────────────────────────────────────
  // TODO: Erstat med Supabase når klar
  const [bilTimerFordelinger, setBilTimerFordelinger] = useState<Record<string, Record<string, number>>>({})
  // Ventetid fordeles parallelt med køretimer — hviletid distribueres IKKE pr. ordre
  const [bilVentetidFordelinger, setBilVentetidFordelinger] = useState<Record<string, Record<string, number>>>({})
  const [bilTimerFordelingOpen, setBilTimerFordelingOpen] = useState<Set<string>>(new Set())

  // ── PLAN-modal state ─────────────────────────────────────────────────────────
  const [planModalOpen, setPlanModalOpen] = useState(false)

  // ── Materiel timeafregning state ─────────────────────────────────────────────
  const [timeafregningFraPlan, setTimeafregningFraPlan] = useState<TimeafregningFraPlan>('nej')
  // Case A (nej): samlet timer for hele holdpakken
  const [holdpakkeTimer, setHoldpakkeTimer] = useState<number>(7.5)
  const [materielAnvendt, setMaterielAnvendt] = useState<Record<string, boolean>>(
    () => Object.fromEntries(MATERIEL_ENHEDER.map(e => [e.anlaegsNr, true]))
  )
  const [materielTimer, setMaterielTimer] = useState<Record<string, number>>(
    () => ({ '5-0034': 8.5, '3-0112': 7.0, '7-0078': 2.0 })
  )

  // Lokal kopi af afregnings-felter per chauffør-nøgle
  // TODO: Erstat med Supabase når klar
  const [afregningData, setAfregningData] = useState<Record<string, ChauffoerAfregning>>(() => {
    const initial: Record<string, ChauffoerAfregning> = {}
    const bilerData = vognmandBekraeftelse?.biler ?? []
    for (const bil of bilerData) {
      if (bil.afregning) {
        initial[bil.regnr] = {
          chauffoer_navn: bil.chauffoer,
          reg_nr: bil.regnr,
          ...bil.afregning,
        }
      }
    }
    return initial
  })

  // ── Afslut dag state ─────────────────────────────────────────────────────────
  const [dagAfsluttet, setDagAfsluttet] = useState(false)
  const [afslutDagModalOpen, setAfslutDagModalOpen] = useState(false)
  const [valideringsFejl, setValideringsFejl] = useState<string[]>([])

  function validerAfregning(): string[] {
    const fejl: string[] = []

    // 1. Bil- og tonsafregning (Timeafregning): alle chauffør-rækker skal være godkendt
    const bilerData = vognmandBekraeftelse?.biler ?? []
    for (const bil of bilerData) {
      const afregKey = bil.regnr
      const afrData = afregningData[afregKey]

      if (!afrData?.godkendt_af_formand) {
        fejl.push(`Timeafregning — ${bil.chauffoer} (${bil.regnr}) mangler godkendelse`)
        continue
      }

      // Tjek at relevante felter er udfyldt for godkendte rækker
      // Fase 2: base-form = per-bil override → biltype→afregning-map (Planlægning) → afrData → 'time'
      const baseType: AfregningType = bilAfregningOverride[afregKey] ?? biltypeAfregning?.[bil.biltype] ?? afrData?.afregning_type ?? 'time'
      const isTimeForcedBy15Min = !bil.er_materiel_bil
        && baseType === 'akkord'
        && (bil.vejesedler ?? []).some(vs => vs.aflæsset_efter_1_5t)
      const effectiveType: AfregningType =
        bil.er_materiel_bil || isTimeForcedBy15Min ? 'time' : baseType

      if (effectiveType === 'time') {
        if (!afrData?.koretimer && afrData?.koretimer !== 0) {
          fejl.push(`Timeafregning — ${bil.chauffoer} (${bil.regnr}): Timer mangler`)
        }
      } else {
        // akkord: ventetid er påkrævet
        if (!afrData?.ventetid && afrData?.ventetid !== 0) {
          fejl.push(`Timeafregning — ${bil.chauffoer} (${bil.regnr}): Ventetid mangler`)
        }
      }
    }

    // 2. Materielafregning: skal være godkendt
    if (!materielAfregningGodkendt) {
      fejl.push('Materielafregning mangler godkendelse')
    }

    return fejl
  }

  function handleAfslutDag() {
    const fejl = validerAfregning()
    if (fejl.length > 0) {
      setValideringsFejl(fejl)
      setAfslutDagModalOpen(true)
    } else {
      setDagAfsluttet(true)
    }
  }

  function handleRetDag() {
    setDagAfsluttet(false)
  }

  function toggleAfregning(key: string) {
    setAfregningOpen(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  function updateAfregningField(key: string, field: keyof ChauffoerAfregning, value: number | string | boolean | undefined | null) {
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  function godkendAfregning(key: string) {
    const tids = formatTimestamp(new Date())
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], godkendt_af_formand: true, godkendt_tidspunkt: tids },
    }))
    setAfregningOpen(prev => { const next = new Set(prev); next.delete(key); return next })
  }

  function genaabnAfregning(key: string) {
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], godkendt_af_formand: false, godkendt_tidspunkt: undefined, auto_godkendt: false },
    }))
    setAfregningOpen(prev => new Set([...prev, key]))
  }

  // ── Auto-godkend hjælpefunktion ──────────────────────────────────────────────
  // FF Flow 4 Trin 5a: Akkord-afregning uden ventetid auto-godkendes.
  // Brugt af både useEffect nedenfor og render-loop (effectiveType).
  // TODO: Erstat med Supabase når klar — skal køre server-side ved opdatering af afregning_data-rækken
  function beregnAfregningEligibility(bil: ConfirmedTruck, afrData: ChauffoerAfregning | undefined, vejeseddelFordelingerMap: Record<string, { ordre_id: string; tons: number }[]>) {
    const bilVejesedler = bil.vejesedler ?? []
    // Fase 2: base-form = per-bil override → biltype→afregning-map (Planlægning) → afrData → 'time'
    const bilKey = bil.regnr
    const baseType: AfregningType = bilAfregningOverride[bilKey] ?? biltypeAfregning?.[bil.biltype] ?? afrData?.afregning_type ?? 'time'
    const isTimeForcedBy15Min = !bil.er_materiel_bil
      && baseType === 'akkord'
      && bilVejesedler.some(vs => vs.aflæsset_efter_1_5t)
    const effectiveType: AfregningType =
      bil.er_materiel_bil || isTimeForcedBy15Min ? 'time' : baseType
    // Fordeling-blokering: multilæs-vejesedler der mangler komplet fordeling
    const manglerFordeling = bilVejesedler.some(vs => {
      if (!vs.multilaes_flag) return false
      const fordeling = vejeseddelFordelingerMap[vs.id]
        ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
      const sum = fordeling.reduce((s, f) => s + f.tons, 0)
      return Math.abs(vs.netto_tons - sum) >= 0.05
    })
    const ventetid = afrData?.ventetid ?? 0
    const kanAutoGodkendes = effectiveType === 'akkord' && ventetid === 0 && !manglerFordeling
    return { effectiveType, manglerFordeling, kanAutoGodkendes }
  }

  // ── Auto-godkend effect ───────────────────────────────────────────────────────
  // Kører hver gang afregningData eller vejeseddelFordelinger ændres.
  // Regler:
  //   1. Sæt godkendt hvis kanAutoGodkendes og ikke allerede godkendt.
  //   2. Fjern godkendelse KUN hvis rækken VAR auto-godkendt og nu ikke længere er eligible
  //      (fx ventetid > 0 er tilføjet). Manuelt godkendte rækker (auto_godkendt falsy) røres ikke.
  // Effect er idempotent: kun rækker der mangler godkendelse/de-godkendelse producerer updates.
  // Efter første kørsel er alle eligible rækker stabiliserede → 0 updates → ingen loop.
  // TODO: Erstat med Supabase når klar — server-side trigger på afregning_data-tabel
  useEffect(() => {
    const bilerData = vognmandBekraeftelse?.biler ?? []
    const updates: Record<string, ChauffoerAfregning> = {}

    for (const bil of bilerData) {
      const key = bil.regnr
      const afrData = afregningData[key]
      if (!afrData) continue
      const { kanAutoGodkendes } = beregnAfregningEligibility(bil, afrData, vejeseddelFordelinger)

      // Ikke auto-godkend mens rækken er ekspanderet (formand er i gang med at redigere)
      const erAaben = afregningOpen.has(key)
      if (kanAutoGodkendes && !afrData.godkendt_af_formand && !erAaben) {
        // Ikke godkendt endnu og ikke åben — auto-godkend
        updates[key] = {
          ...afrData,
          godkendt_af_formand: true,
          godkendt_tidspunkt: formatTimestamp(new Date()),
          auto_godkendt: true,
        }
      } else if (!kanAutoGodkendes && afrData.auto_godkendt && afrData.godkendt_af_formand) {
        // Tidligere auto-godkendt men ikke længere eligible (fx ventetid tilføjet) — fjern godkendelse
        // Manuelt godkendte rækker (auto_godkendt falsy) røres ALDRIG
        updates[key] = {
          ...afrData,
          godkendt_af_formand: false,
          godkendt_tidspunkt: undefined,
          auto_godkendt: false,
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      setAfregningData(prev => ({ ...prev, ...updates }))
    }
  // afregningData i deps er sikkert: effecten er idempotent — første kørsel godkender
  // eligible rækker; anden kørsel finder 0 candidates og kalder ikke setAfregningData.
  // afregningOpen: åbne rækker auto-godkendes ikke mens formand redigerer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afregningData, vejeseddelFordelinger, afregningOpen])

  return (
    <div className="flex flex-col gap-[48px]">

      {/* ── Afregningsperiode — første sektion på Afregning-mode (matcher Udførsel) ── */}
      {/* Kopieret 1:1 fra UdfoerselContent's "Udføres i perioden"-sektion. selectedDate
          er hejst til OrdrePlanScreen-root så valg deles med Udførsel-mode. */}
      {afregningDays.length > 0 && (
        <section>
          <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Afregningsperiode</h2>
          <div className="flex items-center gap-xs flex-wrap">
            {afregningDays.map(ds => {
              const isSelected = ds === selectedDate
              // Overstået dag = rød skravering så formanden ser at den er passeret
              const isPast = ds < dateToString(TODAY)
              return (
                <button
                  key={ds}
                  onClick={() => onSelectDate(ds)}
                  aria-pressed={isSelected}
                  aria-label={`${formatLongDate(ds)}${isPast ? ' (overstået)' : ''}`}
                  className={[
                    'flex items-center gap-xxxs px-sm py-xs rounded-full font-poppins font-semibold text-sm transition-colors',
                    isSelected
                      ? 'bg-deep-teal text-white shadow-sm'
                      : isPast
                        ? 'bg-white border border-hairline text-text-muted line-through hover:border-dark-teal'
                        : 'bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal',
                  ].join(' ')}
                >
                  {formatLongDate(ds)}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Ordredetaljer ────────────────────────────────────────────── */}
      {/* Separat state (detailsExpandedAfregning) fra Udfoersel-mode — uafhængig toggle */}
      <div>
        <OrdredetaljerSection
          expanded={detailsExpandedAfregning}
          onToggle={() => setDetailsExpandedAfregning(e => !e)}
          renderCard={() => makeOrdredetaljerCard()}
          renderCollapsedPille={renderOrdredetaljerCollapsedPille}
        />

        <hr className="my-lg border-t border-hairline" />

        {/* ── Udlægning — INDE i Ordredetaljer-section som sibling til hr, matcher
            Planlægning + Udførsel-pattern hvor "næste sektion" sidder inden i samme
            section så hr's mb-lg styrer spacing. */}
        {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
        {recept && (() => {
        const fmtTal = (n: number, d = 0) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: d }).format(n)
        // Per-child udlægning i samleordre-mode
        const activeChildForU = isSamleordreMode && samleordreCtx
          ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
          : undefined
        const childUdlaegning = activeChildForU?.udlaegningDetails

        // Per-produkt data: hent fra perProduktUdlaegning mock — fallback til globale demo-props
        // TODO: Erstat med Supabase per-produkt udlægnings-data
        const aktivtProduktId = selectedAfregningProductId ?? produkterForUdlaegning[0]?.id
        const harFlereProdukter = produkterForUdlaegning.length > 1
        const ppu = aktivtProduktId ? perProduktUdlaegning[aktivtProduktId] : undefined
        const TONS_I_DAG  = ppu?.tonsIDag  ?? demoTonsIDag  ?? 0
        const AREAL_I_DAG = ppu?.arealIDag ?? demoArealIDag ?? 0
        const TYKKELSE    = ppu?.tykkelseMm ?? demoTykkelse ?? 0
        // TODO: Erstat med Supabase per-produkt udlægnings-data — pt. bruger valgt produkt
        // sin egen mock; fallback til globale useDagsoverblik-data for p2 (SMA 11S)
        const tonsAnkommetVis    = ppu?.tonsAnkommet    ?? tonsAnkommet    ?? 0
        const forventetUdlagtVis = ppu?.forventetM2     ?? forventetUdlagtM2 ?? 0
        const faktiskUdlagtM2    = ppu?.faktiskM2 !== undefined ? ppu.faktiskM2 : (faktiskRegistrering?.faktiskM2 ?? null)

        const tonsProgress   = TONS_I_DAG  > 0 ? Math.round((tonsAnkommetVis    / TONS_I_DAG)  * 100) : 0
        const forventetProgress = AREAL_I_DAG > 0 ? Math.round((forventetUdlagtVis / AREAL_I_DAG) * 100) : 0
        const faktiskProgress   = faktiskUdlagtM2 !== null && AREAL_I_DAG > 0 ? Math.round((faktiskUdlagtM2 / AREAL_I_DAG) * 100) : 0
        const afvigelse = faktiskUdlagtM2 !== null ? Math.round(faktiskUdlagtM2 - forventetUdlagtVis) : undefined
        const faktiskVariant: 'good' | 'warn' | 'bad' = afvigelse !== undefined && afvigelse < 0 ? 'bad' : 'good'
        const tonsRegistreret4A = ppu?.tonsRegistreret4A
        const tillaegsareal4A = ppu?.tillaegsarealM2
        const arealRegistreret4A = ppu?.arealRegistreret4A

        return (
          <div>
            {/* Produkt-tabs — vises kun hvis 2+ produkter. Pattern identisk med makeOrdredetaljerCard-tabs (linje 1103-1128). */}
            {harFlereProdukter && (
              <div className="inline-flex gap-xxxs">
                {produkterForUdlaegning.map(p => {
                  const isActive = p.id === (selectedAfregningProductId ?? produkterForUdlaegning[0]?.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedAfregningProductId(p.id)}
                      aria-pressed={isActive}
                      className={[
                        'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                        isActive
                          ? 'bg-deep-teal border-deep-teal text-white relative z-10 -mb-[1px]'
                          : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                      ].join(' ')}
                    >
                      {INITIAL_RECEPTER[p.recipeCode]?.navn ?? p.recipeCode}
                    </button>
                  )
                })}
              </div>
            )}
            {/* Indhold-wrapper: border-boks kun ved 2+ produkter (browser-tab-stil) */}
            <div className={harFlereProdukter ? 'bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl p-md' : ''}>
              <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">
                Udlægning
                {isSamleordreMode && activeChildForU && (
                  <span className="font-inter text-sm font-normal text-text-muted ml-xs">— {activeChildForU.stedLabel}</span>
                )}
              </h2>
              {/* Per-child noter vises som info-banner i samleordre-mode */}
              {isSamleordreMode && childUdlaegning && (
                <div className="flex items-center gap-xs bg-surface border border-hairline rounded-xl px-sm py-xs mb-xs">
                  <div className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${
                    childUdlaegning.status === 'færdig' ? 'bg-good' :
                    childUdlaegning.status === 'i-gang' ? 'bg-warning' : 'bg-text-muted'
                  }`} />
                  <span className="font-inter text-xs font-medium text-text-primary">
                    {childUdlaegning.status === 'færdig' ? 'Færdig'
                      : childUdlaegning.status === 'i-gang' ? `I gang${childUdlaegning.startTid ? ` · startet ${childUdlaegning.startTid}` : ''}`
                      : 'Ikke startet'}
                  </span>
                  {childUdlaegning.noter && (
                    <span className="font-inter text-xs text-text-muted">· {childUdlaegning.noter}</span>
                  )}
                </div>
              )}
              {/* ── Ekstraarbejde-flag (3a) — vises kun når harEkstraarbejde === true ── */}
              {harEkstraarbejde && (
                <div className="flex justify-end mb-xs">
                  <span className="inline-flex items-center gap-xxs px-sm py-xxxs rounded-full bg-soft-aqua text-deep-teal font-inter text-xxs font-semibold">
                    Der er ekstraarbejder under ydelser
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-xs">
                <FremdriftCard
                  variant="tons-ankommet"
                  label="UDVEJET FABRIK"
                  value={fmtTal(tonsAnkommetVis, 1)}
                  unit=""
                  subtekst={`á ${fmtTal(TONS_I_DAG)} Tons dagens plan`}
                  progress={tonsProgress}
                  progressVariant="good"
                />
                <FremdriftCard
                  variant="forventet-udlagt"
                  label="FORVENTET M2 UDLAGT"
                  value={fmtTal(forventetUdlagtVis)}
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
                      ? `senest gemt ${formatTimestamp(faktiskRegistrering.gemtTidspunkt)}`
                      : 'ikke registreret endnu'
                  }
                  progress={faktiskProgress}
                  progressVariant={faktiskVariant}
                  afvigelse={afvigelse}
                />
              </div>
              <div className="mt-xs">
                {/* ── Ekstraarbejde-note (3b) — read-only info-felt ved kvm/tons ── */}
                {harEkstraarbejde && (
                  <div className="rounded-lg border border-hairline bg-surface-2 px-sm py-xs mb-xs font-inter text-xs text-text-secondary">
                    Der er ekstraarbejder under ydelser
                  </div>
                )}
                {!visUdlaegningInput ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSetVisUdlaegningInput?.(true)}
                      className="bg-dark-teal text-white font-inter font-medium text-sm px-sm py-xs rounded-lg min-h-[44px] hover:opacity-90 transition-all"
                    >
                      Registrer udlægning
                    </button>
                  </div>
                ) : (
                  <FremdriftInputRow
                    densitet={recept.densitet}
                    planTykkelse={TYKKELSE}
                    initial={
                      faktiskRegistrering
                        ? { faktiskM2: faktiskRegistrering.faktiskM2!, faktiskTons: faktiskRegistrering.faktiskTons! }
                        : undefined
                    }
                    onSave={({ faktiskM2, faktiskTons }) => {
                      onGemFaktisk?.(faktiskM2, faktiskTons)
                      onSetVisUdlaegningInput?.(false)
                    }}
                    referenceLines={[
                      ...(tonsRegistreret4A !== undefined ? [`${fmtTal(tonsRegistreret4A)} tons registreret i 4A`] : []),
                      ...(arealRegistreret4A !== undefined ? [`${fmtTal(arealRegistreret4A)} m² areal registreret i 4A`] : []),
                      ...(tillaegsareal4A !== undefined && tillaegsareal4A > 0 ? [`${fmtTal(tillaegsareal4A)} m² tillægsareal registreret i 4A`] : []),
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        )
      })()}
      </div>

      {/* ── Bestilte biler (Bil- og tonsafregning) ─────────────────── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      {todayDay && (
        <section>
          <div className="mb-sm">
            <h2 className="font-poppins font-semibold text-xl text-text-primary">Bil- og tonsafregning</h2>
          </div>

          {vognmandBekraeftelse ? (
            <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
              <table className="w-full">
                    <thead>
                      <tr className="border-b border-hairline bg-soft-aqua">
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
                        const bilVejesedlerCollapsed = bil.vejesedler ?? []
                        // 1,5-times-reglen: akkord-bil der ikke er aflæsset inden 1,5t → HELE dagens kørsel er timebaseret.
                        // Reglen er firm — ingen override. Flaget sidder på vejesedlerne (aflæsset_efter_1_5t).
                        // Fase 2: base-form = per-bil override → biltype→afregning-map (Planlægning) → afrData → 'time'
                        const baseType: AfregningType = bilAfregningOverride[afregKey] ?? biltypeAfregning?.[bil.biltype] ?? afrData?.afregning_type ?? 'time'
                        const isTimeForcedBy15Min = !bil.er_materiel_bil
                          && baseType === 'akkord'
                          && bilVejesedlerCollapsed.some(vs => vs.aflæsset_efter_1_5t)
                        // Materiel-biler afregnes ALTID på time. Akkord-biler med 1,5-times-overskridelse tvinges til time.
                        const effectiveType: AfregningType =
                          bil.er_materiel_bil || isTimeForcedBy15Min ? 'time' : baseType
                        const isLast = i === vognmandBekraeftelse.biler.length - 1

                        // ── Fordeling-blokering (collapsed) — Multilæs fjernet som visuel kategori ──────────
                        // harMultilaes bevares til fordeling-logik (mangler fordeling) men vises IKKE som badge
                        const harMultilaes = bilVejesedlerCollapsed.some(vs => vs.multilaes_flag)
                        const harPuljelaes = bilVejesedlerCollapsed.some(vs => vs.puljelaes_flag)
                        // Mangler fordeling: mindst én vejeseddel med multilaes_flag har sum != netto_tons
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
                              <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums">{formatRegnr(bil.regnr)}</td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{bil.chauffoer}</td>
                              <td className="align-middle px-xs py-xs">
                                <a href={`tel:${toE164(bil.tlf) ?? bil.tlf.replace(/\s/g, '')}`} className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors">
                                  {formatPhone(bil.tlf)}
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
                              {/* D. Læs-type kolonne — rød "Mangler fordeling" trumfer alt.
                                  Multilæs fjernet som visuel kategori — kolonne viser kun fordeling-status og "Samles på en bil" (puljelæs). */}
                              <td className="align-middle px-xs py-xs">
                                {!isOpen && manglerFordeling ? (
                                  <span className="inline-flex items-center gap-xxxs bg-bad/10 border border-bad text-bad font-inter font-semibold text-xxs px-xs py-xxxs rounded-md">
                                    <AlertTriangle size={10} className="flex-shrink-0" aria-label="Mangler fordeling" />
                                    Mangler fordeling
                                  </span>
                                ) : harPuljelaes ? (
                                  <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Samles på en bil
                                  </span>
                                ) : null}
                              </td>
                              <td className="align-middle px-xs py-xs text-right">
                                {isGodkendt ? (
                                  <span className="inline-flex items-center px-xs py-xxxs rounded-md bg-good text-white font-inter font-semibold text-xs">
                                    {afrData?.auto_godkendt ? 'Afregning auto-godkendt' : 'Afregning godkendt'}
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
                            {(isOpen || isGodkendt) && (() => {
                              // ── Vejeseddel-hjælpere ──────────────────────────────────
                              const bilVejesedler = bil.vejesedler ?? []
                              // Dagens kørte tons = sum af alle vejesedler på bilen
                              const inheritedTons = bilVejesedler.reduce((s, vs) => s + vs.netto_tons, 0)
                              // 1,5-times-reglen er trådt i kraft hvis isTimeForcedBy15Min (beregnet i outer scope).
                              // effectiveType er allerede 'time' i dette tilfælde — vi viser banneret baseret på flaget.
                              const has1_5tRule = isTimeForcedBy15Min
                              const displayType: AfregningType = effectiveType

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
                                  <div className="bg-soft-aqua rounded-lg p-sm mt-xxxs border border-hairline">

                                    {/* ── Afregningsform-override (pr. bil) ───────────── */}
                                    {/* Formanden kan overstyre Planlægningens biltype-default her.
                                        Toggle vises altid, men låses når materiel-tvang eller 1,5-times-regel er aktiv. */}
                                    {(() => {
                                      const isLocked = bil.er_materiel_bil || isTimeForcedBy15Min
                                      const lockReason = bil.er_materiel_bil
                                        ? 'Materiel — altid timeløn'
                                        : 'Over 1,5-times-reglen — tvunget timeløn'
                                      // baseType (beregnet i outer scope) reflekterer override-opslaget INDEN materiel/1,5t-tvang
                                      const toggleValue: AfregningType = baseType
                                      return (
                                        <div className="flex items-center gap-xs mb-sm">
                                          <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">Afregningsform</span>
                                          <div className={[
                                            'flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit',
                                            isLocked ? 'opacity-60' : '',
                                          ].join(' ')}>
                                            {(['akkord', 'time'] as const).map(type => {
                                              const isActive = toggleValue === type
                                              const label = type === 'akkord' ? 'Akkord' : 'Timeløn'
                                              return (
                                                <button
                                                  key={type}
                                                  disabled={isLocked || isGodkendt}
                                                  aria-pressed={isActive}
                                                  onClick={() => !isLocked && !isGodkendt && setBilAfregningOverride(prev => ({ ...prev, [afregKey]: type }))}
                                                  className={[
                                                    'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                                                    isActive
                                                      ? 'bg-dark-teal text-white'
                                                      : 'text-text-muted hover:bg-soft-aqua',
                                                    isLocked ? 'cursor-not-allowed' : '',
                                                  ].join(' ')}
                                                >
                                                  {label}
                                                </button>
                                              )
                                            })}
                                          </div>
                                          {isLocked && (
                                            <span className="font-inter text-xxs text-text-muted italic">{lockReason}</span>
                                          )}
                                        </div>
                                      )
                                    })()}

                                    {/* ── 1,5-times-regel banner (akkord-biler) ──────── */}
                                    {has1_5tRule && (
                                      <div className="inline-flex items-center gap-xs bg-warn-bg border border-yellow px-sm py-xs rounded-lg mb-sm">
                                        <AlertTriangle size={14} className="text-warning flex-shrink-0" />
                                        <span className="font-inter text-xs font-medium text-deep-teal">
                                          1,5-times-reglen trådte i kraft for denne bil
                                        </span>
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
                                          {/* Hviletid-felt kun for asfalt-biler — ikke relevant for materiel */}
                                          {!bil.er_materiel_bil && (
                                            <div className="flex flex-col gap-xxxs">
                                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Hviletid</label>
                                              <input
                                                type="number"
                                                step="0.5"
                                                value={afrData?.hviletid ?? ''}
                                                disabled={isGodkendt}
                                                onChange={e => updateAfregningField(afregKey, 'hviletid', parseFloat(e.target.value) || 0)}
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
                                              <div className="flex items-center gap-xs bg-surface border border-hairline rounded-md px-xs py-xxxs w-fit whitespace-nowrap">
                                                <Layers size={12} className="text-text-muted flex-shrink-0" />
                                                <span className="font-inter text-sm tabular-nums font-semibold text-text-primary">{inheritedTons.toFixed(1).replace('.', ',')} Tons</span>
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
                                                : 'bg-yellow text-deep-teal font-semibold hover:opacity-90',
                                            ].join(' ')}
                                          >
                                            <CheckCircle2 size={14} />
                                            Godkend afregning
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* TODO: Fase 2 — returlæs (manuel formand-registrering) flyttes hertil */}

                                    {/* A. "Beregnet beløb pr. ordre"-sektionen er fjernet — økonomi er ikke formands domæne */}

                                    {/* ── Timer-fordeling (time-biler på samleordre med 2+ children) ── */}
                                    {displayType === 'time' && isSamleordreMode && samleordreCtx && samleordreCtx.children.length >= 2 && (() => {
                                      const koretimer = afrData?.koretimer ?? 0
                                      const ventetid = afrData?.ventetid ?? 0
                                      const isTimerOpen = bilTimerFordelingOpen.has(afregKey)
                                      // Initialisér fordeling: alt på anchor, resten 0
                                      const anchorChild = samleordreCtx.children.find(c => c.isAnchor) ?? samleordreCtx.children[0]
                                      const currentKoretimer: Record<string, number> = bilTimerFordelinger[afregKey]
                                        ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                          c.orderNumber,
                                          c.orderNumber === anchorChild.orderNumber ? koretimer : 0,
                                        ]))
                                      const currentVentetid: Record<string, number> = bilVentetidFordelinger[afregKey]
                                        ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                          c.orderNumber,
                                          c.orderNumber === anchorChild.orderNumber ? ventetid : 0,
                                        ]))
                                      const koretimerSum = Object.values(currentKoretimer).reduce((s, t) => s + t, 0)
                                      const ventetidSum = Object.values(currentVentetid).reduce((s, t) => s + t, 0)
                                      const koretimerRest = koretimer - koretimerSum
                                      const ventetidRest = ventetid - ventetidSum
                                      const koretimerMatch = Math.abs(koretimerRest) < 0.05
                                      const ventetidMatch = Math.abs(ventetidRest) < 0.05

                                      return (
                                        <div className="mt-sm border-t border-hairline pt-sm">
                                          {/* Overskrift + toggle-knap — samme mønster som "Fordel tons"-knap på vejeseddel */}
                                          <div className="flex items-center justify-between mb-xs">
                                            <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">
                                              Fordel timer på ordrer
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => setBilTimerFordelingOpen(prev => {
                                                const next = new Set(prev)
                                                if (next.has(afregKey)) next.delete(afregKey); else next.add(afregKey)
                                                return next
                                              })}
                                              className="inline-flex items-center gap-xxxs font-inter text-xs text-deep-teal font-semibold hover:opacity-80 transition-opacity whitespace-nowrap min-h-[28px] px-xs"
                                            >
                                              {isTimerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                              {isTimerOpen ? 'Skjul' : 'Fordel timer'}
                                            </button>
                                          </div>

                                          {isTimerOpen && (
                                            <div className="bg-surface border border-hairline rounded-md overflow-hidden">
                                              <div className="px-xs pb-xs pt-xs bg-soft-aqua">
                                                {/* Kolonne-labels */}
                                                <div className="flex items-center gap-xs mb-xxxs">
                                                  <div className="w-2 h-2 flex-shrink-0" />
                                                  <span className="font-inter text-xs flex-1 min-w-0" />
                                                  <span className="font-inter text-xxs text-text-muted uppercase tracking-widest w-[90px] text-center">Køretimer</span>
                                                  <span className="font-inter text-xxs text-text-muted uppercase tracking-widest w-[90px] text-center">Ventetid</span>
                                                </div>
                                                <div className="flex flex-col gap-xs">
                                                  {samleordreCtx.children
                                                    .slice()
                                                    .sort((a, b) => (a.isAnchor ? -1 : b.isAnchor ? 1 : 0))
                                                    .map((child) => {
                                                      const childKoretimer = currentKoretimer[child.orderNumber] ?? 0
                                                      const childVentetid = currentVentetid[child.orderNumber] ?? 0
                                                      return (
                                                        <div key={child.orderNumber} className="flex items-center gap-xs">
                                                          {/* Anchor-markering: gul prik — præcis som tons-fordeling */}
                                                          <div className={[
                                                            'w-2 h-2 rounded-full flex-shrink-0',
                                                            child.isAnchor ? 'bg-yellow' : 'bg-hairline-2',
                                                          ].join(' ')} title={child.isAnchor ? 'Anchor-ordre' : ''} />
                                                          <span className={[
                                                            'font-inter text-xs flex-1 min-w-0 truncate',
                                                            child.isAnchor ? 'font-semibold text-text-primary' : 'text-text-secondary',
                                                          ].join(' ')}>
                                                            {child.orderNumber} · {child.stedLabel}
                                                          </span>
                                                          {/* Køretimer-input */}
                                                          <input
                                                            type="number"
                                                            value={childKoretimer}
                                                            disabled={isGodkendt}
                                                            step="0.5"
                                                            pattern="[0-9]*[.,]?[0-9]*"
                                                            onChange={e => {
                                                              const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                              const newVal = parseFloat(raw) || 0
                                                              setBilTimerFordelinger(prev => {
                                                                const current = prev[afregKey]
                                                                  ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                                                    c.orderNumber,
                                                                    c.orderNumber === anchorChild.orderNumber ? koretimer : 0,
                                                                  ]))
                                                                return { ...prev, [afregKey]: { ...current, [child.orderNumber]: newVal } }
                                                              })
                                                            }}
                                                            className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                            aria-label={`Køretimer til ${child.orderNumber} · ${child.stedLabel}`}
                                                          />
                                                          {/* Ventetid-input */}
                                                          <input
                                                            type="number"
                                                            value={childVentetid}
                                                            disabled={isGodkendt}
                                                            step="0.5"
                                                            pattern="[0-9]*[.,]?[0-9]*"
                                                            onChange={e => {
                                                              const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                              const newVal = parseFloat(raw) || 0
                                                              setBilVentetidFordelinger(prev => {
                                                                const current = prev[afregKey]
                                                                  ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                                                    c.orderNumber,
                                                                    c.orderNumber === anchorChild.orderNumber ? ventetid : 0,
                                                                  ]))
                                                                return { ...prev, [afregKey]: { ...current, [child.orderNumber]: newVal } }
                                                              })
                                                            }}
                                                            className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                            aria-label={`Ventetid til ${child.orderNumber} · ${child.stedLabel}`}
                                                          />
                                                        </div>
                                                      )
                                                    })}
                                                </div>
                                                {/* To sum-counters — køretimer og ventetid hver for sig */}
                                                <div className="flex justify-end gap-md mt-xs">
                                                  <span className={[
                                                    'font-inter text-xs tabular-nums font-semibold',
                                                    koretimerMatch ? 'text-good' : 'text-bad',
                                                  ].join(' ')}>
                                                    {koretimerMatch ? (
                                                      <>Køretimer: {koretimerSum.toFixed(1)}/{koretimer.toFixed(1)} Timer</>
                                                    ) : (
                                                      <>Køretimer: {koretimerSum.toFixed(1)}/{koretimer.toFixed(1)} Timer (rest {koretimerRest > 0 ? '+' : ''}{koretimerRest.toFixed(1)})</>
                                                    )}
                                                  </span>
                                                  <span className={[
                                                    'font-inter text-xs tabular-nums font-semibold',
                                                    ventetidMatch ? 'text-good' : 'text-bad',
                                                  ].join(' ')}>
                                                    {ventetidMatch ? (
                                                      <>Ventetid: {ventetidSum.toFixed(1)}/{ventetid.toFixed(1)} Timer</>
                                                    ) : (
                                                      <>Ventetid: {ventetidSum.toFixed(1)}/{ventetid.toFixed(1)} Timer (rest {ventetidRest > 0 ? '+' : ''}{ventetidRest.toFixed(1)})</>
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })()}

                                    {/* ── Vejesedler under afregnings-felterne ─────── */}
                                    {/* Alle vejesedler rendres ens — badgen signalerer "Samles på en bil" (puljelæs). Multilæs fjernet som visuel kategori. Ingen gruppering. */}
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
                                                  style={{ gridTemplateColumns: 'minmax(140px, auto) 1fr 140px 140px' }}
                                                >
                                                  <div className="flex items-center gap-xs min-w-0">
                                                    <span className="font-inter text-xs font-semibold text-text-primary tabular-nums">{vs.vejeseddelNr}</span>
                                                    <span className="font-inter text-xs font-semibold text-text-primary tabular-nums">{vs.product_code}</span>
                                                    <span className="font-inter text-xs text-text-muted truncate">{vs.product_name}</span>
                                                  </div>
                                                  <div className="flex items-center justify-end gap-md tabular-nums whitespace-nowrap">
                                                    <span className="font-inter text-xs text-text-muted">Tara <span className="text-text-secondary">{vs.tara_tons.toFixed(1).replace('.', ',')}</span></span>
                                                    <span className="font-inter text-xs text-text-muted">Brutto <span className="text-text-secondary">{(vs.tara_tons + vs.netto_tons).toFixed(1).replace('.', ',')}</span></span>
                                                    <span className="font-inter text-xs text-text-muted">Netto <span className="font-semibold text-text-primary">{vs.netto_tons.toFixed(1).replace('.', ',')} Tons</span></span>
                                                  </div>
                                                  {/* Badge alignet med "Indeholder"-kolonnen */}
                                                  <div className="w-fit">
                                                    {/* Multilæs fjernet som visuel kategori — kun puljelæs ("Samles på en bil") vises */}
                                                    {vs.puljelaes_flag && (
                                                      <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider whitespace-nowrap">
                                                        Samles på en bil
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
                                                        Fordel tons og timer
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Fordeling-expander — multilaes_flag er dataflag, badge er fjernet som visuel kategori */}
                                                {vs.multilaes_flag && isVsExpanded && (
                                                  <div className="border-t border-hairline px-xs pb-xs pt-xs bg-soft-aqua">
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
                                                              ].join(' ')} title={pf.is_anchor ? 'Primær ordre' : ''} />
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
                                                              <span className="font-inter text-xs text-text-muted">Tons</span>
                                                              <input
                                                                type="number"
                                                                value={vejeseddelVentetidFordelinger[vs.id]?.[pf.ordre_id] ?? 0}
                                                                disabled={isGodkendt}
                                                                pattern="[0-9]*[.,]?[0-9]*"
                                                                onChange={e => {
                                                                  const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                                  const newTimer = parseFloat(raw) || 0
                                                                  setVejeseddelVentetidFordelinger(prev => ({
                                                                    ...prev,
                                                                    [vs.id]: {
                                                                      ...(prev[vs.id] ?? {}),
                                                                      [pf.ordre_id]: newTimer,
                                                                    },
                                                                  }))
                                                                }}
                                                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                aria-label={`Ventetid til ${pf.ordre_label}`}
                                                              />
                                                              <span className="font-inter text-xs text-text-muted">Timer</span>
                                                            </div>
                                                          )
                                                        })}
                                                    </div>
                                                    {/* E. Sum-counter: til højre under det sidste input-felt */}
                                                    <div className="flex justify-end mt-xs gap-md">
                                                      {/* Tons sum */}
                                                      <span className={[
                                                        'font-inter text-xs tabular-nums font-semibold',
                                                        sumMatch ? 'text-good' : 'text-bad',
                                                      ].join(' ')}>
                                                        {sumMatch ? (
                                                          <>Sum: {fordelingSum.toFixed(1)}/{vs.netto_tons.toFixed(1)} Tons</>
                                                        ) : (
                                                          <>Sum: {fordelingSum.toFixed(1)}/{vs.netto_tons.toFixed(1)} Tons (rest {rest > 0 ? '+' : ''}{rest.toFixed(1)} Tons)</>
                                                        )}
                                                      </span>
                                                      {/* Ventetid sum */}
                                                      {(() => {
                                                        const ventetidMap = vejeseddelVentetidFordelinger[vs.id] ?? {}
                                                        const ventetidSum = vs.pre_fordeling.reduce((s, pf) => s + (ventetidMap[pf.ordre_id] ?? 0), 0)
                                                        const totalVentetid = afrData?.ventetid ?? 0
                                                        const ventetidMatch = Math.abs(ventetidSum - totalVentetid) < 0.05
                                                        const ventetidRest = totalVentetid - ventetidSum
                                                        return (
                                                          <span className={[
                                                            'font-inter text-xs tabular-nums font-semibold',
                                                            ventetidMatch ? 'text-good' : 'text-bad',
                                                          ].join(' ')}>
                                                            {ventetidMatch ? (
                                                              <>Ventetid: {ventetidSum.toFixed(1)}/{totalVentetid.toFixed(1)} Timer</>
                                                            ) : (
                                                              <>Ventetid: {ventetidSum.toFixed(1)}/{totalVentetid.toFixed(1)} Timer (rest {ventetidRest > 0 ? '+' : ''}{ventetidRest.toFixed(1)} Timer)</>
                                                            )}
                                                          </span>
                                                        )
                                                      })()}
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
              {/* ── Subtotaler pr. afregningsform ─────────────────────────────────────── */}
              {/* Beregnes via beregnAfregningEligibility (single source of truth for effectiveType). */}
              {/* Reagerer automatisk når per-bil override eller 1,5-times-regel ændres. */}
              {/* Komponenter summeres separat: akkord→(tons, ventetid) / time→(køretimer, ventetid, hviletid) */}
              {(() => {
                const fmtTal = (n: number, d = 0) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: d }).format(n)
                let akkordBiler = 0
                let akkordTons = 0
                let akkordVentetid = 0
                let timeBiler = 0
                let timeKoretimer = 0
                let timeVentetid = 0
                let timeHviletid = 0
                for (const bil of vognmandBekraeftelse.biler) {
                  const afrData = afregningData[bil.regnr]
                  const { effectiveType } = beregnAfregningEligibility(bil, afrData, vejeseddelFordelinger)
                  if (effectiveType === 'akkord') {
                    akkordBiler++
                    akkordTons += (bil.vejesedler ?? []).reduce((s, vs) => s + vs.netto_tons, 0)
                    akkordVentetid += afrData?.ventetid ?? 0
                  } else {
                    timeBiler++
                    timeKoretimer += afrData?.koretimer ?? 0
                    timeVentetid += afrData?.ventetid ?? 0
                    timeHviletid += afrData?.hviletid ?? 0
                  }
                }
                return (
                  <div className="flex flex-wrap gap-xs px-xs py-xs border-t border-hairline bg-surface-2">
                    {/* Akkord-pille: tons + ventetid */}
                    <span className="inline-flex flex-wrap items-center gap-xs px-sm py-xxxs rounded-lg bg-surface border border-hairline font-inter text-xs text-deep-teal">
                      <span className="font-semibold">Akkord</span>
                      <span className="text-text-muted">·</span>
                      <span>{akkordBiler} {akkordBiler === 1 ? 'bil' : 'biler'}</span>
                      <span className="text-text-muted">·</span>
                      <span>{fmtTal(akkordTons, 1)} Tons</span>
                      <span className="text-text-muted">·</span>
                      <span>Ventetid {fmtTal(akkordVentetid, 1)} Timer</span>
                    </span>
                    {/* Time-pille: køretimer + ventetid + hviletid hver for sig */}
                    <span className="inline-flex flex-wrap items-center gap-xs px-sm py-xxxs rounded-lg bg-surface border border-hairline font-inter text-xs text-text-secondary">
                      <span className="font-semibold">Time</span>
                      <span className="text-text-muted">·</span>
                      <span>{timeBiler} {timeBiler === 1 ? 'bil' : 'biler'}</span>
                      <span className="text-text-muted">·</span>
                      <span>Køretimer {fmtTal(timeKoretimer, 1)}</span>
                      <span className="text-text-muted">·</span>
                      <span>Ventetid {fmtTal(timeVentetid, 1)}</span>
                      <span className="text-text-muted">·</span>
                      <span>Hviletid {fmtTal(timeHviletid, 1)} Timer</span>
                    </span>
                  </div>
                )
              })()}
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
              <span className="inline-flex items-center bg-good text-white font-inter font-semibold text-xs px-sm py-xxxs rounded-full">
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
                  <tr className="border-b border-hairline bg-soft-aqua">
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
                            className="min-h-touch shrink-0 ml-auto bg-yellow text-deep-teal font-inter font-semibold text-sm py-xxxs px-sm rounded-lg hover:opacity-90 transition-all"
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

      {/* ── Timeafregning ─────────────────────────────────────── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      {/* Placeholder-sektion — selve timeafregningen håndteres i PLAN (åbnes via knap) */}
      <section>
        <div className="flex items-center mb-sm">
          <h2 className="font-poppins font-semibold text-xl text-text-primary">Timeafregning</h2>
        </div>

        <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
          <div className="flex flex-col items-center justify-center gap-md px-md py-lg">
            <p className="font-inter text-sm text-text-secondary text-center">
              Timeafregning for hold. Bemærk at knap åbner PLAN.
            </p>
            <button
              type="button"
              onClick={() => setPlanModalOpen(true)}
              className="font-poppins font-semibold text-xs px-md py-xs rounded-full bg-yellow text-deep-teal inline-flex items-center gap-xxxs hover:opacity-90 transition-opacity"
            >
              PLAN
            </button>
          </div>
        </div>
      </section>

      {/* ── Afslut dag CTA + bekræftet-banner ───────────────────── */}
      {dagAfsluttet ? (
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm px-md py-sm bg-good-bg border border-good/30 rounded-2xl">
            <CheckCircle2 size={20} className="text-good flex-shrink-0" />
            <div className="flex flex-col gap-xxxs flex-1 min-w-0">
              <span className="font-poppins font-semibold text-sm text-good">
                Dag afsluttet — sendt til PLAN
              </span>
              <span className="font-inter text-xs text-text-secondary">
                Afregningen er låst og klar til behandling.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRetDag}
              className="shrink-0 font-inter font-semibold text-xs text-text-secondary underline cursor-pointer hover:text-text-primary transition-colors min-h-[44px] px-xs"
            >
              Ret
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          {/* KS-husker — ikke-blokerende note. KS-felterne er uncontrolled og indgår
              bevidst IKKE i validerAfregning(). Fjernes når KS-felterne er klar. */}
          <div className="flex items-start gap-xs px-sm py-xs rounded-xl bg-surface-2 border border-hairline">
            <span className="font-inter text-xs text-text-muted leading-relaxed">
              Husk: KS-rapportering (A3/A4/MKS) skal udfyldes — felterne er under udvikling og indgår ikke i valideringen endnu.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAfslutDag}
            className="w-full min-h-[52px] bg-good text-white font-poppins font-semibold text-sm rounded-full px-md py-sm hover:opacity-90 transition-opacity inline-flex items-center justify-center shadow-sm"
          >
            Afslut dag
          </button>
        </div>
      )}

      {/* ── Validerings-modal — manglende afregning ──────────────── */}
      {afslutDagModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-md"
          onClick={() => setAfslutDagModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-md p-md w-full max-w-sm border border-hairline"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-poppins font-semibold text-md text-text-primary mb-xs">
              Du mangler udfyldelse
            </p>
            <p className="font-inter text-sm text-text-secondary mb-sm leading-relaxed">
              Du mangler udfyldelse af:
            </p>
            <ul className="flex flex-col gap-xxxs mb-md">
              {valideringsFejl.map((fejl, i) => (
                <li key={i} className="flex items-start gap-xs">
                  <span className="mt-[3px] flex-shrink-0 w-[6px] h-[6px] rounded-full bg-bad" />
                  <span className="font-inter text-xs text-text-primary">{fejl}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setAfslutDagModalOpen(false)}
              className="w-full py-xs rounded-xl bg-dark-teal text-white font-inter font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              OK, ret afregning
            </button>
          </div>
        </div>
      )}

      {/* ── PLAN Timeregistrering mock-modal ──────────────────────── */}
      {planModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-md"
          onClick={() => setPlanModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-md border-b border-hairline">
              <div>
                <p className="font-poppins font-semibold text-sm uppercase tracking-wide text-deep-teal">
                  TIMEREGISTRERING — ADMIN
                </p>
                <p className="font-inter text-xs text-text-muted mt-xxxs">Denne dag er lukket.</p>
              </div>
              <button
                type="button"
                aria-label="Luk PLAN-modal"
                onClick={() => setPlanModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none ml-md"
              >
                ✕
              </button>
            </div>

            {/* Top-controls (visuel placeholder — ikke funktionel) */}
            <div className="flex flex-wrap gap-xs items-center p-md border-b border-hairline bg-surface-2">
              <span className="font-inter text-xs text-text-secondary">Vælg dato: <strong>18-05-2026</strong></span>
              <span className="font-inter text-xs text-text-secondary">|</span>
              <span className="font-inter text-xs text-text-secondary">Vælg hold: <strong>24 Kim Sørensen</strong></span>
              <button
                type="button"
                disabled
                className="font-poppins font-semibold text-xs px-sm py-xxxs rounded bg-deep-teal text-white opacity-40 cursor-not-allowed"
              >
                Hent data
              </button>
            </div>

            {/* Grove skeleton-linjer — illustrerer at PLAN åbnes, ingen detaljer */}
            <div className="p-md flex flex-col gap-sm">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-surface-2 rounded-md" />
              ))}
            </div>

            {/* Bunden */}
            <div className="flex items-center justify-between p-md border-t border-hairline bg-surface-2">
              <p className="font-inter text-xs text-text-muted italic">
                Demo-mockup — den fulde PLAN-skærm har flere kolonner og funktioner
              </p>
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className="font-poppins font-semibold text-xs px-md py-xs rounded-full border border-hairline text-text-primary hover:bg-surface-2 transition-colors"
              >
                Luk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

