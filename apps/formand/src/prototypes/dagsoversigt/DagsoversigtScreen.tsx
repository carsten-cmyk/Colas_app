/**
 * PROTOTYPE — Dagsoversigt
 * Sprint 1 — Startpunkt for formandens planlægnings-flow (unified planning model).
 * Viser dagens ordrer, dato-navigation og samleordre-mekanik.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Layers,
  Check,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { TabName } from '@/types/navigation'

// ─── Types (inline — prototype) ──────────────────────────────────────────────

type OrderStatus = 'planlagt' | 'aktiv' | 'afventer'
type ViewMode = 'uge' | '14-dage' | 'maaned'

interface MockProduct {
  recipeName: string
  tons: number
}

interface MockOrder {
  id: string
  orderNumber: string
  jobnummer: string
  address: string
  postalCode: string
  city: string
  status: OrderStatus
  products: MockProduct[]
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  factoryName: string
  driveTimeMinutes: number
  projektleder: string
  projektlederTlf: string
}

interface MockSamleordre {
  id: string
  orderIds: string[]
}

// ─── Frozen prototype date ───────────────────────────────────────────────────
// TODO (produktion): Erstat med new Date()
const TODAY = new Date('2026-03-17T00:00:00')

const DAY_SHORT = ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø']

// ─── Mock data (inline — prototype) ──────────────────────────────────────────
// TODO: Erstat med Supabase når klar

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ord-1',
    orderNumber: '1212343',
    jobnummer: '234. UCSY Nakskov',
    address: 'Skolevej 4',
    postalCode: '4900',
    city: 'Nakskov',
    status: 'aktiv',
    startDate: '2026-03-16',
    endDate: '2026-03-20',
    factoryName: 'PROD A EAST KØGE PH',
    driveTimeMinutes: 36,
    products: [
      { recipeName: 'SMA 11S', tons: 752 },
      { recipeName: 'GAB I', tons: 200 },
    ],
    projektleder: 'Henrik Thor',
    projektlederTlf: '+45 28 14 22 56',
  },
  {
    id: 'ord-2',
    orderNumber: '1212344',
    jobnummer: '187. Havnevej Roskilde',
    address: 'Havnevej 12',
    postalCode: '4000',
    city: 'Roskilde',
    status: 'planlagt',
    startDate: '2026-03-17',
    endDate: '2026-03-17',
    factoryName: 'PROD B VEST KØGE PH',
    driveTimeMinutes: 22,
    products: [
      { recipeName: 'ABB 11', tons: 450 },
    ],
    projektleder: 'Ole Jensen',
    projektlederTlf: '+45 22 41 18 09',
  },
  {
    id: 'ord-3',
    orderNumber: '1212350',
    jobnummer: '412. Ringvej Næstved E3',
    address: 'Ringvej Syd 44',
    postalCode: '4700',
    city: 'Næstved',
    status: 'planlagt',
    startDate: '2026-03-17',
    endDate: '2026-03-17',
    factoryName: 'PROD C SYD PH',
    driveTimeMinutes: 44,
    products: [
      { recipeName: 'SMA 8S', tons: 310 },
    ],
    projektleder: 'Mette Lund',
    projektlederTlf: '+45 31 67 92 14',
  },
  {
    id: 'ord-4',
    orderNumber: '1212351',
    jobnummer: '298. BMF Vordingborg',
    address: 'Algade 18',
    postalCode: '4760',
    city: 'Vordingborg',
    status: 'afventer',
    startDate: '2026-03-17',
    endDate: '2026-03-17',
    factoryName: 'PROD C SYD PH',
    driveTimeMinutes: 51,
    products: [
      { recipeName: 'GAB 0/16', tons: 180 },
    ],
    projektleder: 'Søren Krarup',
    projektlederTlf: '+45 25 88 41 30',
  },
  // Flerdags-ordre (startDate != endDate — disabled checkbox)
  {
    id: 'ord-5',
    orderNumber: '1212345',
    jobnummer: '156. SPR Helsingør',
    address: 'Strandvejen 100',
    postalCode: '3000',
    city: 'Helsingør',
    status: 'planlagt',
    startDate: '2026-03-16',
    endDate: '2026-03-19',
    factoryName: 'PROD A NORTH PH',
    driveTimeMinutes: 28,
    products: [
      { recipeName: 'SMA 11S', tons: 480 },
      { recipeName: 'ABB 16', tons: 120 },
    ],
    projektleder: 'Henrik Thor',
    projektlederTlf: '+45 28 14 22 56',
  },
  // 18. marts — 2 ordrer for at give mening til kombinering
  {
    id: 'ord-6',
    orderNumber: '1212346',
    jobnummer: '377. Boligvej Køge',
    address: 'Boligvej 5',
    postalCode: '4600',
    city: 'Køge',
    status: 'planlagt',
    startDate: '2026-03-18',
    endDate: '2026-03-18',
    factoryName: 'PROD A EAST KØGE PH',
    driveTimeMinutes: 12,
    products: [
      { recipeName: 'GAB I', tons: 200 },
    ],
    projektleder: 'Ole Jensen',
    projektlederTlf: '+45 22 41 18 09',
  },
  {
    id: 'ord-7',
    orderNumber: '1212347',
    jobnummer: '289. SVR Greve',
    address: 'Strandvejen 2',
    postalCode: '2670',
    city: 'Greve',
    status: 'planlagt',
    startDate: '2026-03-18',
    endDate: '2026-03-18',
    factoryName: 'PROD A EAST KØGE PH',
    driveTimeMinutes: 18,
    products: [
      { recipeName: 'ABB 11', tons: 165 },
    ],
    projektleder: 'Mette Lund',
    projektlederTlf: '+45 31 67 92 14',
  },
  // 19. marts
  {
    id: 'ord-8',
    orderNumber: '1212348',
    jobnummer: '204. Rolighedsvej Rønde',
    address: 'Rolighedsvej 22',
    postalCode: '8410',
    city: 'Rønde',
    status: 'afventer',
    startDate: '2026-03-19',
    endDate: '2026-03-19',
    factoryName: 'PROD EAST AARHUS PH',
    driveTimeMinutes: 33,
    products: [
      { recipeName: 'SMA 8S', tons: 290 },
    ],
    projektleder: 'Søren Krarup',
    projektlederTlf: '+45 25 88 41 30',
  },
]

// TODO: Erstat med Supabase når klar
// Mock-samleordre: ord-2 + ord-3 på 2026-03-17 som eksempel på Connected Box
const INITIAL_SAMLEORDRER: MockSamleordre[] = [
  { id: 'samle-001', orderIds: ['ord-2', 'ord-3'] },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function dateToString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isMultiDay(order: MockOrder): boolean {
  return order.startDate !== order.endDate
}

function ordersForDate(date: string): MockOrder[] {
  return MOCK_ORDERS.filter(o => {
    const start = o.startDate
    const end = o.endDate
    return date >= start && date <= end
  })
}

// TODO: Erstat med Supabase når klar — startDate/endDate skal komme fra ordre-rækken (orders.start_date, orders.end_date)
function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const monthShort = (d: Date) =>
    d.toLocaleDateString('da-DK', { month: 'short' }).replace('.', '')
  if (start === end) {
    return `${s.getDate()}. ${monthShort(s)}`
  }
  // Samme måned: "16.–20. mar"
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}.–${e.getDate()}. ${monthShort(e)}`
  }
  // Forskellige måneder: "28. feb–3. mar"
  return `${s.getDate()}. ${monthShort(s)}–${e.getDate()}. ${monthShort(e)}`
}

function isWeekend(d: Date): boolean {
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

function getViewDays(mode: ViewMode): number {
  if (mode === 'uge') return 7
  if (mode === '14-dage') return 14
  return 31
}

// Gantt-stil: uge starter på mandag
function getWindowStart(mode: ViewMode, offset: number): Date {
  if (mode === 'uge') {
    const base = addDays(TODAY, offset)
    const dow = base.getDay() // 0=sø
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    return addDays(base, mondayOffset)
  }
  return addDays(TODAY, offset)
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  planlagt: 'Planlagt',
  aktiv: 'Aktiv',
  afventer: 'Afventer planlægning',
}

// ─── Sub-komponenter ──────────────────────────────────────────────────────────

// PRESERVED V1 — kept for reference, no longer rendered. Switch back by renaming and updating usages.
/** Indholdet af et ordre-kort V1 (uden checkbox, uden Planlæg-knap) */
function OrderCardBodyV1({ order }: { order: MockOrder }) {
  const samleNr = undefined // bruges ikke i denne hjælper-funktion

  return (
    <div className="px-sm py-sm min-w-0">
      {/* ─── Udførselssted-blok: top-række (label + badges) ─── */}
      <div className="flex items-start justify-between gap-xs mb-xxxs">
        <p className="font-poppins font-bold text-sm text-deep-teal leading-tight">
          Udførselssted
        </p>
        <div className="flex items-center gap-xs flex-wrap flex-shrink-0">
          {samleNr && (
            <span className="flex items-center gap-xxxs px-xs py-[2px] rounded-md bg-yellow text-deep-teal font-inter font-semibold text-xs flex-shrink-0">
              <Layers size={11} aria-label="Samleordre" />
              {samleNr}
            </span>
          )}
          {/* Udførselsdage-badge — vises på ALLE ordrer (også 1-dags) */}
          <span className="px-xs py-[2px] rounded-md bg-surface-2 text-text-muted font-inter font-semibold text-xs flex-shrink-0">
            Udførselsdage {daysBetween(order.startDate, order.endDate)}
          </span>
          {/* Status-badge */}
          <span className="px-xs py-[2px] rounded-md bg-good-bg text-good font-inter font-semibold text-xs flex-shrink-0">
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      {/* Adresse linje 1: gade */}
      <p className="font-inter text-sm text-text-primary leading-tight">
        {order.address}
      </p>
      {/* Adresse linje 2: postnr + by */}
      <p className="font-inter text-sm text-text-primary leading-tight">
        {order.postalCode} {order.city}
      </p>
      {/* Jobnummer */}
      <p className="font-inter text-xs text-text-muted leading-tight">
        Jobnummer {order.jobnummer}
      </p>
      {/* Ordrenummer */}
      <p className="font-inter text-xs text-text-muted leading-tight mb-xs">
        Ordrenummer {order.orderNumber}
      </p>

      {/* Produkter større og tydeligere */}
      <div className="bg-soft-aqua border border-dark-teal/20 rounded-xl shadow-sm px-sm py-xs mb-xs">
        {order.products.map((p, pidx) => (
          <div key={pidx} className="flex items-baseline justify-between">
            <span className="font-poppins font-semibold text-md text-deep-teal">
              {p.recipeName}
            </span>
            <span className="font-poppins font-semibold text-lg text-deep-teal">
              {p.tons} t
            </span>
          </div>
        ))}
      </div>

      {/* Bundlinje: projektleder venstre, tid til fabrik højre */}
      <div className="border-t border-hairline pt-xs mt-xs flex items-center justify-between gap-xs">
        <div className="min-w-0">
          <p className="font-inter text-xxs font-medium uppercase tracking-wide text-text-muted">
            Projektleder
          </p>
          <span className="font-inter text-sm text-text-primary">
            {order.projektleder}{' '}
            <span className="font-medium">— {order.projektlederTlf}</span>
          </span>
        </div>
        <span className="font-inter text-xs text-text-muted flex-shrink-0">
          {order.driveTimeMinutes} min til {order.factoryName}
        </span>
      </div>
    </div>
  )
}

