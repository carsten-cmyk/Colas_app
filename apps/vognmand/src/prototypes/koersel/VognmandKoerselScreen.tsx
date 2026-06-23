/**
 * PROTOTYPE — Vognmand Kørsel & afregning (fusioneret tidslinje)
 * ÉT skærmbillede pr. ordre: en lodret række af dag-kort.
 * Hvert dag-kort folder ud til bekræftede biler/kørsel; hver bil folder
 * yderligere ud til timer-sammenligning (app vs formand) + vejesedler.
 * Beskeder (dag afsluttet / aflyst / erstatning) vises inline pr. bil.
 * Kontrakt: Docs/Vognmand/Dataudveksling-vognmand.md § "Udvekslings-model".
 * Må ikke importeres i produktionskode.
 */
import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, Factory, Scale, Clock, Truck, AlertTriangle,
  CheckCircle2, CloudRain, RefreshCw, FileCheck2, ArrowDownLeft, ArrowUpRight,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { MOCK_ORDRER } from '@/mocks/ordrer'
import { MOCK_BILER } from '@/mocks/biler'
import { formatDatoMedUgedag } from '@/utils/dato'
import { formatPhone } from '@shared/utils/phone'
import { formatRegnr } from '@shared/utils/regnr'
import type { DagDisponering } from '@/types/vognmand'

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
interface VejeseddelLinje { vejeseddelNr: string; tidspunkt: string; produkt: string; tons: number; tara: number }
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

const AFREGNING_TYPE_BADGE: Record<AfregningType, { cls: string; label: string }> = {
  akkord: { cls: 'bg-soft-aqua/60 text-deep-teal', label: 'Akkord' },
  time:   { cls: 'bg-good-bg text-good',           label: 'Timekørsel' },
}

// ── Inline dag-besked (erstatter den tidligere Udførsel-fane) ────────────────────
const BESKED_META: Record<DagsBesked['type'], { Icon: typeof CheckCircle2; iconCls: string; titel: string }> = {
  dag_afsluttet: { Icon: CheckCircle2,  iconCls: 'text-good',      titel: 'Dag afsluttet' },
  aflyst:        { Icon: CloudRain,     iconCls: 'text-deep-teal', titel: 'Aflyst' },
  erstatning:    { Icon: AlertTriangle, iconCls: 'text-deep-teal', titel: 'Erstatning' },
}

function BeskedLinje({ besked }: { besked: DagsBesked }) {
  const m = BESKED_META[besked.type]
  return (
    <div className="px-5 pb-2 -mt-xs flex items-start gap-xs">
      <m.Icon size={13} className={`${m.iconCls} flex-shrink-0 mt-xxxs`} />
      <p className="font-inter text-xxs text-text-muted leading-relaxed">
        <span className="font-semibold text-text-secondary">{m.titel}:</span> {besked.tekst}{' '}
        <span className="text-text-muted">(Kilde: {besked.kilde === 'chauffør-app' ? 'Chauffør-app' : 'Formand'})</span>
      </p>
    </div>
  )
}

