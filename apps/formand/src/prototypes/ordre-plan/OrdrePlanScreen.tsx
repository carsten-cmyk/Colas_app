/**
 * PROTOTYPE — Ordre Planlægnings-mode
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
  AlertCircle,
  CheckCircle2,
  Camera,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Trash2,
  Pencil,
  Mic,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { TabName } from '@/types/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

type CancelReason = 'regn' | 'frost' | 'underlag' | 'andet'

interface DayPlan {
  id: string
  day: number
  date: string // YYYY-MM-DD
  tonsPlanned: number
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
  startDate?: string   // YYYY-MM-DD
  endDate?: string     // YYYY-MM-DD
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
  date: string   // YYYY-MM-DD
  time: string   // HH:MM
  status: 'planlagt' | 'ikke-planlagt'
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
    startDate: '2026-03-14',
    endDate: '2026-03-15',
    days: [
      { id: 'd1-1', day: 1, date: '2026-03-14', tonsPlanned: 100, cancelled: false },
      { id: 'd1-2', day: 2, date: '2026-03-15', tonsPlanned: 100, cancelled: false },
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
  { id: 't1', type: 'blokvogn',  direction: 'ud',   date: '2026-03-14', time: '06:00', status: 'ikke-planlagt' },
  { id: 't2', type: 'blokvogn',  direction: 'hjem',  date: '2026-03-18', time: '15:00', status: 'ikke-planlagt' },
  { id: 't3', type: 'kran-baand', direction: 'ud',   date: '2026-03-14', time: '06:30', status: 'ikke-planlagt' },
  { id: 't4', type: 'kran-baand', direction: 'hjem', date: '2026-03-18', time: '15:30', status: 'ikke-planlagt' },
]

const TRANSPORT_TYPE_LABEL: Record<TransportLine['type'], string> = {
  'blokvogn':  'Blokvogn',
  'kran-baand': 'Kran-Bånd',
  'andet':     'Andet',
}

const CANCEL_REASONS: { value: CancelReason; label: string }[] = [
  { value: 'regn',    label: 'Regn' },
  { value: 'frost',   label: 'Frost' },
  { value: 'underlag', label: 'Underlag' },
  { value: 'andet',   label: 'Andet' },
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
    timestamp: '14. mar, 08:42',
    text: 'Området er opmålt og klargjort. Underlag ser fornuftigt ud — mindre ujævnheder ved indkørslen mod nord er udbedret. Koordination med skolens vicevært er på plads, adgang sikret fra kl. 06:00.',
  },
  {
    id: 'nc2',
    initials: 'HT',
    name: 'Henrik Thor',
    timestamp: '14. mar, 11:15',
    text: 'Besigtigelse gennemført. Bemærk at det nordøstlige hjørne kræver ekstra komprimering — kunden har påpeget sætninger fra tidligere belægning. Aftalt med Ole at vi tager et ekstra gennemløb med HAMM HD10 i det område inden udlægning af lag 2.',
  },
]

interface MockPhoto {
  id: string
  color: string   // placeholder farve
  label: string
}

const INITIAL_PHOTOS: MockPhoto[] = [
  { id: 'ph1', color: 'bg-dark-teal/20',  label: 'Foto 1' },
  { id: 'ph2', color: 'bg-yellow/30',     label: 'Foto 2' },
  { id: 'ph3', color: 'bg-light-aqua/60', label: 'Foto 3' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'][d.getDay()]
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function bumpDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function countDays(startStr: string, endStr: string): number {
  const s = new Date(startStr + 'T00:00:00')
  const e = new Date(endStr + 'T00:00:00')
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000) + 1)
}

function generateDays(startDateStr: string, endDateStr: string): DayPlan[] {
  const result: DayPlan[] = []
  const end = new Date(endDateStr + 'T00:00:00')
  let current = new Date(startDateStr + 'T00:00:00')
  let dayNum = 1
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    result.push({ id: `gen-${dateStr}`, day: dayNum, date: dateStr, tonsPlanned: 0, cancelled: false })
    current.setDate(current.getDate() + 1)
    dayNum++
  }
  return result
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type OrderMode = 'planlaegning' | 'udforsrel' | 'evaluering'

const ORDER_MODES: { id: OrderMode; label: string }[] = [
  { id: 'planlaegning', label: 'Planlægning' },
  { id: 'udforsrel',   label: 'Udførsel' },
  { id: 'evaluering',  label: 'Evaluering' },
]

export function OrdrePlanScreen() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabName>('dagens-opgaver')

  function handleTabPress(tab: TabName) {
    if (tab === 'mine-opgaver') { navigate('/prototyper/gantt'); return }
    setActiveTab(tab)
  }
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
  const [besigtigelseOpen, setBesigtigelseOpen] = useState(false)
  const [besigtigelseComment, setBesigtigelseComment] = useState('')
  const [noteComments, setNoteComments] = useState<NoteComment[]>(INITIAL_COMMENTS)

  const [koreplanBeregnet, setKoreplanBeregnet] = useState(false)

  const activeProduct = products.find(p => p.id === activeProductId)!
  const startDate = activeProduct.startDate ?? (activeProduct.days[0]?.date ?? '')
  const endDate = activeProduct.endDate ?? (activeProduct.days[activeProduct.days.length - 1]?.date ?? '')
  const numDays = startDate && endDate && startDate <= endDate
    ? countDays(startDate, endDate)
    : activeProduct.days.length
  const days = activeProduct.days
  const allocated = days.filter(d => !d.cancelled).reduce((s, d) => s + d.tonsPlanned, 0)
  const remainder = activeProduct.tonsTotal - allocated

  function updateTons(dayId: string, value: number) {
    setProducts(prev => prev.map(p =>
      p.id === activeProductId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, tonsPlanned: value } : d) }
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

  function addDay() {
    const last = days[days.length - 1]
    const newDate = last ? bumpDate(last.date) : TODAY_STR
    const newDay: DayPlan = {
      id: `${activeProductId}-${Date.now()}`,
      day: days.length + 1,
      date: newDate,
      tonsPlanned: 0,
      cancelled: false,
    }
    setProducts(prev => prev.map(p =>
      p.id === activeProductId ? { ...p, days: [...p.days, newDay] } : p
    ))
  }

  function updateProductDates(productId: string, field: 'startDate' | 'endDate', value: string) {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const updated = { ...p, [field]: value }
      const start = field === 'startDate' ? value : (p.startDate ?? '')
      const end   = field === 'endDate'   ? value : (p.endDate   ?? '')
      if (start && end && start <= end) {
        return { ...updated, days: generateDays(start, end) }
      }
      return updated
    }))
  }

  function removeResource(id: string) {
    setResources(prev => prev.filter(r => r.id !== id))
    setFjernModalId(null)
  }

  function toggleResourceStatus(id: string) {
    setResources(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === 'planlagt' ? 'ikke-planlagt' : 'planlagt' } : r
    ))
  }

const fjernModalResource = fjernModalId ? resources.find(r => r.id === fjernModalId) : null

  return (
    <div className="min-h-screen bg-soft-aqua flex flex-col">
      <TopBar userInitials="OJ" userName="Ole J." onSettingsPress={() => {}} />

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 110 }}>

        {/* ── Order header — light-aqua baggrund ──────────────────── */}
        <div className="bg-soft-aqua px-sm pt-sm pb-sm">

          {/* Ordrenummer */}
          <p className="font-inter font-semibold text-sm text-dark-teal leading-none pl-xs mb-xs">
            Ordre 1212343
          </p>

          {/* Mode-navigation */}
          <div className="flex mb-sm">
            {ORDER_MODES.map((mode, i) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className="flex-1 py-[9px] font-inter font-semibold text-xxs border-0 outline-none focus:outline-none transition-colors"
                style={{
                  backgroundColor: activeMode === mode.id ? '#FEEE32' : '#0E4764',
                  color: activeMode === mode.id ? '#0B3950' : 'rgba(255,255,255,0.5)',
                  borderTopLeftRadius:    i === 0 ? 16 : 0,
                  borderBottomLeftRadius: i === 0 ? 16 : 0,
                  borderTopRightRadius:    i === ORDER_MODES.length - 1 ? 16 : 0,
                  borderBottomRightRadius: i === ORDER_MODES.length - 1 ? 16 : 0,
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Info-bokse — horisontalt, samme stil som stats-kort */}
          <div className="flex gap-xs">

            {/* Kunde */}
            <div className="flex-1 min-w-[110px] bg-white rounded-2xl shadow-md p-sm flex flex-col gap-xxxs">
              <p className="font-inter text-xxs text-text-muted leading-none">Kunde</p>
              <p className="font-inter font-medium text-xs text-dark-teal leading-tight mt-xxxs">
                Uddannelsescenter Syd
              </p>
              <p className="font-inter text-xxs text-text-muted leading-tight mt-xxxs">
                Søvej 6D, Nakskov
              </p>
            </div>

            {/* Beskrivelse */}
            <div className="flex-1 min-w-[130px] bg-white rounded-2xl shadow-md p-sm flex flex-col gap-xxxs">
              <p className="font-inter text-xxs text-text-muted leading-none">Beskrivelse</p>
              <p className="font-inter text-xs text-dark-teal leading-snug mt-xxxs">
                Ny belægning på parkeringsplads. Koordinér med skolens administration.
              </p>
            </div>

            {/* Projektleder */}
            <div className="flex-1 min-w-[130px] bg-white rounded-2xl shadow-md p-sm flex flex-col gap-xxxs">
              <p className="font-inter text-xxs text-text-muted leading-none">Projektleder</p>
              <div className="flex items-center gap-xxxs mt-xxxs">
                <div className="w-[20px] h-[20px] rounded-full bg-dark-teal/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-inter font-bold text-[9px] text-dark-teal">HT</span>
                </div>
                <p className="font-inter font-medium text-xs text-dark-teal truncate">Henrik Thor</p>
              </div>
              <a
                href="tel:+4540506070"
                className="flex items-center gap-xxxs hover:opacity-70 transition-opacity mt-xxxs"
              >
                <Phone size={11} className="text-dark-teal flex-shrink-0" />
                <span className="font-inter font-medium text-xs text-dark-teal">40 50 60 70</span>
              </a>
            </div>

            {/* Beskeder */}
            <div className="flex-1 min-w-[150px] bg-white rounded-2xl shadow-md p-sm flex flex-col gap-xxxs">
              <p className="font-inter text-xxs text-text-muted leading-none mb-xxxs">Seneste beskeder</p>

              {[
                'Forsinkelse på asfaltfabrik i dag',
                'Vejrmelding: risiko for regn efter kl. 14',
              ].map(msg => (
                <div key={msg} className="flex items-start justify-between gap-xs mt-xxxs">
                  <p className="font-inter text-xs text-dark-teal leading-tight flex-1 min-w-0 line-clamp-2">
                    {msg}
                  </p>
                  <span className="flex-shrink-0 w-[22px] h-[22px] rounded-sm flex items-center justify-center" style={{ backgroundColor: '#CAE6E3' }}>
                    <ChevronDown size={13} className="text-deep-teal -rotate-90" />
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Sektion-overskrift ───────────────────────────────────── */}
        <div className="pl-[32px] pr-sm pt-md pb-xs">
          <h2 className="font-poppins font-bold text-2xl text-deep-teal leading-none">
            Udlægning
          </h2>
        </div>

        {/* ── Produkt-tabs — dark-teal strip under header ──────────── */}
        <div className="bg-soft-aqua flex px-sm">
          {products.map(p => {
            const isActive = p.id === activeProductId
            return (
              <button
                key={p.id}
                onClick={() => setActiveProductId(p.id)}
                className="flex-1 bg-dark-teal first:rounded-tl-2xl last:rounded-tr-2xl relative flex items-center justify-center px-xs py-xs gap-xs border-0 outline-none focus:outline-none"
              >
                <span className={`font-poppins font-semibold text-sm leading-tight ${isActive ? 'text-white' : 'text-white/50'}`}>
                  {p.recipeCode}
                </span>
                <span className={`font-inter text-xs leading-none ${isActive ? 'text-white/70' : 'text-white/35'}`}>
                  {p.tonsTotal}t
                </span>
                <div className={`absolute bottom-0 left-0 right-0 h-[5px] ${isActive ? 'bg-yellow' : ''}`} />
              </button>
            )
          })}
        </div>

        {/* ── Tab content ──────────────────────────────────────────── */}
        <div className="px-sm pb-sm pt-0 flex flex-col gap-sm">

          {/* Stats — ingen top-runding, sidder flush mod fanerne */}
          <div className="bg-white rounded-b-lg shadow-md p-sm">
            <p className="font-poppins font-semibold text-xs text-deep-teal mb-sm">
              Produkt {activeProduct.recipeCode}
            </p>
            <div className="grid grid-cols-4 gap-xs">
              {[
                { label: 'Tons',     value: `${activeProduct.tonsTotal}t` },
                { label: 'KVM',      value: `${activeProduct.m2.toLocaleString('da-DK')} m²` },
                { label: 'Tykkelse', value: `${activeProduct.thicknessMm} mm` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-xxxs">
                  <p className="font-inter text-xxs text-text-muted">{label}</p>
                  <p className="font-poppins font-semibold text-xs text-deep-teal">{value}</p>
                </div>
              ))}
              <div className="flex flex-col gap-xxxs">
                <p className="font-inter text-xxs text-text-muted">Fabrik</p>
                <p className="font-poppins font-semibold text-xs text-deep-teal leading-tight">
                  {activeProduct.factory.name}
                </p>
                <p className="font-inter text-xxs text-text-muted">
                  {activeProduct.factory.driveTimeMinutes} min
                </p>
              </div>
            </div>
            <div className="mt-xs pt-xs border-t border-box-outline grid grid-cols-4 gap-xs">

              {/* Dato for udlægning — kol 1–2 */}
              <div className="col-span-2 flex flex-col gap-xxxs pr-sm">
                <p className="font-inter font-semibold text-xxs text-text-secondary">Dato for udlægning</p>
                <div className="flex items-center gap-[6px]">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => updateProductDates(activeProduct.id, 'startDate', e.target.value)}
                    className="font-inter text-xxs text-deep-teal rounded-md px-[6px] py-[5px] border-2 focus:outline-none min-w-0 flex-1"
                    style={{
                      borderColor: startDate ? '#A0C7D7' : '#FEEE32',
                      backgroundColor: startDate ? '#F0F7FA' : '#FEFBCC',
                    }}
                  />
                  <span className="font-inter text-xxs text-text-muted flex-shrink-0">–</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => updateProductDates(activeProduct.id, 'endDate', e.target.value)}
                    className="font-inter text-xxs text-deep-teal rounded-md px-[6px] py-[5px] border-2 focus:outline-none min-w-0 flex-1"
                    style={{
                      borderColor: endDate ? '#A0C7D7' : '#FEEE32',
                      backgroundColor: endDate ? '#F0F7FA' : '#FEFBCC',
                    }}
                  />
                </div>
              </div>

              {/* Antal dage — kol 3 */}
              <div className="flex flex-col gap-xxxs">
                <p className="font-inter text-xxs text-text-muted">Antal dage</p>
                <p className="font-poppins font-semibold text-xs text-deep-teal">
                  {startDate && endDate && startDate <= endDate ? numDays : '–'}
                </p>
              </div>

              {/* Beskrivelse — kol 4, flugter med Fabrik ovenover */}
              <div className="col-start-4 flex flex-col gap-xxxs">
                <p className="font-inter text-xxs text-text-muted">Beskrivelse</p>
                <p className="font-inter text-xs text-text-secondary leading-snug">
                  {activeProduct.activityName}
                </p>
              </div>

            </div>
          </div>

          {/* Days */}
          <div>
            <p className="font-poppins font-semibold text-xs text-deep-teal mb-xs pl-sm">Dagfordeling</p>

            {/* Scrollable day strip + fast remainder-kort til højre */}
            <div className="flex gap-xs -mx-sm px-sm">
              {/* Scrollable pills */}
              <div className="flex gap-xs overflow-x-auto pb-xs">
                {days.map(day => (
                  <DayPill
                    key={day.id}
                    day={day}
                    isToday={day.date === TODAY_STR}
                    isSelectingReason={cancellingDayId === day.id}
                    onUpdateTons={updateTons}
                    onStartCancel={() => setCancellingDayId(day.id)}
                    onConfirmCancel={cancelDay}
                    onRestore={restoreDay}
                  />
                ))}

                {/* Add day */}
                <button
                  onClick={addDay}
                  className="flex-shrink-0 w-[100px] h-[112px] border-2 border-dashed border-divider-strong rounded-lg flex flex-col items-center justify-center gap-xxxs hover:border-dark-teal hover:bg-white/60 transition-colors"
                >
                  <Plus size={18} className="text-text-muted" />
                  <span className="font-inter text-xxs text-text-muted leading-tight text-center">
                    Tilføj dag
                  </span>
                </button>
              </div>

              {/* Remainder card — fast til højre, samme størrelse */}
              <div className={`flex-shrink-0 w-[100px] h-[112px] pb-xs rounded-lg shadow-md flex flex-col items-center justify-center gap-xs ${
                remainder === 0 ? 'bg-success/40' : 'bg-error/10'
              }`}>
                {remainder === 0 ? (
                  <>
                    <CheckCircle2 size={20} className="text-deep-teal" />
                    <p className="font-inter text-xxs text-deep-teal text-center leading-tight px-xxxs">
                      Fuldt fordelt
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} className="text-error" />
                    <p className="font-inter text-sm text-error leading-none">
                      {Math.abs(remainder)}t
                    </p>
                    <p className="font-inter text-xxs text-error text-center leading-tight">
                      {remainder > 0 ? 'mangler' : 'over'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <RemainderLine allocated={allocated} tonsTotal={activeProduct.tonsTotal} />
          </div>

          {/* Materiel */}
          <div>
            <h2 className="font-poppins font-bold text-2xl text-deep-teal leading-none pl-sm mb-xs pt-sm">Materiel</h2>

            {/* LAG 1 — Maskiner */}
            <div className="flex flex-col gap-xs">
              {resources.length === 0 ? (
                <p className="font-inter text-xs text-text-muted">Intet materiel tilknyttet.</p>
              ) : (
                resources.map(r => (
                  <div
                    key={r.id}
                    className="bg-white rounded-lg shadow-md px-sm py-[10px] flex items-center gap-sm"
                  >
                    <div className="w-[36px] h-[36px] rounded-md bg-soft-aqua flex items-center justify-center flex-shrink-0">
                      <Truck size={16} className="text-dark-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-xs text-text-primary font-medium leading-tight truncate">
                        {r.description}
                      </p>
                      <div className="flex items-center gap-xs mt-xxxs">
                        <span className="font-inter text-xxs text-text-muted">{r.plantNumber}</span>
                        <TransportBadge tag={r.transportTag} />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleResourceStatus(r.id)}
                      className="flex-shrink-0 w-[110px] flex items-center justify-center gap-[5px] py-[5px] rounded-md font-inter font-semibold text-xxs transition-opacity hover:opacity-75"
                      style={
                        r.status === 'planlagt'
                          ? { backgroundColor: '#CAE6E3', color: '#0B3950' }
                          : { backgroundColor: '#FDE8E8', border: '1px solid #F04E4E', color: '#F04E4E' }
                      }
                    >
                      {r.status === 'planlagt'
                        ? <><CheckCircle size={11} /> Planlagt</>
                        : <><AlertTriangle size={11} /> Ikke planlagt</>
                      }
                    </button>
                    <button
                      onClick={() => setFjernModalId(r.id)}
                      className="flex-shrink-0 p-[6px] rounded-md hover:bg-error/10 transition-colors"
                      aria-label={`Fjern ${r.description}`}
                    >
                      <Trash2 size={13} className="text-text-muted" />
                    </button>
                  </div>
                ))
              )}

              {/* Tilføj maskine */}
              <button className="w-full flex items-center justify-center gap-xs border-2 border-dashed border-divider-strong rounded-lg py-[10px] hover:border-dark-teal hover:bg-white/60 transition-colors">
                <Plus size={16} className="text-text-muted" />
                <span className="font-inter text-xs text-text-muted">Tilføj materiel</span>
              </button>
            </div>

            {/* LAG 2 — Transport af materiel */}
            <p className="font-poppins font-semibold text-xs text-deep-teal mt-sm mb-xs pl-sm">
              Transport af materiel
            </p>
            <div className="flex flex-col gap-xs">
              {transport.map(t => (
                <div
                  key={t.id}
                  className="bg-white rounded-lg shadow-md px-sm py-[10px] flex items-center gap-sm"
                >
                  <div className="w-[36px] h-[36px] rounded-md bg-soft-aqua flex items-center justify-center flex-shrink-0">
                    <Truck size={16} className="text-dark-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-xs text-text-primary font-medium leading-tight">
                      {TRANSPORT_TYPE_LABEL[t.type]}
                      <span className="font-normal text-text-muted"> · {t.direction === 'ud' ? 'Ud' : 'Hjem'}</span>
                    </p>
                    <p className="font-inter text-xxs text-text-muted mt-xxxs">
                      {formatShortDate(t.date)} · kl. {t.time}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 flex items-center gap-[5px] px-xs py-[5px] rounded-md font-inter font-semibold text-xxs whitespace-nowrap"
                    style={{ backgroundColor: '#CAE6E3', color: '#0B3950' }}
                  >
                    <CheckCircle size={11} className="flex-shrink-0" />
                    Tilføjet til kørselsplanlægning
                  </span>
                  <button
                    className="flex-shrink-0 p-[6px] rounded-md hover:bg-soft-aqua transition-colors"
                    aria-label="Rediger transport"
                  >
                    <Pencil size={13} className="text-text-muted" />
                  </button>
                </div>
              ))}

              {/* Tilføj transport */}
              <button className="w-full flex items-center justify-center gap-xs border-2 border-dashed border-divider-strong rounded-lg py-[10px] hover:border-dark-teal hover:bg-white/60 transition-colors">
                <Plus size={16} className="text-text-muted" />
                <span className="font-inter text-xs text-text-muted">Tilføj materiel transport</span>
              </button>

            </div>
          </div>

          {/* Dokumentation */}
          <div className="flex flex-col gap-xs pt-sm">
            <h2 className="font-poppins font-bold text-2xl text-deep-teal leading-none pl-sm">Dokumentation</h2>
          <div className="bg-white rounded-lg shadow-md p-sm">

            <div className="flex flex-col divide-y divide-box-outline">

              {/* Opmåling — ekspanderbar */}
              <div>
                <button
                  onClick={() => setOpmaalingOpen(o => !o)}
                  className="w-full flex items-center justify-between py-xs gap-sm"
                >
                  <p className="font-inter text-xs text-text-secondary flex-shrink-0">
                    Opmåling af område
                  </p>
                  <div className="flex items-center gap-xs">
                    <span className="flex items-center gap-[5px] w-[76px] justify-center py-[5px] rounded-md bg-success/20 font-inter font-semibold text-xxs text-deep-teal">
                      <CheckCircle size={11} /> OK
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${opmaalingOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {opmaalingOpen && (
                  <div className="pb-sm">
                    <img
                      src="/opmaalings-kort.png"
                      alt="Opmåling af område"
                      className="w-full rounded-md grayscale"
                    />
                  </div>
                )}
              </div>

              {/* Billedmateriale — ekspanderbar */}
              <div>
                <button
                  onClick={() => setPhotosOpen(o => !o)}
                  className="w-full flex items-center justify-between py-xs gap-sm"
                >
                  <p className="font-inter text-xs text-text-secondary flex-shrink-0">
                    Billedmateriale
                  </p>
                  <div className="flex items-center gap-xs">
                    <span className="font-inter text-xxs text-text-muted">
                      {photos.length} {photos.length === 1 ? 'billede' : 'billeder'}
                    </span>
                    <span className="flex items-center gap-[5px] w-[76px] justify-center py-[5px] rounded-md bg-success/20 font-inter font-semibold text-xxs text-deep-teal">
                      <CheckCircle size={11} /> OK
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${photosOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {photosOpen && (
                  <div className="pb-sm">
                    <div className="grid grid-cols-4 gap-xs">
                      {photos.map(photo => (
                        <div
                          key={photo.id}
                          className={`aspect-square rounded-md ${photo.color} flex items-center justify-center relative group`}
                        >
                          <span className="font-inter text-xxs text-text-muted">{photo.label}</span>
                          <button
                            onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                            className="absolute top-[3px] right-[3px] w-[14px] h-[14px] bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={8} className="text-error" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-md border-2 border-dashed border-divider-strong flex flex-col items-center justify-center cursor-pointer hover:border-dark-teal hover:bg-soft-aqua transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files?.length) {
                              const newPhoto: MockPhoto = {
                                id: `ph${Date.now()}`,
                                color: 'bg-yellow/20',
                                label: `Foto ${photos.length + 1}`,
                              }
                              setPhotos(prev => [...prev, newPhoto])
                            }
                          }}
                        />
                        <Camera size={16} className="text-text-muted" />
                        <span className="font-inter text-xxs text-text-muted mt-xxxs leading-tight text-center">
                          Tag<br />billede
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Projektleder besigtigelse — ekspanderbar */}
              <div>
                <button
                  onClick={() => setBesigtigelseOpen(o => !o)}
                  className="w-full flex items-center justify-between py-xs gap-sm"
                >
                  <p className="font-inter text-xs text-text-secondary flex-shrink-0">
                    Noter til opgave
                  </p>
                  <div className="flex items-center gap-xs">
                    <span className="flex items-center gap-[5px] w-[76px] justify-center py-[5px] rounded-md bg-error/15 font-inter font-semibold text-xxs text-error">
                      <AlertTriangle size={11} /> Mangler
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${besigtigelseOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {besigtigelseOpen && (
                  <div className="pb-sm flex flex-col gap-xs">

                    {/* Kommentar-tråd */}
                    {noteComments.map(c => (
                      <div key={c.id} className="flex gap-xs">
                        <div
                          className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 mt-xxxs"
                          style={{ backgroundColor: c.initials === 'OJ' ? '#0E4764' : '#A0C7D7' }}
                        >
                          <span
                            className="font-inter font-bold text-[9px]"
                            style={{ color: c.initials === 'OJ' ? '#ffffff' : '#0B3950' }}
                          >
                            {c.initials}
                          </span>
                        </div>
                        <div
                          className="flex-1 rounded-lg rounded-tl-none px-xs py-xs"
                          style={{ backgroundColor: c.initials === 'OJ' ? '#F0F7FA' : 'rgba(14,71,100,0.05)' }}
                        >
                          <div className="flex items-baseline gap-xs mb-xxxs">
                            <p className="font-inter font-semibold text-xxs text-deep-teal">{c.name}</p>
                            <p className="font-inter text-xxs text-text-muted">{c.timestamp}</p>
                          </div>
                          <p className="font-inter text-xs text-text-secondary leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))}

                    {/* Tilføj bemærkning */}
                    <div className="flex gap-xs mt-xxxs">
                      <div className="w-[28px] h-[28px] rounded-full bg-dark-teal flex items-center justify-center flex-shrink-0 mt-xxxs">
                        <span className="font-inter font-bold text-[9px] text-white">OJ</span>
                      </div>
                      <div className="flex-1 flex flex-col gap-xxxs">
                        <div className="relative">
                          <textarea
                            value={besigtigelseComment}
                            onChange={e => setBesigtigelseComment(e.target.value)}
                            placeholder="Tilføj bemærkning..."
                            rows={2}
                            className="w-full rounded-lg border border-box-outline bg-soft-aqua px-xs py-xs pr-[36px] font-inter text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-dark-teal resize-none"
                          />
                          <button
                            className="absolute bottom-[10px] right-[10px] w-[28px] h-[28px] rounded-full bg-dark-teal flex items-center justify-center hover:bg-deep-teal transition-colors"
                            aria-label="Dikter bemærkning"
                          >
                            <Mic size={12} className="text-white" />
                          </button>
                        </div>
                        {besigtigelseComment.trim().length > 0 && (
                          <button
                            onClick={() => {
                              setNoteComments(prev => [...prev, {
                                id: `nc${Date.now()}`,
                                initials: 'OJ',
                                name: 'Ole Jensen',
                                timestamp: 'Nu',
                                text: besigtigelseComment.trim(),
                              }])
                              setBesigtigelseComment('')
                            }}
                            className="self-end bg-dark-teal text-white font-inter font-semibold text-xxs px-sm py-[6px] rounded-md hover:bg-deep-teal transition-colors"
                          >
                            Gem
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

          </div>
          </div>{/* /Dokumentation wrapper */}

          {/* Transport */}
          <div className="flex flex-col gap-xs pt-sm">
            <h2 className="font-poppins font-bold text-2xl text-deep-teal leading-none pl-sm">Transport</h2>
          <div className="bg-white rounded-lg shadow-md px-sm pt-sm pb-md">

            {/* Header */}
            <div className="flex items-center justify-between gap-sm mb-sm">
              <p className="font-poppins font-semibold text-xs text-deep-teal">
                Forventet transport
              </p>
              <span className="font-inter text-xxs text-text-muted">
                ~{activeProduct.estimatedTrucks} biler · {activeProduct.estimatedTrucks * activeProduct.estimatedTonsPerTruck}t/dag
              </span>
            </div>


            {/* Knap — altid synlig */}
            <button
              onClick={() => { setKoreplanBeregnet(true); navigate('/prototyper/transportberegner') }}
              className="w-full font-inter font-semibold text-xs py-[11px] rounded-md transition-colors"
              style={
                koreplanBeregnet
                  ? { backgroundColor: '#CAE6E3', color: '#0B3950' }
                  : { backgroundColor: '#0E4764', color: '#ffffff' }
              }
            >
              {koreplanBeregnet ? 'Se køreplan og tilpas' : 'Beregn køreplan'}
            </button>

          </div>
          </div>{/* /Transport wrapper */}

        </div>
      </main>

      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} messageCount={2} />

      {fjernModalResource && (
        <FjernModal
          resource={fjernModalResource}
          onConfirm={() => removeResource(fjernModalResource.id)}
          onCancel={() => setFjernModalId(null)}
        />
      )}
    </div>
  )
}

// ─── DayPill ──────────────────────────────────────────────────────────────────

function DayPill({
  day,
  isToday,
  isSelectingReason,
  onUpdateTons,
  onStartCancel,
  onConfirmCancel,
  onRestore,
}: {
  day: DayPlan
  isToday: boolean
  isSelectingReason: boolean
  onUpdateTons: (id: string, v: number) => void
  onStartCancel: () => void
  onConfirmCancel: (id: string, r: CancelReason) => void
  onRestore: (id: string) => void
}) {
  // Aflyst
  if (day.cancelled) {
    return (
      <div className="flex-shrink-0 w-[100px] h-[112px] bg-white rounded-lg border border-error/30 flex flex-col items-center justify-center gap-xxxs opacity-70">
        <p className="font-inter font-semibold text-xxs text-text-muted">{formatWeekday(day.date)}</p>
        <p className="font-inter text-xxs text-text-muted">{formatShortDate(day.date)}</p>
        <p className="font-inter text-xxs text-text-muted">Dag {day.day}</p>
        <p className="font-inter font-semibold text-xxs text-error mt-xxxs">Aflyst</p>
        {day.cancelReason && (
          <p className="font-inter text-xxs text-text-muted capitalize">{day.cancelReason}</p>
        )}
        <button
          onClick={() => onRestore(day.id)}
          className="mt-xxxs font-inter text-xxs text-dark-teal underline"
        >
          Fortryd
        </button>
      </div>
    )
  }

  // Vælg årsag
  if (isSelectingReason) {
    return (
      <div className="flex-shrink-0 w-[144px] bg-white rounded-lg shadow-md border border-error/20 p-xs flex flex-col gap-xxxs">
        <p className="font-inter text-xxs text-text-muted font-medium mb-xxxs">Årsag til aflysning</p>
        {CANCEL_REASONS.map(r => (
          <button
            key={r.value}
            onClick={() => onConfirmCancel(day.id, r.value)}
            className="w-full text-left px-xs py-[6px] rounded-md font-inter text-xs text-text-secondary hover:bg-soft-aqua hover:text-deep-teal transition-colors"
          >
            {r.label}
          </button>
        ))}
      </div>
    )
  }

  // Normal dag
  return (
    <div
      className={`flex-shrink-0 w-[100px] h-[112px] bg-white rounded-lg flex flex-col items-center pt-xs px-xxxs relative ${
        isToday
          ? 'border-2 border-yellow shadow-md'
          : 'border border-box-outline shadow-md'
      }`}
    >
      {/* Cancel */}
      <button
        onClick={onStartCancel}
        className="absolute top-[5px] right-[5px] w-[16px] h-[16px] flex items-center justify-center rounded-full hover:bg-error/10 transition-colors"
        aria-label="Aflys dag"
      >
        <X size={9} className="text-text-muted" />
      </button>

      <p className={`font-inter font-semibold text-xxs leading-none ${isToday ? 'text-deep-teal' : 'text-text-secondary'}`}>
        {formatWeekday(day.date)}
      </p>
      <p className={`font-inter text-xxs leading-none mt-xxxs ${isToday ? 'text-deep-teal' : 'text-text-muted'}`}>
        {formatShortDate(day.date)}
      </p>
      <p className="font-inter text-xxs text-text-muted mt-xxxs leading-none">Dag {day.day}</p>

      <input
        type="number"
        value={day.tonsPlanned}
        onChange={e => onUpdateTons(day.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="mt-xs w-full text-center font-poppins font-bold text-md text-deep-teal bg-soft-aqua rounded-md border border-box-outline focus:outline-none focus:border-dark-teal py-xxxs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        min={0}
      />
      <p className="font-inter text-xxs text-text-muted mt-xxxs leading-none">tons</p>
    </div>
  )
}

// ─── RemainderLine ────────────────────────────────────────────────────────────

function RemainderLine({ allocated, tonsTotal }: { allocated: number; tonsTotal: number }) {
  const pct = Math.min(100, Math.round((allocated / tonsTotal) * 100))
  const isFull = allocated >= tonsTotal
  const isOver = allocated > tonsTotal
  return (
    <div className="mt-xs">
      <div className={`h-[6px] rounded-full overflow-hidden ${isFull ? 'bg-box-outline' : 'bg-error/20'}`}>
        <div
          className={`h-full rounded-full transition-all ${isOver ? 'bg-error' : 'bg-dark-teal'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-inter font-semibold text-xxs text-text-muted mt-xxxs text-center">
        {allocated}t fordelt af {tonsTotal}t total
      </p>
    </div>
  )
}


// ─── FjernModal ───────────────────────────────────────────────────────────────

function FjernModal({
  resource,
  onConfirm,
  onCancel,
}: {
  resource: MockResource
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 pb-[90px] px-sm">
      <div className="bg-white rounded-2xl shadow-lg p-sm w-full max-w-sm">
        <p className="font-poppins font-semibold text-sm text-deep-teal mb-xxxs">
          Fjern maskine?
        </p>
        <p className="font-inter text-xs text-text-secondary mb-sm leading-relaxed">
          <span className="font-medium">{resource.description}</span> fjernes fra ordren.
          Husk at opdatere transport hvis nødvendigt.
        </p>
        <div className="flex gap-xs">
          <button
            onClick={onCancel}
            className="flex-1 py-[11px] rounded-md border border-box-outline font-inter font-semibold text-xs text-text-secondary hover:border-dark-teal transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-[11px] rounded-md font-inter font-semibold text-xs text-white transition-colors"
            style={{ backgroundColor: '#F04E4E' }}
          >
            Fjern
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TransportBadge ───────────────────────────────────────────────────────────

const TRANSPORT_TAG_STYLES: Record<MockResource['transportTag'], string> = {
  'blokvogn':    'bg-dark-teal/10 text-dark-teal',
  'kran-baand':  'bg-warning/50 text-deep-teal',
  'egen-korsel': 'bg-light-aqua/40 text-deep-teal',
}

const TRANSPORT_TAG_LABEL: Record<MockResource['transportTag'], string> = {
  'blokvogn':    'Blokvogn',
  'kran-baand':  'Kran-Bånd',
  'egen-korsel': 'Egen kørsel',
}

function TransportBadge({ tag }: { tag: MockResource['transportTag'] }) {
  return (
    <span className={`inline-block px-[6px] py-[2px] rounded-sm font-inter text-[9px] leading-none font-semibold ${TRANSPORT_TAG_STYLES[tag]}`}>
      {TRANSPORT_TAG_LABEL[tag]}
    </span>
  )
}
