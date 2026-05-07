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
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'

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
  return ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'][new Date(dateStr + 'T00:00:00').getDay()]
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function bumpDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
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

  const activeProduct = products.find(p => p.id === activeProductId)!
  const days = activeProduct.days
  const allocated = days.filter(d => !d.cancelled).reduce((s, d) => s + d.tonsPlanned, 0)
  const remainder = activeProduct.tonsTotal - allocated
  const isFullyAllocated = remainder === 0

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

  function addDay() {
    const last = days[days.length - 1]
    const newDate = last ? bumpDate(last.date) : TODAY_STR
    setProducts(prev => prev.map(p =>
      p.id === activeProductId
        ? { ...p, days: [...p.days, { id: `${activeProductId}-${Date.now()}`, day: days.length + 1, date: newDate, tonsPlanned: 0, cancelled: false }] }
        : p
    ))
  }

  function updateProductDates(productId: string, field: 'startDate' | 'endDate', value: string) {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p
      const updated = { ...p, [field]: value }
      const start = field === 'startDate' ? value : (p.startDate ?? '')
      const end   = field === 'endDate'   ? value : (p.endDate   ?? '')
      if (start && end && start <= end) return { ...updated, days: generateDays(start, end) }
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
    <div className="min-h-screen bg-page">
      {/* ── TopBar ───────────────────────────────────────────────────── */}
      <TopBar userInitials="OJ" userName="Ole J." onSettingsPress={() => {}} />

      <div
        className="grid"
        style={{ gridTemplateColumns: '280px 1fr', paddingTop: 52 }}
      >

        {/* ── Venstre rail ─────────────────────────────────────────── */}
        <aside
          className="sticky border-r border-hairline flex flex-col gap-md p-md overflow-y-auto"
          style={{ top: 52, height: 'calc(100vh - 52px)' }}
        >
          {/* Tilbage til Gantt */}
          <button
            onClick={() => navigate('/prototyper/gantt')}
            className="flex items-center gap-xxxs font-inter text-xs text-text-muted hover:text-text-primary transition-colors self-start -ml-xxxs"
          >
            <ChevronLeft size={14} />
            Mine opgaver
          </button>

          {/* Adresse + ordrenummer */}
          <div>
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">
              Udførselssted · #1212343
            </span>
            <h1 className="font-poppins font-semibold text-xl text-text-primary leading-tight">
              Søvej 6D<br />4900 Nakskov
            </h1>
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
                      ? 'bg-surface shadow-[inset_0_0_0_1px] shadow-hairline font-semibold text-text-primary'
                      : 'font-medium text-text-muted hover:bg-surface-2 hover:text-text-secondary',
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
                  {isActive && (
                    <span className="font-inter text-xxs text-text-muted font-normal">{mode.step}</span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Meta */}
          <div className="flex flex-col gap-sm pt-md border-t border-hairline">
            <div>
              <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Kunde</span>
              <p className="font-inter text-sm font-medium text-text-primary">Uddannelsescenter Syd</p>
            </div>
            <div>
              <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Projektleder</span>
              <div className="flex items-center gap-xs">
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <span className="font-inter font-bold text-xxs text-deep-teal">HT</span>
                </div>
                <div>
                  <p className="font-inter text-sm font-semibold text-text-primary leading-tight">Henrik Thor</p>
                  <a href="tel:+4540506070" className="font-inter text-xs text-dark-teal flex items-center gap-xxxs hover:text-deep-teal">
                    <Phone size={11} />
                    40 50 60 70
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Seneste beskeder */}
          <div className="flex flex-col gap-xs pt-md border-t border-hairline">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Seneste beskeder</span>
            {[
              { text: 'Forsinkelse på asfaltfabrik i dag', warn: true },
              { text: 'Vejrmelding: risiko for regn efter kl. 14', warn: false },
            ].map(msg => (
              <div key={msg.text} className="flex items-start gap-xs">
                <span
                  className="w-[6px] h-[6px] rounded-full flex-shrink-0 mt-[5px]"
                  style={{ background: msg.warn ? '#D4A017' : '#7AA8C0' }}
                />
                <p className="font-inter text-xs text-text-secondary leading-snug">{msg.text}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Hoved-indhold ────────────────────────────────────────── */}
        <main className="flex flex-col gap-[48px] p-lg pb-[120px] max-w-[960px]">

          {/* ── Sektion: Udlægning ───────────────────────────────── */}
          <section>

            {/* Sektion-header + produkt-tabs */}
            <div className="flex items-end justify-between gap-md pb-sm border-b border-hairline mb-lg">
              <h2 className="font-poppins font-semibold text-xl text-text-primary">Planlægning</h2>
              <div className="flex gap-xs" role="tablist" aria-label="Produkter">
                {products.map(p => {
                  const isActive = p.id === activeProductId
                  const pStart = p.startDate ? formatShortDate(p.startDate) : '–'
                  const pEnd   = p.endDate   ? formatShortDate(p.endDate)   : '–'
                  return (
                    <button
                      key={p.id}
                      role="tab"
                      aria-pressed={isActive}
                      onClick={() => setActiveProductId(p.id)}
                      className={[
                        'flex flex-col gap-xxxs items-start min-w-[150px] px-sm py-xs rounded-xl border transition-all',
                        isActive
                          ? 'bg-deep-teal border-deep-teal'
                          : 'bg-surface border-hairline hover:border-hairline-2',
                      ].join(' ')}
                    >
                      <span className={`font-poppins font-bold text-lg tabular-nums tracking-tight ${isActive ? 'text-white' : 'text-text-muted'}`}>
                        {p.recipeCode}
                      </span>
                      <span className={`font-inter text-xs tabular-nums ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
                        {p.tonsTotal} t · {pStart} – {pEnd}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Spec-grid */}
            <div className="rounded-xl border border-hairline overflow-hidden mb-lg">
              <div className="grid grid-cols-4 divide-x divide-hairline bg-surface">
                <div className="p-sm">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Tons</span>
                  <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">
                    {activeProduct.tonsTotal}<small className="font-inter text-xs text-text-muted ml-xxxs">t</small>
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
                    {activeProduct.factory.code} · {activeProduct.factory.driveTimeMinutes} min
                  </span>
                </div>
              </div>

              {/* Kommentar + dato-split */}
              <div className="grid grid-cols-4 divide-x divide-hairline border-t border-hairline bg-surface">
                <div className="col-span-2 p-sm border-r border-hairline">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Kommentar</span>
                  <p className="font-inter text-sm text-text-secondary leading-relaxed">{activeProduct.activityName}</p>
                </div>
                <div className="col-span-2 p-sm">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xs">Dato for udlægning</span>
                  <div className="flex items-center gap-xs">
                    <input
                      type="date"
                      value={activeProduct.startDate ?? ''}
                      onChange={e => updateProductDates(activeProduct.id, 'startDate', e.target.value)}
                      className="font-inter text-sm text-text-primary border border-hairline rounded-md px-xs py-xxxs
                                 focus:outline-none focus:border-dark-teal focus:ring-2 focus:ring-dark-teal/10 bg-white"
                    />
                    <span className="text-text-muted font-inter text-sm">–</span>
                    <input
                      type="date"
                      value={activeProduct.endDate ?? ''}
                      onChange={e => updateProductDates(activeProduct.id, 'endDate', e.target.value)}
                      className="font-inter text-sm text-text-primary border border-hairline rounded-md px-xs py-xxxs
                                 focus:outline-none focus:border-dark-teal focus:ring-2 focus:ring-dark-teal/10 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dagfordeling */}
            <div className="flex flex-col gap-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="font-poppins font-semibold text-md text-text-primary">Dagfordeling</h3>
                <div className="flex items-center gap-sm font-inter text-xs text-text-muted tabular-nums">
                  <div className="w-[120px] h-[4px] bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFullyAllocated ? 'bg-good' : 'bg-text-primary'}`}
                      style={{ width: `${Math.min(100, Math.round((allocated / activeProduct.tonsTotal) * 100))}%` }}
                    />
                  </div>
                  {isFullyAllocated ? (
                    <span className="flex items-center gap-xxxs text-good font-semibold">
                      <span className="w-[6px] h-[6px] rounded-full bg-good" />
                      Fuldt fordelt
                    </span>
                  ) : (
                    <span>{allocated} / {activeProduct.tonsTotal} t</span>
                  )}
                </div>
              </div>

              <div className="flex gap-xs flex-wrap">
                {days.map(day => (
                  <DayPillV2
                    key={day.id}
                    day={day}
                    isToday={day.date === TODAY_STR}
                    isSelectingReason={cancellingDayId === day.id}
                    onUpdateTons={updateTons}
                    onUpdateMorgenTons={updateMorgenTons}
                    onStartCancel={() => setCancellingDayId(day.id)}
                    onConfirmCancel={cancelDay}
                    onRestore={restoreDay}
                  />
                ))}
                <button
                  onClick={addDay}
                  className="flex flex-col items-center justify-center gap-xs
                             w-[140px] min-h-[140px] rounded-xl
                             border border-dashed border-hairline-2
                             text-text-muted hover:text-text-secondary hover:border-text-muted
                             hover:bg-surface-2 transition-all font-inter text-xs font-medium"
                >
                  <Plus size={16} />
                  Tilføj dag
                </button>
              </div>
            </div>
          </section>

          {/* ── Dokumentation ───────────────────────────────────── */}
          <section>
            <div className="flex items-end justify-between pb-sm border-b border-hairline mb-lg">
              <h2 className="font-poppins font-semibold text-xl text-text-primary">Dokumentation</h2>
            </div>

            <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
              {/* Toggle-header */}
              <button
                onClick={() => setDocsOpen(o => !o)}
                className="w-full flex items-center justify-between px-sm py-sm hover:bg-surface-2 transition-colors"
              >
                <span className="flex items-center gap-md">
                  <span className="font-poppins font-semibold text-sm text-text-primary">Dokumenter</span>
                  <span className="flex items-center gap-xxxs font-inter text-xs text-bad font-medium">
                    <span className="w-[6px] h-[6px] rounded-full bg-bad" />
                    1 mangler
                  </span>
                  <span className="flex items-center gap-xxxs font-inter text-xs text-bad font-medium">
                    <span className="w-[6px] h-[6px] rounded-full bg-bad" />
                    {notPlanlagt} materiel mangler
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
                      <label className="aspect-square rounded-lg border border-dashed border-hairline-2 flex flex-col items-center justify-center cursor-pointer hover:border-text-muted hover:bg-surface-2 transition-colors">
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
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${c.initials === 'OJ' ? 'bg-deep-teal' : 'bg-surface-2'}`}>
                            <span className={`font-inter font-bold text-[9px] ${c.initials === 'OJ' ? 'text-white' : 'text-deep-teal'}`}>{c.initials}</span>
                          </div>
                          <div className="flex-1 bg-surface-2 rounded-xl px-xs py-xs">
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
              {notPlanlagt > 0 && (
                <span className="font-inter text-xs text-text-muted">{notPlanlagt} mangler planlægning</span>
              )}
            </div>

            {/* Maskiner */}
            <div className="bg-surface border border-hairline rounded-xl overflow-hidden mb-sm">
              {resources.map((r, i) => (
                <div
                  key={r.id}
                  className={`grid items-center gap-md px-sm py-sm hover:bg-surface-2 transition-colors ${i < resources.length - 1 ? 'border-b border-hairline' : ''}`}
                  style={{ gridTemplateColumns: '36px 1fr 130px 100px 32px' }}
                >
                  <div className="w-9 h-9 rounded-md bg-surface-2 flex items-center justify-center text-deep-teal">
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="font-inter text-sm font-medium text-text-primary">{r.description}</p>
                    <div className="flex items-center gap-xs mt-xxxs">
                      <span className="font-inter text-xs text-text-muted tabular-nums">{r.plantNumber}</span>
                      <TransportBadge tag={r.transportTag} />
                    </div>
                  </div>
                  <span />
                  <button
                    onClick={() => toggleResourceStatus(r.id)}
                    className={[
                      'inline-flex items-center gap-xxxs font-inter font-semibold text-xs px-xs py-xxxs rounded-lg border transition-colors',
                      r.status === 'planlagt'
                        ? 'bg-good-bg text-good border-transparent'
                        : 'bg-bad-bg text-bad border-bad/20',
                    ].join(' ')}
                  >
                    <span className="w-[5px] h-[5px] rounded-full bg-current" />
                    {r.status === 'planlagt' ? 'Planlagt' : 'Ikke planlagt'}
                  </button>
                  <button
                    onClick={() => setFjernModalId(r.id)}
                    className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-bad hover:bg-bad-bg rounded-md transition-colors"
                    aria-label={`Fjern ${r.description}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border-t border-hairline bg-surface-2 hover:bg-hairline transition-colors">
                <Plus size={14} />
                Tilføj materiel
              </button>
            </div>

            {/* Transport af materiel */}
            <p className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest mb-xs px-xxxs">
              Transport af materiel
            </p>
            <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
              {transport.map((t, i) => (
                <div
                  key={t.id}
                  className={`grid items-center gap-md px-sm py-[12px] hover:bg-surface-2 transition-colors ${i < transport.length - 1 ? 'border-b border-hairline' : ''}`}
                  style={{ gridTemplateColumns: '36px 1fr 180px 32px' }}
                >
                  <div className="w-9 h-9 rounded-md bg-surface-2 flex items-center justify-center text-deep-teal">
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="font-inter text-sm font-medium text-text-primary">
                      {TRANSPORT_TYPE_LABEL[t.type]}
                      <span className="text-text-muted font-normal"> · {t.direction === 'ud' ? 'Ud' : 'Hjem'}</span>
                    </p>
                    <p className="font-inter text-xs text-text-muted tabular-nums">{formatShortDate(t.date)} · kl. {t.time}</p>
                  </div>
                  <span className="inline-flex items-center gap-xxxs bg-good-bg text-good font-inter font-semibold text-xs px-xs py-xxxs rounded-lg">
                    <span className="w-[5px] h-[5px] rounded-full bg-good" />
                    Tilføjet kørselsplan
                  </span>
                  <button className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors" aria-label="Rediger">
                    <Pencil size={14} />
                  </button>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border-t border-hairline bg-surface-2 hover:bg-hairline transition-colors">
                <Plus size={14} />
                Tilføj materiel transport
              </button>
            </div>
          </section>

        </main>
      </div>

      {/* ── Sticky action bar ────────────────────────────────────────── */}
      <div
        className="sticky bottom-0 px-lg py-sm border-t border-hairline z-40
                   flex items-center justify-between gap-md"
        style={{ background: 'rgba(250,250,250,0.88)', backdropFilter: 'saturate(140%) blur(10px)' }}
      >
        <div className="font-inter text-sm text-text-muted">
          <b className="text-text-primary font-semibold tabular-nums">{allocated} t</b> fordelt
          {!isFullyAllocated && (
            <span className="text-bad ml-sm font-medium">{Math.abs(remainder)} t {remainder > 0 ? 'mangler' : 'over'}</span>
          )}
        </div>
        <div className="flex gap-xs">
          <button
            onClick={() => { setKoreplanBeregnet(true); navigate('/prototyper/transportberegner') }}
            className={[
              'font-inter font-semibold text-sm px-sm py-xs rounded-xl transition-all',
              koreplanBeregnet
                ? 'bg-good-bg text-good'
                : 'bg-yellow text-deep-teal hover:brightness-95',
            ].join(' ')}
          >
            {koreplanBeregnet ? 'Se køreplan og tilpas' : 'Beregn køreplan'}
          </button>
        </div>
      </div>

      {/* ── Fjern-modal ──────────────────────────────────────────────── */}
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

// ─── DayPillV2 ────────────────────────────────────────────────────────────────

function DayPillV2({
  day, isToday, isSelectingReason,
  onUpdateTons, onUpdateMorgenTons,
  onStartCancel, onConfirmCancel, onRestore,
}: {
  day: DayPlan
  isToday: boolean
  isSelectingReason: boolean
  onUpdateTons: (id: string, v: number) => void
  onUpdateMorgenTons: (id: string, v: number | undefined) => void
  onStartCancel: () => void
  onConfirmCancel: (id: string, r: CancelReason) => void
  onRestore: (id: string) => void
}) {
  if (day.cancelled) {
    return (
      <div className="w-[140px] min-h-[140px] bg-surface rounded-xl border border-bad/30 flex flex-col items-center justify-center gap-xxxs opacity-60 p-sm">
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
      <div className="w-[152px] bg-surface rounded-xl border border-bad/20 p-xs flex flex-col gap-xxxs shadow-md">
        <p className="font-inter text-xxs font-medium text-text-muted mb-xxxs">Årsag til aflysning</p>
        {CANCEL_REASONS.map(r => (
          <button key={r.value} onClick={() => onConfirmCancel(day.id, r.value)}
            className="w-full text-left px-xs py-[6px] rounded-lg font-inter text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors">
            {r.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={[
      'relative w-[140px] bg-surface rounded-xl flex flex-col p-sm gap-xs transition-all',
      isToday
        ? 'border-2 border-text-primary shadow-[0_0_0_3px_rgba(0,0,0,0.04)]'
        : 'border border-hairline hover:border-hairline-2',
    ].join(' ')}>

      {isToday && (
        <span className="absolute -top-[10px] right-xs bg-text-primary text-white font-inter text-xxs font-semibold px-xs py-[2px] rounded-full uppercase tracking-wider">
          I dag
        </span>
      )}

      {/* Vejr-/aflysnings-knap */}
      <button
        onClick={onStartCancel}
        className="absolute top-[10px] right-[10px] w-6 h-6 rounded-full flex items-center justify-center text-light-aqua hover:text-dark-teal hover:bg-surface-2 transition-all"
        aria-label="Vejrudsigt / aflys dag"
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
          <span className="font-inter text-xxs text-text-muted">t</span>
        </div>
      </div>

      <hr className="border-hairline" />

      {/* Morgen */}
      <div>
        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block">Morgen</span>
        <div className="flex items-baseline gap-xxxs">
          <input
            type="number"
            value={day.morgenTons ?? ''}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              onUpdateMorgenTons(day.id, isNaN(v) ? undefined : Math.max(0, v))
            }}
            className="font-poppins font-semibold text-xl text-deep-teal bg-transparent border-none outline-none w-full tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="–"
          />
          <span className="font-inter text-xxs text-text-muted">t</span>
        </div>
      </div>

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
        className="w-full grid items-center gap-md px-sm py-sm hover:bg-surface-2 transition-colors"
        style={{ gridTemplateColumns: '1fr auto auto auto' }}
      >
        <span className="font-inter text-sm font-medium text-text-primary text-left">{title}</span>
        <span className="font-inter text-xs text-text-muted">{meta}</span>
        <span className={[
          'inline-flex items-center gap-xxxs font-inter font-semibold text-xs px-xs py-xxxs rounded-lg',
          status === 'ok' ? 'bg-good-bg text-good' : 'bg-bad-bg text-bad',
        ].join(' ')}>
          <span className="w-[5px] h-[5px] rounded-full bg-current" />
          {status === 'ok' ? 'OK' : 'Mangler'}
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
      <div className="bg-surface rounded-2xl shadow-md p-md w-full max-w-sm border border-hairline">
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
  'blokvogn':    'bg-surface-2 text-text-secondary',
  'kran-baand':  'bg-warn-bg text-deep-teal',
  'egen-korsel': 'bg-surface-2 text-text-secondary',
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