// Status-classes til mørk (deep-teal) baggrund
// planlagt: grøn ghost, aktiv: hvid solid (høj kontrast), afventer: gul ghost
const STATUS_CLASS_DARK: Record<OrderStatus, string> = {
  planlagt: 'bg-good/20 text-good',
  aktiv: 'bg-white text-deep-teal',
  afventer: 'bg-yellow/30 text-yellow',
}

// PRESERVED V2 — mørkeblå deep-teal baggrund. Bevaret per no-overwrite-regel.
/** Ordre-kortets indhold V2 — mørkeblå (deep-teal) baggrund, 4-kol grid, inline produkt+tons */
function OrderCardBodyV2({ order, samleNr }: { order: MockOrder; samleNr?: string }) {
  return (
    <>
      {/* ─── Header-strip ─────────────────────────────────────────────────── */}
      <div className="px-sm py-xs border-b border-white/10 flex items-center justify-between gap-xs">
        {/* Venstre: sted-label + adresse */}
        <div className="min-w-0">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-white/60 block">
            Udførselssted
          </span>
          <span className="font-poppins font-semibold text-md text-white leading-tight">
            {order.address}, {order.postalCode} {order.city}
          </span>
        </div>
        {/* Højre: badge-stack */}
        <div className="flex items-center gap-xs flex-wrap flex-shrink-0">
          {samleNr && (
            <span className="flex items-center gap-xxxs px-xs py-[2px] rounded-md bg-yellow text-deep-teal font-inter font-semibold text-xs flex-shrink-0">
              <Layers size={11} aria-label="Samleordre" />
              {samleNr}
            </span>
          )}
          {/* Udførselsdage-badge — mørk variant */}
          <span className="px-xs py-[2px] rounded-md bg-white/10 text-white/80 font-inter font-semibold text-xs flex-shrink-0">
            Udførselsdage {daysBetween(order.startDate, order.endDate)}
          </span>
          {/* Status-badge — dark-bg variant */}
          <span
            className={`px-xs py-[2px] rounded-md font-inter font-semibold text-xs flex-shrink-0 ${STATUS_CLASS_DARK[order.status]}`}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      {/* ─── 4-kol data-grid (pattern: OrdrePlanScreen linje 1075-1106) ───── */}
      <div className="grid grid-cols-4 divide-x divide-white/10">
        {/* Jobnummer */}
        <div className="p-sm">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-white/60 block mb-xxxs">
            Jobnummer
          </span>
          <span className="font-poppins font-semibold text-md text-white leading-tight block">
            {order.jobnummer}
          </span>
        </div>

        {/* Produkter — navn + tons inline per produkt */}
        <div className="p-sm">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-white/60 block mb-xxxs">
            Produkter
          </span>
          {order.products.map(p => (
            <div key={p.recipeName} className="flex items-baseline justify-between gap-xs">
              <span className="font-poppins font-semibold text-sm text-white">{p.recipeName}</span>
              <span className="font-poppins font-semibold text-sm text-yellow tabular-nums">{p.tons} t</span>
            </div>
          ))}
        </div>

        {/* Projektleder */}
        <div className="p-sm">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-white/60 block mb-xxxs">
            Projektleder
          </span>
          <span className="font-poppins font-semibold text-md text-white leading-tight block">
            {order.projektleder}
          </span>
          <span className="font-inter text-xs text-white/70">{order.projektlederTlf}</span>
        </div>

        {/* Fabrik */}
        <div className="p-sm">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-white/60 block mb-xxxs">
            Fabrik
          </span>
          <span className="font-poppins font-semibold text-md text-white leading-tight block">
            {order.factoryName}
          </span>
          <span className="font-inter text-xs text-white/70">{order.driveTimeMinutes} min til plads</span>
        </div>
      </div>

      {/* ─── Bundlinje ────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-sm py-xs flex items-center">
        <span className="font-inter text-xs text-white/60">Ordrenr. {order.orderNumber}</span>
      </div>
    </>
  )
}

// Status-classes — V3: rounded-full pill, lys baggrund (toggle-æstetik fra OrdrePlanScreen linje 1236-1256)
const STATUS_CLASS_V3: Record<OrderStatus, string> = {
  planlagt: 'bg-good-bg text-good',
  aktiv: 'bg-deep-teal text-white',
  afventer: 'bg-warn-bg text-deep-teal',
}

/** Ordre-kortets indhold V3 — toggle-inspireret: hvid base + deep-teal accent-elementer.
 *  4-kol grid (samme struktur som V2) men på hvid baggrund.
 *  Deep-teal KUN som accent: header-pill, jobnummer, produktnavn, tons.
 *  Status-piller er rounded-full (matcher toggle-æstetikken i OrdrePlanScreen linje 1236-1256).
 *  Planlæg-knap: bg-deep-teal text-white rounded-full font-poppins font-semibold — direkte toggle-stil.
 */
function OrderCardBodyV3({ order }: { order: MockOrder }) {
  return (
    <>
      {/* ─── Header-strip ─────────────────────────────────────────────────── */}
      <div className="px-sm py-xs border-b border-hairline flex items-center justify-between gap-xs">
        {/* Venstre: Udførselssted som accent-pill + adresse — toggle-inspireret */}
        <div className="min-w-0 flex flex-col items-start gap-xxxs pt-xs">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted block">
            Udførselssted
          </span>
          <span className="font-poppins font-semibold text-md text-deep-teal leading-tight truncate">
            {order.address}, {order.postalCode} {order.city}
          </span>
        </div>
        {/* Højre: badge-stack — alle rounded-full (toggle-æstetik) */}
        <div className="flex items-center gap-xs flex-wrap flex-shrink-0">
          <span className="px-xs py-[2px] rounded-full bg-surface-2 text-text-muted font-inter font-semibold text-xs flex-shrink-0">
            Udføres i perioden {formatDateRange(order.startDate, order.endDate)}
          </span>
          <span
            className={`px-xs py-[2px] rounded-full font-inter font-semibold text-xs flex-shrink-0 ${STATUS_CLASS_V3[order.status]}`}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      {/* ─── 4-kol data-grid — hvid base, divide-hairline ─────────────── */}
      <div className="grid grid-cols-4 divide-x divide-hairline">
        {/* Jobnummer + Ordrenummer samlet */}
        <div className="p-sm">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted block mb-xxxs">
            Jobnummer
          </span>
          <span className="font-poppins font-semibold text-md text-deep-teal leading-tight block">
            {order.jobnummer}
          </span>
          <span className="font-inter text-xs text-text-muted block mt-xxxs">
            Ordrenummer: {order.orderNumber}
          </span>
        </div>

        {/* Produkter — navn + tons i deep-teal */}
        <div className="p-sm">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted block mb-xxxs">
            Produkter
          </span>
          {order.products.map(p => (
            <div key={p.recipeName} className="flex items-baseline justify-between gap-xs">
              <span className="font-poppins font-semibold text-sm text-deep-teal">{p.recipeName}</span>
              <span className="font-poppins font-semibold text-sm text-deep-teal tabular-nums">{p.tons} t</span>
            </div>
          ))}
        </div>

        {/* Projektleder */}
        <div className="p-sm">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted block mb-xxxs">
            Projektleder
          </span>
          <span className="font-poppins font-semibold text-md text-deep-teal leading-tight block">
            {order.projektleder}
          </span>
          <span className="font-inter text-xs text-text-muted">{order.projektlederTlf}</span>
        </div>

        {/* Fabrik */}
        <div className="p-sm">
          <span className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted block mb-xxxs">
            Fabrik
          </span>
          <span className="font-poppins font-semibold text-md text-deep-teal leading-tight block">
            {order.factoryName}
          </span>
          <span className="font-inter text-xs text-text-muted">{order.driveTimeMinutes} min til plads</span>
        </div>
      </div>

    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DagsoversigtScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Dato-state — initialiseres fra URL-param `?date=` hvis tilstede, ellers prototype-anchor.
  // Sikrer at navigation tilbage fra Ordre-plan bevarer den valgte dato.
  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get('date') ?? '2026-03-17'
  )

  // Gantt-stil view mode + offset (erstatter windowOffset/shiftWindow)
  const [viewMode, setViewMode] = useState<ViewMode>('uge')
  const [offset, setOffset] = useState(0)

  // Tab-state
  const [activeTab, setActiveTab] = useState<TabName>('dagens-opgaver')

  // Valgte ordre-id'er til samleordre
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())

  // Oprettede samleordrer: { id, orderIds }[]
  // TODO: Erstat med Supabase når klar
  const [samleordrer, setSamleordrer] = useState<MockSamleordre[]>(INITIAL_SAMLEORDRER)

  // Bekræftelses-modal når formanden kombinerer ordrer
  const [showConfirmKombiner, setShowConfirmKombiner] = useState(false)

  function handleTabPress(tab: TabName) {
    if (tab === 'mine-opgaver') { navigate('/prototyper/gantt'); return }
    setActiveTab(tab)
  }

  const viewDays = getViewDays(viewMode)
  const windowStart = getWindowStart(viewMode, offset)
  const days = Array.from({ length: viewDays }, (_, i) => addDays(windowStart, i))

  // Rettelse 1: Synk offset + selectedDate i samme operation så blå markering
  // følger med ind i det nye vindue
  function navigatePeriod(dir: 1 | -1) {
    const newOffset = offset + dir * viewDays
    setOffset(newOffset)
    setSelectedDate(dateToString(getWindowStart(viewMode, newOffset)))
  }

  const todayStr = dateToString(TODAY)
  const todayOrders = ordersForDate(selectedDate)

  // Samleordre-nr (S-1, S-2...) baseret på index
  function getSamleordreNr(samleordreId: string): string {
    const idx = samleordrer.findIndex(s => s.id === samleordreId)
    return `S-${idx + 1}`
  }

  function toggleOrderSelected(orderId: string, multiDay: boolean) {
    if (multiDay) return // disabled for flerdags-ordrer
    setSelectedOrderIds(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  function handleKombiner() {
    if (selectedOrderIds.size < 2) return
    setShowConfirmKombiner(true)
  }

  function confirmKombiner() {
    const selectedArray = Array.from(selectedOrderIds)
    const newId = `samle-${Date.now()}`
    setSamleordrer(prev => [...prev, { id: newId, orderIds: selectedArray }])
    setSelectedOrderIds(new Set())
    setShowConfirmKombiner(false)
  }

  const canKombiner = selectedOrderIds.size >= 2

  // ─── Render-logik: gruppér ordrer for valgt dato ──────────────────────────

  // Find samleordrer der har mindst ét barn på valgt dato
  const activeSamleordrerForDate = samleordrer.filter(s =>
    s.orderIds.some(id => todayOrders.some(o => o.id === id))
  )

  // Set af ordre-id'er der er i en samleordre på valgt dato (rendres ikke enkeltvis)
  const idsInSamleordre = new Set<string>(
    activeSamleordrerForDate.flatMap(s =>
      s.orderIds.filter(id => todayOrders.some(o => o.id === id))
    )
  )

  // Enkelt-ordrer der IKKE er del af samleordre
  const standaloneOrders = todayOrders.filter(o => !idsInSamleordre.has(o.id))

  // Suppress unused-variable warnings on preserved dead-code components
  void OrderCardBodyV1
  void OrderCardBodyV2

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <TopBar userInitials="OJ" userName="Ole J." onSettingsPress={() => {}} />

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 70 }}>
        {/* Rettelse 5: w-[80%] mx-auto erstatter max-w-2xl */}
        <div className="w-[80%] mx-auto px-sm py-md">

          {/* ─── Page header + controls i én flex-row — Gantt-pattern (GanttScreen linje 215-285) ─── */}
          {/* Title til venstre, pille-toggle + navigationspilar + I dag til højre */}
          <div className="mb-sm flex items-center justify-between flex-wrap gap-sm">
            <div>
              <p className="font-inter text-xs font-medium text-text-muted uppercase tracking-wide">
                Opgaver
              </p>
              <h1 className="font-poppins font-semibold text-xl text-deep-teal leading-tight">
                Dagsoversigt
              </h1>
            </div>

            {/* Controls: pille-toggle + navigationspilar + I dag — identisk Gantt-pattern linje 226-267 */}
            <div className="flex items-center gap-xs">
              {/* View toggle — bg-white border border-hairline rounded-lg overflow-hidden (GanttScreen linje 228) */}
              <div className="flex bg-white border border-hairline rounded-lg overflow-hidden">
                {(['uge', '14-dage', 'maaned'] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    onClick={() => { setViewMode(v); setOffset(0) }}
                    className={[
                      'px-sm py-xs font-inter text-xs font-medium transition-colors',
                      viewMode === v
                        ? 'bg-deep-teal text-white'
                        : 'text-text-muted hover:bg-soft-aqua',
                    ].join(' ')}
                  >
                    {v === 'uge' ? 'Uge' : v === '14-dage' ? '14 dage' : 'Måned'}
                  </button>
                ))}
              </div>

              {/* Navigationspilar + I dag — identisk Gantt-pattern linje 246-267 */}
              <div className="flex items-center gap-xxxs">
                <button
                  onClick={() => navigatePeriod(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-hairline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
                  aria-label="Forrige periode"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => { setOffset(0); setSelectedDate(todayStr) }}
                  className="px-sm py-xs font-inter text-xs font-medium bg-white border border-hairline rounded-lg text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
                >
                  I dag
                </button>
                <button
                  onClick={() => navigatePeriod(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-hairline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
                  aria-label="Næste periode"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── Gantt-style kalender-strip ──────────────────────────────── */}
          <div className="mb-md">
            {/* Dato-card — bg-white rounded-lg shadow-md overflow-hidden (fra GanttScreen linje 288) */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                {/* Dato-header: bg-soft-aqua som Gantt-mønsteret (GanttScreen linje 293) */}
                <div className="flex border-b border-box-outline bg-soft-aqua">
                  {days.map((day) => {
                    const ds = dateToString(day)
                    const isSelected = ds === selectedDate
                    const isToday = ds === todayStr
                    const weekend = isWeekend(day)
                    const dayShort = DAY_SHORT[day.getDay()]
                    const dayNum = day.getDate()
                    // TODO (produktion): Tilføj helligdags-markering med dansk helligdagskalender

                    const hasOrders = ordersForDate(ds).length > 0

                    return (
                      <button
                        key={ds}
                        onClick={() => setSelectedDate(ds)}
                        style={{ flex: 1, minWidth: viewMode === 'maaned' ? 34 : 46 }}
                        className={[
                          'flex flex-col items-center py-xs relative transition-colors min-h-[44px] justify-center',
                          // Valgt=bg-deep-teal, weekend=bg-surface-2, hverdage=bg-soft-aqua (arver fra parent)
                          isSelected
                            ? 'bg-deep-teal'
                            : weekend
                            ? 'bg-surface-2 hover:bg-light-aqua'
                            : 'hover:bg-light-aqua',
                        ].join(' ')}
                        aria-label={`Vælg ${dayShort} ${dayNum}`}
                        aria-pressed={isSelected}
                      >
                        {/* Dashed linje markering for i-dag — fra GanttScreen linje 313 */}
                        {isToday && !isSelected && (
                          <div
                            className="absolute inset-y-0 left-0 w-[2px] pointer-events-none"
                            style={{ zIndex: 1, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(11,57,80,0.5) 0px, rgba(11,57,80,0.5) 5px, transparent 5px, transparent 10px)' }}
                          />
                        )}
                        {/* Prik-markering for dage med opgaver — synlig på alle bg-states (white/surface-2/deep-teal) */}
                        {hasOrders && (
                          <div
                            className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-yellow"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={`font-inter text-xxs font-medium ${
                            isSelected ? 'text-yellow' : isToday ? 'text-deep-teal' : 'text-text-muted'
                          }`}
                        >
                          {dayShort}
                        </span>
                        {/* Altid w-[26px] h-[26px] rounded-full wrapper — Gantt-pattern linje 320-329 */}
                        {/* backgroundColor sættes kun inline til '#2E9E65' når today og ikke valgt */}
                        <div
                          className="w-[26px] h-[26px] mt-xxxs rounded-full flex items-center justify-center"
                          style={isToday && !isSelected ? { backgroundColor: '#2E9E65' } : {}}
                        >
                          <span
                            className={`font-poppins font-semibold text-xs ${
                              isSelected ? 'text-yellow' : isToday ? 'text-white' : 'text-text-secondary'
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Hint-linje: samle-instruktion + prik-legende ────────────── */}
          {todayOrders.length > 0 && (
            <div className="flex items-center mb-md px-sm">
              <span className="inline-block bg-warning text-deep-teal px-xs py-xxs rounded-full font-inter text-xs font-medium whitespace-nowrap">
                Marker flere ordre for at sammenlægge dem
              </span>
              <span className="ml-auto inline-flex items-center gap-xxxs font-inter text-xs text-text-muted">
                <span className="w-[5px] h-[5px] rounded-full bg-yellow" aria-hidden="true" />
                Dage med opgaver
              </span>
            </div>
          )}

          {/* ─── Ordre-liste ─────────────────────────────────────────────── */}
          {todayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-lg text-center">
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-sm">
                <MapPin size={22} className="text-text-muted" />
              </div>
              <p className="font-poppins font-semibold text-md text-deep-teal mb-xxxs">
                Ingen ordrer
              </p>
              <p className="font-inter text-sm text-text-muted">
                Ingen ordrer planlagt på denne dag
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">

              {/* ─── Connected Boxes: samleordrer ─────────────────────── */}
              {activeSamleordrerForDate.map(samle => {
                const samleNr = getSamleordreNr(samle.id)
                // Kun children der er på valgt dato
                const childOrders = samle.orderIds
                  .map(id => todayOrders.find(o => o.id === id))
                  .filter((o): o is MockOrder => o !== undefined)

                if (childOrders.length === 0) return null

                return (
                  <div
                    key={samle.id}
                    // V3-wrapper: hvid base, rounded-2xl — toggle-æstetik
                    className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden"
                  >
                    <div className="flex items-stretch">
                      {/* Venstre dark-teal strip — matcher standalone-card pattern (linje 909-927) */}
                      <div className="bg-dark-teal px-md flex items-center justify-center">
                        <Layers size={16} className="text-white/40" aria-hidden="true" />
                      </div>

                      {/* Højre: child-ordrer + bundknap stacked vertikalt */}
                      <div className="flex-1 min-w-0 flex flex-col gap-md">
                        {/* Body: hver child-ordre via V3 */}
                        {childOrders.map((order, idx) => (
                          <div
                            key={order.id}
                            className={idx < childOrders.length - 1 ? 'border-b border-hairline' : ''}
                          >
                            <OrderCardBodyV3 order={order} />
                          </div>
                        ))}

                        {/* Bundlinje: én delt Planlæg-knap — toggle-stil */}
                        <div className="border-t border-hairline px-sm py-xs flex justify-end">
                          {(() => {
                            const someChildPlanned = childOrders.some(o => o.status === 'planlagt' || o.status === 'aktiv')
                            return (
                              <button
                                onClick={() => navigate(`/prototyper/ordre-plan?samleordreId=${encodeURIComponent(samle.id)}&date=${encodeURIComponent(selectedDate)}`)}
                                className="bg-deep-teal text-white font-poppins font-semibold text-sm px-lg py-sm rounded-full inline-flex items-center gap-xxxs hover:opacity-90 transition-opacity"
                                aria-label={`${someChildPlanned ? 'Ret planlægning for' : 'Planlæg'} samleordre ${samleNr}`}
                              >
                                {someChildPlanned ? 'Ret planlægning' : 'Planlæg samleordre'} <ChevronRight size={14} />
                              </button>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* ─── Enkelt-ordrer (ikke i samleordre) ────────────────── */}
              {standaloneOrders.map((order) => {
                const multiDay = isMultiDay(order)
                const isChecked = selectedOrderIds.has(order.id)

                return (
                  <div
                    key={order.id}
                    // V3-wrapper: hvid base, rounded-2xl — toggle-æstetik
                    className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden"
                  >
                    <div className="flex items-stretch">
                      {/* TEST: dark-teal venstre-strip — anchor-stribe på standalone-cards */}
                      <div className="flex items-center justify-center px-md bg-dark-teal border-r border-dark-teal">
                        <button
                          onClick={() => toggleOrderSelected(order.id, multiDay)}
                          disabled={multiDay}
                          title={multiDay ? 'Flerdags-ordrer kan ikke samles' : undefined}
                          aria-label={`${isChecked ? 'Fravælg' : 'Vælg'} ordre ${order.orderNumber}`}
                          className={[
                            'w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-colors',
                            multiDay
                              ? 'cursor-not-allowed opacity-40 border-white/20 bg-white/5'
                              : isChecked
                              ? 'bg-yellow border-yellow'
                              : 'bg-white/10 border-white/40 hover:border-yellow',
                          ].join(' ')}
                        >
                          {isChecked && <Check size={12} className="text-deep-teal" strokeWidth={3} />}
                        </button>
                      </div>

                      {/* Ordre-indhold via V3 */}
                      <div className="flex-1 min-w-0">
                        <OrderCardBodyV3 order={order} />

                        {/* Planlæg-knap — toggle-stil: bg-deep-teal text-white rounded-full */}
                        <div className="px-sm pb-sm flex justify-end">
                          <button
                            onClick={() =>
                              navigate(`/prototyper/ordre-plan?orderId=${encodeURIComponent(order.id)}&date=${encodeURIComponent(selectedDate)}`)
                            }
                            className="bg-deep-teal text-white font-poppins font-semibold text-sm px-lg py-sm rounded-full inline-flex items-center gap-xxxs hover:opacity-90 transition-opacity"
                            aria-label={`${order.status === 'planlagt' || order.status === 'aktiv' ? 'Ret planlægning for' : 'Planlæg'} ordre ${order.orderNumber}`}
                          >
                            {order.status === 'planlagt' || order.status === 'aktiv' ? 'Ret planlægning' : 'Planlæg'} <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

            </div>
          )}

        </div>
      </main>

      {/* Floating kombiner-knap — vises når 2+ ordrer valgt, følger scroll */}
      {canKombiner && (
        <button
          onClick={handleKombiner}
          aria-label={`Kombiner ${selectedOrderIds.size} ordrer til samleordre`}
          className="fixed bottom-[84px] right-md z-30 flex items-center gap-xs bg-yellow text-deep-teal rounded-full pl-sm pr-md py-sm font-poppins font-semibold text-sm hover:opacity-90 transition-colors shadow-lg"
          // 84px = 70px BottomTabBar + 14px luft
        >
          <span className="flex items-center justify-center w-6 h-6 bg-deep-teal/20 rounded-full">
            <Layers size={16} aria-hidden="true" />
          </span>
          Kombiner {selectedOrderIds.size} ordrer
        </button>
      )}

      {/* Bekræftelses-modal — Kombiner ordrer til samleordre */}
      {showConfirmKombiner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kombiner-modal-title"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Luk dialog"
            onClick={() => setShowConfirmKombiner(false)}
            className="absolute inset-0 bg-deep-teal/40"
          />
          {/* Modal-card */}
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-lg flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <h2
                id="kombiner-modal-title"
                className="font-poppins font-semibold text-lg text-deep-teal leading-tight"
              >
                Kombiner {selectedOrderIds.size} ordrer til samleordre?
              </h2>
              <p className="font-inter text-sm text-text-secondary leading-relaxed">
                Ordrerne samles til én samleordre der kan håndteres som en enhed. Du kan ophæve samleordren igen ved at fjerne fluebenene.
              </p>
            </div>
            <div className="flex items-center justify-end gap-xs">
              <button
                type="button"
                onClick={() => setShowConfirmKombiner(false)}
                className="font-inter font-medium text-sm text-text-secondary bg-white border border-hairline rounded-full px-md py-xs hover:bg-surface-2 transition-colors"
              >
                Annullér
              </button>
              <button
                type="button"
                onClick={confirmKombiner}
                className="font-poppins font-semibold text-sm text-white bg-deep-teal rounded-full px-md py-xs hover:opacity-90 transition-opacity"
              >
                Bekræft
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} messageCount={2} />
    </div>
  )
}