// ── Bil-detaljer (fold-ud niveau 2): timer-sammenligning + vejesedler ────────────
function BilDetaljer({ afregning: r }: { afregning: AfregningRow }) {
  const erAkkord = r.afregningType === 'akkord'
  const fmt = (n: number) => n.toFixed(1).replace('.', ',')
  return (
    <div className="bg-surface-2 border-t border-hairline">

      {/* a) Timer-sammenligning */}
      <div className="px-8 py-3">
        <p className="font-inter text-xxs font-semibold uppercase tracking-wide text-text-muted mb-xs">Timer</p>
        <div className="grid gap-xxxs" style={{ gridTemplateColumns: '7rem 5rem 5rem 5rem' }}>
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
          {erAkkord ? (
            <span className="font-inter text-xs tabular-nums text-text-muted">—</span>
          ) : (
            <span className={`font-inter text-xs tabular-nums ${r.koeretid !== r.appKoeretid ? 'text-deep-teal font-semibold' : 'text-text-secondary'}`}>
              {r.koeretid!.toFixed(1)} Timer
            </span>
          )}
          <span className={`font-inter text-xs tabular-nums ${r.ventetid !== r.appVentetid ? 'text-deep-teal font-semibold' : 'text-text-secondary'}`}>
            {r.ventetid.toFixed(1)} Timer
          </span>
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
        {r.vejesedler.map((v, j) => {
          const netto = v.tons
          const brutto = v.tara + v.tons
          return (
            <div key={j} className="px-8 py-2 flex items-center gap-sm flex-wrap">
              <FileCheck2 size={12} className="text-text-muted flex-shrink-0" />
              <span className="font-inter text-xxs font-semibold text-deep-teal tabular-nums">Vejeseddel {v.vejeseddelNr}</span>
              <span className="font-inter text-xxs text-text-muted">·</span>
              <span className="font-inter text-xxs text-text-muted tabular-nums">{v.tidspunkt}</span>
              <span className="font-inter text-xxs text-text-secondary">{v.produkt}</span>
              <span className="font-inter text-xxs text-text-muted">·</span>
              <span className="font-inter text-xxs font-semibold text-text-primary tabular-nums">
                Tara {fmt(v.tara)} · Brutto {fmt(brutto)} · Netto {fmt(netto)} Tons
              </span>
            </div>
          )
        })}
      </div>

    </div>
  )
}

// ── Bil-række (fold-ud niveau 1) ─────────────────────────────────────────────────
// gridTemplateColumns: bil-ordrenr · reg+biltype · chauffør · tons · status · chevron
const BIL_GRID = '13rem 1fr 1fr 6rem 8rem 2rem'

function BilRow({ bil, afregning, beskeder }: { bil: BekraeftetBil; afregning?: AfregningRow; beskeder: DagsBesked[] }) {
  const [open, setOpen] = useState(false)
  const st = BIL_STATUS[bil.status]
  const afsluttet = bil.status === 'afsluttet'
  const harAfr = !!afregning
  const badge = afregning ? AFREGNING_TYPE_BADGE[afregning.afregningType] : null

  return (
    <div className={afsluttet ? 'opacity-55' : ''}>
      {/* Hoved-række — klikbar hvis der findes afregning */}
      <button
        type="button"
        disabled={!harAfr}
        onClick={() => harAfr && setOpen(o => !o)}
        aria-expanded={harAfr ? open : undefined}
        className={`w-full text-left px-5 py-3 grid items-center gap-sm ${harAfr ? 'hover:bg-surface-2 transition-colors cursor-pointer' : 'cursor-default'}`}
        style={{ gridTemplateColumns: BIL_GRID }}
      >
        {/* Bil-ordrenummer (match-nøgle) */}
        <div>
          <p className="font-inter text-xxs text-text-muted uppercase tracking-wide mb-xxxs">Bil-ordrenummer</p>
          <p className="font-inter text-xs font-semibold text-deep-teal tabular-nums">{bil.bilOrdrenr}</p>
        </div>
        {/* Reelt reg.nr + biltype */}
        <div className="flex items-center gap-xs min-w-0">
          <Truck size={14} className="text-text-muted flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-inter text-xs font-bold text-text-primary tabular-nums">{bil.reelReg ? formatRegnr(bil.reelReg) : 'Afventer retur'}</p>
            <p className="font-inter text-xxs text-text-muted truncate">{bil.biltype}</p>
          </div>
        </div>
        {/* Chauffør */}
        <div className="min-w-0">
          <p className="font-inter text-xs font-medium text-text-secondary truncate">{bil.chauffør}</p>
          <p className="font-inter text-xxs text-text-muted tabular-nums">{formatPhone(bil.mobil)}</p>
        </div>
        {/* Tons (realiseret) */}
        <div>
          {harAfr ? (
            <>
              <p className="font-inter text-xxs text-text-muted uppercase tracking-wide mb-xxxs">Tons</p>
              <p className="font-inter text-sm font-semibold text-text-primary tabular-nums">{afregning!.tons} Tons</p>
            </>
          ) : (
            <span className="font-inter text-sm text-text-muted">—</span>
          )}
        </div>
        {/* Status + afregningstype */}
        <div className="flex flex-col items-start gap-xxxs">
          <span className={`font-inter text-xxs font-semibold px-xs py-xxxs rounded-full ${st.cls}`}>{st.label}</span>
          {badge && <span className={`font-inter text-xxs font-semibold px-xs py-xxs rounded-full ${badge.cls}`}>{badge.label}</span>}
        </div>
        {/* Chevron */}
        <span className="flex items-center justify-center text-text-muted">
          {harAfr && (open
            ? <ChevronDown size={15} aria-label="Skjul timer og vejesedler" />
            : <ChevronRight size={15} aria-label="Vis timer og vejesedler" />)}
        </span>
      </button>

      {/* Inline beskeder for bilen (dag afsluttet / aflyst / erstatning) */}
      {beskeder.map(b => <BeskedLinje key={b.id} besked={b} />)}

      {/* Fold-ud niveau 2 */}
      {harAfr && open && <BilDetaljer afregning={afregning!} />}
    </div>
  )
}

