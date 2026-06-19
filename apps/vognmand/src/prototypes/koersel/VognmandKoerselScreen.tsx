/**
 * PROTOTYPE — Vognmand Kørsel & afregning (3-mode)
 * Spejler formandens toggle: Planlægning · Udførsel · Afregning.
 * Viser de fire udvekslings-øjeblikke som felter frem/tilbage — fungerer som
 * visuel kontrakt for den senere funktionalitet.
 * Kontrakt: Docs/Vognmand/Dataudveksling-vognmand.md § "Udvekslings-model".
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Factory, Scale, Clock, Truck, AlertTriangle,
  CheckCircle2, CloudRain, RefreshCw, FileCheck2, ArrowDownLeft, ArrowUpRight,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { MOCK_ORDRER } from '@/mocks/ordrer'
import { MOCK_BILER } from '@/mocks/biler'
import { formatDatoMedUgedag } from '@/utils/dato'
import { formatPhone } from '@shared/utils/phone'
import type { DagDisponering } from '@/types/vognmand'

type Mode = 'planlaegning' | 'udfoersel' | 'afregning'

// ── Cutoff-regel (LÅST 2026-06-19) ─────────────────────────────────────────────
const CUTOFF_LABEL = 'kl. 18 dagen før'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** ISO YYYY-MM-DD → DDMMYY */
function ddmmyy(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}${m}${y.slice(2)}`
}

/** Bil-ordrenummer: <ordrenr>-DDMMYY-NN — permanent match-nøgle (LÅST 2026-06-13) */
function bilOrdrenr(ordrenr: string, iso: string, nn: number): string {
  return `${ordrenr}-${ddmmyy(iso)}-${String(nn).padStart(2, '0')}`
}

// ── Inline mock for de felter der ikke er i ordre-modellen endnu ─────────────────
// TODO: Erstat med Supabase når klar — disse felter leveres af udvekslings-flowet

type BekraeftetStatus = 'aktiv' | 'afsluttet' | 'ny'

interface BekraeftetBil {
  bilOrdrenr: string        // Colas' match-nøgle
  reelReg: string | null    // vognmandens reelle reg.nr (null = afventer retur)
  biltype: string
  chauffør: string
  mobil: string
  status: BekraeftetStatus
}

interface DagsBesked {
  id: string
  type: 'dag_afsluttet' | 'aflyst' | 'erstatning'
  dato: string
  reelReg: string
  chauffør: string
  tekst: string
  kilde: 'chauffør-app' | 'formand'
}

type AfregningType = 'akkord' | 'time'
interface VejeseddelLinje { tidspunkt: string; produkt: string; tons: number }
interface AfregningRow {
  chauffør: string
  reelReg: string
  dato: string
  afregningType: AfregningType
  koeretid: number | null   // kun time; akkord = null
  ventetid: number          // begge typer
  hviletid: number | null   // kun time; akkord = null
  tons: number
  vejesedler: VejeseddelLinje[]
  // Chauffør-app rå-registrering (chaufføren logger ALTID alle tre, uanset type):
  appKoeretid: number
  appVentetid: number
  appHviletid: number
  // Chaufførens input fra app:
  aarsag: string | null            // årsag til at chauffør har ændret timer
  chauffoerKommentar: string | null
}

/** Byg bekræftede biler for en dag fra mock-flåden — demonstrerer match-nøgle ↔ reelt reg.nr */
function bekraeftedeForDag(ordrenr: string, dag: DagDisponering): BekraeftetBil[] {
  const flåde = MOCK_BILER.filter(b => b.tons > 0)
  const rows: BekraeftetBil[] = []
  for (let i = 0; i < dag.bestilteBiler; i++) {
    const b = flåde[i % flåde.length]
    rows.push({
      bilOrdrenr: bilOrdrenr(ordrenr, dag.dato, i + 1),
      reelReg: b.reg,
      biltype: b.biltype,
      chauffør: b.chaufførNavn,
      mobil: '+4520304050',
      status: 'aktiv',
    })
  }
  return rows
}

// ── Mode-toggle ──────────────────────────────────────────────────────────────────

const MODES: { key: Mode; label: string }[] = [
  { key: 'planlaegning', label: 'Planlægning' },
  { key: 'udfoersel', label: 'Udførsel' },
  { key: 'afregning', label: 'Afregning' },
]

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex bg-surface-2 border border-hairline rounded-full p-xxs">
      {MODES.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={[
            'font-poppins font-semibold text-xs px-md py-xs rounded-full transition-colors',
            mode === m.key
              ? 'bg-deep-teal text-white shadow-sm'
              : 'text-text-muted hover:text-text-secondary',
          ].join(' ')}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ── Retnings-mærkat — "felter frem/tilbage" ────────────────────────────────────
type Retning = 'modtaget' | 'retur' | 'besked'
const RETNING: Record<Retning, { cls: string; label: string; Icon: typeof ArrowDownLeft }> = {
  modtaget: { cls: 'bg-soft-aqua/60 text-deep-teal border-light-aqua', label: 'Modtaget fra Colas', Icon: ArrowDownLeft },
  retur:    { cls: 'bg-good-bg text-good border-good/20',              label: 'Sendt retur',        Icon: ArrowUpRight },
  besked:   { cls: 'bg-warn-bg text-deep-teal border-yellow/30',       label: 'Besked',             Icon: RefreshCw },
}

function RetningsBadge({ retning, fixedWidth }: { retning: Retning; fixedWidth?: boolean }) {
  const r = RETNING[retning]
  return (
    <span className={`inline-flex items-center gap-xxxs font-inter text-xxs font-semibold uppercase tracking-wide border px-xs py-xxs rounded-full whitespace-nowrap ${fixedWidth ? 'w-40 justify-center' : ''} ${r.cls}`}>
      <r.Icon size={11} className="flex-shrink-0" />
      {r.label}
    </span>
  )
}

function SektionsHeader({ titel, retning, transparent, fixedWidth }: { titel: string; retning: Retning; transparent?: boolean; fixedWidth?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 py-3 border-b border-hairline ${transparent ? '' : 'bg-surface-2'}`}>
      <p className="font-inter text-xs font-semibold uppercase tracking-widest text-text-muted">{titel}</p>
      <RetningsBadge retning={retning} fixedWidth={fixedWidth} />
    </div>
  )
}

