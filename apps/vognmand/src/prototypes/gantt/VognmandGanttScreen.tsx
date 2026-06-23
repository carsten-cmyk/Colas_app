/**
 * PROTOTYPE — Vognmand Gantt-oversigt
 * Fase 1 — Disponerings-overblik
 * 14-dages Gantt over vognmandens ordrer med dag-status per bestilling.
 * Baseret på formandets GanttScreen — tilpasset vognmands spec.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, LayoutGrid } from 'lucide-react'
import { PeriodeNavigator } from '@shared/components/PeriodeNavigator'
import { MOCK_ORDRER } from '@/mocks/ordrer'
// DATO-NOTE: Gantt-headeren viser kun ugedag-initialer + dato-tal i komprimerede kalender-celler —
// disse er ikke fulde datoer i tekst-form og konverteres ikke til lang-format (jf. DATOFORMAT.md).
// Periode-labelen (fmtShort) bruger kortformat ("13. mar") da det er en komprimeret range-overskrift.
import type { Ordre } from '@/types/vognmand'

type ViewMode = 'uge' | '14-dage' | 'maaned'

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


// TODO (produktion): Brug dansk kalender med danske mærkedage (helligdage).
// Skal markere mindst: nytårsdag, skærtorsdag, langfredag, 2. påskedag, store bededag,
// Kr. himmelfartsdag, 2. pinsedag, juleaften, juledag, 2. juledag, nytårsaftensdag.
// Helligdage skal markeres visuelt på samme måde som weekender i Gantten.

function getViewDays(mode: ViewMode): number {
  if (mode === 'uge') return 7
  if (mode === '14-dage') return 14
  return 31
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


export function VognmandGanttScreen() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('14-dage')
  const [offset, setOffset] = useState(0)

  const viewDays = getViewDays(viewMode)

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
            <h1 className="font-poppins font-semibold text-2xl text-deep-teal leading-tight">Kalenderoversigt</h1>
            <p className="font-inter text-xs text-text-muted mt-0.5">{fmtShort(windowStart)} – {fmtShort(windowEnd)}</p>
          </div>

          {/* View toggle — aligned med overskrift */}
          <div className="flex bg-white border border-hairline rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => navigate('/prototyper/liste')}
              className="px-3 py-2 font-inter text-xs font-medium text-text-muted hover:bg-surface-2 flex items-center gap-1.5 transition-colors"
            >
              <List size={14} />
              Liste
            </button>
            <button
              className="px-3 py-2 font-inter text-xs font-medium bg-deep-teal text-white flex items-center gap-1.5"
            >
              <LayoutGrid size={14} />
              Kalender
            </button>
          </div>
        </div>

        {/* Periode-controls */}
        <div className="mb-5">
          <PeriodeNavigator
            modes={['uge', '14-dage', 'maaned']}
            activeMode={viewMode}
            onModeChange={(mode) => { setViewMode(mode); setOffset(0) }}
            onNavigate={(direction) => navigatePeriod(direction)}
            onToday={() => setOffset(0)}
          />
        </div>

        {/* Gantt-kort */}
        <div className="space-y-xs">

          {/* Dato-header som sit eget kort */}
          <div className="bg-white rounded-lg border border-hairline shadow-sm overflow-hidden">
              {/* Dato-header */}
              <div className="flex bg-soft-aqua">
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
                        flex: 1, minWidth: 0,
                        ...(isToday ? { backgroundColor: 'rgba(46, 158, 101, 0.1)' } : {}),
                      }}
                      className={`flex flex-col items-center py-2 relative${we && !isToday ? ' bg-surface-2' : ''}`}
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
                        className="w-[26px] h-[26px] mt-xxxs rounded-full flex items-center justify-center"
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
          </div>

          {/* Tom-state */}
          {visibleOrdrer.length === 0 && (
            <div className="bg-white rounded-lg border border-hairline shadow-sm py-16 text-center font-inter text-sm text-text-muted">
              Ingen ordrer i denne periode
            </div>
          )}

          {/* Ordre-kort — ét kort per ordre */}
          {visibleOrdrer.map((ordre) => {
                const start = parseDate(ordre.startDate)
                const end = parseDate(ordre.endDate)

                return (
                  <div
                    key={ordre.id}
                    className="flex min-h-[80px] bg-white rounded-lg border border-hairline shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                  >
                    {/* Venstre: ordre-info */}
                    <button
                      style={{ width: 280, flexShrink: 0 }}
                      className="px-4 py-3 flex flex-col justify-center gap-0.5 border-r border-hairline text-left cursor-pointer hover:bg-surface-2 transition-colors"
                      onClick={() => navigate(`/prototyper/koersel/${ordre.id}`, { state: { from: 'gantt' } })}
                    >
                      <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-text-muted">
                        Udførselssted
                      </p>
                      <p className="font-poppins font-semibold text-xs text-deep-teal leading-snug">
                        {ordre.adresse}
                      </p>
                      <p className="font-inter text-[11px] text-text-primary mt-0.5">
                        Holdnummer 10541 – Jens Thorsager
                      </p>
                      <p className="font-inter text-[11px] text-text-muted">
                        Formand: Lars Hansen – +45 22 33 44 55
                      </p>
                      <div className="mt-xs flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-inter text-[9px] font-medium uppercase tracking-widest text-text-muted">Mængde</span>
                          <span className="font-inter text-[11px] font-semibold text-text-secondary">{ordre.mængdeTotal} t · {ordre.produktKode}</span>
                        </div>

                      </div>
                    </button>

                    {/* Dag-celler */}
                    {days.map((day, di) => {
                      const inRange = day >= start && day <= end
                      const isToday = sameDay(day, TODAY)
                      const we = isWeekend(day)
                      const isFirst = inRange && (sameDay(day, start) || di === 0)
                      const isLast = inRange && (sameDay(day, end) || di === days.length - 1)

                      // Bar-farve sættes PR. DAG. Prioritet: aflyst dag > nat (ordre-egenskab)
                      // > weekend-dag (afledt af kalenderen) > normal. En ordre der løber hen
                      // over en weekend vises derfor grøn på hverdage og gul på lø/sø.
                      const dagEntry = ordre.dage.find(d => sameDay(parseDate(d.dato), day))
                      const erAflyst = !!dagEntry?.annulleretAarsag
                      const barColorClass = inRange
                        ? erAflyst                    ? 'bg-bad'
                        : ordre.tidsvindue === 'nat' ? 'bg-deep-teal'
                        : we                          ? 'bg-warning'
                        : 'bg-good'
                        : ''

                      return (
                        <div
                          key={di}
                          style={{ flex: 1, minWidth: 0 }}
                          className={[
                            'flex flex-col items-center justify-start pt-4 relative',
                            isToday ? 'bg-good-bg/30' : we ? 'bg-soft-gray' : '',
                          ].filter(Boolean).join(' ')}
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

                          {inRange && (
                            <button
                              type="button"
                              onClick={() => navigate(`/prototyper/koersel/${ordre.id}`, { state: { from: 'gantt' } })}
                              aria-label={`Åbn ordre — ${ordre.adresse}`}
                              className={[
                                'h-[6px] w-full cursor-pointer hover:opacity-75 transition-opacity',
                                barColorClass,
                                isFirst ? 'rounded-l-full ml-[3px]' : '',
                                isLast ? 'rounded-r-full mr-[3px]' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}

        </div>

        {/* Forklaring */}
        <div className="flex items-center flex-wrap gap-4 mt-4 pl-1">
          {[
            { cls: 'bg-good',      label: 'Normal udførsel' },
            { cls: 'bg-deep-teal', label: 'Nat' },
            { cls: 'bg-warning',   label: 'Weekend' },
            { cls: 'bg-bad',       label: 'Aflyst' },
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
