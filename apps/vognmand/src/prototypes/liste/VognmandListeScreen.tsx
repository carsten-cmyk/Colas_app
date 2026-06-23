/**
 * PROTOTYPE — Vognmand Liste-view (Disponering)
 * Viser ordrer som kort sorteret efter første ikke-disponerede dag.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, LayoutGrid, Factory, Scale } from 'lucide-react'
import { PeriodeNavigator } from '@shared/components/PeriodeNavigator'
import { MOCK_ORDRER } from '@/mocks/ordrer'
import { formatDatoMedUgedag } from '@/utils/dato'
import type { Ordre } from '@/types/vognmand'

// DATO-NOTE: Periode-labelen (fmtShort) bruger kortformat ("13. mar") da det er en komprimeret range-overskrift.
// Kalender-celler vises ikke som fulde datoer — jf. DATOFORMAT.md.
type ViewMode = 'dag' | 'uge' | '14-dage' | 'maaned'

// Forankret prototype-dato — SAMME konstant som VognmandGanttScreen.tsx
const TODAY = new Date('2026-03-16T00:00:00')

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

/** Lokal ISO-dato (YYYY-MM-DD) — IKKE toISOString(), der skifter til UTC og kan rykke dagen */
function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getViewDays(mode: ViewMode): number {
  if (mode === 'dag') return 1
  if (mode === 'uge') return 7
  if (mode === '14-dage') return 14
  return 31
}

type OrdreStatus = 'roed' | 'orange' | 'groen' | 'gul'

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


// Disponer-knappen er foreløbig taget UD AF SCOPE (2026-06-19).
// Vognmanden disponerer i sit eget system og leverer via fil-udveksling (SFTP/web-formular),
// så drag-and-drop-disponeringen udgår sandsynligvis. Koden + ruten bevares bag dette flag,
// så den nemt kan slås til igen hvis beslutningen ændrer sig.
const SHOW_DISPONER = false

interface OrdreKortProps {
  ordre: Ordre
  /** Vinduets start/slut (ISO) — kortet viser kun dage inden for vinduet */
  windowStartIso: string
  windowEndIso: string
  onDisponer: (id: string) => void
  onKoersel: (id: string) => void
}

function OrdreKort({ ordre, windowStartIso, windowEndIso, onDisponer, onKoersel }: OrdreKortProps) {
  const status = getOrdreStatus(ordre)
  const erFuldt = status === 'groen'

  // Kun dage med bestilte biler (formand har disponeret) OG inden for det valgte vindue —
  // så et kort i "Dag"-visning kun viser dagens række, ikke ordrens øvrige dage.
  const visibleDage = ordre.dage
    .filter(d => d.bestilteBiler > 0 && d.dato >= windowStartIso && d.dato <= windowEndIso)
    .sort((a, b) => a.dato.localeCompare(b.dato))

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
            {/* 2-celle metadata-grid */}
            <div className="grid grid-cols-2 gap-xs mt-sm">
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
            <p className="font-inter text-xs text-text-secondary">+45 22 33 44 55</p>
          </div>

        </div>
      </div>

      {/* Biler pr. dag — simpel oversigt (detaljer ligger i Kørsel & afregning) */}
      <div className="px-5 py-3">
        <p className="font-inter text-xxs font-semibold uppercase tracking-widest text-text-muted mb-xs">
          Biler pr. dag
        </p>
        <div className="flex flex-col divide-y divide-hairline">
          {visibleDage.map(dag => (
            <div key={dag.dato} className="flex items-center justify-between py-xs">
              <span className="font-inter text-sm text-text-secondary capitalize">
                {formatDatoMedUgedag(dag.dato)}
              </span>
              <span className="font-inter text-sm font-semibold text-deep-teal">
                {dag.bestilteBiler} {dag.bestilteBiler === 1 ? 'bil' : 'biler'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Handlinger */}
      <div className="px-5 py-3 border-t border-box-outline flex justify-end gap-xs">
        <button
          className="font-poppins text-xs font-semibold px-md py-xs rounded-full bg-deep-teal text-white inline-flex items-center gap-xxxs hover:bg-dark-teal transition-colors"
          onClick={() => onKoersel(ordre.id)}
        >
          Kørsel & afregning
        </button>

        {/* UD AF SCOPE pt. — se SHOW_DISPONER-noten øverst. Bevaret bag flag. */}
        {SHOW_DISPONER && (
          <button
            className="font-poppins text-xs font-semibold px-md py-xs rounded-full bg-white border border-hairline text-text-secondary inline-flex items-center gap-xxxs hover:bg-surface-2 transition-colors"
            onClick={() => onDisponer(ordre.id)}
          >
            {erFuldt ? 'Se disponering' : 'Disponer'}
          </button>
        )}
      </div>


    </div>
  )
}

export function VognmandListeScreen() {
  const navigate = useNavigate()

  // Kalender-navigation state — uafhængig af Gantt-view (ingen synkronisering)
  // Default = 'dag' (i dag): listen åbner fokuseret på i dag — kun dagens ordrer.
  const [viewMode, setViewMode] = useState<ViewMode>('dag')
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

  // Periode-filter: kun ordrer med dage (med bestilte biler) inden for det valgte vindue
  const windowStartIso = toIso(windowStart)
  const windowEndIso = toIso(windowEnd)

  const periodeFilteredOrdrer = alleOrdrer.filter(o =>
    o.dage.some(d =>
      d.bestilteBiler > 0 &&
      d.dato >= windowStartIso &&
      d.dato <= windowEndIso
    )
  )

  const filteredOrdrer = sortOrdrer(periodeFilteredOrdrer)

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
              {filteredOrdrer.length} {filteredOrdrer.length === 1 ? 'ordre' : 'ordrer'} · {viewMode === 'dag' ? fmtShort(windowStart) : `${fmtShort(windowStart)} – ${fmtShort(windowEnd)}`}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex bg-white border border-hairline rounded-lg overflow-hidden flex-shrink-0">
            <button
              className="px-3 py-2 font-inter text-xs font-medium bg-deep-teal text-white flex items-center gap-1.5"
            >
              <List size={14} />
              Liste
            </button>
            <button
              onClick={() => navigate('/prototyper/gantt')}
              className="px-3 py-2 font-inter text-xs font-medium text-text-muted hover:bg-surface-2 flex items-center gap-1.5 transition-colors"
            >
              <LayoutGrid size={14} />
              Kalender
            </button>
          </div>
        </div>

        {/* Periode-controls */}
        <div className="mb-5">
          <PeriodeNavigator
            modes={['dag', 'uge', '14-dage', 'maaned']}
            activeMode={viewMode}
            onModeChange={m => { setViewMode(m); setOffset(0) }}
            onNavigate={dir => setOffset(o => o + dir * viewDays)}
            onToday={() => setOffset(0)}
            ariaLabel="Periode-navigation"
          />
        </div>

        {/* Kort-liste */}
        {filteredOrdrer.length === 0 ? (
          <div className="py-20 text-center font-inter text-sm text-text-muted">
            Ingen ordrer i den valgte periode
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrdrer.map(ordre => (
              <OrdreKort
                key={ordre.id}
                ordre={ordre}
                windowStartIso={windowStartIso}
                windowEndIso={windowEndIso}
                onDisponer={id => navigate(`/prototyper/koersel/${id}`, { state: { from: 'liste', fromIso: windowStartIso, toIso: windowEndIso } })}
                onKoersel={id => navigate(`/prototyper/koersel/${id}`, { state: { from: 'liste', fromIso: windowStartIso, toIso: windowEndIso } })}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