// ── Hoved-skærm ──────────────────────────────────────────────────────────────────

export function VognmandKoerselScreen() {
  const { ordreId } = useParams<{ ordreId: string }>()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('planlaegning')

  const ordre = MOCK_ORDRER.find(o => o.id === ordreId)

  if (!ordre) {
    return <div className="p-md"><p className="font-inter text-sm text-text-muted">Ordre ikke fundet.</p></div>
  }

  const dage = ordre.dage.filter(d => d.bestilteBiler > 0).sort((a, b) => a.dato.localeCompare(b.dato))

  // Bekræftede biler pr. dag — med én erstatning på første dag for at vise flowet
  const bekraeftet: Record<string, BekraeftetBil[]> = {}
  for (const dag of dage) bekraeftet[dag.dato] = bekraeftedeForDag(ordre.ordrenr, dag)
  // Erstatnings-demo: gammel bil afsluttet, ny bil på samme slot
  if (dage[0] && bekraeftet[dage[0].dato]?.[0]) {
    const slot = bekraeftet[dage[0].dato][0]
    slot.status = 'afsluttet'
    bekraeftet[dage[0].dato].push({
      bilOrdrenr: slot.bilOrdrenr,        // samme match-nøgle
      reelReg: 'TH11233',
      biltype: 'Tippehænger',
      chauffør: 'Jens Andersen',
      mobil: '+4520304053',
      status: 'ny',
    })
  }

  // Dagens beskeder (Udførsel) — TODO: Erstat med Supabase når klar
  const beskeder: DagsBesked[] = [
    { id: 'b1', type: 'dag_afsluttet', dato: dage[0]?.dato ?? '', reelReg: 'AB54231', chauffør: 'Brian Nielsen', kilde: 'chauffør-app', tekst: 'Chaufføren afsluttede dagen i app’en — bilen er fri og kan disponeres andetsteds.' },
    { id: 'b2', type: 'dag_afsluttet', dato: dage[0]?.dato ?? '', reelReg: 'CV98012', chauffør: 'Mads Christensen', kilde: 'formand', tekst: 'Formanden frigav bilen (sidste læs taget) — bilen er fri og kan disponeres andetsteds.' },
    { id: 'b3', type: 'erstatning', dato: dage[0]?.dato ?? '', reelReg: 'XE32114', chauffør: 'Lars Pedersen', kilde: 'formand', tekst: 'Nedbrud aftalt telefonisk. Erstatningsbil TH11233 sendt via filudveksling på samme bil-ordrenummer.' },
  ]

  // Afregning — pr. chauffør pr. dag — TODO: Erstat med Supabase når klar
  // TODO: Erstat med Supabase når klar
  const afregning: AfregningRow[] = [
    {
      chauffør: 'Lars Pedersen', reelReg: 'XE32114', dato: dage[0]?.dato ?? '',
      afregningType: 'time', koeretid: 5.5, ventetid: 1.5, hviletid: 0.75, tons: 96,
      appKoeretid: 5.5, appVentetid: 1.5, appHviletid: 0.75,
      aarsag: null, chauffoerKommentar: null,
      vejesedler: [
        { tidspunkt: '07.20', produkt: 'AB 11t', tons: 32 },
        { tidspunkt: '09.05', produkt: 'AB 11t', tons: 32 },
        { tidspunkt: '10.40', produkt: 'AB 11t', tons: 32 },
      ],
    },
    {
      chauffør: 'Brian Nielsen', reelReg: 'AB54231', dato: dage[0]?.dato ?? '',
      afregningType: 'akkord', koeretid: null, ventetid: 0.5, hviletid: null, tons: 90,
      appKoeretid: 5.0, appVentetid: 0.75, appHviletid: 0.5,
      aarsag: 'Ventetid justeret — kø ved fabrik talte ikke med',
      chauffoerKommentar: 'Lang kø på fabrik om morgenen',
      vejesedler: [
        { tidspunkt: '07.35', produkt: 'AB 11t', tons: 30 },
        { tidspunkt: '09.15', produkt: 'AB 11t', tons: 30 },
        { tidspunkt: '10.55', produkt: 'AB 11t', tons: 30 },
      ],
    },
    {
      chauffør: 'Mads Christensen', reelReg: 'CV98012', dato: dage[0]?.dato ?? '',
      afregningType: 'time', koeretid: 6.0, ventetid: 2.0, hviletid: 0.5, tons: 84,
      appKoeretid: 6.5, appVentetid: 2.0, appHviletid: 0.5,
      aarsag: 'Køretid rettet til aftalt rute-tid',
      chauffoerKommentar: null,
      vejesedler: [
        { tidspunkt: '07.50', produkt: 'AB 11t', tons: 28 },
        { tidspunkt: '09.30', produkt: 'AB 11t', tons: 28 },
        { tidspunkt: '11.10', produkt: 'AB 11t', tons: 28 },
      ],
    },
  ]

  return (
    <div className="bg-page min-h-full">
      <div className="px-md pt-md pb-lg">

          {/* Tilbage + mode-toggle */}
          <div className="flex items-center justify-between mb-md">
            <button
              onClick={() => navigate('/prototyper/liste')}
              className="flex items-center gap-xxxs font-inter text-sm font-medium text-text-muted hover:text-text-secondary transition-colors"
            >
              <ChevronLeft size={15} />
              Aktive ordre
            </button>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>

          {/* Ordrekort */}
          <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden mb-md">
            <div className="px-5 pt-5 pb-4">
              <div className="grid grid-cols-[1fr_14rem] gap-md">
                <div className="min-w-0">
                  <p className="font-inter text-xxs font-medium uppercase tracking-widest text-text-muted mb-xxxs">Udførselssted</p>
                  <p className="font-poppins font-semibold text-sm text-deep-teal leading-snug">{ordre.adresse}</p>
                  <div className="grid grid-cols-3 gap-xs mt-sm">
                    <div>
                      <p className="flex items-center gap-xxxs font-inter text-xxs text-text-muted uppercase tracking-wide">
                        <Factory size={12} className="flex-shrink-0" /> Fabrik
                      </p>
                      <p className="font-inter text-sm font-semibold text-deep-teal">{ordre.fabrik}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-xxxs font-inter text-xxs text-text-muted uppercase tracking-wide">
                        <Scale size={12} className="flex-shrink-0" /> Mængde
                      </p>
                      <p className="font-inter text-sm font-semibold text-deep-teal">{ordre.mængdeTotal} Tons · {ordre.produktKode}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-xxxs font-inter text-xxs text-text-muted uppercase tracking-wide">
                        <Clock size={12} className="flex-shrink-0" /> Dage
                      </p>
                      <p className="font-inter text-sm font-semibold text-deep-teal">{dage.length} dage</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-xxxs">
                  <p className="font-inter text-xs text-text-primary">Ordrenummer {ordre.ordrenr}</p>
                  <p className="font-inter text-xs text-text-secondary">Formand: Lars Hansen</p>
                  <p className="font-inter text-xs text-text-secondary">+45 22 33 44 55</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mode-indhold ── */}
          {mode === 'planlaegning' && (
            <PlanlaegningMode
              dage={dage}
              bekraeftet={bekraeftet}
            />
          )}
          {mode === 'udfoersel' && <UdfoerselMode beskeder={beskeder} />}
          {mode === 'afregning' && <AfregningMode rows={afregning} />}

      </div>

    </div>
  )
}

