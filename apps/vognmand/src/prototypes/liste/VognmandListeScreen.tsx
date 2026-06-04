/**
 * PROTOTYPE — Vognmand Liste-view (Disponering)
 * Viser ordrer som kort sorteret efter første ikke-disponerede dag.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, List, LayoutGrid, Clock, Repeat, Factory, Scale, CloudRain } from 'lucide-react'
import { PeriodeNavigator } from '@shared/components/PeriodeNavigator'
import { MOCK_ORDRER } from '@/mocks/ordrer'
import { erGodkendt } from '@/mocks/disponeringState'
import { formatDatoLang, formatDatoMedUgedag } from '@/utils/dato'
import type { Ordre, DagDisponering } from '@/types/vognmand'

type Tab = 'alle' | 'aabne' | 'disponeret'
// DATO-NOTE: Periode-labelen (fmtShort) bruger kortformat ("13. mar") da det er en komprimeret range-overskrift.
// Kalender-celler vises ikke som fulde datoer — jf. DATOFORMAT.md.
type ViewMode = 'uge' | '14-dage' | 'maaned'

// Forankret prototype-dato — SAMME konstant som VognmandGanttScreen.tsx
const TODAY = new Date('2026-03-16T00:00:00')

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function getViewDays(mode: ViewMode): number {
  if (mode === 'uge') return 7
  if (mode === '14-dage') return 14
  return 31
}

type OrdreStatus = 'roed' | 'orange' | 'groen' | 'gul'

function getDagStatus(dag: DagDisponering): OrdreStatus {
  if (dag.ændretAfFormand) return 'gul'
  if (dag.disponeredeBiler === dag.bestilteBiler) return 'groen'
  if (dag.disponeredeBiler > 0) return 'orange'
  return 'roed'
}

function getOrdreStatus(ordre: Ordre): OrdreStatus {
  const dage = ordre.dage
  if (dage.length === 0) return 'roed'
  const harGul = dage.some(d => d.ændretAfFormand)
  if (harGul) return 'gul'
  const alleGrønne = dage.every(d => d.disponeredeBiler === d.bestilteBiler)
  if (alleGrønne) return 'groen'
  const harDisponeret = dage.some(d => d.disponeredeBiler > 0)
  if (harDisponeret) return 'orange'
  return 'roed'
}

// Finder tidligste urgent dag fra og med i dag:
// rød (ikke disponeret), orange (delvist), gul (ændret af formand)
function getEarliestUrgent(ordre: Ordre): string | null {
  const todayStr = TODAY.toISOString().slice(0, 10)
  const urgent = ordre.dage
    .filter(d => d.dato >= todayStr)
    .filter(d => d.ændretAfFormand || d.disponeredeBiler < d.bestilteBiler)
    .map(d => d.dato)
    .sort()
  return urgent[0] ?? null
}

function sortOrdrer(ordrer: Ordre[]): Ordre[] {
  return [...ordrer].sort((a, b) => {
    const au = getEarliestUrgent(a)
    const bu = getEarliestUrgent(b)
    if (au && !bu) return -1
    if (!au && bu) return 1
    if (au && bu) return au.localeCompare(bu)
    return a.startDate.localeCompare(b.startDate)
  })
}

function førsteLæsAggregeret(dage: DagDisponering[]): string {
  const synlige = dage.filter(d => d.bestilteBiler > 0)
  if (synlige.length === 0) return '—'
  const første = synlige[0].førsteLæsPåPlads
  if (!første) return '—'
  const ensartet = synlige.every(d => d.førsteLæsPåPlads === første)
  return ensartet ? første : 'Varierer'
}

function intervalAggregeret(dage: DagDisponering[]): string {
  const synlige = dage.filter(d => d.bestilteBiler > 0)
  if (synlige.length === 0) return '—'
  const første = synlige[0].intervalMinutter
  if (første == null) return '—'
  const ensartet = synlige.every(d => d.intervalMinutter === første)
  return ensartet ? `+${første} min` : 'Varierer'
}

// Solid-tint pills uden border — matcher formand's status-pille-pattern (PATTERNS.md 1a)
const STATUS_BADGE: Record<OrdreStatus, { cls: string; label: string }> = {
  roed:   { cls: 'bg-bad/15 text-bad',                  label: 'Ikke disponeret' },
  orange: { cls: 'bg-warn-bg text-deep-teal',           label: 'Delvist disponeret' },
  groen:  { cls: 'bg-good-bg text-good',                label: 'Fuldt disponeret' },
  gul:    { cls: 'bg-yellow/25 text-deep-teal',         label: 'Ændret af formand' },
}


interface OrdreKortProps {
  ordre: Ordre
  onDisponer: (id: string) => void
}

function OrdreKort({ ordre, onDisponer }: OrdreKortProps) {
  const status = getOrdreStatus(ordre)
  const erFuldt = status === 'groen'

  // Kun dage med bestilte biler (formand har disponeret)
  const visibleDage = ordre.dage.filter(d => d.bestilteBiler > 0).sort((a, b) => a.dato.localeCompare(b.dato))

  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-box-outline">
        <div className="grid grid-cols-[1fr_14rem] gap-md">

          {/* Venstre kolonne: udførselssted + 4 metadata-celler */}
          <div className="min-w-0">
            <p className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted mb-xxxs">
              Udførselssted
            </p>
            <p className="font-poppins font-semibold text-sm text-deep-teal leading-snug">
              {ordre.adresse}
            </p>
            {/* 4-celle metadata-grid */}
            <div className="grid grid-cols-4 gap-xs mt-sm">
              <div>
                <p className="flex items-center gap-xxxs font-inter text-xxs text-text-muted uppercase tracking-wide">
                  <Clock size={12} className="text-text-muted flex-shrink-0" />
                  Første læs
                </p>
                <p className="font-inter text-sm font-semibold text-deep-teal">
                  {førsteLæsAggregeret(ordre.dage)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-xxxs font-inter text-xxs text-text-muted uppercase tracking-wide">
                  <Repeat size={12} className="text-text-muted flex-shrink-0" />
                  Interval
                </p>
                <p className="font-inter text-sm font-semibold text-deep-teal">
                  {intervalAggregeret(ordre.dage)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-xxxs font-inter text-xxs text-text-muted uppercase tracking-wide">
                  <Factory size={12} className="text-text-muted flex-shrink-0" />
                  Fabrik
                </p>
                <p className="font-inter text-sm font-semibold text-deep-teal">
                  {ordre.fabrik}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-xxxs font-inter text-xxs text-text-muted uppercase tracking-wide">
                  <Scale size={12} className="text-text-muted flex-shrink-0" />
                  Mængde
                </p>
                <p className="font-inter text-sm font-semibold text-deep-teal">
                  {ordre.mængdeTotal} t · {ordre.produktKode}
                </p>
              </div>
            </div>
          </div>

          {/* Højre kolonne: holdnummer + ordrenummer + formand */}
          <div className="flex flex-col gap-xxxs">
            <p className="font-inter text-xs text-text-primary">Holdnummer 10541</p>
            <p className="font-inter text-xs text-text-primary">Jens Thorsager</p>
            <p className="font-inter text-xxs text-text-muted mt-xxxs">Ordrenummer {ordre.ordrenr}</p>
            <p className="font-inter text-xs text-text-secondary mt-xxxs">Formand: Lars Hansen</p>
            <p className="font-inter text-xs text-text-secondary">22 33 44 55</p>
          </div>

        </div>
      </div>

      {/* Dag-tabel */}
      <div>
        {/* Kolonneoverskrifter */}
        <div className="px-5 py-2 flex items-center gap-3 bg-surface-2 border-b border-hairline">
          <span className="font-inter text-[10px] font-semibold uppercase tracking-wide text-text-muted w-32 flex-shrink-0">
            Dato for udlægning
          </span>
          <span className="font-inter text-[10px] font-semibold uppercase tracking-wide text-text-muted w-24 flex-shrink-0">
            Bestilte biler
          </span>
          <span className="font-inter text-[10px] font-semibold uppercase tracking-wide text-text-muted w-24 flex-shrink-0">
            Mødetid fabrik
          </span>
          <span className="font-inter text-[10px] font-semibold uppercase tracking-wide text-text-muted w-28 flex-shrink-0">
            Tid fabrik til plads
          </span>
          <span className="font-inter text-[10px] font-semibold uppercase tracking-wide text-text-muted w-36 flex-shrink-0">
            Status
          </span>
          <span className="font-inter text-[10px] font-semibold uppercase tracking-wide text-text-muted flex-1">
            Kommentar
          </span>
        </div>

        <div className="divide-y divide-hairline">
          {visibleDage.map(dag => {
            const dagStatus = getDagStatus(dag)
            const dagBadge = STATUS_BADGE[dagStatus]
            const erAnnulleret = dag.annulleretAarsag === 'vejr'
            return (
              <div
                key={dag.dato}
                className={`px-5 py-3 flex items-center gap-3 ${erAnnulleret ? 'bg-warn-bg' : ''}`}
              >
                {/* Dato for udlægning */}
                <span className="font-inter text-xs font-medium text-text-secondary w-32 flex-shrink-0 capitalize">
                  {formatDatoMedUgedag(dag.dato)}
                </span>

                {/* Bestilte biler */}
                <span className="font-inter text-xs font-medium w-24 flex-shrink-0 text-text-secondary">
                  {dag.bestilteBiler}
                </span>

                {/* Mødetid fabrik */}
                <span className="font-inter text-xs text-text-secondary w-24 flex-shrink-0">
                  {dag.mødetidFabrik ?? '—'}
                </span>

                {/* Tid fabrik til plads */}
                <span className="font-inter text-xs text-text-secondary w-28 flex-shrink-0">
                  {dag.tidFabrikTilPlads != null ? `${dag.tidFabrikTilPlads} min` : '—'}
                </span>

                {/* Status badge */}
                <span className={`w-36 flex-shrink-0 text-xxs font-inter font-semibold px-xs py-xxxs rounded-full text-center ${dagBadge.cls}`}>
                  {dagBadge.label}
                </span>

                {/* Kommentar fra formand — med vejr-annullerings-pille */}
                <span className="flex-1 flex flex-col gap-xxxs">
                  {erAnnulleret && (
                    <span className="inline-flex items-center gap-xxxs px-xs py-xxs rounded-md bg-yellow text-deep-teal font-poppins font-semibold text-xs uppercase tracking-wide self-start">
                      <CloudRain size={14} className="flex-shrink-0" aria-hidden="true" />
                      Ordre annulleret pga. vejr
                    </span>
                  )}
                  {dag.kommentar && (
                    <span className={`font-inter text-text-muted italic ${erAnnulleret ? 'text-xxs mt-xxxs' : 'text-xs'}`}>
                      {dag.kommentar}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Disponer-knap */}
      <div className="px-5 py-3 border-t border-box-outline flex justify-end">
        <button
          className="font-poppins text-xs font-semibold px-md py-xs rounded-full bg-deep-teal text-white inline-flex items-center gap-xxxs hover:bg-dark-teal transition-colors"
          onClick={() => onDisponer(ordre.id)}
        >
          {erFuldt ? 'Se disponering' : 'Disponer'}
        </button>
      </div>

      {/* Tidligere kørte */}
      {ordre.tidligereKørte && ordre.tidligereKørte.length > 0 && (
        <div className="px-5 py-3 border-t border-box-outline bg-soft-aqua/40">
          {ordre.tidligereKørte.map((tk, i) => (
            <button
              key={i}
              className="flex items-start gap-1 text-left hover:opacity-75 transition-opacity w-full"
              onClick={() => {
                // TODO: åbn historik for denne tidligere periode
              }}
            >
              <span className="font-inter text-[11px] text-text-muted leading-relaxed">
                Første del af ordre kørt på ordrenummer: {tk.ordrenr} ({formatDatoLang(tk.fraDato)}–{formatDatoLang(tk.tilDato)}):
                {' '}
                <span className="font-medium text-deep-teal">
                  {tk.biler.map(b => `Bil ${b.reg} (${b.chauffør})`).join(', ')}
                </span>
              </span>
              <ChevronRight size={11} className="text-deep-teal flex-shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      )}

    </div>
  )
}

export function VognmandListeScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab')
    if (t === 'disponeret') return 'disponeret'
    if (t === 'aabne') return 'aabne'
    return 'aabne'
  })
  const [søgning, setSøgning] = useState('')

  // Kalender-navigation state — uafhængig af Gantt-view (ingen synkronisering)
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

  const fmtShort = (d: Date) =>
    d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })

  const alleOrdrer = MOCK_ORDRER.filter(o => o.dage.some(d => d.bestilteBiler > 0))

  const tabFilteredOrdrer = alleOrdrer.filter(o => {
    if (activeTab === 'disponeret') return erGodkendt(o.id)
    if (activeTab === 'aabne') return !erGodkendt(o.id)
    return true
  })

  // Periode-filter: kun ordrer med dage (med bestilte biler) inden for det valgte vindue
  const windowStartIso = windowStart.toISOString().slice(0, 10)
  const windowEndIso = windowEnd.toISOString().slice(0, 10)

  const periodeFilteredOrdrer = tabFilteredOrdrer.filter(o =>
    o.dage.some(d =>
      d.bestilteBiler > 0 &&
      d.dato >= windowStartIso &&
      d.dato <= windowEndIso
    )
  )

  const sortedOrdrer = sortOrdrer(periodeFilteredOrdrer)

  const filteredOrdrer = søgning.trim()
    ? sortedOrdrer.filter(o =>
        o.adresse.toLowerCase().includes(søgning.toLowerCase()) ||
        o.ordrenr.includes(søgning) ||
        o.produktKode.toLowerCase().includes(søgning.toLowerCase())
      )
    : sortedOrdrer

  const antalAabne = alleOrdrer.filter(o => !erGodkendt(o.id)).length
  const antalDisponeret = alleOrdrer.filter(o => erGodkendt(o.id)).length

  return (
    <div className="bg-page min-h-full">
      <div className="px-md pt-md pb-lg">

        {/* Page header */}
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-poppins font-semibold text-2xl text-deep-teal leading-tight">
              Aktive ordre
            </h1>
            <p className="font-inter text-xs text-text-muted mt-0.5">
              {filteredOrdrer.length} {filteredOrdrer.length === 1 ? 'ordre' : 'ordrer'} · {fmtShort(windowStart)} – {fmtShort(windowEnd)}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex bg-white border border-hairline rounded-lg overflow-hidden flex-shrink-0">
            <button
              className="px-3 py-2 font-inter text-xs font-medium bg-deep-teal text-white flex items-center gap-1.5"
            >
              <List size={14} />
              Aktive ordre
            </button>
            <button
              onClick={() => navigate('/prototyper/gantt')}
              className="px-3 py-2 font-inter text-xs font-medium text-text-muted hover:bg-surface-2 flex items-center gap-1.5 transition-colors"
            >
              <LayoutGrid size={14} />
              Kalender view
            </button>
          </div>
        </div>

        {/* Periode-controls */}
        <div className="mb-5">
          <PeriodeNavigator
            modes={['uge', '14-dage', 'maaned']}
            activeMode={viewMode}
            onModeChange={m => { setViewMode(m); setOffset(0) }}
            onNavigate={dir => setOffset(o => o + dir * viewDays)}
            onToday={() => setOffset(0)}
            ariaLabel="Periode-navigation"
          />
        </div>

        {/* Filter-tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-hairline pb-0">
          {([
            { id: 'aabne',      label: 'Åbne',       count: antalAabne },
            { id: 'disponeret', label: 'Disponeret',  count: antalDisponeret },
            { id: 'alle',       label: 'Alle',        count: alleOrdrer.length },
          ] as { id: Tab; label: string; count: number }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2.5 font-inter text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-deep-teal text-deep-teal'
                  : 'border-transparent text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              {tab.label}
              <span className={[
                'font-inter text-[11px] font-semibold px-1.5 py-px rounded-full min-w-[18px] text-center',
                activeTab === tab.id
                  ? 'bg-deep-teal/10 text-deep-teal'
                  : 'bg-surface-2 text-text-muted',
              ].join(' ')}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Søg */}
        <div className="mb-5">
          <input
            type="search"
            placeholder="Søg adresse, ordrenr eller produktkode…"
            value={søgning}
            onChange={e => setSøgning(e.target.value)}
            className="w-full bg-white border border-box-outline rounded-lg px-4 py-2.5 font-inter text-sm text-text-secondary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-deep-teal/20 focus:border-deep-teal/40 transition"
          />
        </div>

        {/* Kort-liste */}
        {filteredOrdrer.length === 0 ? (
          <div className="py-20 text-center font-inter text-sm text-text-muted">
            Ingen ordrer matcher søgningen
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrdrer.map(ordre => (
              <OrdreKort
                key={ordre.id}
                ordre={ordre}
                onDisponer={id => navigate(`/prototyper/disponering/${id}`)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
