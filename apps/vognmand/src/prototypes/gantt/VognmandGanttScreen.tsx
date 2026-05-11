/**
 * PROTOTYPE — Vognmand Gantt-oversigt
 * Fase 1 — Disponerings-overblik
 * 14-dages Gantt over vognmandens ordrer med dag-status per bestilling.
 * Baseret på formandets GanttScreen — tilpasset vognmands spec.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, List, LayoutGrid } from 'lucide-react'
import { MOCK_ORDRER } from '@/mocks/ordrer'
import type { Ordre, DagDisponering } from '@/types/vognmand'

type ViewMode = 'uge' | '14-dage' | 'maaned'
type CellStatus = 'groen' | 'orange' | 'roed' | 'gul' | 'neutral'

// Forankret prototype-dato
const TODAY = new Date('2026-03-16T00:00:00')

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

function isWeekend(d: Date): boolean {
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

function getViewDays(mode: ViewMode): number {
  if (mode === 'uge') return 7
  if (mode === '14-dage') return 14
  return 31
}

function getCellMinWidth(mode: ViewMode): number {
  return mode === 'maaned' ? 34 : 46
}

function getBestilling(ordre: Ordre, day: Date): DagDisponering | undefined {
  const iso = day.toISOString().slice(0, 10)
  return ordre.dage.find(d => d.dato === iso)
}

function getCellStatus(b: DagDisponering): CellStatus {
  if (b.ændretAfFormand) return 'gul'
  if (b.disponeredeBiler === b.bestilteBiler) return 'groen'
  if (b.disponeredeBiler > 0) return 'orange'
  return 'roed'
}

// Finder tidligste urgente dag (rød/orange/gul) fra og med i dag
function getEarliestUrgentDay(ordre: Ordre): string | null {
  const todayStr = TODAY.toISOString().slice(0, 10)
  const urgent = ordre.dage
    .filter(d => d.dato >= todayStr)
    .filter(d => d.ændretAfFormand || d.disponeredeBiler < d.bestilteBiler)
    .map(d => d.dato)
    .sort()
  return urgent[0] ?? null
}

// Sortering: røde/orange/gule fremad øverst → tidligste dag → bekræftede → afsluttede
function sortOrdrer(ordrer: Ordre[]): Ordre[] {
  return [...ordrer].sort((a, b) => {
    const au = getEarliestUrgentDay(a)
    const bu = getEarliestUrgentDay(b)
    if (au && !bu) return -1
    if (!au && bu) return 1
    if (au && bu) return au.localeCompare(bu)
    return a.endDate.localeCompare(b.endDate)
  })
}

const CELL_BAR_CLASS: Record<CellStatus, string> = {
  groen:   'bg-good',
  orange:  'bg-orange-500',
  roed:    'bg-bad',
  gul:     'bg-yellow',
  neutral: 'bg-light-aqua/50',
}

const BADGE_CLASS: Record<CellStatus, string> = {
  groen:   'bg-good text-white border-transparent',
  orange:  'bg-orange-500 text-white border-transparent',
  roed:    'bg-bad text-white border-transparent',
  gul:     'bg-yellow text-deep-teal border-yellow/40',
  neutral: 'bg-light-aqua/50 text-text-muted border-transparent',
}

export function VognmandGanttScreen() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('14-dage')
  const [offset, setOffset] = useState(0)

  const viewDays = getViewDays(viewMode)
  const cellMin = getCellMinWidth(viewMode)

  function getWindowStart(): Date {
    if (viewMode === 'uge') {
      const base = addDays(TODAY, offset)
      const dow = base.getDay()
      const mondayOffset = dow === 0 ? -6 : 1 - dow
      return addDays(base, mondayOffset)
    }
    return addDays(TODAY, offset)
  }

  const windowStart = getWindowStart()
  const days = Array.from({ length: viewDays }, (_, i) => addDays(windowStart, i))
  const windowEnd = days[days.length - 1]
  const todayIndex = days.findIndex(d => sameDay(d, TODAY))

  const fmtShort = (d: Date) =>
    d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })

  function navigatePeriod(dir: 1 | -1) {
    setOffset(prev => prev + dir * viewDays)
  }

  const sortedOrdrer = sortOrdrer(MOCK_ORDRER)
  const visibleOrdrer = sortedOrdrer.filter(o =>
    parseDate(o.endDate) >= windowStart && parseDate(o.startDate) <= windowEnd
  )

  return (
    <div className="bg-page min-h-full">
      <main className="max-w-screen-xl mx-auto px-md pt-md pb-lg">

        {/* Page header */}
        <div className="mb-5 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-poppins font-semibold text-2xl text-deep-teal leading-tight">
              Kalender view
            </h1>
            <p className="font-inter text-xs text-text-muted mt-0.5">
              {fmtShort(windowStart)} – {fmtShort(windowEnd)}
            </p>
          </div>

          {/* View toggle — aligned med overskrift */}
          <div className="flex bg-white border border-hairline rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => navigate('/prototyper/liste')}
              className="px-3 py-2 font-inter text-xs font-medium text-text-muted hover:bg-surface-2 flex items-center gap-1.5 transition-colors"
            >
              <List size={14} />
              Aktive ordre
            </button>
            <button
              className="px-3 py-2 font-inter text-xs font-medium bg-deep-teal text-white flex items-center gap-1.5"
            >
              <LayoutGrid size={14} />
              Kalender view
            </button>
          </div>
        </div>

        {/* Periode-controls */}
        <div className="mb-5 flex items-center gap-3">
          {/* Periode-view toggle */}
          <div className="flex bg-white border border-hairline rounded-lg overflow-hidden">
              {(['uge', '14-dage', 'maaned'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => { setViewMode(v); setOffset(0) }}
                  className={[
                    'px-3 py-2 font-inter text-xs font-medium transition-colors',
                    viewMode === v
                      ? 'bg-deep-teal text-white'
                      : 'text-text-muted hover:bg-soft-aqua',
                  ].join(' ')}
                >
                  {v === 'uge' ? 'Uge' : v === '14-dage' ? '14 dage' : 'Måned'}
                </button>
              ))}
            </div>

            {/* Periode-navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigatePeriod(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-box-outline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
                aria-label="Forrige periode"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setOffset(0)}
                className="px-3 py-2 font-inter text-xs font-medium bg-white border border-box-outline rounded-lg text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
              >
                I dag
              </button>
              <button
                onClick={() => navigatePeriod(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-box-outline text-text-muted hover:bg-soft-aqua hover:text-deep-teal transition-colors"
                aria-label="Næste periode"
              >
                <ChevronRight size={16} />
              </button>
            </div>
        </div>

        {/* Gantt-kort */}
        <div className="bg-white rounded-lg border border-hairline shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: 280 + viewDays * cellMin }}>

              {/* Dato-header */}
              <div className="flex border-b border-hairline bg-surface-2">
                <div
                  style={{ width: 280, flexShrink: 0 }}
                  className="px-4 py-3 flex items-end border-r border-box-outline"
                >
                  <p className="font-inter text-xxs font-medium uppercase tracking-wide text-text-muted">
                    Ordre
                  </p>
                </div>

                {days.map((day, i) => {
                  const isToday = i === todayIndex
                  const we = isWeekend(day)
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        minWidth: cellMin,
                        ...(we && !isToday ? { backgroundColor: '#F5F5F5' } : {}),
                        ...(isToday ? { backgroundColor: 'rgba(46,158,101,0.09)' } : {}),
                      }}
                      className="flex flex-col items-center py-2 relative"
                    >
                      {isToday && (
                        <div
                          className="absolute inset-y-0 left-0 w-[2px] pointer-events-none"
                          style={{
                            zIndex: 1,
                            backgroundImage:
                              'repeating-linear-gradient(to bottom, rgba(11,57,80,0.5) 0px, rgba(11,57,80,0.5) 5px, transparent 5px, transparent 10px)',
                          }}
                        />
                      )}
                      <span
                        className={`font-inter text-xxs font-medium ${
                          isToday
                            ? 'text-deep-teal font-semibold'
                            : we
                            ? 'text-text-muted/40'
                            : 'text-text-muted'
                        }`}
                      >
                        {DAY_SHORT[day.getDay()]}
                      </span>
                      <div
                        className="w-[22px] h-[22px] mt-[2px] rounded-full flex items-center justify-center"
                        style={isToday ? { backgroundColor: '#2E9E65' } : {}}
                      >
                        <span
                          className={`font-poppins font-semibold text-xs ${
                            isToday ? 'text-white' : we ? 'text-text-muted/40' : 'text-text-secondary'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Ordre-rækker */}
              {visibleOrdrer.length === 0 && (
                <div className="py-16 text-center font-inter text-sm text-text-muted">
                  Ingen ordrer i denne periode
                </div>
              )}

              {visibleOrdrer.map((ordre, oi) => {
                const start = parseDate(ordre.startDate)
                const end = parseDate(ordre.endDate)

                return (
                  <div
                    key={ordre.id}
                    className={`flex min-h-[80px] transition-colors hover:bg-[#FCFCFC] ${
                      oi < visibleOrdrer.length - 1 ? 'border-b border-box-outline' : ''
                    }`}
                  >
                    {/* Venstre: ordre-info */}
                    <button
                      style={{ width: 280, flexShrink: 0 }}
                      className="px-4 py-3 flex flex-col justify-center gap-0.5 border-r border-hairline text-left cursor-pointer hover:bg-surface-2 transition-colors"
                      onClick={() => navigate(`/prototyper/disponering/${ordre.id}`)}
                    >
                      <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-text-muted">
                        Udførselssted
                      </p>
                      <p className="font-poppins font-semibold text-xs text-deep-teal leading-snug">
                        {ordre.adresse}
                      </p>
                      <p className="font-inter text-[11px] text-text-muted mt-0.5">
                        Ordrenummer: {ordre.ordrenr}
                      </p>
                    </button>

                    {/* Dag-celler */}
                    {days.map((day, di) => {
                      const inRange = day >= start && day <= end
                      const isToday = sameDay(day, TODAY)
                      const we = isWeekend(day)
                      const bestilling = inRange ? getBestilling(ordre, day) : undefined
                      const isFirst = inRange && (sameDay(day, start) || di === 0)
                      const isLast = inRange && (sameDay(day, end) || di === days.length - 1)

                      const status: CellStatus | null = inRange
                        ? bestilling
                          ? getCellStatus(bestilling)
                          : 'neutral'
                        : null

                      return (
                        <div
                          key={di}
                          style={{
                            flex: 1,
                            minWidth: cellMin,
                            ...(we && !isToday ? { backgroundColor: '#FAFAFA' } : {}),
                            ...(isToday ? { backgroundColor: 'rgba(46,158,101,0.04)' } : {}),
                          }}
                          className="flex flex-col items-center justify-start pt-4 relative"
                        >
                          {isToday && (
                            <div
                              className="absolute inset-y-0 left-0 w-[2px] pointer-events-none"
                              style={{
                                zIndex: 1,
                                backgroundImage:
                                  'repeating-linear-gradient(to bottom, rgba(11,57,80,0.5) 0px, rgba(11,57,80,0.5) 5px, transparent 5px, transparent 10px)',
                              }}
                            />
                          )}

                          {inRange && status && (
                            <>
                              {/* Sammenhængende stav */}
                              <div
                                className={[
                                  'h-[6px] w-full',
                                  CELL_BAR_CLASS[status],
                                  isFirst ? 'rounded-l-full ml-[3px]' : '',
                                  isLast ? 'rounded-r-full mr-[3px]' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              />

                              {/* Badge med antal biler — kun hvis der er en bestilling */}
                              {bestilling && (
                                <button
                                  className={[
                                    'mt-2 flex items-center gap-1 font-inter text-[10px] font-semibold px-1.5 py-[3px] rounded-full border transition-all hover:-translate-y-px hover:opacity-90',
                                    BADGE_CLASS[status],
                                  ].join(' ')}
                                  onClick={() => navigate(`/prototyper/disponering/${ordre.id}`)}
                                  aria-label={`${bestilling.bestilteBiler} biler bestilt ${day.toLocaleDateString('da-DK')}`}
                                >
                                  <span className="w-[5px] h-[5px] rounded-full bg-current opacity-70 flex-shrink-0" />
                                  {bestilling.bestilteBiler}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}

            </div>
          </div>
        </div>

        {/* Forklaring */}
        <div className="flex items-center flex-wrap gap-4 mt-4 pl-1">
          {[
            { cls: 'bg-bad',        label: 'Ikke disponeret' },
            { cls: 'bg-orange-500', label: 'Delvist disponeret' },
            { cls: 'bg-good',       label: 'Fuldt disponeret' },
            { cls: 'bg-yellow',     label: 'Ændret af formand' },
            { cls: 'bg-light-aqua/50', label: 'Ingen bestilling (weekend/fridag)' },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-5 h-2.5 rounded-full ${cls}`} />
              <span className="font-inter text-xxs text-text-muted">{label}</span>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