// ── 🔵 Planlægning — bestilling (modtaget) + bekræftede biler (retur) ───────────

interface PlanlaegningProps {
  dage: DagDisponering[]
  bekraeftet: Record<string, BekraeftetBil[]>
}

function PlanlaegningMode({ dage, bekraeftet }: PlanlaegningProps) {
  return (
    <div className="flex flex-col gap-md">
      {/* Cutoff-banner */}
      <div className="bg-soft-aqua border border-light-aqua rounded-xl px-md py-xs">
        <p className="font-inter text-xs text-deep-teal">
          Ændringer kan laves frem til <span className="font-semibold">{CUTOFF_LABEL}</span>. Herefter kun telefonisk.
        </p>
      </div>

      {dage.map(dag => {
        const biler = bekraeftet[dag.dato] ?? []
        return (
          <div key={dag.dato} className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">
            <div className="px-5 pt-3">
              <p className="font-inter text-sm font-semibold text-deep-teal capitalize">{formatDatoMedUgedag(dag.dato)}</p>
            </div>
            <div className="px-5 py-3 flex items-start justify-between gap-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-sm flex-1 min-w-0">
                <Felt label="Bestilte biler" value={`${dag.bestilteBiler}`} />
                <Felt label="Mødetid fabrik" value={dag.mødetidFabrik ?? '—'} />
                <Felt label="Første læs på plads" value={dag.førsteLæsPåPlads ?? '—'} />
                <Felt label="Interval" value={dag.intervalMinutter ? `+${dag.intervalMinutter} Minutter` : '—'} />
                {dag.kommentar && <Felt label="Kommentar" value={dag.kommentar} wide />}
              </div>
              <RetningsBadge retning="modtaget" fixedWidth />
            </div>
            <hr className="border-hairline" />

            {/* Sendt retur — bekræftede biler */}
            <SektionsHeader titel="Bekræftede biler" retning="retur" transparent fixedWidth />
            <div className="divide-y divide-hairline">
              {biler.map((b, i) => (
                <BekraeftetBilRow key={`${b.bilOrdrenr}-${i}`} bil={b} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Felt({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2 md:col-span-4' : ''}>
      <p className="font-inter text-xxs font-medium uppercase tracking-wide text-text-muted mb-xxxs">{label}</p>
      <p className="font-inter text-sm font-semibold text-text-primary">{value}</p>
    </div>
  )
}

const BIL_STATUS: Record<BekraeftetStatus, { cls: string; label: string }> = {
  aktiv:     { cls: 'bg-good-bg text-good',          label: 'Aktiv' },
  afsluttet: { cls: 'bg-surface-2 text-text-muted',  label: 'Afsluttet' },
  ny:        { cls: 'bg-yellow/25 text-deep-teal',   label: 'Ny (erstatning)' },
}

function BekraeftetBilRow({ bil }: { bil: BekraeftetBil }) {
  const st = BIL_STATUS[bil.status]
  const afsluttet = bil.status === 'afsluttet'
  return (
    <div className={`px-5 py-3 grid items-center gap-sm ${afsluttet ? 'opacity-55' : ''}`} style={{ gridTemplateColumns: '13rem 1fr 1fr 7rem' }}>
      {/* Match-nøgle */}
      <div>
        <p className="font-inter text-xxs text-text-muted uppercase tracking-wide mb-xxxs">Bil-ordrenummer</p>
        <p className="font-inter text-xs font-semibold text-deep-teal tabular-nums">{bil.bilOrdrenr}</p>
      </div>
      {/* Reelt reg.nr */}
      <div className="flex items-center gap-xs">
        <Truck size={14} className="text-text-muted flex-shrink-0" />
        <div>
          <p className="font-inter text-xs font-bold text-text-primary">{bil.reelReg ?? 'Afventer retur'}</p>
          <p className="font-inter text-xxs text-text-muted">{bil.biltype}</p>
        </div>
      </div>
      {/* Chauffør */}
      <div>
        <p className="font-inter text-xs font-medium text-text-secondary">{bil.chauffør}</p>
        <p className="font-inter text-xxs text-text-muted tabular-nums">{formatPhone(bil.mobil)}</p>
      </div>
      {/* Status */}
      <span className={`font-inter text-xxs font-semibold px-xs py-xxxs rounded-full text-center ${st.cls}`}>
        {st.label}
      </span>
    </div>
  )
}

// ── 🟠 Udførsel — dagens beskeder (ingen live-data) ─────────────────────────────

const BESKED_META: Record<DagsBesked['type'], { Icon: typeof CheckCircle2; iconCls: string; bgCls: string; titel: string }> = {
  dag_afsluttet: { Icon: CheckCircle2,  iconCls: 'text-good',      bgCls: 'bg-good/10',  titel: 'Dag afsluttet' },
  aflyst:        { Icon: CloudRain,     iconCls: 'text-deep-teal', bgCls: 'bg-yellow/20', titel: 'Aflyst' },
  erstatning:    { Icon: AlertTriangle, iconCls: 'text-deep-teal', bgCls: 'bg-warn-bg',   titel: 'Erstatning' },
}

function UdfoerselMode({ beskeder }: { beskeder: DagsBesked[] }) {
  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">
      <SektionsHeader titel="Dagens beskeder" retning="besked" />
      {beskeder.length === 0 ? (
        <p className="px-5 py-8 text-center font-inter text-sm text-text-muted">Ingen beskeder i dag.</p>
      ) : (
        <div className="divide-y divide-hairline">
          {beskeder.map(b => {
            const m = BESKED_META[b.type]
            return (
              <div key={b.id} className="px-5 py-4 flex items-start gap-sm">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${m.bgCls}`}>
                  <m.Icon size={17} className={m.iconCls} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-xs flex-wrap">
                    <span className="font-poppins font-semibold text-sm text-deep-teal">{m.titel}</span>
                    <span className="font-inter text-xs font-semibold text-text-primary">{b.reelReg}</span>
                    <span className="font-inter text-xs text-text-muted">· {b.chauffør}</span>
                    <span className="font-inter text-xxs text-text-muted capitalize ml-auto">{formatDatoMedUgedag(b.dato)}</span>
                  </div>
                  <p className="font-inter text-xs text-text-secondary leading-relaxed mt-xxxs">{b.tekst}</p>
                  <p className="font-inter text-xxs text-text-muted mt-xxxs">
                    Kilde: {b.kilde === 'chauffør-app' ? 'Chauffør-app' : 'Formand'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 🟢 Afregning — timer pr. chauffør pr. dag (køretid/ventetid/hviletid + tons) ─

const AFREGNING_TYPE_BADGE: Record<AfregningType, { cls: string; label: string }> = {
  akkord: { cls: 'bg-soft-aqua/60 text-deep-teal', label: 'Akkord' },
  time:   { cls: 'bg-good-bg text-good',           label: 'Timekørsel' },
}

// gridTemplateColumns: chauffør+type · køretid · ventetid · hviletid · tons · chevron
const AFREGNING_GRID = '1fr 6rem 6rem 6rem 5rem 2rem'

function AfregningMode({ rows }: { rows: AfregningRow[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const totalTons = rows.reduce((s, r) => s + r.tons, 0)

  function toggle(i: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">
      <SektionsHeader titel="Bil- og tonsafregning" retning="modtaget" />

      {/* Tabel-header */}
      <div className="px-5 py-2 grid bg-surface-2 border-b border-hairline gap-sm" style={{ gridTemplateColumns: AFREGNING_GRID }}>
        {['Chauffør / bil', 'Køretid', 'Ventetid', 'Hviletid', 'Tons', ''].map((h, i) => (
          <span key={i} className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted">{h}</span>
        ))}
      </div>

      <div className="divide-y divide-hairline">
        {rows.map((r, i) => {
          const isOpen = expanded.has(i)
          const badge = AFREGNING_TYPE_BADGE[r.afregningType]
          const erAkkord = r.afregningType === 'akkord'
          return (
            <div key={i}>
              {/* Hoved-række — klikbar */}
              <button
                onClick={() => toggle(i)}
                className="w-full text-left px-5 py-3 grid items-center gap-sm hover:bg-surface-2 transition-colors"
                style={{ gridTemplateColumns: AFREGNING_GRID }}
              >
                {/* Chauffør + type-badge */}
                <div className="min-w-0">
                  <div className="flex items-center gap-xs flex-wrap">
                    <p className="font-inter text-xs font-medium text-text-primary">{r.chauffør}</p>
                    <span className={`font-inter text-xxs font-semibold px-xs py-xxs rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="font-inter text-xxs text-text-muted mt-xxxs">{r.reelReg} · <span className="capitalize">{formatDatoMedUgedag(r.dato)}</span></p>
                </div>
                {/* Køretid */}
                <span className={`font-inter text-sm tabular-nums ${erAkkord ? 'text-text-muted' : 'text-text-secondary'}`}>
                  {erAkkord ? '—' : `${r.koeretid!.toFixed(1)} Timer`}
                </span>
                {/* Ventetid */}
                <span className="font-inter text-sm text-text-secondary tabular-nums">{r.ventetid.toFixed(1)} Timer</span>
                {/* Hviletid */}
                <span className={`font-inter text-sm tabular-nums ${erAkkord ? 'text-text-muted' : 'text-text-secondary'}`}>
                  {erAkkord ? '—' : `${r.hviletid!.toFixed(1)} Timer`}
                </span>
                {/* Tons */}
                <span className="font-inter text-sm font-semibold text-text-primary tabular-nums">{r.tons} Tons</span>
                {/* Chevron */}
                <span className="flex items-center justify-center text-text-muted">
                  {isOpen
                    ? <ChevronDown size={15} aria-label="Skjul vejesedler" />
                    : <ChevronRight size={15} aria-label="Vis vejesedler" />}
                </span>
              </button>

              {/* Ekspanderet sektion */}
              {isOpen && (
                <div className="bg-surface-2 border-t border-hairline">

                  {/* a) Timer-sammenligning */}
                  <div className="px-8 py-3">
                    <p className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted mb-xs">Timer</p>
                    <div className="grid gap-xxxs" style={{ gridTemplateColumns: '7rem 5rem 5rem 5rem' }}>
                      {/* Header-row */}
                      <span className="font-inter text-xxs text-text-muted" />
                      <span className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted">Køretid</span>
                      <span className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted">Ventetid</span>
                      <span className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted">Hviletid</span>
                      {/* Chauffør app */}
                      <span className="font-inter text-xxs text-text-muted">Chauffør app</span>
                      <span className="font-inter text-xs tabular-nums text-text-secondary">{r.appKoeretid.toFixed(1)} Timer</span>
                      <span className="font-inter text-xs tabular-nums text-text-secondary">{r.appVentetid.toFixed(1)} Timer</span>
                      <span className="font-inter text-xs tabular-nums text-text-secondary">{r.appHviletid.toFixed(1)} Timer</span>
                      {/* Formand */}
                      <span className="font-inter text-xxs text-text-muted">Formand</span>
                      {/* Køretid formand */}
                      {erAkkord ? (
                        <span className="font-inter text-xs tabular-nums text-text-muted">—</span>
                      ) : (
                        <span className={`font-inter text-xs tabular-nums ${r.koeretid !== r.appKoeretid ? 'text-deep-teal font-semibold' : 'text-text-secondary'}`}>
                          {r.koeretid!.toFixed(1)} Timer
                        </span>
                      )}
                      {/* Ventetid formand */}
                      <span className={`font-inter text-xs tabular-nums ${r.ventetid !== r.appVentetid ? 'text-deep-teal font-semibold' : 'text-text-secondary'}`}>
                        {r.ventetid.toFixed(1)} Timer
                      </span>
                      {/* Hviletid formand */}
                      {erAkkord ? (
                        <span className="font-inter text-xs tabular-nums text-text-muted">—</span>
                      ) : (
                        <span className={`font-inter text-xs tabular-nums ${r.hviletid !== r.appHviletid ? 'text-deep-teal font-semibold' : 'text-text-secondary'}`}>
                          {r.hviletid!.toFixed(1)} Timer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* b) Årsag + kommentar — kun hvis udfyldt */}
                  {(r.aarsag !== null || r.chauffoerKommentar !== null) && (
                    <div className="border-t border-hairline px-8 py-3 flex flex-col gap-xs">
                      {r.aarsag !== null && (
                        <div>
                          <p className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted mb-xxxs">Årsag til ændrede timer</p>
                          <p className="font-inter text-xs text-text-secondary">{r.aarsag}</p>
                        </div>
                      )}
                      {r.chauffoerKommentar !== null && (
                        <div>
                          <p className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted mb-xxxs">Kommentar fra chauffør</p>
                          <p className="font-inter text-xs text-text-secondary">{r.chauffoerKommentar}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* c) Vejesedler */}
                  <div className="border-t border-hairline divide-y divide-hairline">
                    {r.vejesedler.map((v, j) => (
                      <div key={j} className="px-8 py-2 flex items-center gap-sm">
                        <FileCheck2 size={12} className="text-text-muted flex-shrink-0" />
                        <span className="font-inter text-xxs text-text-muted tabular-nums w-10">{v.tidspunkt}</span>
                        <span className="font-inter text-xxs text-text-secondary">{v.produkt}</span>
                        <span className="font-inter text-xxs text-text-muted">·</span>
                        <span className="font-inter text-xxs font-semibold text-text-primary tabular-nums">{v.tons} Tons</span>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total — kun Tons */}
      <div className="px-5 py-3 grid items-center gap-sm bg-surface-2 border-t border-box-outline" style={{ gridTemplateColumns: AFREGNING_GRID }}>
        <span className="font-inter text-xs font-semibold uppercase tracking-wide text-text-muted">Total</span>
        <span className="font-inter text-xs text-text-muted">—</span>
        <span className="font-inter text-xs text-text-muted">—</span>
        <span className="font-inter text-xs text-text-muted">—</span>
        <span className="font-inter text-sm font-semibold text-text-primary tabular-nums">{totalTons} Tons</span>
        <span />
      </div>
    </div>
  )
}
