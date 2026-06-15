/**
 * PROTOTYPE — Mine opgaver (Gantt-oversigt)
 * Sprint 1 — Element 2
 * 14-dages Gantt over formandets ordrer (3 dage tilbage, 11 frem).
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { TabName } from '@/types/navigation'

type ViewMode = 'uge' | '14-dage' | 'maaned'

interface GanttProduct {
  id: string
  recipeCode: string
  recipeName: string
  thicknessMm: number
  tonsTotal: number
  startDate: string
  endDate: string
  planlagt: boolean
}

interface GanttOrder {
  id: string
  orderNumber: string
  projectName: string
  state: 'active' | 'planned' | 'completed' | 'cancelled'
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  tonsTotal: number
  tonsDelivered: number
  products: GanttProduct[]
  tidsvindue?: 'nat' | 'weekend' // angiver om ordren udføres uden for normal arbejdstid
  jobnummer: string
}

// Anchored to prototype date
const TODAY = new Date('2026-03-16T00:00:00')

const MOCK_ORDERS: GanttOrder[] = [
  {
    id: '1',
    orderNumber: '1212343',
    jobnummer: '4821',
    projectName: 'Uddannelsescenter Syd, Nakskov',
    state: 'active',
    startDate: '2026-03-14',
    endDate: '2026-03-20',
    tonsTotal: 952,
    tonsDelivered: 250,
    tidsvindue: 'weekend', // dækker lø 14/3 + sø 15/3
    products: [
      { id: 'p1', recipeCode: '82101H', recipeName: 'SMA 11S',  thicknessMm: 45, tonsTotal: 752, startDate: '2026-03-16', endDate: '2026-03-18', planlagt: true },
      { id: 'p2', recipeCode: '23001B', recipeName: 'GAB I',    thicknessMm: 80, tonsTotal: 200, startDate: '2026-03-19', endDate: '2026-03-20', planlagt: false },
    ],
  },
  {
    id: '2',
    orderNumber: '1212344',
    jobnummer: '5102',
    projectName: 'Havnevej Renovering, Roskilde',
    state: 'planned',
    startDate: '2026-03-18',
    endDate: '2026-03-23',
    tonsTotal: 450,
    tonsDelivered: 0,
    products: [
      { id: 'p3', recipeCode: '41002C', recipeName: 'ABB 11',   thicknessMm: 60, tonsTotal: 450, startDate: '2026-03-18', endDate: '2026-03-23', planlagt: false },
    ],
  },
  {
    id: '3',
    orderNumber: '1212345',
    jobnummer: '4977',
    projectName: 'Rolighedsvej Asfalt, Rønde',
    state: 'completed',
    startDate: '2026-03-09',
    endDate: '2026-03-14',
    tonsTotal: 320,
    tonsDelivered: 320,
    products: [
      { id: 'p4', recipeCode: '82101H', recipeName: 'SMA 11S',  thicknessMm: 45, tonsTotal: 320, startDate: '2026-03-09', endDate: '2026-03-14', planlagt: true },
    ],
  },
  {
    id: '4',
    orderNumber: '1212346',
    jobnummer: '5234',
    projectName: 'Strandvej Vedligehold, Helsingør',
    state: 'planned',
    startDate: '2026-03-23',
    endDate: '2026-03-26',
    tonsTotal: 180,
    tonsDelivered: 0,
    products: [
      { id: 'p5', recipeCode: '31005A', recipeName: 'GAB 0/16', thicknessMm: 70, tonsTotal: 180, startDate: '2026-03-23', endDate: '2026-03-26', planlagt: false },
    ],
  },
  {
    // Eksempel: aflyst ordre — rød "Aflyst"-markering (uden årsag i Gantt, jf. FF 2026-06-15)
    id: '5',
    orderNumber: '1212347',
    jobnummer: '5310',
    projectName: 'Industrivej Slidlag, Køge',
    state: 'cancelled',
    startDate: '2026-03-17',
    endDate: '2026-03-18',
    tonsTotal: 140,
    tonsDelivered: 0,
    products: [
      { id: 'p6', recipeCode: '82101H', recipeName: 'SMA 11S', thicknessMm: 40, tonsTotal: 140, startDate: '2026-03-17', endDate: '2026-03-18', planlagt: false },
    ],
  },
]

const DAY_SHORT = ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø']

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

// TODO (produktion): Brug dansk kalender med danske mærkedage (helligdage).
// Skal markere mindst: nytårsdag, skærtorsdag, langfredag, 2. påskedag, store bededag,
// Kr. himmelfartsdag, 2. pinsedag, juleaften, juledag, 2. juledag, nytårsaftensdag.
// Helligdage skal markeres visuelt på samme måde som weekender i Gantten.
function isWeekend(d: Date): boolean {
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00')
}

function isInRange(day: Date, order: GanttOrder): boolean {
  const start = parseDate(order.startDate)
  const end = parseDate(order.endDate)
  return day >= start && day <= end
}

function getBarColorClass(order: GanttOrder, day: Date): string {
  if (!isInRange(day, order)) return ''
  // Aflyst overrider alt — rød markering (UDEN årsag i Gantt, jf. FF aflysnings-markeringer 2026-06-15)
  if (order.state === 'cancelled') return 'bg-bad/10 border border-bad/30'
  // Nat: tidsvindue-farve overrider state-farve på hele baren
  if (order.tidsvindue === 'nat') return 'bg-deep-teal'
  // Weekend-ordrer og ordrer uden tidsvindue: brug state-farve
  if (order.state === 'completed') return 'bg-light-aqua'
  if (day < TODAY && !sameDay(day, TODAY)) return 'bg-light-aqua'
  if (sameDay(day, TODAY) && order.state === 'active') return 'bg-good'
  return 'bg-good-bg border border-good/30'
}

const STATE_LABEL: Record<GanttOrder['state'], string> = {
  active: 'I gang',
  planned: 'Planlagt',
  completed: 'Afsluttet',
  cancelled: 'Aflyst',
}

// LÅST 2026-06-05: active=mørkegrøn (bg-good), planned=lysegrøn (bg-good-bg), completed=uændret
const STATE_BADGE: Record<GanttOrder['state'], string> = {
  active: 'bg-good text-white',
  planned: 'bg-good-bg text-good',
  completed: 'bg-light-aqua text-deep-teal',
  cancelled: 'bg-bad/10 text-bad',
}

function getViewDays(mode: ViewMode): number {
  if (mode === 'uge') return 7
  if (mode === '14-dage') return 14
  return 31 // maaned — fast 31 for prototypen
}


export function GanttScreen() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabName>('mine-opgaver')
  const [viewMode, setViewMode] = useState<ViewMode>('14-dage')
  const [offset, setOffset] = useState(0) // i dage fra TODAY
  // aktivRegionId — fremtidig brug: vis aktivt regionnavn i header-subtitle eller skift datasæt
  const aktivRegionId = '2900-CON West Sydjylland'
  const [comparisonRegionId, setComparisonRegionId] = useState<string | null>(null)

  function handleTabPress(tab: TabName) {
    if (tab === 'dagens-opgaver') { navigate('/prototyper/ordre-plan'); return }
    setActiveTab(tab)
  }

  const viewDays = getViewDays(viewMode)

  // Uge: start på mandag, ellers start på offset
  function getWindowStart(): Date {
    if (viewMode === 'uge') {
      const base = addDays(TODAY, offset)
      const dow = base.getDay() // 0=sø
      const mondayOffset = dow === 0 ? -6 : 1 - dow
      return addDays(base, mondayOffset)
    }
    return addDays(TODAY, offset)
  }

  const windowStart = getWindowStart()
  const days = Array.from({ length: viewDays }, (_, i) => addDays(windowStart, i))
  const windowEnd = days[days.length - 1]

  const todayIndex = days.findIndex(d => sameDay(d, TODAY))

  const visibleOrders = MOCK_ORDERS.filter(o =>
    parseDate(o.endDate) >= windowStart && parseDate(o.startDate) <= windowEnd
  )

  function navigate_period(dir: 1 | -1) {
    setOffset(prev => prev + dir * viewDays)
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <TopBar userInitials="OJ" userName="Ole J." onSettingsPress={() => {}} />

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 70 }}>
        <div className="w-[80%] mx-auto px-sm pt-md pb-md">

          {/* Page header */}
          <div className="mb-sm pl-sm flex items-center justify-between flex-wrap gap-sm">
            <div>
              <p className="font-inter text-xs font-medium text-text-muted uppercase tracking-wide">
                Opgaveoversigt
              </p>
              <h1 className="font-poppins font-semibold text-2xl text-deep-teal leading-tight">
                Holdnummer 10541 – Jens Thorsager
              </h1>
            </div>

            {/* Controls: view toggle + navigationspilar + region-dropdown */}
            <div className="flex items-center gap-xs">
              {/* View toggle */}
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

              {/* Pilar */}
              <div className="flex items-center gap-xxxs">
                <button
                  onClick={() => navigate_period(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-hairline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
                  aria-label="Forrige periode"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => { setOffset(0); setViewMode(viewMode) }}
                  className="px-sm py-xs font-inter text-xs font-medium bg-white border border-hairline rounded-lg text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
                >
                  I dag
                </button>
                <button
                  onClick={() => navigate_period(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-hairline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
                  aria-label="Næste periode"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

            </div>
          </div>

          {/* Gantt card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div>
              <div>

                {/* Date header */}
                <div className="flex border-b border-box-outline bg-soft-aqua">
                  <div style={{ width: 160, flexShrink: 0 }} className="px-sm py-xs flex items-end">
                    <p className="font-inter text-xxs font-medium uppercase tracking-wide text-text-muted">
                      Ordre
                    </p>
                  </div>
                  <div style={{ width: 90, flexShrink: 0 }} className="border-r border-box-outline" />
                  {days.map((day, i) => {
                    const isToday = i === todayIndex
                    const weekend = isWeekend(day)
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1, minWidth: 0,
                          ...(isToday ? { backgroundColor: 'rgba(46, 158, 101, 0.1)' } : {}),
                        }}
                        className={`flex flex-col items-center py-xs relative${weekend && !isToday ? ' bg-surface-2' : ''}`}
                      >
                        {isToday && (
                          <div className="absolute inset-y-0 left-0 w-[2px] pointer-events-none" style={{ zIndex: 1, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(11,57,80,0.5) 0px, rgba(11,57,80,0.5) 5px, transparent 5px, transparent 10px)' }} />
                        )}
                        <span
                          className={`font-inter text-xxs font-medium ${isToday ? 'text-deep-teal' : 'text-text-muted'}`}
                        >
                          {DAY_SHORT[day.getDay()]}
                        </span>
                        <div
                          className="w-[26px] h-[26px] mt-xxxs rounded-full flex items-center justify-center"
                          style={isToday ? { backgroundColor: '#2E9E65' } : {}}
                        >
                          <span
                            className={`font-poppins font-semibold text-xs ${isToday ? 'text-white' : 'text-text-secondary'}`}
                          >
                            {day.getDate()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Order rows */}
                {visibleOrders.map((order, oi) => (
                  <div
                    key={order.id}
                    className={`flex ${oi < visibleOrders.length - 1 ? 'border-b border-box-outline' : ''}`}
                  >
                    {/* Order info */}
                    <div
                      style={{ width: 160, flexShrink: 0 }}
                      className="px-sm py-xs flex flex-col justify-center gap-xxxs"
                    >
                      <p className="font-poppins font-bold text-xs text-deep-teal leading-tight">
                        Udførselssted
                      </p>
                      <p className="font-inter text-xs text-text-primary leading-snug line-clamp-2">
                        {order.projectName}
                      </p>
                      <p className="font-inter text-xxs text-text-muted leading-tight">
                        Jobnummer {order.jobnummer}
                      </p>
                      <p className="font-inter text-xxs text-text-muted leading-tight">
                        Ordrenummer {order.orderNumber}
                      </p>
                    </div>

                    {/* Status col */}
                    <div
                      style={{ width: 90, flexShrink: 0 }}
                      className="px-xs py-xs flex flex-col justify-center gap-xxxs border-r border-box-outline"
                    >
                      <span
                        className={`inline-block px-[6px] py-[2px] rounded-sm font-inter font-semibold text-[9px] leading-none w-fit ${STATE_BADGE[order.state]}`}
                      >
                        {STATE_LABEL[order.state]}
                      </span>
                      <span className="font-inter text-xxs text-text-muted">
                        {order.tonsDelivered > 0
                          ? `${order.tonsDelivered} / ${order.tonsTotal}t`
                          : `${order.tonsTotal}t`}
                      </span>
                    </div>

                    {/* Day cells */}
                    {days.map((day, di) => {
                      const inRange = isInRange(day, order)
                      const colorClass = getBarColorClass(order, day)
                      const isToday = sameDay(day, TODAY)
                      const weekend = isWeekend(day)
                      const start = parseDate(order.startDate)
                      const end = parseDate(order.endDate)
                      const isFirst = inRange && (sameDay(day, start) || di === 0)
                      const isLast = inRange && (sameDay(day, end) || di === days.length - 1)
                      // Tilgang B: weekend-overlay kun på weekend-celler inden for bar-spanet
                      const showWeekendOverlay = inRange && weekend && order.tidsvindue === 'weekend'
                      // Tekstfarve på nat-ordrer for kontrast
                      const textColorClass = order.tidsvindue === 'nat' ? 'text-white' : ''

                      return (
                        <div
                          key={di}
                          style={{
                            flex: 1, minWidth: 0,
                            ...(isToday ? { backgroundColor: 'rgba(46, 158, 101, 0.05)' } : {}),
                          }}
                          className={`flex items-center relative${weekend && !isToday ? ' bg-surface-2' : ''}`}
                        >
                          {isToday && (
                            <div className="absolute inset-y-0 left-0 w-[2px] pointer-events-none" style={{ zIndex: 1, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(11,57,80,0.5) 0px, rgba(11,57,80,0.5) 5px, transparent 5px, transparent 10px)' }} />
                          )}
                          {inRange && colorClass && (
                            <div className="relative w-full">
                              <button
                                onClick={() => order.id === '1' ? navigate('/prototyper/ordre-plan') : undefined}
                                aria-label={`Åbn ordre ${order.orderNumber}`}
                                className={[
                                  'h-[14px] w-full transition-opacity',
                                  order.id === '1' ? 'cursor-pointer hover:opacity-75' : 'cursor-not-allowed opacity-50',
                                  colorClass,
                                  textColorClass,
                                  isFirst ? 'rounded-l-sm ml-[3px]' : '',
                                  isLast ? 'rounded-r-sm mr-[3px]' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              />
                              {/* Tilgang B: weekend-overlay — bg-bad på lø/sø-celler inden for bar */}
                              {showWeekendOverlay && (
                                <span
                                  className="absolute inset-0 bg-bad pointer-events-none"
                                  style={{ zIndex: 2 }}
                                  aria-label="Weekend-udførelse"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}

              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center flex-wrap gap-sm mt-sm pl-sm">
            {[
              { cls: 'bg-good', label: 'I gang' },
              { cls: 'bg-good-bg border border-good/30', label: 'Planlagt' },
              { cls: 'bg-light-aqua', label: 'Afsluttet' },
              { cls: 'bg-bad/10 border border-bad/30', label: 'Aflyst' },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-xxxs">
                <div className={`w-[20px] h-[10px] rounded-sm ${cls}`} />
                <span className="font-inter text-xxs text-text-muted">{label}</span>
              </div>
            ))}
            {/* Tidsvindue-forklaringer */}
            <div className="flex items-center gap-xxxs">
              <div className="w-[20px] h-[10px] rounded-sm bg-deep-teal" />
              <span className="font-inter text-xxs text-text-muted">Nat</span>
            </div>
            <div className="flex items-center gap-xxxs">
              <div className="w-[20px] h-[10px] rounded-sm bg-bad" />
              <span className="font-inter text-xxs text-text-muted">Weekend-udførelse</span>
            </div>
          </div>

          {/* Sammenligning: andre regioner */}
          <div className="mt-lg">
            <h2 className="font-poppins font-semibold text-lg text-deep-teal mb-sm">
              Se oversigt for de andre regioner
            </h2>

            {/* Region-oversigt dropdown — visuelt kun, filtrerer ikke data i prototype */}
            {/* TODO: Erstat med Supabase-kald per region når klar */}
            <div className="relative w-fit mb-md">
              <select
                value={comparisonRegionId ?? ''}
                onChange={e => setComparisonRegionId(e.target.value || null)}
                className="appearance-none bg-white border border-hairline rounded-lg font-inter text-xs font-medium text-text-muted px-sm py-xs pr-7 cursor-pointer focus:outline-none"
              >
                <option value="">Vælg region…</option>
                {[
                  '2900-CON West Sydjylland',
                  '2750-CON Nord Jylland',
                  '3100-CON Midt Fyn',
                  '3400-CON Øst Sjælland',
                  '3700-CON Syd Sjælland',
                ]
                  .filter(r => r !== aktivRegionId)
                  .map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" />
            </div>

            {comparisonRegionId && (
              <div>
                <p className="font-inter text-xs font-medium text-text-muted uppercase tracking-wide mb-sm">
                  {comparisonRegionId}
                </p>
                {/* TODO: Erstat med data filtreret per region fra Supabase */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div>
                    {/* Date header */}
                    <div className="flex border-b border-box-outline bg-soft-aqua">
                      <div style={{ width: 160, flexShrink: 0 }} className="px-sm py-xs flex items-end">
                        <p className="font-inter text-xxs font-medium uppercase tracking-wide text-text-muted">
                          Ordre
                        </p>
                      </div>
                      <div style={{ width: 90, flexShrink: 0 }} className="border-r border-box-outline" />
                      {days.map((day, i) => {
                        const isToday = i === todayIndex
                        const weekend = isWeekend(day)
                        return (
                          <div
                            key={i}
                            style={{
                              flex: 1, minWidth: 0,
                              ...(isToday ? { backgroundColor: 'rgba(46, 158, 101, 0.1)' } : {}),
                            }}
                            className={`flex flex-col items-center py-xs relative${weekend && !isToday ? ' bg-surface-2' : ''}`}
                          >
                            {isToday && (
                              <div className="absolute inset-y-0 left-0 w-[2px] pointer-events-none" style={{ zIndex: 1, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(11,57,80,0.5) 0px, rgba(11,57,80,0.5) 5px, transparent 5px, transparent 10px)' }} />
                            )}
                            <span className={`font-inter text-xxs font-medium ${isToday ? 'text-deep-teal' : 'text-text-muted'}`}>
                              {DAY_SHORT[day.getDay()]}
                            </span>
                            <div
                              className="w-[26px] h-[26px] mt-xxxs rounded-full flex items-center justify-center"
                              style={isToday ? { backgroundColor: '#2E9E65' } : {}}
                            >
                              <span className={`font-poppins font-semibold text-xs ${isToday ? 'text-white' : 'text-text-secondary'}`}>
                                {day.getDate()}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Order rows — samme mock-data som placeholder */}
                    {visibleOrders.map((order, oi) => (
                      <div
                        key={order.id}
                        className={`flex ${oi < visibleOrders.length - 1 ? 'border-b border-box-outline' : ''}`}
                      >
                        <div style={{ width: 160, flexShrink: 0 }} className="px-sm py-xs flex flex-col justify-center gap-xxxs">
                          <p className="font-poppins font-bold text-xs text-deep-teal leading-tight">Udførselssted</p>
                          <p className="font-inter text-xs text-text-primary leading-snug line-clamp-2">{order.projectName}</p>
                          <p className="font-inter text-xxs text-text-muted leading-tight">Jobnummer {order.jobnummer}</p>
                          <p className="font-inter text-xxs text-text-muted leading-tight">Ordrenummer {order.orderNumber}</p>
                        </div>
                        <div style={{ width: 90, flexShrink: 0 }} className="px-xs py-xs flex flex-col justify-center gap-xxxs border-r border-box-outline">
                          <span className={`inline-block px-[6px] py-[2px] rounded-sm font-inter font-semibold text-[9px] leading-none w-fit ${STATE_BADGE[order.state]}`}>
                            {STATE_LABEL[order.state]}
                          </span>
                          <span className="font-inter text-xxs text-text-muted">
                            {order.tonsDelivered > 0 ? `${order.tonsDelivered} / ${order.tonsTotal}t` : `${order.tonsTotal}t`}
                          </span>
                        </div>
                        {days.map((day, di) => {
                          const inRange = isInRange(day, order)
                          const colorClass = getBarColorClass(order, day)
                          const isToday = sameDay(day, TODAY)
                          const weekend = isWeekend(day)
                          const start = parseDate(order.startDate)
                          const end = parseDate(order.endDate)
                          const isFirst = inRange && (sameDay(day, start) || di === 0)
                          const isLast = inRange && (sameDay(day, end) || di === days.length - 1)
                          const showWeekendOverlay = inRange && weekend && order.tidsvindue === 'weekend'
                          const textColorClass = order.tidsvindue === 'nat' ? 'text-white' : ''
                          return (
                            <div
                              key={di}
                              style={{ flex: 1, minWidth: 0, ...(isToday ? { backgroundColor: 'rgba(46, 158, 101, 0.05)' } : {}) }}
                              className={`flex items-center relative${weekend && !isToday ? ' bg-surface-2' : ''}`}
                            >
                              {isToday && (
                                <div className="absolute inset-y-0 left-0 w-[2px] pointer-events-none" style={{ zIndex: 1, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(11,57,80,0.5) 0px, rgba(11,57,80,0.5) 5px, transparent 5px, transparent 10px)' }} />
                              )}
                              {inRange && colorClass && (
                                <div className="relative w-full">
                                  <div
                                    className={[
                                      'h-[14px] w-full opacity-50',
                                      colorClass, textColorClass,
                                      isFirst ? 'rounded-l-sm ml-[3px]' : '',
                                      isLast ? 'rounded-r-sm mr-[3px]' : '',
                                    ].filter(Boolean).join(' ')}
                                  />
                                  {showWeekendOverlay && (
                                    <span className="absolute inset-0 bg-bad pointer-events-none" style={{ zIndex: 2 }} aria-label="Weekend-udførelse" />
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} messageCount={2} />
    </div>
  )
}
