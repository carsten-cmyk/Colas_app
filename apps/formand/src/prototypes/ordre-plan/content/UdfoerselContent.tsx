import { useState, useMemo, useRef, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Camera, Plus } from 'lucide-react'
import { VejesedlerTable } from '@/components/ui/VejesedlerTable'
import { useRecept } from '@/hooks/useRecept'
import { useVejesedler } from '@/hooks/useVejesedler'
import { INITIAL_RECEPTER } from '@/mocks/recepter'
import { INITIAL_UDLAEGGERE } from '@/mocks/udlaeggere'
import { formatLongDate } from '@/utils/date'
import { clusterEtaper as _clusterEtaper, getMaterielUiState as _getMaterielUiState, transportKey as _transportKey } from '../etape'
import type { Etape, MaterielUiState, MaterielTransportPlan } from '../etape'
import {
  MaterielPaaPladsenTilstand,
  MaterielDvaleTilstand,
} from '../MaterielTilstande'
import type { MaterielEnhed as MaterielEnhedTilstand } from '../MaterielTilstande'
import { formatPhone, toE164 } from '@shared/utils/phone'
import { formatRegnr } from '@shared/utils/regnr'
import type {
  MockPhoto,
  VognmandBekraeftelse,
  VognmandMaterielBekraeftelse,
  MockProduct,
  SamleordreContext,
  EkstraLinje,
  ChauffoerSmsStatus,
  UnderlagType,
  UnderlaegsAarsag,
  MaterielEnhed,
} from '../types'
import { UNDERLAG_OPTIONS, AARSAG_OPTIONS, MATERIEL_ENHEDER } from '../mocks'
import { getEffectiveTons, dateToString, TODAY } from '../utils'
import { OrdredetaljerSection } from '../components/OrdredetaljerSection'
import { EkstraarbejdeBlok } from '../components/EkstraarbejdeBlok'
import { ForCheckbox } from '../components/ForCheckbox'
import { JaNejToggle } from '../components/JaNejToggle'
import { OvrigeOplysningerSkema3a } from '../components/ks/OvrigeOplysningerSkema3a'
import { OvrigeOplysningerSkema } from '../components/ks/OvrigeOplysningerSkema'
import { MksSkema } from '../components/ks/MksSkema'

