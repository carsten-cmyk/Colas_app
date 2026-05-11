/**
 * PROTOTYPE — Vognmand Liste-view (Disponering)
 * Viser ordrer som kort sorteret efter første ikke-disponerede dag.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, List, LayoutGrid } from 'lucide-react'
import { MOCK_ORDRER } from '@/mocks/ordrer'
import { erGodkendt } from '@/mocks/disponeringState'
import type { Ordre, DagDisponering } from '@/types/vognmand'

type Tab = 'alle' | 'aabne' | 'disponeret'

// Forankret prototype-dato
const TODAY = new Date('2026-03-16T00:00:00')

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

function fmtDato(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtDatoKort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'numeric' })
}

const STATUS_BADGE: Record<OrdreStatus, { cls: string; label: string }> = {
  roed:   { cls: 'bg-bad/10 text-bad border border-bad/20',                       label: 'Ikke disponeret' },
  orange: { cls: 'bg-orange-50 text-orange-600 border border-orange-200',          label: 'Delvist disponeret' },
  groen:  { cls: 'bg-good/10 text-good border border-good/20',                     label: 'Fuldt disponeret' },
  gul:    { cls: 'bg-yellow/20 text-deep-teal border border-yellow/40',             label: 'Ændret af formand' },
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
    <div className="bg-white rounded-xl border border-box-outline shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-box-outline">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted mb-xxxs">
              Udførselssted
            </p>
            <p className="font-poppins font-semibold text-sm text-deep-teal leading-snug truncate">
              {ordre.adresse}
            </p>
            <p className="font-inter text-xs text-text-muted mt-0.5">
              Ordrenummer: {ordre.ordrenr} · {ordre.produktKode}
            </p>
          </div>
          <button
            className="flex-shrink-0 font-inter text-xs font-semibold px-4 py-2 rounded-lg bg-good text-white hover:bg-good/90 transition-colors"
            onClick={() => onDisponer(ordre.id)}
          >
            {erFuldt ? 'Se disponering' : 'Disponer'}
          </button>
        </div>

        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-inter text-[11px] text-text-muted">Fabrik:</span>
            <span className="font-inter text-[11px] font-medium text-text-secondary">{ordre.fabrik}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-inter text-[11px] text-text-muted">Mængde:</span>
            <span className="font-inter text-[11px] font-medium text-text-secondary">{ordre.mængdeTotal} tons · Produkt {ordre.produktKode}</span>
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
            return (
              <div key={dag.dato} className="px-5 py-3 flex items-center gap-3">
                {/* Dato for udlægning */}
                <span className="font-inter text-xs font-medium text-text-secondary w-32 flex-shrink-0 capitalize">
                  {fmtDato(dag.dato)}
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
                <span className={`w-36 flex-shrink-0 text-[10px] font-inter font-semibold px-2 py-1 rounded-full text-center ${dagBadge.cls}`}>
                  {dagBadge.label}
                </span>

                {/* Kommentar fra formand */}
                <span className="flex-1 font-inter text-xs text-text-muted italic">
                  {dag.kommentar ?? ''}
                </span>
              </div>
            )
          })}
        </div>
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
                Første del af ordre kørt på ordrenummer: {tk.ordrenr} ({fmtDatoKort(tk.fraDato)}–{fmtDatoKort(tk.tilDato)}):
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

  const alleOrdrer = MOCK_ORDRER.filter(o => o.dage.some(d => d.bestilteBiler > 0))

  const tabFilteredOrdrer = alleOrdrer.filter(o => {
    if (activeTab === 'disponeret') return erGodkendt(o.id)
    if (activeTab === 'aabne') return !erGodkendt(o.id)
    return true
  })

  const sortedOrdrer = sortOrdrer(tabFilteredOrdrer)

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
              {filteredOrdrer.length} {filteredOrdrer.length === 1 ? 'ordre' : 'ordrer'}
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
