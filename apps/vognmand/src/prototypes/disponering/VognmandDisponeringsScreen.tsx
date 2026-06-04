/**
 * PROTOTYPE — Vognmand Disponerings-view
 * Eget layout (ingen VognmandShell) — flåde-panel erstatter sidebar.
 * Præudfyldes fra "tidligere kørte". Drag-and-drop tildeling per dag.
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Search, Truck, Clock, Repeat, Factory, Scale, CloudRain } from 'lucide-react'
import { MOCK_ORDRER } from '@/mocks/ordrer'
import { MOCK_BILER, MOCK_CHAUFFOERER } from '@/mocks/biler'
import { markGodkendt } from '@/mocks/disponeringState'
import { BilProfilModal } from './BilProfilModal'
import { formatDatoMedUgedag } from '@/utils/dato'
import type { DagDisponering, ProduktKørsel } from '@/types/vognmand'
import type { Bil, Chauffør } from '@/mocks/biler'

type DagStatus = 'roed' | 'orange' | 'groen' | 'gul'

function getDagStatus(dag: DagDisponering, disponerede: string[]): DagStatus {
  if (dag.ændretAfFormand) return 'gul'
  const count = disponerede.length
  if (count >= dag.bestilteBiler) return 'groen'
  if (count > 0) return 'orange'
  return 'roed'
}

// Solid-tint pills uden border — matcher formand's status-pille-pattern (PATTERNS.md 1a)
const STATUS_BADGE: Record<DagStatus, { cls: string; label: string }> = {
  roed:   { cls: 'bg-bad/15 text-bad',                  label: 'Ikke disponeret' },
  orange: { cls: 'bg-warn-bg text-deep-teal',           label: 'Delvist disponeret' },
  groen:  { cls: 'bg-good-bg text-good',                label: 'Fuldt disponeret' },
  gul:    { cls: 'bg-yellow/25 text-deep-teal',         label: 'Ændret af formand' },
}

/** Pure helper — beregner HH:MM + minutter. Returnér '—' ved ugyldigt input. */
function addMinutesToHHMM(hhmm: string | undefined, minutes: number): string {
  if (!hhmm) return '—'
  const parts = hhmm.split(':')
  if (parts.length !== 2) return '—'
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return '—'
  const total = h * 60 + m + minutes
  const hh = Math.floor(((total % 1440) + 1440) % 1440 / 60)
  const mm = ((total % 1440) + 1440) % 1440 % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function førsteLæsAggregeret(dage: DagDisponering[]): string {
  const synlige = dage.filter(d => d.bestilteBiler > 0)
  if (synlige.length === 0) return '—'
  // Regel: brug Nr. 1's startTid hvis formand HAR valgt start-rækkefølge med tid
  // Fallback: førsteLæsPåPlads (formands planlagte ankomsttid)
  const resolve = (d: DagDisponering): string | undefined =>
    d.startRaekkefoelge?.[0] != null && d.startTider?.[0] != null
      ? d.startTider![0]!
      : d.førsteLæsPåPlads
  const første = resolve(synlige[0])
  if (!første) return '—'
  const ensartet = synlige.every(d => resolve(d) === første)
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

// ── Lastbil-kort i flåde-panel ────────────────────────────────────────────────

interface TruckCardProps {
  bil: Bil
  erPlaceret: boolean
  erTidligere: boolean
  onOpenProfil: () => void
}

function TruckCard({ bil, erPlaceret, erTidligere, onOpenProfil }: TruckCardProps) {
  return (
    <div
      draggable={!erPlaceret}
      onDragStart={e => {
        e.dataTransfer.setData('text/reg', bil.reg)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={onOpenProfil}
      className={[
        'rounded-lg border px-3 py-2.5 flex items-center gap-3 transition-all select-none',
        erPlaceret
          ? 'bg-surface-2 border-hairline opacity-50 cursor-pointer'
          : 'bg-white border-hairline hover:border-box-outline cursor-grab active:cursor-grabbing hover:shadow-sm',
      ].join(' ')}
    >
      <div className="w-8 h-8 rounded-lg bg-soft-aqua/60 flex items-center justify-center flex-shrink-0">
        <Truck size={14} className="text-deep-teal" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-inter text-xs font-bold text-text-primary">{bil.reg}</span>
          {erTidligere && (
            <span className="font-inter text-[9px] font-semibold uppercase tracking-wide text-deep-teal bg-soft-aqua/60 border border-light-aqua px-1.5 py-px rounded-full">
              Tidl.
            </span>
          )}
        </div>
        <span className="font-inter text-[11px] text-text-muted">
          {bil.biltype} · {bil.chaufførNavn.split(' ')[0]}
        </span>
      </div>
      {erPlaceret && (
        <span className="font-inter text-[10px] text-text-muted flex-shrink-0">Placeret</span>
      )}
    </div>
  )
}

// ── Hoved-skærm ──────────────────────────────────────────────────────────────

export function VognmandDisponeringsScreen() {
  const { ordreId } = useParams<{ ordreId: string }>()
  const navigate = useNavigate()

  const ordre = MOCK_ORDRER.find(o => o.id === ordreId)

  // materielMap: materielId → reg — pre-populeret med blokvogn BL77331 på alle linjer
  // TODO: Erstat med Supabase når klar
  const [materielMap, setMaterielMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const m of ordre?.materiel ?? []) {
      map[m.id] = 'BL77331'
    }
    return map
  })
  const [dragOverMaterielId, setDragOverMaterielId] = useState<string | null>(null)

  const [dispMap, setDispMap] = useState<Record<string, string[]>>(() => {
    if (!ordre) return {}
    const tidligereReg = ordre.tidligereKørte?.[0]?.biler.map(b => b.reg) ?? []
    const map: Record<string, string[]> = {}
    for (const dag of ordre.dage.filter(d => d.bestilteBiler > 0)) {
      map[dag.dato] = tidligereReg.slice(0, dag.bestilteBiler)
    }
    return map
  })

  const [biler, setBiler] = useState<Bil[]>(MOCK_BILER)
  const [chauffoerer, setChauffoerer] = useState<Chauffør[]>(MOCK_CHAUFFOERER)
  const [besked, setBesked] = useState('')
  const [dragOverDato, setDragOverDato] = useState<string | null>(null)
  const [godkendt, setGodkendt] = useState(false)
  const [søgning, setSøgning] = useState('')
  const [filterTidligere, setFilterTidligere] = useState(false)
  const [filter6aks, setFilter6aks] = useState(false)
  const [filter30t, setFilter30t] = useState(false)
  const [profileReg, setProfileReg] = useState<string | null>(null)

  if (!ordre) {
    return <div className="p-md"><p className="font-inter text-sm text-text-muted">Ordre ikke fundet.</p></div>
  }

  const dage = ordre.dage.filter(d => d.bestilteBiler > 0).sort((a, b) => a.dato.localeCompare(b.dato))
  const tidligereReg = new Set(ordre.tidligereKørte?.flatMap(tk => tk.biler.map(b => b.reg)) ?? [])
  const placeredeBiler = new Set(Object.values(dispMap).flat())
  const profileBil = profileReg ? biler.find(b => b.reg === profileReg) ?? null : null


  const filteredBiler = biler.filter(b => {
    if (!b.aktiv) return false
    if (søgning && !b.reg.toLowerCase().includes(søgning.toLowerCase()) && !b.chaufførNavn.toLowerCase().includes(søgning.toLowerCase())) return false
    if (filterTidligere && !tidligereReg.has(b.reg)) return false
    if (filter6aks && b.type !== '6-aks') return false
    if (filter30t && b.tons < 30) return false
    return true
  })

  function addBil(dato: string, reg: string) {
    setDispMap(prev => {
      const current = prev[dato] ?? []
      if (current.includes(reg)) return prev
      return { ...prev, [dato]: [...current, reg] }
    })
  }

  function removeBil(dato: string, reg: string) {
    setDispMap(prev => ({
      ...prev,
      [dato]: (prev[dato] ?? []).filter(r => r !== reg),
    }))
  }

  function handleSaveBil(data: Omit<Bil, 'type' | 'tons'> & { reg: string }) {
    setBiler(prev => prev.map(b => b.reg === data.reg ? { ...b, ...data } : b))
  }

  function handleDeleteBil(reg: string) {
    setBiler(prev => prev.filter(b => b.reg !== reg))
    setDispMap(prev => {
      const next = { ...prev }
      for (const dato of Object.keys(next)) {
        next[dato] = next[dato].filter(r => r !== reg)
      }
      return next
    })
  }

  function handleSaveChauf(c: Omit<Chauffør, 'id'>): string {
    const id = 'c_' + Date.now()
    setChauffoerer(prev => [...prev, { ...c, id }])
    return id
  }

  function handleGodkend() {
    if (ordre) markGodkendt(ordre.id)
    setGodkendt(true)
  }

  // ── Topbar (identisk med VognmandShell) ────────────────────────────────────
  const topbar = (
    <header
      className="sticky top-0 z-50 bg-deep-teal flex items-center justify-between px-sm flex-shrink-0"
      style={{ height: 52 }}
    >
      <img src="/colas-logo.png" alt="Colas" className="object-contain" style={{ height: 32 }} />
      <div className="flex items-center gap-xs bg-white/10 rounded-[20px] px-xs py-xxxs">
        <div className="w-[26px] h-[26px] rounded-full bg-dark-teal flex items-center justify-center flex-shrink-0">
          <span className="font-inter font-bold text-xxs text-white">PJ</span>
        </div>
        <span className="font-inter text-xs text-white/85">Per Jakobsen · Vognmand</span>
      </div>
    </header>
  )

  // ── Godkendt-skærm ─────────────────────────────────────────────────────────
  if (godkendt) {
    return (
      <div className="min-h-screen bg-page flex flex-col">
        {topbar}
        <div className="flex-1 flex items-center justify-center px-md">
          <div className="bg-white rounded-xl border border-box-outline shadow-sm p-10 max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-full bg-good/10 flex items-center justify-center mx-auto mb-5">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-good">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <p className="font-inter text-xxs font-semibold uppercase tracking-widest text-text-muted mb-1">
              Disponering godkendt
            </p>
            <h2 className="font-poppins font-semibold text-xl text-deep-teal mb-2 leading-snug">
              {ordre.adresse}
            </h2>
            <p className="font-inter text-sm text-text-secondary leading-relaxed">
              Ordren er fuldt disponeret og flyttes til{' '}
              <span className="font-semibold text-text-primary">"Disponeret"</span>-fanen.
              Formanden er notificeret.
            </p>

            {besked.trim() && (
              <div className="mt-4 bg-surface-2 rounded-lg px-4 py-3 text-left">
                <p className="font-inter text-xxs font-semibold uppercase tracking-widest text-text-muted mb-1">
                  Din besked
                </p>
                <p className="font-inter text-sm text-text-secondary italic">"{besked}"</p>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={() => navigate('/prototyper/liste?tab=disponeret')}
                className="w-full font-poppins font-semibold text-xs px-md py-xs rounded-full bg-good text-white inline-flex items-center justify-center gap-xxxs hover:opacity-90 transition-opacity"
              >
                Se disponerede ordrer
              </button>
              <button
                onClick={() => navigate('/prototyper/liste?tab=aabne')}
                className="w-full font-inter font-medium text-sm px-md py-xs rounded-full bg-white border border-hairline text-text-secondary hover:bg-surface-2 transition-colors"
              >
                Tilbage til Åbne ordre
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Hoved-layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-page flex flex-col">
      {topbar}

      <div className="flex flex-1" style={{ height: 'calc(100vh - 52px)' }}>

        {/* ── Venstre: Flåde-panel (erstatter sidebar) ── */}
        <aside
          className="sticky top-0 flex-shrink-0 bg-page border-r border-hairline flex flex-col overflow-y-auto"
          style={{ width: 280, height: 'calc(100vh - 52px)' }}
        >
          {/* Tilbage-navigation — samme stil som sidebar nav-item */}
          <nav className="px-xs pt-xs pb-xxxs">
            <button
              onClick={() => navigate('/prototyper/liste')}
              className="flex items-center gap-xs px-xs py-[10px] rounded-lg font-inter text-sm font-medium text-text-muted hover:bg-hairline hover:text-text-secondary transition-colors w-full text-left"
            >
              <ChevronLeft size={15} />
              Aktive ordre
            </button>
          </nav>

          <div className="h-px bg-hairline mx-xs mb-xs" />

          {/* Flåde-header */}
          <div className="px-xs pb-xs">
            <p className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted mb-xxxs px-xs">
              Din flåde
            </p>
            <p className="font-poppins font-semibold text-sm text-text-primary px-xs mb-xs">
              {MOCK_BILER.length} køretøjer
            </p>

            {/* Søgning */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="search"
                placeholder="Reg. nr. eller chauffør…"
                value={søgning}
                onChange={e => setSøgning(e.target.value)}
                className="w-full bg-white border border-box-outline rounded-lg pl-8 pr-3 py-2 font-inter text-xs text-text-secondary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-deep-teal/20 focus:border-deep-teal/40 transition"
              />
            </div>

            {/* Filter-chips */}
            <div className="flex flex-wrap gap-1.5 mt-xs">
              {[
                { label: 'Tidligere kørte', active: filterTidligere, toggle: () => setFilterTidligere(p => !p) },
                { label: '6-aks',           active: filter6aks,     toggle: () => setFilter6aks(p => !p) },
                { label: '30+ t',           active: filter30t,      toggle: () => setFilter30t(p => !p) },
              ].map(({ label, active, toggle }) => (
                <button
                  key={label}
                  onClick={toggle}
                  className={[
                    'font-inter text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
                    active
                      ? 'bg-deep-teal text-white border-deep-teal'
                      : 'bg-white text-text-muted border-hairline hover:border-box-outline hover:text-text-secondary',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bil-liste */}
          <div className="flex-1 overflow-y-auto px-xs pb-xs flex flex-col gap-1.5">
            {filteredBiler.length === 0 && (
              <p className="font-inter text-xs text-text-muted text-center py-8">Ingen køretøjer matcher</p>
            )}
            {filteredBiler.map(bil => (
              <TruckCard
                key={bil.reg}
                bil={bil}
                erPlaceret={placeredeBiler.has(bil.reg)}
                erTidligere={tidligereReg.has(bil.reg)}
                onOpenProfil={() => setProfileReg(bil.reg)}
              />
            ))}
          </div>
        </aside>

        {/* ── Højre: Ordre + disponering ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-md pt-md pb-lg">

            {/* Ordrekort */}
            <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">

              {/* Header — 2-kolonne grid, matcher VognmandListeScreen OrdreKort header */}
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
                <div
                  className="px-5 py-2 grid bg-surface-2 border-b border-hairline"
                  style={{ gridTemplateColumns: '8rem 5.5rem 6rem 1fr 9rem 1fr' }}
                >
                  {['Dato for udlægning', 'Bestilte biler', 'Første læs · interval', 'Disponerede biler', 'Status', 'Kommentar'].map(h => (
                    <span key={h} className="font-inter text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                      {h}
                    </span>
                  ))}
                </div>

                <div className="divide-y divide-hairline">
                  {dage.map(dag => {
                    const disponerede = dispMap[dag.dato] ?? []
                    const dagStatus = getDagStatus(dag, disponerede)
                    const badge = STATUS_BADGE[dagStatus]
                    const isDragOver = dragOverDato === dag.dato
                    const mangler = dag.bestilteBiler - disponerede.length
                    const erAnnulleret = dag.annulleretAarsag === 'vejr'
                    const harAnbefaling = dag.startRaekkefoelge?.some(v => v !== null) ?? false

                    return (
                      <div key={dag.dato}>
                        {/* Start-rækkefølge-banner — vises kun hvis formand har angivet anbefaling */}
                        {harAnbefaling && (
                          <div className="mx-5 mt-xs mb-xxs rounded-md bg-soft-aqua border border-light-aqua px-md py-xs">
                            <div className="font-poppins text-sm font-medium text-deep-teal mb-xxxs">
                              Formand anbefaler start-rækkefølge
                            </div>
                            <div className="flex items-center gap-md mb-xxxs">
                              {dag.startRaekkefoelge!.map((biltype, i) => {
                                const tid = dag.startTider?.[i] ?? null
                                return (
                                  <span key={i} className="inline-flex items-center gap-xxxs font-inter text-xs text-text-primary">
                                    <span className="font-semibold">Nr. {i + 1}:</span>
                                    {biltype ?? '—'}
                                    {tid && (
                                      <span className="font-inter text-xxs font-semibold text-deep-teal bg-white/70 border border-light-aqua rounded-md px-xs py-xxs tabular-nums">
                                        {tid}
                                      </span>
                                    )}
                                  </span>
                                )
                              })}
                            </div>
                            {dag.intervalMinutter != null && (
                              <p className="font-inter text-xxs text-text-secondary mb-xxxs">
                                Herefter interval: {dag.intervalMinutter} min
                              </p>
                            )}
                            <p className="font-inter text-xxs text-text-muted">
                              Du kan afvige — ring til formand hvis det ikke kan lade sig gøre.
                            </p>
                          </div>
                        )}
                      <div
                        className={`px-5 py-3 grid items-start${erAnnulleret ? ' bg-warn-bg' : ''}`}
                        style={{ gridTemplateColumns: '8rem 5.5rem 6rem 1fr 9rem 1fr' }}
                      >
                        <div className="flex flex-col gap-xxxs pt-1.5">
                          <span className="font-inter text-xs font-medium text-text-secondary capitalize">
                            {formatDatoMedUgedag(dag.dato)}
                          </span>
                          {erAnnulleret && (
                            <span className="inline-flex items-center gap-xxxs px-xs py-xxs rounded-md bg-yellow text-deep-teal font-poppins font-semibold text-xs uppercase tracking-wide self-start">
                              <CloudRain size={16} className="flex-shrink-0" aria-label="Vejrannullering" />
                              Ordre annulleret pga. vejr
                            </span>
                          )}
                        </div>
                        <span className="font-inter text-xs font-medium text-text-secondary pt-1.5">
                          {dag.bestilteBiler}
                        </span>
                        <span className="font-inter text-xs text-text-secondary pt-1.5">
                          {/* Multi-produkt: vis kompakt "X produkter" */}
                          {dag.produkter && dag.produkter.length >= 2
                            ? (
                              <span className="inline-flex items-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-soft-aqua/60 border border-light-aqua px-xs py-xxs rounded-md">
                                {dag.produkter.length} produkter
                              </span>
                            )
                            : dag.førsteLæsPåPlads
                              ? <>{dag.førsteLæsPåPlads}{' '}<span className="text-text-muted font-normal">+{dag.intervalMinutter} min</span></>
                              : '—'
                          }
                        </span>

                        {/* Drop zone */}
                        <div className="mr-4 flex flex-col gap-1.5">
                          {/* Drop zone */}
                          <div
                            onDragOver={e => { e.preventDefault(); setDragOverDato(dag.dato) }}
                            onDragLeave={() => setDragOverDato(null)}
                            onDrop={e => {
                              e.preventDefault()
                              const reg = e.dataTransfer.getData('text/reg')
                              if (reg) addBil(dag.dato, reg)
                              setDragOverDato(null)
                            }}
                            className={[
                              'min-h-[36px] rounded-lg border transition-all px-2 py-1.5 flex flex-wrap gap-1.5 content-start',
                              isDragOver
                                ? 'border-deep-teal bg-soft-aqua/40 border-dashed'
                                : 'border-dashed border-hairline hover:border-deep-teal/40 hover:bg-soft-aqua/20',
                            ].join(' ')}
                          >
                            {disponerede.map((reg, idx) => {
                              const bil = biler.find(b => b.reg === reg)
                              const læsNr = idx + 1
                              const ankomstPlads = addMinutesToHHMM(dag.førsteLæsPåPlads, idx * (dag.intervalMinutter ?? 0))
                              const fabrikMøde = dag.tidFabrikTilPlads != null && ankomstPlads !== '—'
                                ? addMinutesToHHMM(ankomstPlads, -dag.tidFabrikTilPlads)
                                : dag.mødetidFabrik ?? '—'
                              // Anbefaling-pille: vis for de 3 første læs når formand har angivet startRaekkefoelge
                              // Prototype: match via biltype-prefix (fx "6 Aks" matcher "6 Aks · 32 tons")
                              const anbefalingForPos = idx < 3 ? (dag.startRaekkefoelge?.[idx] ?? null) : null
                              const anbefalingMatch = anbefalingForPos !== null && (bil?.biltype.startsWith(anbefalingForPos) ?? false)
                              return (
                                <span
                                  key={reg}
                                  title={`${læsNr}. læs · plads ${ankomstPlads} · fabrik ${fabrikMøde}`}
                                  className="inline-flex items-center gap-1 bg-surface-2 border border-hairline rounded-md px-2 py-0.5 font-inter text-[11px] font-semibold text-text-secondary"
                                >
                                  {/* Læs-nummer badge — text-xxs = 10px i tokens */}
                                  <span className="font-inter text-xxs font-semibold bg-deep-teal/10 text-deep-teal px-1.5 py-px rounded-full flex-shrink-0">
                                    {læsNr}. læs
                                  </span>
                                  {/* Anbefaling-pille for de 3 første positioner */}
                                  {anbefalingForPos !== null && (
                                    <span className={`font-inter text-xxs ml-xxs ${anbefalingMatch ? 'text-good' : 'text-text-muted'}`}>
                                      {anbefalingMatch ? '✓' : `(anbef. ${anbefalingForPos})`}
                                    </span>
                                  )}
                                  <Truck size={9} className="text-text-muted flex-shrink-0" />
                                  <button
                                    onClick={() => setProfileReg(reg)}
                                    className="hover:text-deep-teal transition-colors"
                                  >
                                    {reg}
                                  </button>
                                  {bil && <span className="font-normal text-text-muted">· {bil.chaufførNavn.split(' ')[0]}</span>}
                                  {ankomstPlads !== '—' && (
                                    <span className="font-normal text-text-muted">· {ankomstPlads}</span>
                                  )}
                                  <button
                                    onClick={() => removeBil(dag.dato, reg)}
                                    className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full text-text-muted hover:bg-bad/10 hover:text-bad transition-colors flex-shrink-0"
                                    aria-label={`Fjern ${reg}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              )
                            })}
                            {disponerede.length === 0 && (
                              <span className="font-inter text-[11px] text-text-muted/60 italic self-center">
                                Træk biler hertil…
                              </span>
                            )}
                            {disponerede.length > 0 && mangler > 0 && (
                              <span className="font-inter text-[11px] text-text-muted/60 italic self-center">
                                {mangler} bil{mangler !== 1 ? 'er' : ''} mangler
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={[
                          'font-inter text-xxs font-semibold px-xs py-xxxs rounded-full text-center self-start mt-1',
                          badge.cls,
                        ].join(' ')}>
                          {badge.label}
                        </span>

                        <span className="font-inter text-xs text-text-muted italic self-start pt-1.5 pl-3">
                          {dag.kommentar ?? ''}
                        </span>
                      </div>

                      {/* Per-produkt kørsels-segmenter — kun ved multi-produkt-ordrer */}
                      {/* FUNCTIONAL_FLOWS § "Per-produkt kørselsfelter — formand styrer overgange" */}
                      {dag.produkter && dag.produkter.length >= 2 && (
                        <div className="mx-5 mb-xs flex flex-col gap-xxs">
                          {dag.produkter.map((p: ProduktKørsel, idx: number) => {
                            const erSekventiel = p.foersteLaesPaaPlads == null && idx > 0
                            // Vis tid-gab-zone: hvis forrige produkt er færdigt + gap inden dette starter
                            const forrigeProd = idx > 0 ? dag.produkter![idx - 1] : null
                            const harTidGab = !erSekventiel && forrigeProd?.foersteLaesPaaPlads != null && p.foersteLaesPaaPlads != null
                            return (
                              <div key={p.produktId}>
                                {/* Tid-gab-zone mellem produkter med eksplicitte starttider */}
                                {harTidGab && (
                                  <div className="flex items-center gap-xs py-xxs px-xs my-xxs border-dashed border border-hairline rounded-md bg-surface-2">
                                    <span className="font-inter text-xxs text-text-muted italic">
                                      Skift fra {forrigeProd!.recipeName} → {p.recipeName}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-sm px-xs py-xxs rounded-md bg-surface-2 border border-hairline">
                                  {/* Produkt-nummer badge */}
                                  <span className="font-inter text-xxs font-semibold bg-deep-teal/10 text-deep-teal px-xs py-xxs rounded-full flex-shrink-0 w-[20px] text-center">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-inter text-xs font-medium text-text-primary">{p.recipeName}</span>
                                    <span className="font-inter text-xxs text-text-muted ml-xs">{p.tonsPlanned} t</span>
                                  </div>
                                  <div className="flex items-center gap-xs flex-shrink-0">
                                    {erSekventiel ? (
                                      <span className="font-inter text-xxs text-text-muted italic">
                                        Sekventielt efter forrige
                                      </span>
                                    ) : (
                                      <>
                                        <span className="font-inter text-xs font-semibold text-deep-teal tabular-nums">
                                          {p.foersteLaesPaaPlads ?? '—'}
                                        </span>
                                        {p.intervalMin != null && (
                                          <span className="font-inter text-xxs text-text-muted">
                                            +{p.intervalMin} min
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Materiel ─────────────────────────────────────────── */}
              {ordre.materiel && ordre.materiel.length > 0 && (
                <div className="border-t border-box-outline">
                  <div className="px-5 py-3 bg-surface-2 border-b border-hairline">
                    <p className="font-inter text-xs font-semibold uppercase tracking-widest text-text-muted">Materiel</p>
                  </div>
                  <div className="divide-y divide-hairline">
                    {ordre.materiel.map(m => {
                      const assignedReg = materielMap[m.id]
                      const assignedBil = assignedReg ? biler.find(b => b.reg === assignedReg) : null
                      const isDragOverM = dragOverMaterielId === m.id
                      return (
                        <div key={m.id} className="px-5 py-3 grid items-center gap-4" style={{ gridTemplateColumns: '9rem 1fr 1fr' }}>
                          <div>
                            <p className="font-inter text-xs font-semibold text-text-primary">{m.beskrivelse}</p>
                            <p className="font-inter text-[10px] text-text-muted">{m.anlaegsNr} · {m.transportType}</p>
                          </div>
                          <div>
                            <p className="font-inter text-[10px] text-text-muted mb-xxxs">Afhentning → Aflæsning</p>
                            <p className="font-inter text-xs text-text-secondary leading-snug">{m.afhentning}</p>
                            <p className="font-inter text-[10px] text-text-muted">→ {m.aflæsning}</p>
                          </div>
                          {/* Drop zone */}
                          <div
                            onDragOver={e => { e.preventDefault(); setDragOverMaterielId(m.id) }}
                            onDragLeave={() => setDragOverMaterielId(null)}
                            onDrop={e => {
                              e.preventDefault()
                              const reg = e.dataTransfer.getData('text/reg')
                              if (reg) setMaterielMap(prev => ({ ...prev, [m.id]: reg }))
                              setDragOverMaterielId(null)
                            }}
                            className={[
                              'min-h-[36px] rounded-lg border transition-all px-2 py-1.5 flex items-center gap-2',
                              isDragOverM
                                ? 'border-deep-teal bg-soft-aqua/40 border-dashed'
                                : 'border-dashed border-hairline hover:border-deep-teal/40 hover:bg-soft-aqua/20',
                            ].join(' ')}
                          >
                            {assignedBil ? (
                              <span className="inline-flex items-center gap-1 bg-surface-2 border border-hairline rounded-md px-2 py-0.5 font-inter text-[11px] font-semibold text-text-secondary">
                                <Truck size={9} className="text-text-muted flex-shrink-0" />
                                {assignedBil.reg}
                                <span className="font-normal text-text-muted">· {assignedBil.chaufførNavn.split(' ')[0]}</span>
                                <button
                                  onClick={() => setMaterielMap(prev => { const n = { ...prev }; delete n[m.id]; return n })}
                                  className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full text-text-muted hover:bg-bad/10 hover:text-bad transition-colors flex-shrink-0"
                                  aria-label="Fjern transport"
                                >×</button>
                              </span>
                            ) : (
                              <span className="font-inter text-[11px] text-text-muted/60 italic">Træk transport hertil…</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Besked + Godkend */}
              <div className="px-5 py-5 border-t border-box-outline">
                <label className="block">
                  <span className="font-inter text-xxs font-semibold uppercase tracking-widest text-text-muted mb-1.5 block">
                    Besked til formand (valgfri)
                  </span>
                  <textarea
                    value={besked}
                    onChange={e => setBesked(e.target.value)}
                    placeholder="Skriv en besked, kommentar eller afvigelse til formanden…"
                    rows={2}
                    className="w-full bg-white border border-box-outline rounded-lg px-3 py-2 font-inter text-sm text-text-secondary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-deep-teal/20 focus:border-deep-teal/40 transition resize-none"
                  />
                </label>
                <button
                  // TODO: I produktion skal godkendelsen sende BÅDE asfalt-biler (dispMap)
                // OG materiel-transport (materielMap) til Supabase.
                // Supabase-trigger opdaterer formands badges:
                //   - Asfalt kørsel: "Bekræftet af vognmand" badge per dag
                //   - Materiellevering: "Bekræftet af vognmand" badge per maskine
                // Se .claude/docs/MATERIEL_FLOW.md for fuld spec.
                onClick={handleGodkend}
                  className="mt-4 w-full font-poppins font-semibold text-xs px-md py-xs rounded-full bg-good text-white inline-flex items-center justify-center gap-xxxs hover:opacity-90 transition-opacity shadow-sm"
                >
                  Godkend disponering og bekræft kørsel til formand
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* Bil-profil modal */}
      {profileReg !== null && (
        <BilProfilModal
          bil={profileBil}
          chauffoerer={chauffoerer}
          onSave={handleSaveBil}
          onDelete={handleDeleteBil}
          onSaveChauf={handleSaveChauf}
          onClose={() => setProfileReg(null)}
        />
      )}
    </div>
  )
}