export function UdfoerselContent({ forundersoegelseFotos, onAddPhotos, vognmandBekraeftelse, vognmandMaterielBekraeftelse, products, isSamleordreMode, samleordreCtx, samleordreTabOrderNr, makeOrdredetaljerCard, renderOrdredetaljerCollapsedPille, selectedDate, onSelectDate, ekstraLinjer, setEkstraLinjer, ekstraSent, setEkstraSent, materielUiState, etaper, transportPlaner }: {
  forundersoegelseFotos: MockPhoto[]
  onAddPhotos: (p: MockPhoto[]) => void
  vognmandBekraeftelse?: VognmandBekraeftelse
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  /** Alle produkter i ordren — bruges til produkt+dato-selector */
  products: MockProduct[]
  /** True når Ordre-plan vises i samleordre-kontekst */
  isSamleordreMode?: boolean
  /** Samleordre-context med children (anchor + andre ordrer) når isSamleordreMode === true */
  samleordreCtx?: SamleordreContext | null
  /** Aktivt ordrenummer i samleordre-tab — bruges til per-child dagsoverblik */
  samleordreTabOrderNr?: string
  /** Factory-funktion til Ordredetaljer-visning — kald med hideTabs=true for at skjule tab-rækken.
   *  cardMode='udfoersel' viser AFLYSNING-cellen i dag-kontekst (selectedDate). */
  makeOrdredetaljerCard: (
    hideTabs?: boolean,
    cardMode?: 'planlaegning' | 'udfoersel',
    udfoerselSelectedDate?: string,
  ) => ReactNode
  /** Renderer kompakt hvid pille der vises når Ordredetaljer-sektionen er collapsed.
   *  Indeholder dato-range, mængde tons og produkt — matcher Forundersøgelse-pillen visuelt. */
  renderOrdredetaljerCollapsedPille: () => ReactNode
  /** Valgt dato — hejst til OrdrePlanScreen-root så Udførsel + Afregning deler state */
  selectedDate: string
  /** Setter for valgt dato — kaldes ved klik på dato-pille */
  onSelectDate: (date: string) => void
  /** Ekstralinjer — løftet til root så AfregningContent kan aflæse dem */
  ekstraLinjer: EkstraLinje[]
  setEkstraLinjer: React.Dispatch<React.SetStateAction<EkstraLinje[]>>
  /** Om ekstraarbejde er sendt (godkendt) — løftet til root */
  ekstraSent: boolean
  setEkstraSent: (b: boolean) => void
  /** Etape-bevidst UX-tilstand for materiel-sektionen — afledt af selectedDate + etaper i root */
  materielUiState: MaterielUiState
  /** Klyngede etaper for ordren (fra root) */
  etaper: Etape[]
  /** Transport-planer keyed på transportKey(resourceId, etapeId) (fra root) */
  transportPlaner: Record<string, MaterielTransportPlan>
}) {
  const setSelectedDate = onSelectDate

  // ── Dagsdata — hardcoded for demo, TODO: hent fra ordre-objekt når Supabase klar ───
  const DEMO_ORDRE_ID = '260423891'
  const DEMO_DATO = new Date().toISOString().slice(0, 10)

  const { recept } = useRecept('82101H') // SMA 11S — TODO: Erstat med Supabase når klar — bruges i spec-grid
  const { vejesedler } = useVejesedler(DEMO_ORDRE_ID, DEMO_DATO)
  // Udlægning-state (tonsAnkommet, forventetUdlagtM2, faktiskRegistrering, gemFaktisk)
  // er løftet til OrdrePlanScreen-root så AfregningContent kan bruge det direkte.

  const [underlaegsType, setUnderlaegsType] = useState<UnderlagType | ''>('asfalt')
  const [underlaegsAndet, setUnderlaegsAndet] = useState('')
  const [tilfredsstillende, setTilfredsstillende] = useState<boolean | null>(null)
  const [underlaegsAarsager, setUnderlaegsAarsager] = useState<Set<UnderlaegsAarsag>>(new Set())
  const [aftaltMed, setAftaltMed] = useState('')
  const [forbehold, setForbehold] = useState('')
  const [saved, setSaved] = useState(false)
  const [forundersoegelseOpen, setForundersoegelseOpen] = useState(false)

  // ── KS-rapportering state ────────────────────────────────────────────────────
  const [ksExpanded, setKsExpanded] = useState(false)
  const [ksActiveTab, setKsActiveTab] = useState<'a3' | 'a4' | 'mks'>('mks')
  // Ekstraarbejde-state er løftet til OrdrePlanScreen-root (deles med AfregningContent via props)

  // ── Samleordre per-ordre vejeseddel-state ────────────────────────────────────
  // Kun aktiv i samleordre-mode: formanden kan logge temperatur + udlægger separat pr. ordre pr. vejeseddel.
  // Default: anchor-ordre (første child med isAnchor). TODO: Erstat med Supabase når klar
  const [vejeseddelSelectedOrdre, setVejeseddelSelectedOrdre] = useState<Record<string, string>>({})
  const [vejeseddelTempPerOrdre, setVejeseddelTempPerOrdre] = useState<Record<string, Record<string, number>>>({})
  const [vejeseddelUdlaeggerPerOrdre, setVejeseddelUdlaeggerPerOrdre] = useState<Record<string, Record<string, string>>>({})

  /** Returnerer aktuelt valgt ordrenummer for en vejeseddel — fallback til anchor-child */
  function getSelectedOrdreForVs(vsId: string): string {
    return (
      vejeseddelSelectedOrdre[vsId] ??
      samleordreCtx?.children.find((c) => c.isAnchor)?.orderNumber ??
      samleordreCtx?.children[0]?.orderNumber ??
      ''
    )
  }

  // Mini-strip: om fuld spec-grid er åben
  const [detailsExpanded, setDetailsExpanded] = useState(true)

  // ── SMS-status state — per regnr (nøgle). Initialiseres fra mock-data.
  // TODO: Erstat med Supabase når klar — confirmed_vehicles[].sms_status pr. (ordre, dag, reg_nr)
  const [smsStatusMap, setSmsStatusMap] = useState<Record<string, ChauffoerSmsStatus>>(() => {
    const map: Record<string, ChauffoerSmsStatus> = {}
    const biler = vognmandBekraeftelse?.biler ?? []
    for (const b of biler) {
      if (!b.er_materiel_bil) {
        map[b.regnr] = b.sms_status ?? 'ikke_sendt'
      }
    }
    return map
  })

  /** Send SMS → sætter status 'sendt' for det givne regnr. */
  function sendSms(regnr: string) {
    setSmsStatusMap(prev => ({ ...prev, [regnr]: 'sendt' }))
  }

  // ── Materiel SMS-status state — pr. chauffør-nøgle (regnr på transport-bilen).
  // Kører samme chauffør flere materiel-enheder, vises kun ÉN knap (konsolideret SMS).
  // Nøgle = regnr (unikt pr. transport-bil; samme bil = samme chauffør for materiel).
  // TODO: Erstat med Supabase når klar — materiel_transport[].sms_status pr. (ordre, dag, regnr)
  const [materielSmsStatusMap, setMaterielSmsStatusMap] = useState<Record<string, ChauffoerSmsStatus>>(() => {
    const map: Record<string, ChauffoerSmsStatus> = {}
    const items = vognmandMaterielBekraeftelse?.items ?? []
    // Første unikke regnr (øverste transport-bil) vises som 'sendt' — demo-default
    let foerste = true
    for (const item of items) {
      if (!(item.regnr in map)) {
        map[item.regnr] = foerste ? 'sendt' : 'ikke_sendt'
        foerste = false
      }
    }
    return map
  })

  /** Send materiel SMS → sætter status 'sendt' for transport-bilens regnr (dækker alle enheder på bilen). */
  function sendMaterielSms(regnr: string) {
    setMaterielSmsStatusMap(prev => ({ ...prev, [regnr]: 'sendt' }))
  }

  // ── Expand-state for tabeller (biler + materiel)
  const [bilerTableExpanded, setBilerTableExpanded] = useState(false)
  const [materielTableExpanded, setMaterielTableExpanded] = useState(false)

  function addEkstraLinje() {
    setEkstraLinjer(prev => [...prev, { id: `el-${Date.now()}`, type: '', beskrivelse: '', antal: 1 }])
  }

  function updateEkstraLinje(id: string, field: keyof EkstraLinje, value: string | number) {
    setEkstraLinjer(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    setEkstraSent(false)
  }

  function removeEkstraLinje(id: string) {
    setEkstraLinjer(prev => prev.filter(l => l.id !== id))
  }

  const PHOTO_COLORS = ['bg-dark-teal/20', 'bg-yellow/20', 'bg-light-aqua/40']

  function toggleAarsag(a: UnderlaegsAarsag) {
    setUnderlaegsAarsager(prev => {
      const next = new Set(prev)
      if (next.has(a)) next.delete(a); else next.add(a)
      return next
    })
    setSaved(false)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const newPhotos: MockPhoto[] = files.map((file, i) => ({
      id: `fo-${Date.now()}-${i}`,
      color: PHOTO_COLORS[(forundersoegelseFotos.length + i) % PHOTO_COLORS.length],
      label: file.name.replace(/\.[^.]+$/, ''),
      source: 'forundersoegelse',
      url: URL.createObjectURL(file),
    }))
    onAddPhotos(newPhotos)
    // Reset så samme fil kan vælges igen
    e.target.value = ''
  }

  // Dato-piller: faktisk-planlagte dage (tonsPlanned > 0 && !cancelled) — ikke contiguous fill.
  // Spejler "Udføres i perioden = kun PLAN-planlagte dage"-reglen (FF Flow 1, LÅST 2026-06-23).
  // TODO: Erstat med Supabase når klar — dage fra plan_dag-tabellen.
  const udfoerselDays = useMemo<string[]>(() => {
    const datoSet = new Set<string>()
    for (const p of products) {
      for (const d of p.days) {
        if (d.tonsPlanned > 0 && !d.cancelled) datoSet.add(d.date)
      }
    }
    return [...datoSet].sort()
  }, [products])

  return (
    <div className="flex flex-col gap-[48px]">

      {/* ── Udføres i perioden — første sektion på Udførsel-mode (flyttet 2026-06-05) ── */}
      {udfoerselDays.length > 0 && (
        <section>
          <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Udføres i perioden</h2>
          <div className="flex items-center gap-xs flex-wrap">
            {udfoerselDays.map(ds => {
              const isSelected = ds === selectedDate
              // Overstået dag = rød skravering så formanden ser at den er passeret
              const isPast = ds < dateToString(TODAY)
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  aria-pressed={isSelected}
                  aria-label={`${formatLongDate(ds)}${isPast ? ' (overstået)' : ''}`}
                  className={[
                    'flex items-center gap-xxxs px-sm py-xs rounded-full font-poppins font-semibold text-sm transition-colors',
                    isSelected
                      ? 'bg-deep-teal text-white shadow-sm'
                      : isPast
                        ? 'bg-white border border-hairline text-text-muted line-through hover:border-dark-teal'
                        : 'bg-white border border-hairline text-text-muted hover:border-dark-teal hover:text-deep-teal',
                  ].join(' ')}
                >
                  {formatLongDate(ds)}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Ordredetaljer-section — identisk med Planlægning-mode ───────
          Indkapslet i OrdredetaljerSection. cardMode='udfoersel' aktiverer
          dag-kontekst i AFLYSNING-cellen via makeOrdredetaljerCard-args. */}
      <OrdredetaljerSection
        expanded={detailsExpanded}
        onToggle={() => setDetailsExpanded(e => !e)}
        renderCard={() => makeOrdredetaljerCard(false, 'udfoersel')}
        renderCollapsedPille={renderOrdredetaljerCollapsedPille}
      />

      {/* ── Status-bokse ────────────────────────────────────────────────
          Kun synlige når Ordredetaljer er expanded.
          Én toggle styrer både Ordredetaljer OG status-boksene. */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      {detailsExpanded && (
      <>
      <div className="flex flex-col gap-xs -mt-[48px]">
        <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Bekræftede biler</h2>
        {/* Alle 7 bokse i ét fælles grid — samme bredde og højde via auto-rows-fr */}
        {(() => {
          // Per-child værdier når i samleordre-mode — fallback til global state for enkelt-ordre
          const activeChild = isSamleordreMode && samleordreCtx
            ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
            : undefined

          const displayBilerBekraeftet = activeChild !== undefined ? activeChild.vognmandBekraeftet : !!vognmandBekraeftelse
          const displayAntalMateriel = activeChild !== undefined ? activeChild.antalMateriel : (vognmandMaterielBekraeftelse?.items.length ?? 0)
          const displayMaterielBekraeftet = activeChild !== undefined ? activeChild.materielBekraeftet : !!(vognmandMaterielBekraeftelse && vognmandMaterielBekraeftelse.items.length > 0)
          // ── Bekræftet detalje (LÅST 2026-06-13) ──────────────────────────
          // Bilbestillingen er en ønskeliste; vognmandens bekræftede data kan afvige.
          // Vises kun i enkelt-ordre (samleordre har ikke per-child bil-liste i mock).
          // TODO: Erstat med Supabase — confirmed_vehicles[] pr. (ordre, dag).
          const optælTyper = (typer: string[]): string => {
            const m = new Map<string, number>()
            typer.forEach(t => m.set(t, (m.get(t) ?? 0) + 1))
            return Array.from(m.entries()).map(([t, n]) => `${n}× ${t}`).join(' · ')
          }
          const byTid = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

          // Biler-boks: asfalt-biler (materiel-biler hører til Materiel-boksen)
          const asfaltBiler = (vognmandBekraeftelse?.biler ?? []).filter(b => !b.er_materiel_bil)
          const bilerTypeTekst = optælTyper(asfaltBiler.map(b => b.biltype))
          const visBilDetalje = activeChild === undefined && displayBilerBekraeftet && asfaltBiler.length > 0

          // Materiel-boks: unik transport-bil pr. reg.nr (én bil kan bære flere enheder)
          const materielItems = vognmandMaterielBekraeftelse?.items ?? []
          const materielTypeTekst = optælTyper(materielItems.map(m => m.transportType))
          const seenRegnr = new Set<string>()
          const materielBilerUnik = materielItems.filter(m => {
            if (seenRegnr.has(m.regnr)) return false
            seenRegnr.add(m.regnr)
            return true
          })
          const materielSorted = [...materielBilerUnik].sort((a, b) => byTid(a.ankomst_plads_tid ?? '', b.ankomst_plads_tid ?? ''))
          const visMaterielDetalje = activeChild === undefined && displayMaterielBekraeftet && materielItems.length > 0

          // Tabel-slice: vis 3 default; knap folder resten ud
          const TABEL_DEFAULT = 3
          const bilerSorted = [...asfaltBiler].sort((a, b) => (a.laes_nummer ?? 99) - (b.laes_nummer ?? 99))
          const bilerVis = bilerTableExpanded ? bilerSorted : bilerSorted.slice(0, TABEL_DEFAULT)
          const materielVis = materielTableExpanded ? materielSorted : materielSorted.slice(0, TABEL_DEFAULT)

          return (
            <div className="flex flex-col gap-sm">
              {/* Biler — tabel i enkelt-ordre bekræftet-tilstand; status-kort ellers */}
              {visBilDetalje ? (
                /* ── Biler-tabel (bekræftet, enkelt-ordre) — FF Trin 7 + 7b (LÅST 2026-06-15) ── */
                <div className="overflow-hidden rounded-xl border border-good/30 bg-good-bg">
                  {/* Tabel-header */}
                  <div className="flex items-center justify-between px-sm py-xs border-b border-good/20">
                    <div className="flex items-center gap-xs">
                      <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Biler</span>
                    </div>
                    <span className="font-poppins font-semibold text-sm text-text-primary">{bilerTypeTekst}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-good/15 bg-good-bg/60">
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Reg.nr</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Biltype</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Chauffør</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Telefon</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Ankomst plads</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Mødetid fabrik</th>
                          <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">SMS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bilerVis.map((b, i) => {
                          const isLast = i === bilerVis.length - 1 && !(!bilerTableExpanded && bilerSorted.length > TABEL_DEFAULT)
                          const smsStatus = smsStatusMap[b.regnr] ?? 'ikke_sendt'
                          const erSendt = smsStatus === 'sendt'
                          return (
                            <tr key={b.regnr} className={isLast ? '' : 'border-b border-good/15'}>
                              <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">{formatRegnr(b.regnr)}</td>
                              <td className="align-middle font-inter text-xs text-text-muted px-xs py-xs whitespace-nowrap">{b.biltype}</td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{b.chauffoer}</td>
                              <td className="align-middle px-xs py-xs">
                                <a
                                  href={`tel:${toE164(b.tlf) ?? b.tlf.replace(/\s/g, '')}`}
                                  className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors whitespace-nowrap"
                                >
                                  {formatPhone(b.tlf)}
                                </a>
                              </td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                                {b.ankomst_plads_tid ?? '—'}
                              </td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                                {b.moedetid_fabrik ?? '—'}
                              </td>
                              <td className="align-middle px-xs py-xs text-right">
                                <span className="inline-flex items-center gap-xxxs justify-end">
                                  {erSendt ? (
                                    <>
                                      <span
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-good bg-good-bg border border-good/40 rounded-md px-xs min-h-[44px] min-w-[44px]"
                                        aria-label={`Ordre sendt til chauffør ${b.chauffoer}`}
                                      >
                                        Ordre sendt til chauffør
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => sendSms(b.regnr)}
                                        aria-label={`Gensend ordre til ${b.chauffoer}`}
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-[44px] min-w-[44px]"
                                      >
                                        Gensend ordre
                                      </button>
                                    </>
                                  ) : smsStatus === 'aendret_siden_afsendelse' ? (
                                    <>
                                      <span
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-warning bg-warning-bg border border-warning/40 rounded-md px-xs min-h-[44px] min-w-[44px]"
                                        aria-label={`Ordre opdateret siden afsendelse — ${b.chauffoer}`}
                                      >
                                        Ordre opdateret
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => sendSms(b.regnr)}
                                        aria-label={`Gensend ordre til ${b.chauffoer}`}
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-[44px] min-w-[44px]"
                                      >
                                        Gensend ordre
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs text-text-muted border border-hairline rounded-md px-xs min-h-[44px] min-w-[44px]"
                                        aria-label={`Ordre afventer afsendelse — ${b.chauffoer}`}
                                      >
                                        Afventer afsendelse
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => sendSms(b.regnr)}
                                        aria-label={`Send ordre til ${b.chauffoer} nu`}
                                        className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-[44px] min-w-[44px]"
                                      >
                                        Send ordre nu
                                      </button>
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Expand-knap — kun synlig når der er >3 biler */}
                  {bilerSorted.length > TABEL_DEFAULT && (
                    <div className="border-t border-good/15 px-xs py-xxxs">
                      <button
                        type="button"
                        onClick={() => setBilerTableExpanded(e => !e)}
                        className="w-full flex items-center justify-center gap-xxxs font-inter text-xxs font-medium text-text-muted hover:text-deep-teal transition-colors min-h-touch"
                        aria-expanded={bilerTableExpanded}
                      >
                        {bilerTableExpanded ? (
                          <>
                            <ChevronUp size={13} aria-hidden="true" /> Vis færre
                          </>
                        ) : (
                          <>
                            <ChevronDown size={13} aria-hidden="true" /> Vis alle ({bilerSorted.length})
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {/* ── Materiel transport — etape-bewidst branch (Round 3 — LÅST 2026-06-23) ─────────
                  'planlaeg' | 'ny-etape' → eksisterende tabel (transport sker denne dag)
                  'paa-pladsen'           → read-only MaterielPaaPladsenTilstand (transport afsluttet)
                  'dvale'                 → MaterielDvaleTilstand (gap mellem etaper)
                  Asfalt-biler-sektionen OVENFOR er urørt — den er IKKE etape-branchet.
                  TODO: Erstat MATERIEL_ENHEDER med Supabase-data når klar. */}
              {(materielUiState === 'paa-pladsen') ? (() => {
                // Find aktiv etape for selectedDate
                const aktivEtape = etaper.find(e => e.dates.includes(selectedDate))
                if (!aktivEtape) return null
                // Map lokale MaterielEnhed → MaterielEnhedTilstand (id, plantNumber, description)
                const tilstandEnheder: MaterielEnhedTilstand[] = MATERIEL_ENHEDER.map((m: MaterielEnhed) => ({
                  id: m.anlaegsNr,
                  plantNumber: m.anlaegsNr,
                  description: m.beskrivelse,
                }))
                return (
                  <MaterielPaaPladsenTilstand
                    resources={tilstandEnheder}
                    etape={aktivEtape}
                    transportPlaner={transportPlaner}
                  />
                )
              })() : (materielUiState === 'dvale') ? (() => {
                // Find næste etapes startdato — vis til formanden hvis planlagt
                const naestEtape = etaper.find(e => e.startDate > selectedDate)
                return (
                  <MaterielDvaleTilstand
                    naestEtapeStartDato={naestEtape?.startDate}
                  />
                )
              })() : (
              /* 'planlaeg' | 'ny-etape' — eksisterende materiel-transport-tabel (uændret) */
              /* Materiel transport — tabel i enkelt-ordre bekræftet-tilstand; status-kort ellers */
              visMaterielDetalje ? (
                /* ── Materiel-tabel (bekræftet, enkelt-ordre) — FF Trin 7 (LÅST 2026-06-15) ── */
                <div className="overflow-hidden rounded-xl border border-good/30 bg-good-bg">
                  <div className="flex items-center justify-between px-sm py-xs border-b border-good/20">
                    <div className="flex items-center gap-xs">
                      <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Materiel transport</span>
                    </div>
                    <span className="font-poppins font-semibold text-sm text-text-primary">{materielTypeTekst}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-good/15 bg-good-bg/60">
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Anlæg</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Beskrivelse</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Transport</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Chauffør</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Telefon</th>
                          <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">Ankomst</th>
                          <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs whitespace-nowrap">SMS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Saml alle items der hører til de synlige transport-biler (én bil kan bære flere anlæg)
                          const synligeRegnr = new Set(materielVis.map(m => m.regnr))
                          const synligeItems = materielItems.filter(m => synligeRegnr.has(m.regnr))
                          // Konsolideringsnøgle = regnr (unikt pr. transport-bil; samme bil = samme chauffør).
                          // SMS-knap vises KUN på første række pr. regnr — øvrige rækker er tom td (rowspan emuleret).
                          const seenSmsRegnr = new Set<string>()
                          return synligeItems.map((m, i) => {
                            const isLast = i === synligeItems.length - 1 && !(!materielTableExpanded && materielSorted.length > TABEL_DEFAULT)
                            // Er dette den første enhed for denne transport-bil (chauffør)?
                            const erFoersteForChauffoer = !seenSmsRegnr.has(m.regnr)
                            if (erFoersteForChauffoer) seenSmsRegnr.add(m.regnr)
                            // SMS-status keyed by regnr (chauffør-niveau)
                            const materielSmsStatus = materielSmsStatusMap[m.regnr] ?? 'ikke_sendt'
                            const erSendt = materielSmsStatus === 'sendt'
                            return (
                              <tr key={m.resourceId} className={isLast ? '' : 'border-b border-good/15'}>
                                <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs whitespace-nowrap">{m.anlaegsNr}</td>
                                <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{m.beskrivelse}</td>
                                <td className="align-middle px-xs py-xs whitespace-nowrap">
                                  <span className="font-inter text-xs tabular-nums text-text-primary">{formatRegnr(m.regnr)}</span>
                                  <span className="font-inter text-xs text-text-muted ml-xxxs">({m.transportType})</span>
                                </td>
                                <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{m.chauffoer}</td>
                                <td className="align-middle px-xs py-xs">
                                  <a
                                    href={`tel:${toE164(m.tlf) ?? m.tlf.replace(/\s/g, '')}`}
                                    className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors whitespace-nowrap"
                                  >
                                    {formatPhone(m.tlf)}
                                  </a>
                                </td>
                                <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs tabular-nums whitespace-nowrap">
                                  {m.ankomst_plads_tid ?? '—'}
                                </td>
                                {/* SMS-kolonne — konsolideret pr. chauffør (regnr-nøgle).
                                    Kun første række pr. chauffør viser knap/pille; øvrige rækker er tomme. */}
                                <td className="align-middle px-xs py-xs text-right">
                                  {erFoersteForChauffoer ? (
                                    <span className="inline-flex items-center gap-xxxs justify-end">
                                      {erSendt ? (
                                        <>
                                          <span
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-good bg-good-bg border border-good/40 rounded-md px-xs min-h-touch min-w-touch"
                                            aria-label={`Ordre sendt til chauffør ${m.chauffoer}`}
                                          >
                                            Ordre sendt til chauffør
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => sendMaterielSms(m.regnr)}
                                            aria-label={`Gensend ordre til ${m.chauffoer}`}
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                          >
                                            Gensend ordre
                                          </button>
                                        </>
                                      ) : materielSmsStatus === 'aendret_siden_afsendelse' ? (
                                        <>
                                          <span
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-warning bg-warning-bg border border-warning/40 rounded-md px-xs min-h-touch min-w-touch"
                                            aria-label={`Ordre opdateret siden afsendelse — ${m.chauffoer}`}
                                          >
                                            Ordre opdateret
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => sendMaterielSms(m.regnr)}
                                            aria-label={`Gensend ordre til ${m.chauffoer}`}
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                          >
                                            Gensend ordre
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <span
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs text-text-muted border border-hairline rounded-md px-xs min-h-touch min-w-touch"
                                            aria-label={`Ordre afventer afsendelse — ${m.chauffoer}`}
                                          >
                                            Afventer afsendelse
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => sendMaterielSms(m.regnr)}
                                            aria-label={`Send ordre til ${m.chauffoer} nu`}
                                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xxs font-semibold text-deep-teal bg-white border border-deep-teal/40 rounded-md px-xs hover:bg-soft-aqua hover:border-deep-teal transition-colors min-h-touch min-w-touch"
                                          >
                                            Send ordre nu
                                          </button>
                                        </>
                                      )}
                                    </span>
                                  ) : null}
                                </td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {materielSorted.length > TABEL_DEFAULT && (
                    <div className="border-t border-good/15 px-xs py-xxxs">
                      <button
                        type="button"
                        onClick={() => setMaterielTableExpanded(e => !e)}
                        className="w-full flex items-center justify-center gap-xxxs font-inter text-xxs font-medium text-text-muted hover:text-deep-teal transition-colors min-h-touch"
                        aria-expanded={materielTableExpanded}
                      >
                        {materielTableExpanded ? (
                          <>
                            <ChevronUp size={13} aria-hidden="true" /> Vis færre
                          </>
                        ) : (
                          <>
                            <ChevronDown size={13} aria-hidden="true" /> Vis alle ({materielSorted.length})
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Materiel status-kort (ikke-bekræftet eller samleordre) — uændret ── */
                <div className={`flex flex-col items-start min-w-0 w-full min-h-[120px] px-sm py-xs rounded-xl border ${displayMaterielBekraeftet ? 'bg-good-bg border-good/30' : 'bg-surface border-hairline'}`}>
                  <div className="w-full flex items-center justify-between gap-xs">
                    <span className="font-inter text-xxs font-medium tracking-widest uppercase text-text-muted">Materiel transport</span>
                    {displayMaterielBekraeftet && (
                      <span className="font-inter text-xxs font-semibold text-good">Bekræftet</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-end pb-xxxs">
                    <span className="font-poppins font-semibold text-xl text-text-primary tabular-nums">{displayAntalMateriel}</span>
                  </div>
                  <span className="font-inter text-xs text-text-muted min-h-[1em]">
                    {displayMaterielBekraeftet ? 'Bekræftet vognmand' : 'Afventer bekræftelse'}
                  </span>
                </div>
              /* visMaterielDetalje-ternary slutter */
              )
              /* planlaeg/ny-etape-branch slutter */
              )}
            </div>
          )
        })()}
        {/* REPLACED: old 2-row layout (inline-flex + DagsoverblikSection) replaced by unified grid above.
              <span>dead_code_placeholder–'}
              </span>
              <span className={`font-inter text-xs ${forundersoegelseForetaget ? 'text-text-muted' : 'text-bad/80'}`}>
                {forundersoegelseForetaget ? (tilfredsstillende ? 'Tilfredsstillende' : 'Ikke tilfredsstillende') : 'Mangler vurdering'}
              </span>
              {/* NOTE:
                {forundersoegelseForetaget ? (tilfredsstillende ? 'Tilfredsstillende' : 'Ikke tilfredsstillende') : ' '}
              </span>
        */}
      </div>

      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <section>
        {/* Header: vis aktiv child-sted i samleordre-mode så formanden ser hvilken ordre detaljer tilhører */}
        <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">
          Forundersøgelse
          {isSamleordreMode && samleordreCtx && (() => {
            const activeChildForHeader = samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
            return activeChildForHeader ? (
              <span className="font-inter text-sm font-normal text-text-muted ml-xs">— {activeChildForHeader.stedLabel}</span>
            ) : null
          })()}
        </h2>
        {/* Hint-banner fjernet — aktiv ordre er synlig via tabs på Ordredetaljer-rækken */}
        <div className={`w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm`}>
          <button
            type="button"
            onClick={() => setForundersoegelseOpen(o => !o)}
            className="w-full flex items-start justify-between px-md py-sm cursor-pointer hover:border-hairline-2 transition-colors"
            aria-expanded={forundersoegelseOpen}
          >
            {/* Collapsed preview — per-child i samleordre-mode, global i enkelt-ordre */}
            {(() => {
              const activeChildForF = isSamleordreMode && samleordreCtx
                ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
                : undefined
              const childDetails = activeChildForF?.forundersoegelseDetails
              // I samleordre-mode bruger vi per-child details til preview; globale felter bruges kun i enkelt-ordre
              const displayUnderlaegsType = childDetails !== undefined ? childDetails.underlaegsType : underlaegsType
              const displayTilfredsstillende = childDetails !== undefined ? childDetails.tilfredsstillende : tilfredsstillende
              const displayPhotoCount = childDetails !== undefined ? childDetails.photoCount : forundersoegelseFotos.length
              const displayComment = childDetails !== undefined ? childDetails.besigtigelseComment : ''
              const displayVurderet = displayUnderlaegsType !== null && displayUnderlaegsType !== undefined && displayUnderlaegsType !== ''
                && displayTilfredsstillende !== null && displayTilfredsstillende !== undefined
              return (
                <>
                  <div className="flex flex-col gap-xxxs items-start">
                    {!forundersoegelseOpen && (
                      <div className="text-xs text-text-muted font-inter">
                        {displayUnderlaegsType ? (
                          <>
                            <span className="font-semibold text-text-secondary">
                              {displayUnderlaegsType === 'asfalt' ? 'Asfalt'
                                : displayUnderlaegsType === 'beton' ? 'Beton'
                                : displayUnderlaegsType === 'grus' ? 'Grus'
                                : displayUnderlaegsType}
                            </span>
                            {' · '}
                            {displayTilfredsstillende === true ? 'Tilfredsstillende' : displayTilfredsstillende === false ? 'Ikke tilfredsstillende' : 'Tilstand ikke vurderet'}
                            {' · '}
                            {displayPhotoCount} {displayPhotoCount === 1 ? 'billede' : 'billeder'}
                            {displayComment ? <> · {displayComment}</> : null}
                            {!childDetails && ekstraLinjer.length > 0 && <> · {ekstraLinjer.length} ekstraarbejde</>}
                          </>
                        ) : (
                          <span className="italic">Ikke udfyldt endnu</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-xs">
                    {!forundersoegelseOpen && (
                      displayVurderet ? (
                        <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-good-bg text-good border border-good/30">
                          Vurderet
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-bad-bg text-bad border border-bad/30">
                          Mangler vurdering
                        </span>
                      )
                    )}
                    {forundersoegelseOpen ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                  </div>
                </>
              )
            })()}
          </button>

        {forundersoegelseOpen && <div className="flex flex-col gap-sm p-md pt-sm">

          {/* ── Række 1: Underlag + Tilstand ─────────────────────── */}
          <div className="grid grid-cols-2 rounded-xl border border-hairline overflow-hidden">

            {/* Underlag dropdown */}
            <div className="p-md">
              <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
                Underlag / Bund
              </p>
              <div className="relative">
                <select
                  value={underlaegsType}
                  onChange={e => { setUnderlaegsType(e.target.value as UnderlagType); setSaved(false) }}
                  className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs pr-[32px] focus:outline-none focus:border-dark-teal transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Vælg underlag...</option>
                  {UNDERLAG_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-xs top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              {underlaegsType === 'andet' && (
                <input
                  type="text"
                  value={underlaegsAndet}
                  onChange={e => { setUnderlaegsAndet(e.target.value); setSaved(false) }}
                  placeholder="Beskriv underlag..."
                  className="mt-xs w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors"
                />
              )}
            </div>

            {/* Tilstand */}
            <div className="p-md">
              <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
                Underlagets tilstand
              </p>
              <div className="flex items-center gap-xs mb-xs">
                <span className="font-inter text-sm text-text-secondary">Tilfredsstillende:</span>
                <JaNejToggle
                  value={tilfredsstillende === true ? 'ja' : tilfredsstillende === false ? 'nej' : null}
                  onChange={v => { setTilfredsstillende(v === 'ja'); setSaved(false) }}
                />
              </div>

              {tilfredsstillende === false && (
                <div className="flex flex-col gap-sm pt-sm">
                  <div>
                    <p className="font-inter text-xxs font-medium text-text-muted mb-xs">Årsag:</p>
                    <div className="grid grid-cols-2 gap-xs">
                      {AARSAG_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-xs cursor-pointer">
                          <ForCheckbox
                            checked={underlaegsAarsager.has(opt.value)}
                            onChange={() => toggleAarsag(opt.value)}
                          />
                          <span className="font-inter text-xs text-text-primary select-none">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={aftaltMed}
                    onChange={e => { setAftaltMed(e.target.value); setSaved(false) }}
                    placeholder="Aftalt med (navn / firma)..."
                    className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Række 2: Forbehold (fuld bredde) ─────────────────── */}
          <div>
            <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-sm">
              Forbehold
            </p>
            <textarea
              value={forbehold}
              onChange={e => { setForbehold(e.target.value); setSaved(false) }}
              rows={3}
              placeholder="Beskriv evt. forbehold for ordren..."
              className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-xl px-sm py-xs focus:outline-none focus:border-dark-teal transition-colors resize-none leading-relaxed mb-xs"
            />
            <div className="flex gap-xs bg-[#F5F9FA] border border-dark-teal/15 rounded-xl px-sm py-xs">
              <span className="font-inter text-xxs font-semibold text-dark-teal uppercase tracking-widest flex-shrink-0 mt-[1px]">Eks.</span>
              <p className="font-inter text-xs text-text-muted leading-relaxed italic">
                Bæreevnen af den eksisterende belægning der efterfølgende kan forårsage sætninger og revnedannelse i den nye asfaltbelægning.
              </p>
            </div>
          </div>

          {/* ── Række 3: Billeder (fuld bredde) ───────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-sm">
              <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest">Billeder</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap gap-xs">
              {forundersoegelseFotos.map(foto => (
                <div
                  key={foto.id}
                  className="w-[76px] h-[76px] rounded-xl border border-hairline overflow-hidden flex-shrink-0"
                >
                  {foto.url ? (
                    <img src={foto.url} alt={foto.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${foto.color} flex flex-col items-center justify-center gap-xxxs`}>
                      <Camera size={14} className="text-text-muted" />
                      <span className="font-inter text-xxs text-text-muted text-center px-xxxs leading-tight">{foto.label}</span>
                    </div>
                  )}
                </div>
              ))}
              <div
                onClick={() => fileInputRef.current?.click()}
                role="button"
                aria-label="Tilføj billede"
                className="w-[76px] h-[76px] rounded-xl border-2 border-dashed border-hairline-2 flex flex-col items-center justify-center gap-xxxs cursor-pointer hover:border-dark-teal hover:bg-[#F5F9FA] transition-colors group flex-shrink-0"
              >
                <Plus size={18} className="text-text-muted group-hover:text-dark-teal transition-colors" />
                <span className="font-inter text-xxs text-text-muted group-hover:text-dark-teal transition-colors leading-tight text-center">
                  Tilføj
                </span>
              </div>
            </div>
          </div>

          {/* ── Ekstraarbejde (delt state — se også MKS-skema) ──────── */}
          <EkstraarbejdeBlok
            linjer={ekstraLinjer}
            onAdd={addEkstraLinje}
            onUpdate={updateEkstraLinje}
            onRemove={removeEkstraLinje}
            sent={ekstraSent}
            onSend={() => { if (ekstraLinjer.length > 0) setEkstraSent(true) }}
            onReset={() => { setEkstraLinjer([]); setEkstraSent(false) }}
            hideSaveFooter
          />

          {/* ── Footer ────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-sm">
            <button
              onClick={() => { setSaved(true); if (ekstraLinjer.length > 0) setEkstraSent(true) }}
              className={[
                'font-inter text-sm font-semibold px-md py-xs rounded-xl transition-all active:scale-[0.98]',
                saved
                  ? 'bg-good text-white cursor-default'
                  : 'bg-yellow text-deep-teal hover:opacity-90',
              ].join(' ')}
            >
              {saved ? 'Gemt' : 'Gem forundersøgelse'}
            </button>
          </div>

        </div>}
        </div>
      </section>

      {/* ── Udlægning ── (flyttet til AfregningContent — vises under Afregning-mode) */}

      {/* ── KS-rapportering ──────────────────────────────────────────────────────
          Conditional: vises kun når mindst ét produkt har entreprisekontrol eller
          temperaturmaaling sat (1 eller 2). Union på tværs af alle produkter —
          strengeste vinder (2 > 1 > undefined).
          TODO: Erstat med Supabase når klar — hent fra PLAN-system pr. produkt
      ─────────────────────────────────────────────────────────────────────────── */}
      {(() => {
        // Beregn union af krav på tværs af alle produkter — strengeste vinder
        const maxEntreprisekontrol = products.reduce<1 | 2 | undefined>((max, p) => {
          if (p.entreprisekontrol === 2) return 2
          if (p.entreprisekontrol === 1 && max !== 2) return 1
          return max
        }, undefined)
        const maxTemperaturmaaling = products.reduce<1 | 2 | undefined>((max, p) => {
          if (p.temperaturmaaling === 2) return 2
          if (p.temperaturmaaling === 1 && max !== 2) return 1
          return max
        }, undefined)

        // Ingen krav → skjul hele sektionen
        if (!maxEntreprisekontrol && !maxTemperaturmaaling) return null

        // Niveau 2 (mindst ét produkt kræver det) → alle 3 tabs
        const showAllTabs = maxEntreprisekontrol === 2 || maxTemperaturmaaling === 2

        return (
          <section>
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">KS-rapportering</h2>
            <div className="w-full bg-surface border border-hairline rounded-2xl shadow-sm overflow-hidden mb-sm">
              <button
                type="button"
                onClick={() => setKsExpanded(o => !o)}
                className="w-full flex items-start justify-between px-md py-sm cursor-pointer hover:border-hairline-2 transition-colors"
                aria-expanded={ksExpanded}
              >
                {/* Venstre: collapsed preview-tekst */}
                <div className="flex flex-col gap-xxxs items-start">
                  {!ksExpanded && (
                    <div className="text-xs text-text-muted font-inter italic">
                      {showAllTabs ? 'A3, A4, MKS skal udfyldes' : 'MKS skal udfyldes'}
                    </div>
                  )}
                </div>

                {/* Højre: status-pille + chevron */}
                <div className="flex items-center gap-xs">
                  {!ksExpanded && (
                    <span className="inline-flex items-center px-sm py-xxxs rounded-full text-xxs font-medium bg-bad-bg text-bad border border-bad/30">
                      Mangler vurdering
                    </span>
                  )}
                  {ksExpanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                </div>
              </button>

            {ksExpanded && (
              <div className="p-md pt-sm">
                {/* Tab-rækken — identisk styling med makeOrdredetaljerCard-tabs (linje 1102-1128) */}
                <div className="inline-flex gap-xxxs">
                  {showAllTabs && (
                    <>
                      <button
                        onClick={() => setKsActiveTab('a3')}
                        aria-pressed={ksActiveTab === 'a3'}
                        className={[
                          'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                          ksActiveTab === 'a3'
                            ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                            : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                        ].join(' ')}
                      >
                        3a
                      </button>
                      <button
                        onClick={() => setKsActiveTab('a4')}
                        aria-pressed={ksActiveTab === 'a4'}
                        className={[
                          'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                          ksActiveTab === 'a4'
                            ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                            : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                        ].join(' ')}
                      >
                        4a
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setKsActiveTab('mks')}
                    aria-pressed={ksActiveTab === 'mks'}
                    className={[
                      'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                      ksActiveTab === 'mks'
                        ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                        : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                    ].join(' ')}
                  >
                    MKS
                  </button>
                </div>

                {/* Tab-content — box-pattern identisk med Udlægning-tab-content */}
                <div className="bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl p-md space-y-md">
                  {ksActiveTab === 'a3' && showAllTabs && (
                    <OvrigeOplysningerSkema3a
                      products={products}
                      selectedDate={selectedDate}
                    />
                  )}
                  {ksActiveTab === 'a4' && showAllTabs && (
                    <OvrigeOplysningerSkema
                      variant="4a"
                      products={products}
                      selectedDate={selectedDate}
                    />
                  )}
                  {ksActiveTab === 'mks' && (
                    <MksSkema
                      products={products}
                      selectedDate={selectedDate}
                      ekstraarbejde={{
                        linjer: ekstraLinjer,
                        onAdd: addEkstraLinje,
                        onUpdate: updateEkstraLinje,
                        onRemove: removeEkstraLinje,
                        sent: ekstraSent,
                        onSend: () => { if (ekstraLinjer.length > 0) setEkstraSent(true) },
                        onReset: () => { setEkstraLinjer([]); setEkstraSent(false) },
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            </div>
          </section>
        )
      })()}
      </>
      )}

      {/* ── Kørsel (synlig overskrift; tidl. "Vejesedler" — datanavnet Vejeseddel beholdes internt) ── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <section>
        <div className="flex items-center justify-between mb-sm">
          <h2 className="font-poppins font-semibold text-xl text-text-primary">Kørsel</h2>
          {/* Kompakt produkt-statusbar — pulje-læs-guard (Carsten 2026-06-05) */}
          {/* Logik: 1 aktivt produkt på dato → vis, 2+ → skjul (pulje-læs-risiko), 0 → skjul */}
          {/* TODO: Erstat med Supabase ordre-estimat pr. dag når klar */}
          {(() => {
            const aktiveProdukter = products.filter((p) =>
              p.days.some((d) => d.date === selectedDate && !d.cancelled)
            )
            if (aktiveProdukter.length !== 1) return null

            const produkt = aktiveProdukter[0]
            const dagsplan = produkt.days.find((d) => d.date === selectedDate && !d.cancelled)
            // effective tons = planlagt + evt. ekstra fra PLAN
            const estimat = dagsplan ? getEffectiveTons(dagsplan) : produkt.tonsTotal
            const udlagt = vejesedler
              .filter((v) => v.receptkode === produkt.recipeCode && v.status === 'udlagt')
              .reduce((sum, v) => sum + (v.tons ?? 0), 0)
            const pct = estimat > 0 ? Math.min(100, Math.round((udlagt / estimat) * 100)) : 0
            const produktNavn = INITIAL_RECEPTER[produkt.recipeCode]?.navn ?? produkt.recipeCode

            return (
              <div className="inline-flex items-center gap-xs bg-surface-2 rounded-full px-md py-xs">
                <span className="font-inter text-xxs font-semibold uppercase tracking-widest text-text-muted">
                  Status
                </span>
                <span className="font-poppins text-xs font-semibold text-text-primary">
                  {produktNavn}
                </span>
                <div className="h-2 w-28 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-good rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-poppins text-xs font-semibold text-text-secondary whitespace-nowrap">
                  {udlagt % 1 === 0 ? udlagt : udlagt.toFixed(1)} Tons af {estimat} Tons · {pct}%
                </span>
              </div>
            )
          })()}
        </div>
        <VejesedlerTable
          vejesedler={vejesedler}
          recepter={INITIAL_RECEPTER}
          minTemperatur={recept?.min_temperatur ?? 140}
          udlaeggerliste={INITIAL_UDLAEGGERE}
          onTemperatur={(vsId, temp) => {
            if (isSamleordreMode && samleordreCtx) {
              // Samleordre-mode: skriv temperatur til den valgte ordre på denne vejeseddel
              const ordreNr = getSelectedOrdreForVs(vsId)
              setVejeseddelTempPerOrdre(prev => ({
                ...prev,
                [vsId]: { ...(prev[vsId] ?? {}), [ordreNr]: temp },
              }))
            }
            // TODO (produktion): skriv retur til PLAN pr. ordre
          }}
          onUdlaegger={(vsId, materielNr) => {
            if (isSamleordreMode && samleordreCtx) {
              // Samleordre-mode: skriv udlægger-valg til den valgte ordre på denne vejeseddel
              const ordreNr = getSelectedOrdreForVs(vsId)
              setVejeseddelUdlaeggerPerOrdre(prev => ({
                ...prev,
                [vsId]: { ...(prev[vsId] ?? {}), [ordreNr]: materielNr },
              }))
            }
            // TODO (produktion): opdater vejeseddel pr. ordre
          }}
          samleordreChildren={
            isSamleordreMode && samleordreCtx && samleordreCtx.children.length > 1
              ? samleordreCtx.children.map(c => ({ orderNumber: c.orderNumber, stedLabel: c.stedLabel }))
              : undefined
          }
          vejeseddelSelectedOrdre={vejeseddelSelectedOrdre}
          onSelectOrdreForVs={(vsId, orderNumber) =>
            setVejeseddelSelectedOrdre(prev => ({ ...prev, [vsId]: orderNumber }))
          }
          vejeseddelTempPerOrdre={vejeseddelTempPerOrdre}
          vejeseddelUdlaeggerPerOrdre={vejeseddelUdlaeggerPerOrdre}
        />
      </section>

      {/* ── Bil- og tonsafregning + Materielafregning ─────────────────────────── */}
      {/* Sektionerne er flyttet til AfregningContent nedenfor (Afregning-mode i toggle). */}

    </div>
  )
}