// ── Dag-kort (fold-ud niveau 0) ──────────────────────────────────────────────────
function DagKort({ dag, biler, afregning, beskeder }: {
  dag: DagDisponering
  biler: BekraeftetBil[]
  afregning: AfregningRow[]
  beskeder: DagsBesked[]
}) {
  return (
    <div className="bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">
      {/* Dato */}
      <div className="px-5 pt-3">
        <p className="font-inter text-sm font-semibold text-deep-teal capitalize">{formatDatoMedUgedag(dag.dato)}</p>
      </div>

      {/* Plan-felter + retning */}
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

      {/* Bekræftede biler / kørsel */}
      <SektionsHeader titel="Bekræftede biler · kørsel" retning="retur" transparent fixedWidth />
      <div className="divide-y divide-hairline">
        {biler.map((b, i) => (
          <BilRow
            key={`${b.bilOrdrenr}-${i}`}
            bil={b}
            afregning={b.reelReg ? afregning.find(a => a.reelReg === b.reelReg) : undefined}
            beskeder={b.reelReg ? beskeder.filter(x => x.reelReg === b.reelReg) : []}
          />
        ))}
      </div>
    </div>
  )
}

// ── Hoved-skærm ──────────────────────────────────────────────────────────────────

export function VognmandKoerselScreen() {
  const { ordreId } = useParams<{ ordreId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // Tilbage fører til den visning man kom fra (liste el. kalender) — fallback: liste
  const fromGantt = (location.state as { from?: string } | null)?.from === 'gantt'

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

  // Dagens beskeder (inline pr. bil) — TODO: Erstat med Supabase når klar
  const beskeder: DagsBesked[] = [
    { id: 'b1', type: 'dag_afsluttet', dato: dage[0]?.dato ?? '', reelReg: 'AB54231', chauffør: 'Brian Nielsen', kilde: 'chauffør-app', tekst: 'Chaufføren afsluttede dagen i app’en — bilen er fri og kan disponeres andetsteds.' },
    { id: 'b2', type: 'dag_afsluttet', dato: dage[0]?.dato ?? '', reelReg: 'CV98012', chauffør: 'Mads Christensen', kilde: 'formand', tekst: 'Formanden frigav bilen (sidste læs taget) — bilen er fri og kan disponeres andetsteds.' },
    { id: 'b3', type: 'erstatning', dato: dage[0]?.dato ?? '', reelReg: 'XE32114', chauffør: 'Lars Pedersen', kilde: 'formand', tekst: 'Nedbrud aftalt telefonisk. Erstatningsbil TH11233 sendt via filudveksling på samme bil-ordrenummer.' },
  ]

  // Afregning — pr. chauffør pr. dag — TODO: Erstat med Supabase når klar
  const afregning: AfregningRow[] = [
    {
      chauffør: 'Lars Pedersen', reelReg: 'XE32114', dato: dage[0]?.dato ?? '',
      afregningType: 'time', koeretid: 5.5, ventetid: 1.5, hviletid: 0.75, tons: 96,
      appKoeretid: 5.5, appVentetid: 1.5, appHviletid: 0.75,
      aarsag: null, chauffoerKommentar: null,
      vejesedler: [
        { vejeseddelNr: '25-1101-A', tidspunkt: '07.20', produkt: 'AB 11t', tons: 32, tara: 14.5 },
        { vejeseddelNr: '25-1101-B', tidspunkt: '09.05', produkt: 'AB 11t', tons: 32, tara: 14.5 },
        { vejeseddelNr: '25-1101-C', tidspunkt: '10.40', produkt: 'AB 11t', tons: 32, tara: 14.5 },
      ],
    },
    {
      chauffør: 'Brian Nielsen', reelReg: 'AB54231', dato: dage[0]?.dato ?? '',
      afregningType: 'akkord', koeretid: null, ventetid: 0.5, hviletid: null, tons: 90,
      appKoeretid: 5.0, appVentetid: 0.75, appHviletid: 0.5,
      aarsag: 'Ventetid justeret — kø ved fabrik talte ikke med',
      chauffoerKommentar: 'Lang kø på fabrik om morgenen',
      vejesedler: [
        { vejeseddelNr: '25-1102-A', tidspunkt: '07.35', produkt: 'AB 11t', tons: 30, tara: 14.5 },
        { vejeseddelNr: '25-1102-B', tidspunkt: '09.15', produkt: 'AB 11t', tons: 30, tara: 14.5 },
        { vejeseddelNr: '25-1102-C', tidspunkt: '10.55', produkt: 'AB 11t', tons: 30, tara: 14.5 },
      ],
    },
    {
      chauffør: 'Mads Christensen', reelReg: 'CV98012', dato: dage[0]?.dato ?? '',
      afregningType: 'time', koeretid: 6.0, ventetid: 2.0, hviletid: 0.5, tons: 84,
      appKoeretid: 6.5, appVentetid: 2.0, appHviletid: 0.5,
      aarsag: 'Køretid rettet til aftalt rute-tid',
      chauffoerKommentar: null,
      vejesedler: [
        { vejeseddelNr: '25-1103-A', tidspunkt: '07.50', produkt: 'AB 11t', tons: 28, tara: 14.5 },
        { vejeseddelNr: '25-1103-B', tidspunkt: '09.30', produkt: 'AB 11t', tons: 28, tara: 14.5 },
        { vejeseddelNr: '25-1103-C', tidspunkt: '11.10', produkt: 'AB 11t', tons: 28, tara: 14.5 },
      ],
    },
  ]

  return (
    <div className="bg-page min-h-full">
      <div className="px-md pt-md pb-lg">

          {/* Tilbage */}
          <div className="flex items-center justify-end mb-md">
            <button
              onClick={() => navigate(fromGantt ? '/prototyper/gantt' : '/prototyper/liste')}
              className="flex items-center gap-xxxs px-sm py-xs font-inter text-xs font-medium text-dark-teal hover:text-deep-teal hover:bg-soft-aqua rounded-lg transition-colors"
            >
              <ChevronLeft size={14} />
              {fromGantt ? 'Tilbage til kalender' : 'Tilbage til liste'}
            </button>
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

          {/* ── Fusioneret tidslinje: ét dag-kort pr. dag ── */}
          <div className="flex flex-col gap-md">
            {/* Cutoff-banner */}
            <div className="bg-soft-aqua border border-light-aqua rounded-xl px-md py-xs">
              <p className="font-inter text-xs text-deep-teal">
                Ændringer kan laves frem til <span className="font-semibold">{CUTOFF_LABEL}</span>. Herefter kun telefonisk.
              </p>
            </div>

            {dage.map(dag => (
              <DagKort
                key={dag.dato}
                dag={dag}
                biler={bekraeftet[dag.dato] ?? []}
                afregning={afregning.filter(a => a.dato === dag.dato)}
                beskeder={beskeder.filter(b => b.dato === dag.dato)}
              />
            ))}
          </div>

      </div>
    </div>
  )
}
