/**
 * PROTOTYPE — Ordre Planlægnings-mode (v2 layout)
 * Sprint 1 — Element 3
 * Viser dagfordeling, materiel og transport for én ordre.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone,
  Truck,
  X,
  Plus,
  ChevronDown,
  ChevronLeft,
  Trash2,
  Pencil,
  Mic,
  Camera,
  CloudRain,
  CheckCircle2,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { TabName } from '@/types/navigation'

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
}

interface MockResource {
  id: string
  plantNumber: string
  description: string
  transportTag: 'blokvogn' | 'kran-baand' | 'egen-korsel'
  status: 'planlagt' | 'ikke-planlagt'
}

interface TransportLine {
  id: string
  type: 'blokvogn' | 'kran-baand' | 'andet'
  direction: 'ud' | 'hjem'
  date: string
  time: string
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

const INITIAL_TRANSPORT: TransportLine[] = [
  { id: 't1', type: 'blokvogn',   direction: 'ud',   date: '2026-03-16', time: '06:00', status: 'planlagt' },
  { id: 't2', type: 'blokvogn',   direction: 'hjem', date: '2026-03-18', time: '15:00', status: 'planlagt' },
  { id: 't3', type: 'kran-baand', direction: 'ud',   date: '2026-03-16', time: '06:30', status: 'planlagt' },
  { id: 't4', type: 'kran-baand', direction: 'hjem', date: '2026-03-18', time: '15:30', status: 'planlagt' },
]

const TRANSPORT_TYPE_LABEL: Record<TransportLine['type'], string> = {
  'blokvogn':   'Blokvogn',
  'kran-baand': 'Kran-Bånd',
  'andet':      'Andet',
}

const CANCEL_REASONS: { value: CancelReason; label: string }[] = [
  { value: 'regn',     label: 'Regn' },
  { value: 'frost',    label: 'Frost' },
  { value: 'underlag', label: 'Underlag' },
  { value: 'andet',    label: 'Andet' },
]

const TODAY_STR = '2026-03-16'

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

interface MockPhoto { id: string; color: string; label: string }

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export function OrdrePlanScreen() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabName>('dagens-opgaver')
  const [activeMode, setActiveMode] = useState<OrderMode>('planlaegning')
  const [activeProductId, setActiveProductId] = useState('p2')
  const [products, setProducts] = useState<MockProduct[]>(INITIAL_PRODUCTS)
  const [resources, setResources] = useState<MockResource[]>(INITIAL_RESOURCES)
  const [transport] = useState<TransportLine[]>(INITIAL_TRANSPORT)
  const [fjernModalId, setFjernModalId] = useState<string | null>(null)
  const [cancellingDayId, setCancellingDayId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<MockPhoto[]>(INITIAL_PHOTOS)
  const [opmaalingOpen, setOpmaalingOpen] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [besigtigelseComment, setBesigtigelseComment] = useState('')
  const [noteComments, setNoteComments] = useState<NoteComment[]>(INITIAL_COMMENTS)
  const [koreplanBeregnet, setKoreplanBeregnet] = useState(false)
  const [fabricSent, setFabricSent] = useState(false)
  const [sentDayIds, setSentDayIds] = useState<Set<string>>(new Set())
  const [correctionDayIds, setCorrectionDayIds] = useState<Set<string>>(new Set())
  const [expandedResourceId, setExpandedResourceId] = useState<string | null>(null)
  const [udlaantIds, setUdlaantIds] = useState<Set<string>>(new Set())
  const [fakturaOrdre, setFakturaOrdre] = useState<Record<string, string>>({})
  const [sammeAfhentning, setSammeAfhentning] = useState<Record<string, boolean>>({})
  const [planlagtProductIds, setPlanlagtProductIds] = useState<Set<string>>(new Set())
  const [kørselExpandedId, setKørselExpandedId] = useState<string | null>(null)
  const [kørselPlanlagtIds, setKørselPlanlagtIds] = useState<Set<string>>(new Set())
  const [kørselOrders, setKørselOrders] = useState<Record<string, VehicleOrder[]>>({})
  const [kørselParams, setKørselParams] = useState<Record<string, KørselDayParams>>({})

  const activeProduct = products.find(p => p.id === activeProductId)!
  const days = activeProduct.days
  const allocated = days.filter(d => !d.cancelled).reduce((s, d) => s + d.tonsPlanned, 0)
  const remainder = activeProduct.tonsTotal - allocated
  const isFullyAllocated = remainder === 0
  const activeDays = days.filter(d => !d.cancelled)
  const morgenTonsCount = activeDays.filter(d => d.morgenTons != null).length

  const notPlanlagt = resources.filter(r => r.status === 'ikke-planlagt').length

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

          {/* Projektleder */}
          <div className="pt-md border-t border-hairline">
            <div className="flex flex-col gap-xxxs px-xs">
              <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Projektleder</span>
              <p className="font-inter text-sm font-semibold text-text-primary leading-tight">Henrik Thor</p>
              <a href="tel:+4540506070" className="font-inter text-sm text-dark-teal flex items-center gap-xxxs hover:text-deep-teal transition-colors">
                <Phone size={13} />
                40 50 60 70
              </a>
            </div>
          </div>

          {/* Bekræft planlægning */}
          <div className="pt-md border-t border-hairline">
            {planlagtProductIds.has(activeProductId) ? (
              <div className="w-full flex items-center justify-center gap-xs px-sm py-xs rounded-xl bg-[#E7F4EE] border border-[#1F8A5B]/20">
                <CheckCircle2 size={15} className="text-[#1F8A5B] flex-shrink-0" />
                <span className="font-inter font-semibold text-sm text-[#1F8A5B]">Planlægning bekræftet</span>
              </div>
            ) : (
              <button
                onClick={() => setPlanlagtProductIds(prev => new Set([...prev, activeProductId]))}
                className="w-full flex items-center justify-center gap-xs font-inter font-semibold text-sm px-sm py-xs rounded-xl transition-all bg-[#2E9E65] text-white hover:bg-[#1F8A5B] active:scale-[0.98]"
              >
                Bekræft planlægning
              </button>
            )}
          </div>


        </aside>

        {/* ── Hoved-indhold ────────────────────────────────────────── */}
        <main className="px-lg pb-[120px] pt-xs">
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
                        <span className={`font-poppins font-semibold text-sm tabular-nums tracking-tight ${isActive ? 'text-white' : 'text-text-muted'}`}>
                          {p.recipeCode} · <span className="text-xs font-normal">{p.tonsTotal} tons</span>
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
                  <span className="font-poppins font-semibold text-sm text-text-primary">
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

              {/* Kommentar */}
              <div className="border-t border-hairline bg-white">
                <CommentCell text={activeProduct.activityName} />
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
                        isToday={day.date === TODAY_STR}
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
            <div className="flex items-end justify-between pb-sm border-b border-hairline mb-lg">
              <h2 className="font-poppins font-semibold text-xl text-text-primary">Dokumentation</h2>
            </div>

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
                    <img src="/opmaalings-kort.png" alt="Opmåling af område" className="w-full rounded-lg border border-hairline grayscale-[30%]" />
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
                        <div key={photo.id} className={`aspect-square rounded-lg ${photo.color} flex items-center justify-center relative group border border-hairline`}>
                          <span className="font-inter text-xxs text-text-muted">{photo.label}</span>
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
                        <span className="font-inter text-xxs text-text-muted mt-xxxs">Tilføj</span>
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
            <div className="flex items-end justify-between pb-sm border-b border-hairline mb-lg">
              <h2 className="font-poppins font-semibold text-xl text-text-primary">Materiel</h2>
            </div>

            {/* Maskiner */}
            <div className="bg-white border border-hairline rounded-xl overflow-hidden mb-sm">
              {resources.map((r, i) => {
                const isExpanded = expandedResourceId === r.id
                const isUdlaant = udlaantIds.has(r.id)
                const isSamme = sammeAfhentning[r.id] !== false
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
                      <div className="flex items-center gap-xxxs">
                        {r.status === 'planlagt' && !isExpanded ? (
                          <>
                            <span className="inline-flex items-center gap-[5px] px-xs py-xxxs rounded-l-lg border border-r-0 border-hairline bg-[#E7F4EE] font-inter text-xs font-medium text-text-primary whitespace-nowrap">
                              <span className="w-[6px] h-[6px] rounded-full bg-[#1F8A5B] flex-shrink-0" />
                              Planlagt
                            </span>
                            <button
                              onClick={() => setExpandedResourceId(r.id)}
                              className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-r-lg border border-hairline font-inter text-xs font-medium text-dark-teal hover:bg-[#F5F5F5] transition-colors whitespace-nowrap"
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

                        {/* Aflæsning */}
                        <div>
                          <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Aflæsningssted</p>
                          <div className="w-full h-[180px] rounded-xl bg-[#E8EFF5] border border-hairline flex flex-col items-center justify-center gap-xs text-text-muted">
                            <div className="w-8 h-8 rounded-full bg-dark-teal/10 flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-teal"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                            </div>
                            <p className="font-inter text-xs text-text-muted">Kortintegration tilgængelig efter opsætning</p>
                            <p className="font-inter text-xxs text-text-muted opacity-60">Klik for at markere aflæsningssted</p>
                          </div>
                        </div>

                        {/* Afhentning */}
                        <div>
                          <div className="flex items-center justify-between mb-xs">
                            <p className="font-inter text-xs font-semibold text-text-primary">Afhentningssted</p>
                            <div className="flex items-center gap-xs">
                              <span className="font-inter text-xs text-text-muted">Samme sted?</span>
                              <div className="flex gap-xxxs">
                                <button
                                  onClick={() => setSammeAfhentning(prev => ({ ...prev, [r.id]: true }))}
                                  className={`px-xs py-xxxs rounded-full font-inter text-xs font-medium border transition-colors ${isSamme ? 'bg-dark-teal text-white border-dark-teal' : 'bg-white text-text-muted border-hairline hover:border-dark-teal hover:text-dark-teal'}`}
                                >Ja</button>
                                <button
                                  onClick={() => setSammeAfhentning(prev => ({ ...prev, [r.id]: false }))}
                                  className={`px-xs py-xxxs rounded-full font-inter text-xs font-medium border transition-colors ${!isSamme ? 'bg-dark-teal text-white border-dark-teal' : 'bg-white text-text-muted border-hairline hover:border-dark-teal hover:text-dark-teal'}`}
                                >Nej</button>
                              </div>
                            </div>
                          </div>
                          {isSamme ? (
                            <div className="w-full py-sm px-sm rounded-xl bg-[#E7F4EE] border border-[#1F8A5B]/20 flex items-center gap-xs">
                              <span className="w-[6px] h-[6px] rounded-full bg-[#1F8A5B] flex-shrink-0" />
                              <span className="font-inter text-xs text-text-secondary">Samme placering som aflæsningssted</span>
                            </div>
                          ) : (
                            <div className="w-full h-[180px] rounded-xl bg-[#E8EFF5] border border-hairline flex flex-col items-center justify-center gap-xs text-text-muted">
                              <div className="w-8 h-8 rounded-full bg-dark-teal/10 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-teal"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                              </div>
                              <p className="font-inter text-xs text-text-muted">Kortintegration tilgængelig efter opsætning</p>
                              <p className="font-inter text-xxs text-text-muted opacity-60">Klik for at markere alternativt afhentningssted</p>
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
              <div className="flex items-end justify-between pb-sm border-b border-hairline mb-lg">
                <h2 className="font-poppins font-semibold text-xl text-text-primary">Kørsel</h2>
              </div>
              <div className="bg-white border border-hairline rounded-xl overflow-hidden">
                {activeDays.map((day, i) => {
                  const isExpanded = kørselExpandedId === day.id
                  const isPlanlagt = kørselPlanlagtIds.has(day.id)
                  const orders = kørselOrders[day.id] ?? []
                  const params = kørselParams[day.id] ?? DEFAULT_KØRSEL_PARAMS
                  const totalCapacity = orders.reduce((sum, o) => {
                    const vt = VEHICLE_TYPES.find(v => v.label === o.type)
                    return sum + (vt ? vt.tons * o.antal : 0)
                  }, 0)
                  const capacityOk = totalCapacity >= day.tonsPlanned

                  function updateOrder(id: string, field: 'type' | 'antal', value: string | number) {
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
                  function addPause() {
                    const p: KørselPause = { id: `p-${Date.now()}`, time: '09:00', durationMin: 30 }
                    updateParam('pauses', [...params.pauses, p])
                  }
                  function removePause(id: string) {
                    updateParam('pauses', params.pauses.filter(p => p.id !== id))
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
                            <div className="flex items-center gap-md flex-wrap justify-end">
                              <span className="inline-flex items-center gap-sm px-sm py-xxxs rounded-lg bg-[#E7F4EE] font-inter text-xs font-medium text-text-primary whitespace-nowrap">
                                <span>{orders.reduce((s, o) => s + o.antal, 0)} biler bestilt</span>
                                <span className="text-text-muted">·</span>
                                <span>Interval {params.intervalMinutes} min</span>
                                <span className="text-text-muted">·</span>
                                <span>Første læs {params.firstLoadTime}</span>
                              </span>
                              <div className="flex">
                                <span className="inline-flex items-center gap-[5px] px-xs py-xxxs rounded-l-lg border border-r-0 border-hairline bg-[#E7F4EE] font-inter text-xs font-medium text-text-primary whitespace-nowrap">
                                  <span className="w-[6px] h-[6px] rounded-full bg-[#1F8A5B] flex-shrink-0" />
                                  Kørsel planlagt
                                </span>
                                <button
                                  onClick={() => setKørselExpandedId(day.id)}
                                  className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-r-lg border border-hairline bg-white font-inter text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                                >
                                  <Pencil size={11} />
                                  Ret
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => isExpanded ? (setKørselPlanlagtIds(prev => new Set([...prev, day.id])), setKørselExpandedId(null)) : setKørselExpandedId(day.id)}
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
                                          onChange={e => updateOrder(o.id, 'foersteLaes' as any, e.target.checked)}
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
                              <div className={`mt-md flex items-center gap-xs px-xs py-xxxs rounded-lg ${capacityOk ? 'bg-[#E7F4EE]' : 'bg-[#FBECEA]'}`}>
                                <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${capacityOk ? 'bg-[#1F8A5B]' : 'bg-[#C8372D]'}`} />
                                <span className="font-inter text-xs font-medium text-text-primary tabular-nums">
                                  Gns. {totalCapacity} tons kapacitet / {day.tonsPlanned} tons
                                </span>
                                {!capacityOk && (
                                  <span className="font-inter text-xs text-[#C8372D]">{day.tonsPlanned - totalCapacity} tons mangler</span>
                                )}
                              </div>
                            )}
                          </div>

                          <hr className="border-hairline" />

                          {/* Fabrik – Plads */}
                          <div>
                            <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Fabrik – Plads</p>
                            <div className="grid grid-cols-4 gap-xs">
                              {([
                                { label: 'Køretid (en vej)', key: 'driveMinutes' as const },
                                { label: 'Pålæsning',        key: 'loadMinutes' as const },
                                { label: 'Aflæsning',        key: 'deliverMinutes' as const },
                                { label: 'Interval',         key: 'intervalMinutes' as const },
                              ]).map(f => (
                                <div key={f.key} className="flex flex-col gap-xxxs">
                                  <label className="font-inter text-xxs text-text-muted">{f.label}</label>
                                  <div className="flex items-center gap-xxxs bg-white border border-hairline rounded-lg px-xs py-xs">
                                    <input
                                      type="number"
                                      value={params[f.key] as number}
                                      onChange={e => updateParam(f.key, Math.max(1, parseInt(e.target.value) || 1))}
                                      className="w-full font-inter text-xs text-text-primary bg-transparent border-none outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="font-inter text-xxs text-text-muted">min</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <hr className="border-hairline" />

                          {/* Leveringstid */}
                          <div>
                            <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Leveringstid på pladsen</p>
                            <div className="grid grid-cols-2 gap-xs">
                              {([
                                { label: 'Første læs', key: 'firstLoadTime' as const },
                                { label: 'Sidste læs', key: 'lastLoadTime' as const },
                              ]).map(f => (
                                <div key={f.key} className="flex flex-col gap-xxxs">
                                  <label className="font-inter text-xxs text-text-muted">{f.label}</label>
                                  <input
                                    type="time"
                                    value={params[f.key] as string}
                                    onChange={e => updateParam(f.key, e.target.value)}
                                    className="font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <hr className="border-hairline" />

                          {/* Pauser */}
                          <div>
                            <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Pauser</p>
                            <div className="flex flex-col gap-xs">
                              {params.pauses.map(p => (
                                <div key={p.id} className="flex items-center gap-xs">
                                  <div className="flex flex-col gap-xxxs flex-1">
                                    <label className="font-inter text-xxs text-text-muted">Tidspunkt</label>
                                    <input
                                      type="time"
                                      value={p.time}
                                      onChange={e => updateParam('pauses', params.pauses.map(x => x.id === p.id ? { ...x, time: e.target.value } : x))}
                                      className="font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-xxxs flex-1">
                                    <label className="font-inter text-xxs text-text-muted">Varighed</label>
                                    <div className="flex items-center gap-xxxs bg-white border border-hairline rounded-lg px-xs py-xs">
                                      <input
                                        type="number"
                                        value={p.durationMin}
                                        onChange={e => updateParam('pauses', params.pauses.map(x => x.id === p.id ? { ...x, durationMin: Math.max(1, parseInt(e.target.value) || 1) } : x))}
                                        className="w-full font-inter text-xs text-text-primary bg-transparent border-none outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <span className="font-inter text-xxs text-text-muted">min</span>
                                    </div>
                                  </div>
                                  <button onClick={() => removePause(p.id)} className="text-text-muted hover:text-bad transition-colors mt-sm">
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={addPause}
                                className="inline-flex items-center gap-xxxs font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors self-start"
                              >
                                <Plus size={13} />
                                Tilføj pause
                              </button>
                            </div>
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
  day, isToday, isSelectingReason,
  onUpdateTons, onUpdateMorgenTons,
  onConfirmCancel, onRestore,
}: {
  day: DayPlan
  isToday: boolean
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
    <div className="relative w-[140px] min-h-[172px] bg-white rounded-xl flex flex-col p-sm gap-xs transition-all border border-hairline hover:border-hairline-2">


      {/* Vejr-knap */}
      <button
        onClick={() => setWeatherActive(w => !w)}
        className={[
          'absolute bottom-[10px] right-[10px] w-7 h-7 rounded-lg flex items-center justify-center border transition-all',
          weatherActive
            ? 'bg-dark-teal text-white border-dark-teal'
            : 'bg-[#F5F5F5] text-dark-teal border-hairline hover:bg-dark-teal hover:text-white hover:border-dark-teal',
        ].join(' ')}
        aria-label="Markér vejrrisiko"
        aria-pressed={weatherActive}
      >
        <CloudRain size={14} />
      </button>

      <div className="flex justify-between items-center">
        <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">{formatWeekday(day.date)}</span>
        <span className="font-inter text-xs font-semibold text-text-secondary tabular-nums">{formatShortDate(day.date)}</span>
      </div>

      {/* Forventet */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block">Forventet</span>
        <div className="flex items-baseline gap-xxxs">
          <input
            type="number"
            value={day.tonsPlanned || ''}
            onChange={e => onUpdateTons(day.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="font-poppins font-semibold text-xl text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="0"
          />
          <span className="font-inter text-xxs text-text-muted">tons</span>
        </div>
      </div>

      <hr className="border-hairline" />

      {/* Morgen */}
      <div className={`rounded-lg px-xs py-xxxs -mx-xs transition-colors ${day.morgenTons == null ? 'bg-[#FBECEA]' : 'bg-[#E7F4EE]'}`}>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block">Morgen tons</span>
        <div className="flex items-baseline gap-xxxs">
          <input
            type="number"
            value={day.morgenTons ?? ''}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              onUpdateMorgenTons(day.id, isNaN(v) ? undefined : Math.max(0, v))
            }}
            className="font-poppins font-semibold text-xl text-text-primary bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="–"
          />
          <span className="font-inter text-xxs text-text-muted">tons</span>
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
        className="w-full grid items-center gap-md px-sm py-sm hover:bg-[#F5F5F5] transition-colors"
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
        <div className="px-sm pb-sm border-t border-hairline">{children}</div>
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

