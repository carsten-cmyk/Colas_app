/**
 * PROTOTYPE — Mine opgaver (Gantt-oversigt)
 * Sprint 1 — Element 2
 * 14-dages Gantt over formandets ordrer (3 dage tilbage, 11 frem).
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import type { TabName } from '@/types/navigation'

interface GanttOrder {
  id: string
  orderNumber: string
  projectName: string
  state: 'active' | 'planned' | 'completed'
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  tonsTotal: number
  tonsDelivered: number
}

// Anchored to prototype date
const TODAY = new Date('2026-03-16T00:00:00')

const MOCK_ORDERS: GanttOrder[] = [
  {
    id: '1',
    orderNumber: '1212343',
    projectName: 'Uddannelsescenter Syd, Nakskov',
    state: 'active',
    startDate: '2026-03-14',
    endDate: '2026-03-20',
    tonsTotal: 952,
    tonsDelivered: 250,
  },
  {
    id: '2',
    orderNumber: '1212344',
    projectName: 'Havnevej Renovering, Roskilde',
    state: 'planned',
    startDate: '2026-03-18',
    endDate: '2026-03-23',
    tonsTotal: 450,
    tonsDelivered: 0,
  },
  {
    id: '3',
    orderNumber: '1212345',
    projectName: 'Rolighedsvej Asfalt, Rønde',
    state: 'completed',
    startDate: '2026-03-09',
    endDate: '2026-03-14',
    tonsTotal: 320,
    tonsDelivered: 320,
  },
  {
    id: '4',
    orderNumber: '1212346',
    projectName: 'Strandvej Vedligehold, Helsingør',
    state: 'planned',
    startDate: '2026-03-23',
    endDate: '2026-03-26',
    tonsTotal: 180,
    tonsDelivered: 0,
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
  if (order.state === 'completed') return 'bg-light-aqua'
  if (day < TODAY && !sameDay(day, TODAY)) return 'bg-light-aqua'
  if (sameDay(day, TODAY) && order.state === 'active') return 'bg-[#2E9E65]'
  return 'bg-dark-teal'
}

const STATE_LABEL: Record<GanttOrder['state'], string> = {
  active: 'I gang',
  planned: 'Planlagt',
  completed: 'Afsluttet',
}

const STATE_BADGE: Record<GanttOrder['state'], string> = {
  active: 'bg-[#2E9E65] text-white',
  planned: 'bg-dark-teal text-white',
  completed: 'bg-light-aqua text-deep-teal',
}

export function GanttScreen() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabName>('mine-opgaver')

  function handleTabPress(tab: TabName) {
    if (tab === 'dagens-opgaver') { navigate('/prototyper/ordre-plan'); return }
    setActiveTab(tab)
  }

  // Window: 3 days back, 11 days forward = 14 days
  const days = Array.from({ length: 14 }, (_, i) => addDays(TODAY, i - 3))
  // Forudberegn today-index én gang så alle rækker bruger samme check
  const todayIndex = days.findIndex(d => sameDay(d, TODAY))
  const windowStart = days[0]
  const windowEnd = days[13]

  // Filtrer ordrer der slet ikke overlapper med det synlige vindue
  const visibleOrders = MOCK_ORDERS.filter(o =>
    parseDate(o.endDate) >= windowStart && parseDate(o.startDate) <= windowEnd
  )

  const fmtShort = (d: Date) =>
    d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })

  return (
    <div className="min-h-screen bg-soft-aqua flex flex-col">
      <TopBar userInitials="OJ" userName="Ole J." onSettingsPress={() => {}} />

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 70 }}>
        <div className="max-w-screen-xl mx-auto px-sm pt-md pb-md">

          {/* Page header */}
          <div className="mb-sm pl-sm">
            <h1 className="font-poppins font-bold text-2xl text-deep-teal leading-tight">
              Opgave oversigt
            </h1>
            <p className="font-inter text-xs text-text-muted">
              {fmtShort(windowStart)} – {fmtShort(windowEnd)}
            </p>
          </div>

          {/* Gantt card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              {/* min-width: 160px info col + 90px status col + 14 × 46px = 894px */}
              <div style={{ minWidth: 894 }}>

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
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1, minWidth: 46,
                          ...(isToday ? { backgroundColor: 'rgba(46, 158, 101, 0.1)' } : {}),
                        }}
                        className="flex flex-col items-center py-xs relative"
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
                      <p className="font-poppins font-semibold text-xs text-deep-teal truncate">
                        Ordrenr. {order.orderNumber}
                      </p>
                      <p className="font-inter text-xxs text-text-muted leading-snug line-clamp-2">
                        {order.projectName}
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
                      const start = parseDate(order.startDate)
                      const end = parseDate(order.endDate)
                      const isFirst = inRange && (sameDay(day, start) || di === 0)
                      const isLast = inRange && (sameDay(day, end) || di === 13)

                      return (
                        <div
                          key={di}
                          style={{
                            flex: 1, minWidth: 46,
                            ...(isToday ? { backgroundColor: 'rgba(46, 158, 101, 0.05)' } : {}),
                          }}
                          className="flex items-center relative"
                        >
                          {isToday && (
                            <div className="absolute inset-y-0 left-0 w-[2px] pointer-events-none" style={{ zIndex: 1, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(11,57,80,0.5) 0px, rgba(11,57,80,0.5) 5px, transparent 5px, transparent 10px)' }} />
                          )}
                          {inRange && colorClass && (
                            <button
                              onClick={() => order.id === '1' ? navigate('/prototyper/ordre-plan') : undefined}
                              aria-label={`Åbn ordre ${order.orderNumber}`}
                              className={[
                                'h-[14px] w-full transition-opacity',
                                order.id === '1' ? 'cursor-pointer hover:opacity-75' : 'cursor-not-allowed opacity-50',
                                colorClass,
                                isFirst ? 'rounded-l-sm ml-[3px]' : '',
                                isLast ? 'rounded-r-sm mr-[3px]' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            />
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
              { cls: 'bg-[#2E9E65]', label: 'I gang' },
              { cls: 'bg-dark-teal', label: 'Planlagt / fremtid' },
              { cls: 'bg-light-aqua', label: 'Afsluttet' },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-xxxs">
                <div className={`w-[20px] h-[10px] rounded-sm ${cls}`} />
                <span className="font-inter text-xxs text-text-muted">{label}</span>
              </div>
            ))}
          </div>

        </div>
      </main>

      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} messageCount={2} />
    </div>
  )
}
