import { useState, useMemo, useEffect, type ReactNode } from 'react'
import {
  ChevronDown, ChevronUp, CheckCircle2, Layers, MessageSquare, AlertTriangle,
} from 'lucide-react'
import { FremdriftCard } from '@/components/ui/FremdriftCard'
import { FremdriftInputRow } from '@/components/ui/FremdriftInputRow'
import { useRecept } from '@/hooks/useRecept'
import { INITIAL_RECEPTER } from '@/mocks/recepter'
import { formatLongDate } from '@/utils/date'
import { formatPhone, toE164 } from '@shared/utils/phone'
import { formatRegnr } from '@shared/utils/regnr'
import type { DagsoverblikRegistrering } from '@/types/order'
import type {
  VognmandBekraeftelse,
  VognmandMaterielBekraeftelse,
  DayPlan,
  SamleordreContext,
  MockProduct,
  ChauffoerAfregning,
  AfregningType,
  TimeafregningFraPlan,
  ConfirmedTruck,
} from '../types'
import { MATERIEL_ENHEDER } from '../mocks'
import { formatTimestamp, dateToString, TODAY } from '../utils'
import { OrdredetaljerSection } from '../components/OrdredetaljerSection'

// ─── AfregningContent ─────────────────────────────────────────────────────────
// Vises i Afregning-mode (tre-mode toggle). Indeholder Bil- og tonsafregning
// + Materielafregning (klipset fra UdfoerselContent 2026-05-22).

export function AfregningContent({ vognmandBekraeftelse, todayDay, isSamleordreMode, samleordreCtx, samleordreTabOrderNr,
  recept, tonsAnkommet, forventetUdlagtM2, faktiskRegistrering,
  visUdlaegningInput, onSetVisUdlaegningInput, onGemFaktisk,
  demoTonsIDag, demoArealIDag, demoTykkelse, makeOrdredetaljerCard, renderOrdredetaljerCollapsedPille,
  products, selectedDate, onSelectDate, harEkstraarbejde, biltypeAfregning,
}: {
  vognmandBekraeftelse?: VognmandBekraeftelse
  /** Ubrugt nu — tilgængelig til fremtidig materiel-per-hold expansion */
  vognmandMaterielBekraeftelse?: VognmandMaterielBekraeftelse
  todayDay?: DayPlan
  isSamleordreMode?: boolean
  samleordreCtx?: SamleordreContext | null
  samleordreTabOrderNr?: string
  /** Recept-objekt fra useRecept — bruges til Udlægning-sektion */
  recept?: ReturnType<typeof useRecept>['recept']
  /** Ankomne tons — fra useDagsoverblik */
  tonsAnkommet?: number
  /** Forventet udlagt m² — fra useDagsoverblik */
  forventetUdlagtM2?: number
  /** Faktisk m²/tons-registrering — fra useDagsoverblik */
  faktiskRegistrering?: DagsoverblikRegistrering | null
  /** Viser Udlægning-inputfelter inline */
  visUdlaegningInput?: boolean
  onSetVisUdlaegningInput?: (vis: boolean) => void
  /** Gem faktisk udlagt m² + tons */
  onGemFaktisk?: (m2: number, tons: number) => void
  /** Demo-konstanter — TODO: Erstat med Supabase når klar */
  demoTonsIDag?: number
  demoArealIDag?: number
  demoTykkelse?: number
  /** Renderer Ordredetaljer-spec-grid med tabs — identisk med Planlægning + Udførelse */
  makeOrdredetaljerCard: (
    hideTabs?: boolean,
    cardMode?: 'planlaegning' | 'udfoersel',
    udfoerselSelectedDate?: string,
  ) => ReactNode
  /** Renderer kompakt hvid pille der vises når Ordredetaljer-sektionen er collapsed.
   *  Indeholder dato-range, mængde tons og produkt — matcher Forundersøgelse-pillen visuelt. */
  renderOrdredetaljerCollapsedPille: () => ReactNode
  /** Alle produkter på ordren — bruges til Udlægning per-produkt tabs */
  products?: MockProduct[]
  /** Valgt dato — hejst til OrdrePlanScreen-root så Udførsel + Afregning deler state */
  selectedDate: string
  /** Setter for valgt dato — kaldes ved klik på dato-pille */
  onSelectDate: (date: string) => void
  /** Viser ekstraarbejde-flag i Udlagt-fanen — true når ekstraSent && ekstraLinjer.length > 0 */
  harEkstraarbejde?: boolean
  /** Fase 2: biltype→afregningsform fra Planlægningens kørselOrders for dagen.
   *  Bruges som base-form pr. bil — ovenpå: materiel-override + 1,5-times-override.
   *  Udledt i root fra kørselOrders[dayId] og dagAfregning[dayId]. */
  biltypeAfregning?: Record<string, 'time' | 'akkord'>
}) {
  // ── Ordredetaljer state (separat fra UdfoerselContent's detailsExpanded) ────
  const [detailsExpandedAfregning, setDetailsExpandedAfregning] = useState(true)

  // ── Afregningsperiode dato-piller — faktisk-planlagte dage ──────────────────
  // Matcher Udførsel-mode's sparse "Udføres i perioden"-sektion.
  // Bruger samme selectedDate (hejst til root) så valg deles med Udførsel + Afregning.
  // Spejler "Udføres i perioden = kun PLAN-planlagte dage"-reglen (FF Flow 1).
  // TODO: Erstat med Supabase når klar — dage fra plan_dag-tabellen.
  const afregningDays = useMemo<string[]>(() => {
    const datoSet = new Set<string>()
    for (const p of (products ?? [])) {
      for (const d of p.days) {
        if (d.tonsPlanned > 0 && !d.cancelled) datoSet.add(d.date)
      }
    }
    return [...datoSet].sort()
  }, [products])

  // ── Udlægning per-produkt tabs state ─────────────────────────────────────────
  // Bestemmer hvilke produkter der vises tabs for i Udlægning-sektionen.
  // I samleordre-mode: produkter på den aktuelt valgte child-ordre (samleordreTabOrderNr).
  // I normal mode: produkter på ordren (products-prop).
  const produkterForUdlaegning = (() => {
    if (isSamleordreMode && samleordreCtx && samleordreTabOrderNr) {
      const child = samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
      return child?.products ?? []
    }
    return (products ?? []).map(p => ({ id: p.id, recipeCode: p.recipeCode, recipeName: p.recipeName }))
  })()
  const [selectedAfregningProductId, setSelectedAfregningProductId] = useState<string | null>(
    () => produkterForUdlaegning[0]?.id ?? null
  )

  // Per-produkt udlægnings-mock — TODO: Erstat med Supabase per-produkt udlægnings-data
  // Værdier er prototype-fiktive; produktion henter fra plan_vejebilag per recipeCode+dato
  const perProduktUdlaegning: Record<string, {
    tonsAnkommet: number
    forventetM2: number
    faktiskM2: number | null
    tonsIDag: number
    arealIDag: number
    tykkelseMm: number
    tonsRegistreret4A: number
    tillaegsarealM2: number
    arealRegistreret4A: number
  }> = {
    'p1': { tonsAnkommet: 68, forventetM2: 363, faktiskM2: 355, tonsIDag: 70,  arealIDag: 374,  tykkelseMm: 80, tonsRegistreret4A: 70,  tillaegsarealM2: 12, arealRegistreret4A: 540 },
    'p2': { tonsAnkommet: 243, forventetM2: 2170, faktiskM2: null, tonsIDag: 251, arealIDag: 2241, tykkelseMm: 45, tonsRegistreret4A: 251, tillaegsarealM2: 0,  arealRegistreret4A: 2170 },
    // Samleordre child-produkter (bruger samme id som SamleordreChild.products[].id)
    'sp2': { tonsAnkommet: 94, forventetM2: 839, faktiskM2: null, tonsIDag: 100, arealIDag: 893, tykkelseMm: 45, tonsRegistreret4A: 100, tillaegsarealM2: 8,  arealRegistreret4A: 839 },
    'sp3': { tonsAnkommet: 47, forventetM2: 540, faktiskM2: 510, tonsIDag: 50,  arealIDag: 574,  tykkelseMm: 40, tonsRegistreret4A: 50,  tillaegsarealM2: 0,  arealRegistreret4A: 510 },
  }

  // ── Afregning state ──────────────────────────────────────────────────────────
  const [afregningOpen, setAfregningOpen] = useState<Set<string>>(new Set())
  const [materielAfregningGodkendt, setMaterielAfregningGodkendt] = useState(false)
  /** Per-bil override af afregningsform — key = bil.regnr (samme som afregKey).
   *  Overstyre Planlægningens biltypeAfregning-default. Materiel + 1,5-times-tvang forbliver oven på. */
  const [bilAfregningOverride, setBilAfregningOverride] = useState<Record<string, AfregningType>>({})

  // ── Vejeseddel-fordeling state ───────────────────────────────────────────────
  // TODO: Erstat med Supabase når klar
  const [vejeseddelFordelinger, setVejeseddelFordelinger] = useState<Record<string, { ordre_id: string; tons: number }[]>>(() => {
    const initial: Record<string, { ordre_id: string; tons: number }[]> = {}
    const biler = vognmandBekraeftelse?.biler ?? []
    for (const bil of biler) {
      for (const vs of bil.vejesedler ?? []) {
        if (vs.multilaes_flag) {
          initial[vs.id] = vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
        }
      }
    }
    return initial
  })
  const [vejeseddelExpanded, setVejeseddelExpanded] = useState<Set<string>>(new Set())
  const [vejeseddelVentetidFordelinger, setVejeseddelVentetidFordelinger] = useState<Record<string, Record<string, number>>>({})

  // ── Timer-fordeling state ─────────────────────────────────────────────────────
  // TODO: Erstat med Supabase når klar
  const [bilTimerFordelinger, setBilTimerFordelinger] = useState<Record<string, Record<string, number>>>({})
  // Ventetid fordeles parallelt med køretimer — hviletid distribueres IKKE pr. ordre
  const [bilVentetidFordelinger, setBilVentetidFordelinger] = useState<Record<string, Record<string, number>>>({})
  const [bilTimerFordelingOpen, setBilTimerFordelingOpen] = useState<Set<string>>(new Set())

  // ── PLAN-modal state ─────────────────────────────────────────────────────────
  const [planModalOpen, setPlanModalOpen] = useState(false)

  // ── Materiel timeafregning state ─────────────────────────────────────────────
  const [timeafregningFraPlan, setTimeafregningFraPlan] = useState<TimeafregningFraPlan>('nej')
  // Case A (nej): samlet timer for hele holdpakken
  const [holdpakkeTimer, setHoldpakkeTimer] = useState<number>(7.5)
  const [materielAnvendt, setMaterielAnvendt] = useState<Record<string, boolean>>(
    () => Object.fromEntries(MATERIEL_ENHEDER.map(e => [e.anlaegsNr, true]))
  )
  const [materielTimer, setMaterielTimer] = useState<Record<string, number>>(
    () => ({ '5-0034': 8.5, '3-0112': 7.0, '7-0078': 2.0 })
  )

  // Lokal kopi af afregnings-felter per chauffør-nøgle
  // TODO: Erstat med Supabase når klar
  const [afregningData, setAfregningData] = useState<Record<string, ChauffoerAfregning>>(() => {
    const initial: Record<string, ChauffoerAfregning> = {}
    const bilerData = vognmandBekraeftelse?.biler ?? []
    for (const bil of bilerData) {
      if (bil.afregning) {
        initial[bil.regnr] = {
          chauffoer_navn: bil.chauffoer,
          reg_nr: bil.regnr,
          ...bil.afregning,
        }
      }
    }
    return initial
  })

  // ── Afslut dag state ─────────────────────────────────────────────────────────
  const [dagAfsluttet, setDagAfsluttet] = useState(false)
  const [afslutDagModalOpen, setAfslutDagModalOpen] = useState(false)
  const [valideringsFejl, setValideringsFejl] = useState<string[]>([])

  function validerAfregning(): string[] {
    const fejl: string[] = []

    // 1. Bil- og tonsafregning (Timeafregning): alle chauffør-rækker skal være godkendt
    const bilerData = vognmandBekraeftelse?.biler ?? []
    for (const bil of bilerData) {
      const afregKey = bil.regnr
      const afrData = afregningData[afregKey]

      if (!afrData?.godkendt_af_formand) {
        fejl.push(`Timeafregning — ${bil.chauffoer} (${bil.regnr}) mangler godkendelse`)
        continue
      }

      // Tjek at relevante felter er udfyldt for godkendte rækker
      // Fase 2: base-form = per-bil override → biltype→afregning-map (Planlægning) → afrData → 'time'
      const baseType: AfregningType = bilAfregningOverride[afregKey] ?? biltypeAfregning?.[bil.biltype] ?? afrData?.afregning_type ?? 'time'
      const isTimeForcedBy15Min = !bil.er_materiel_bil
        && baseType === 'akkord'
        && (bil.vejesedler ?? []).some(vs => vs.aflæsset_efter_1_5t)
      const effectiveType: AfregningType =
        bil.er_materiel_bil || isTimeForcedBy15Min ? 'time' : baseType

      if (effectiveType === 'time') {
        if (!afrData?.koretimer && afrData?.koretimer !== 0) {
          fejl.push(`Timeafregning — ${bil.chauffoer} (${bil.regnr}): Timer mangler`)
        }
      } else {
        // akkord: ventetid er påkrævet
        if (!afrData?.ventetid && afrData?.ventetid !== 0) {
          fejl.push(`Timeafregning — ${bil.chauffoer} (${bil.regnr}): Ventetid mangler`)
        }
      }
    }

    // 2. Materielafregning: skal være godkendt
    if (!materielAfregningGodkendt) {
      fejl.push('Materielafregning mangler godkendelse')
    }

    return fejl
  }

  function handleAfslutDag() {
    const fejl = validerAfregning()
    if (fejl.length > 0) {
      setValideringsFejl(fejl)
      setAfslutDagModalOpen(true)
    } else {
      setDagAfsluttet(true)
    }
  }

  function handleRetDag() {
    setDagAfsluttet(false)
  }

  function toggleAfregning(key: string) {
    setAfregningOpen(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  function updateAfregningField(key: string, field: keyof ChauffoerAfregning, value: number | string | boolean | undefined | null) {
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  function godkendAfregning(key: string) {
    const tids = formatTimestamp(new Date())
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], godkendt_af_formand: true, godkendt_tidspunkt: tids },
    }))
    setAfregningOpen(prev => { const next = new Set(prev); next.delete(key); return next })
  }

  function genaabnAfregning(key: string) {
    setAfregningData(prev => ({
      ...prev,
      [key]: { ...prev[key], godkendt_af_formand: false, godkendt_tidspunkt: undefined, auto_godkendt: false },
    }))
    setAfregningOpen(prev => new Set([...prev, key]))
  }

  // ── Auto-godkend hjælpefunktion ──────────────────────────────────────────────
  // FF Flow 4 Trin 5a: Akkord-afregning uden ventetid auto-godkendes.
  // Brugt af både useEffect nedenfor og render-loop (effectiveType).
  // TODO: Erstat med Supabase når klar — skal køre server-side ved opdatering af afregning_data-rækken
  function beregnAfregningEligibility(bil: ConfirmedTruck, afrData: ChauffoerAfregning | undefined, vejeseddelFordelingerMap: Record<string, { ordre_id: string; tons: number }[]>) {
    const bilVejesedler = bil.vejesedler ?? []
    // Fase 2: base-form = per-bil override → biltype→afregning-map (Planlægning) → afrData → 'time'
    const bilKey = bil.regnr
    const baseType: AfregningType = bilAfregningOverride[bilKey] ?? biltypeAfregning?.[bil.biltype] ?? afrData?.afregning_type ?? 'time'
    const isTimeForcedBy15Min = !bil.er_materiel_bil
      && baseType === 'akkord'
      && bilVejesedler.some(vs => vs.aflæsset_efter_1_5t)
    const effectiveType: AfregningType =
      bil.er_materiel_bil || isTimeForcedBy15Min ? 'time' : baseType
    // Fordeling-blokering: multilæs-vejesedler der mangler komplet fordeling
    const manglerFordeling = bilVejesedler.some(vs => {
      if (!vs.multilaes_flag) return false
      const fordeling = vejeseddelFordelingerMap[vs.id]
        ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
      const sum = fordeling.reduce((s, f) => s + f.tons, 0)
      return Math.abs(vs.netto_tons - sum) >= 0.05
    })
    const ventetid = afrData?.ventetid ?? 0
    const kanAutoGodkendes = effectiveType === 'akkord' && ventetid === 0 && !manglerFordeling
    return { effectiveType, manglerFordeling, kanAutoGodkendes }
  }

  // ── Auto-godkend effect ───────────────────────────────────────────────────────
  // Kører hver gang afregningData eller vejeseddelFordelinger ændres.
  // Regler:
  //   1. Sæt godkendt hvis kanAutoGodkendes og ikke allerede godkendt.
  //   2. Fjern godkendelse KUN hvis rækken VAR auto-godkendt og nu ikke længere er eligible
  //      (fx ventetid > 0 er tilføjet). Manuelt godkendte rækker (auto_godkendt falsy) røres ikke.
  // Effect er idempotent: kun rækker der mangler godkendelse/de-godkendelse producerer updates.
  // Efter første kørsel er alle eligible rækker stabiliserede → 0 updates → ingen loop.
  // TODO: Erstat med Supabase når klar — server-side trigger på afregning_data-tabel
  useEffect(() => {
    const bilerData = vognmandBekraeftelse?.biler ?? []
    const updates: Record<string, ChauffoerAfregning> = {}

    for (const bil of bilerData) {
      const key = bil.regnr
      const afrData = afregningData[key]
      if (!afrData) continue
      const { kanAutoGodkendes } = beregnAfregningEligibility(bil, afrData, vejeseddelFordelinger)

      // Ikke auto-godkend mens rækken er ekspanderet (formand er i gang med at redigere)
      const erAaben = afregningOpen.has(key)
      if (kanAutoGodkendes && !afrData.godkendt_af_formand && !erAaben) {
        // Ikke godkendt endnu og ikke åben — auto-godkend
        updates[key] = {
          ...afrData,
          godkendt_af_formand: true,
          godkendt_tidspunkt: formatTimestamp(new Date()),
          auto_godkendt: true,
        }
      } else if (!kanAutoGodkendes && afrData.auto_godkendt && afrData.godkendt_af_formand) {
        // Tidligere auto-godkendt men ikke længere eligible (fx ventetid tilføjet) — fjern godkendelse
        // Manuelt godkendte rækker (auto_godkendt falsy) røres ALDRIG
        updates[key] = {
          ...afrData,
          godkendt_af_formand: false,
          godkendt_tidspunkt: undefined,
          auto_godkendt: false,
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      setAfregningData(prev => ({ ...prev, ...updates }))
    }
  // afregningData i deps er sikkert: effecten er idempotent — første kørsel godkender
  // eligible rækker; anden kørsel finder 0 candidates og kalder ikke setAfregningData.
  // afregningOpen: åbne rækker auto-godkendes ikke mens formand redigerer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afregningData, vejeseddelFordelinger, afregningOpen])

  return (
    <div className="flex flex-col gap-[48px]">

      {/* ── Afregningsperiode — første sektion på Afregning-mode (matcher Udførsel) ── */}
      {/* Kopieret 1:1 fra UdfoerselContent's "Udføres i perioden"-sektion. selectedDate
          er hejst til OrdrePlanScreen-root så valg deles med Udførsel-mode. */}
      {afregningDays.length > 0 && (
        <section>
          <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Afregningsperiode</h2>
          <div className="flex items-center gap-xs flex-wrap">
            {afregningDays.map(ds => {
              const isSelected = ds === selectedDate
              // Overstået dag = rød skravering så formanden ser at den er passeret
              const isPast = ds < dateToString(TODAY)
              return (
                <button
                  key={ds}
                  onClick={() => onSelectDate(ds)}
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

      {/* ── Ordredetaljer ────────────────────────────────────────────── */}
      {/* Separat state (detailsExpandedAfregning) fra Udfoersel-mode — uafhængig toggle */}
      <div>
        <OrdredetaljerSection
          expanded={detailsExpandedAfregning}
          onToggle={() => setDetailsExpandedAfregning(e => !e)}
          renderCard={() => makeOrdredetaljerCard()}
          renderCollapsedPille={renderOrdredetaljerCollapsedPille}
        />

        <hr className="my-lg border-t border-hairline" />

        {/* ── Udlægning — INDE i Ordredetaljer-section som sibling til hr, matcher
            Planlægning + Udførsel-pattern hvor "næste sektion" sidder inden i samme
            section så hr's mb-lg styrer spacing. */}
        {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
        {recept && (() => {
        const fmtTal = (n: number, d = 0) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: d }).format(n)
        // Per-child udlægning i samleordre-mode
        const activeChildForU = isSamleordreMode && samleordreCtx
          ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
          : undefined
        const childUdlaegning = activeChildForU?.udlaegningDetails

        // Per-produkt data: hent fra perProduktUdlaegning mock — fallback til globale demo-props
        // TODO: Erstat med Supabase per-produkt udlægnings-data
        const aktivtProduktId = selectedAfregningProductId ?? produkterForUdlaegning[0]?.id
        const harFlereProdukter = produkterForUdlaegning.length > 1
        const ppu = aktivtProduktId ? perProduktUdlaegning[aktivtProduktId] : undefined
        const TONS_I_DAG  = ppu?.tonsIDag  ?? demoTonsIDag  ?? 0
        const AREAL_I_DAG = ppu?.arealIDag ?? demoArealIDag ?? 0
        const TYKKELSE    = ppu?.tykkelseMm ?? demoTykkelse ?? 0
        // TODO: Erstat med Supabase per-produkt udlægnings-data — pt. bruger valgt produkt
        // sin egen mock; fallback til globale useDagsoverblik-data for p2 (SMA 11S)
        const tonsAnkommetVis    = ppu?.tonsAnkommet    ?? tonsAnkommet    ?? 0
        const forventetUdlagtVis = ppu?.forventetM2     ?? forventetUdlagtM2 ?? 0
        const faktiskUdlagtM2    = ppu?.faktiskM2 !== undefined ? ppu.faktiskM2 : (faktiskRegistrering?.faktiskM2 ?? null)

        const tonsProgress   = TONS_I_DAG  > 0 ? Math.round((tonsAnkommetVis    / TONS_I_DAG)  * 100) : 0
        const forventetProgress = AREAL_I_DAG > 0 ? Math.round((forventetUdlagtVis / AREAL_I_DAG) * 100) : 0
        const faktiskProgress   = faktiskUdlagtM2 !== null && AREAL_I_DAG > 0 ? Math.round((faktiskUdlagtM2 / AREAL_I_DAG) * 100) : 0
        const afvigelse = faktiskUdlagtM2 !== null ? Math.round(faktiskUdlagtM2 - forventetUdlagtVis) : undefined
        const faktiskVariant: 'good' | 'warn' | 'bad' = afvigelse !== undefined && afvigelse < 0 ? 'bad' : 'good'
        const tonsRegistreret4A = ppu?.tonsRegistreret4A
        const tillaegsareal4A = ppu?.tillaegsarealM2
        const arealRegistreret4A = ppu?.arealRegistreret4A

        return (
          <div>
            {/* Produkt-tabs — vises kun hvis 2+ produkter. Pattern identisk med makeOrdredetaljerCard-tabs (linje 1103-1128). */}
            {harFlereProdukter && (
              <div className="inline-flex gap-xxxs">
                {produkterForUdlaegning.map(p => {
                  const isActive = p.id === (selectedAfregningProductId ?? produkterForUdlaegning[0]?.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedAfregningProductId(p.id)}
                      aria-pressed={isActive}
                      className={[
                        'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                        isActive
                          ? 'bg-deep-teal border-deep-teal text-white relative z-10 -mb-[1px]'
                          : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                      ].join(' ')}
                    >
                      {INITIAL_RECEPTER[p.recipeCode]?.navn ?? p.recipeCode}
                    </button>
                  )
                })}
              </div>
            )}
            {/* Indhold-wrapper: border-boks kun ved 2+ produkter (browser-tab-stil) */}
            <div className={harFlereProdukter ? 'bg-white border border-hairline overflow-hidden rounded-tr-xl rounded-b-xl p-md' : ''}>
              <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">
                Udlægning
                {isSamleordreMode && activeChildForU && (
                  <span className="font-inter text-sm font-normal text-text-muted ml-xs">— {activeChildForU.stedLabel}</span>
                )}
              </h2>
              {/* Per-child noter vises som info-banner i samleordre-mode */}
              {isSamleordreMode && childUdlaegning && (
                <div className="flex items-center gap-xs bg-surface border border-hairline rounded-xl px-sm py-xs mb-xs">
                  <div className={`w-[8px] h-[8px] rounded-full flex-shrink-0 ${
                    childUdlaegning.status === 'færdig' ? 'bg-good' :
                    childUdlaegning.status === 'i-gang' ? 'bg-warning' : 'bg-text-muted'
                  }`} />
                  <span className="font-inter text-xs font-medium text-text-primary">
                    {childUdlaegning.status === 'færdig' ? 'Færdig'
                      : childUdlaegning.status === 'i-gang' ? `I gang${childUdlaegning.startTid ? ` · startet ${childUdlaegning.startTid}` : ''}`
                      : 'Ikke startet'}
                  </span>
                  {childUdlaegning.noter && (
                    <span className="font-inter text-xs text-text-muted">· {childUdlaegning.noter}</span>
                  )}
                </div>
              )}
              {/* ── Ekstraarbejde-flag (3a) — vises kun når harEkstraarbejde === true ── */}
              {harEkstraarbejde && (
                <div className="flex justify-end mb-xs">
                  <span className="inline-flex items-center gap-xxs px-sm py-xxxs rounded-full bg-soft-aqua text-deep-teal font-inter text-xxs font-semibold">
                    Der er ekstraarbejder under ydelser
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-xs">
                <FremdriftCard
                  variant="tons-ankommet"
                  label="UDVEJET FABRIK"
                  value={fmtTal(tonsAnkommetVis, 1)}
                  unit=""
                  subtekst={`á ${fmtTal(TONS_I_DAG)} Tons dagens plan`}
                  progress={tonsProgress}
                  progressVariant="good"
                />
                <FremdriftCard
                  variant="forventet-udlagt"
                  label="FORVENTET M2 UDLAGT"
                  value={fmtTal(forventetUdlagtVis)}
                  unit=""
                  subtekst="beregnet fra tons × kg/m²"
                  progress={forventetProgress}
                  progressVariant="good"
                />
                <FremdriftCard
                  variant="faktisk-udlagt"
                  label="FAKTISK M2 UDLAGT"
                  value={faktiskUdlagtM2 !== null ? fmtTal(faktiskUdlagtM2) : '–'}
                  unit=""
                  subtekst={
                    faktiskRegistrering?.gemtTidspunkt
                      ? `senest gemt ${formatTimestamp(faktiskRegistrering.gemtTidspunkt)}`
                      : 'ikke registreret endnu'
                  }
                  progress={faktiskProgress}
                  progressVariant={faktiskVariant}
                  afvigelse={afvigelse}
                />
              </div>
              <div className="mt-xs">
                {/* ── Ekstraarbejde-note (3b) — read-only info-felt ved kvm/tons ── */}
                {harEkstraarbejde && (
                  <div className="rounded-lg border border-hairline bg-surface-2 px-sm py-xs mb-xs font-inter text-xs text-text-secondary">
                    Der er ekstraarbejder under ydelser
                  </div>
                )}
                {!visUdlaegningInput ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSetVisUdlaegningInput?.(true)}
                      className="bg-dark-teal text-white font-inter font-medium text-sm px-sm py-xs rounded-lg min-h-[44px] hover:opacity-90 transition-all"
                    >
                      Registrer udlægning
                    </button>
                  </div>
                ) : (
                  <FremdriftInputRow
                    densitet={recept.densitet}
                    planTykkelse={TYKKELSE}
                    initial={
                      faktiskRegistrering
                        ? { faktiskM2: faktiskRegistrering.faktiskM2!, faktiskTons: faktiskRegistrering.faktiskTons! }
                        : undefined
                    }
                    onSave={({ faktiskM2, faktiskTons }) => {
                      onGemFaktisk?.(faktiskM2, faktiskTons)
                      onSetVisUdlaegningInput?.(false)
                    }}
                    referenceLines={[
                      ...(tonsRegistreret4A !== undefined ? [`${fmtTal(tonsRegistreret4A)} tons registreret i 4A`] : []),
                      ...(arealRegistreret4A !== undefined ? [`${fmtTal(arealRegistreret4A)} m² areal registreret i 4A`] : []),
                      ...(tillaegsareal4A !== undefined && tillaegsareal4A > 0 ? [`${fmtTal(tillaegsareal4A)} m² tillægsareal registreret i 4A`] : []),
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        )
      })()}
      </div>

      {/* ── Bestilte biler (Bil- og tonsafregning) ─────────────────── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      {todayDay && (
        <section>
          <div className="mb-sm">
            <h2 className="font-poppins font-semibold text-xl text-text-primary">Bil- og tonsafregning</h2>
          </div>

          {vognmandBekraeftelse ? (
            <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
              <table className="w-full">
                    <thead>
                      <tr className="border-b border-hairline bg-soft-aqua">
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Reg.nr.</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Chauffør</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Tlf.</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Biltype</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Kategori</th>
                        <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Indeholder</th>
                        <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Afregning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vognmandBekraeftelse.biler.map((bil, i) => {
                        const afregKey = bil.regnr
                        const afrData = afregningData[afregKey]
                        const isOpen = afregningOpen.has(afregKey)
                        const isGodkendt = afrData?.godkendt_af_formand ?? false
                        const bilVejesedlerCollapsed = bil.vejesedler ?? []
                        // 1,5-times-reglen: akkord-bil der ikke er aflæsset inden 1,5t → HELE dagens kørsel er timebaseret.
                        // Reglen er firm — ingen override. Flaget sidder på vejesedlerne (aflæsset_efter_1_5t).
                        // Fase 2: base-form = per-bil override → biltype→afregning-map (Planlægning) → afrData → 'time'
                        const baseType: AfregningType = bilAfregningOverride[afregKey] ?? biltypeAfregning?.[bil.biltype] ?? afrData?.afregning_type ?? 'time'
                        const isTimeForcedBy15Min = !bil.er_materiel_bil
                          && baseType === 'akkord'
                          && bilVejesedlerCollapsed.some(vs => vs.aflæsset_efter_1_5t)
                        // Materiel-biler afregnes ALTID på time. Akkord-biler med 1,5-times-overskridelse tvinges til time.
                        const effectiveType: AfregningType =
                          bil.er_materiel_bil || isTimeForcedBy15Min ? 'time' : baseType
                        const isLast = i === vognmandBekraeftelse.biler.length - 1

                        // ── Fordeling-blokering (collapsed) — Multilæs fjernet som visuel kategori ──────────
                        // harMultilaes bevares til fordeling-logik (mangler fordeling) men vises IKKE som badge
                        const harMultilaes = bilVejesedlerCollapsed.some(vs => vs.multilaes_flag)
                        const harPuljelaes = bilVejesedlerCollapsed.some(vs => vs.puljelaes_flag)
                        // Mangler fordeling: mindst én vejeseddel med multilaes_flag har sum != netto_tons
                        const manglerFordeling = harMultilaes && bilVejesedlerCollapsed.some(vs => {
                          if (!vs.multilaes_flag) return false
                          const fordeling = vejeseddelFordelinger[vs.id]
                            ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                          const sum = fordeling.reduce((s, f) => s + f.tons, 0)
                          return Math.abs(vs.netto_tons - sum) >= 0.05
                        })

                        return (
                          <>
                            <tr key={bil.regnr} className={(!isLast || isOpen || isGodkendt) ? 'border-b border-hairline' : ''}>
                              <td className="align-middle font-inter text-xs font-semibold text-text-primary px-xs py-xs tabular-nums">{formatRegnr(bil.regnr)}</td>
                              <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{bil.chauffoer}</td>
                              <td className="align-middle px-xs py-xs">
                                <a href={`tel:${toE164(bil.tlf) ?? bil.tlf.replace(/\s/g, '')}`} className="font-inter text-xs text-dark-teal hover:text-deep-teal transition-colors">
                                  {formatPhone(bil.tlf)}
                                </a>
                              </td>
                              <td className="align-middle px-xs py-xs">
                                <span className="font-inter text-xs text-text-muted">{bil.biltype}</span>
                              </td>
                              <td className="align-middle px-xs py-xs">
                                {bil.er_materiel_bil ? (
                                  <span className="inline-flex items-center gap-xxxs bg-warn-bg text-text-secondary font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Kørt materiel
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Asfaltkørsel
                                  </span>
                                )}
                              </td>
                              {/* D. Læs-type kolonne — rød "Mangler fordeling" trumfer alt.
                                  Multilæs fjernet som visuel kategori — kolonne viser kun fordeling-status og "Samles på en bil" (puljelæs). */}
                              <td className="align-middle px-xs py-xs">
                                {!isOpen && manglerFordeling ? (
                                  <span className="inline-flex items-center gap-xxxs bg-bad/10 border border-bad text-bad font-inter font-semibold text-xxs px-xs py-xxxs rounded-md">
                                    <AlertTriangle size={10} className="flex-shrink-0" aria-label="Mangler fordeling" />
                                    Mangler fordeling
                                  </span>
                                ) : harPuljelaes ? (
                                  <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider">
                                    Samles på en bil
                                  </span>
                                ) : null}
                              </td>
                              <td className="align-middle px-xs py-xs text-right">
                                {isGodkendt ? (
                                  <span className="inline-flex items-center px-xs py-xxxs rounded-md bg-good text-white font-inter font-semibold text-xs">
                                    {afrData?.auto_godkendt ? 'Afregning auto-godkendt' : 'Afregning godkendt'}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => toggleAfregning(afregKey)}
                                    className="inline-flex items-center gap-xxxs bg-yellow text-deep-teal font-inter font-semibold text-xs py-xxxs px-xs rounded-md hover:opacity-90 transition-opacity"
                                  >
                                    {isOpen ? 'Luk' : 'Lav afregning'}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {(isOpen || isGodkendt) && (() => {
                              // ── Vejeseddel-hjælpere ──────────────────────────────────
                              const bilVejesedler = bil.vejesedler ?? []
                              // Dagens kørte tons = sum af alle vejesedler på bilen
                              const inheritedTons = bilVejesedler.reduce((s, vs) => s + vs.netto_tons, 0)
                              // 1,5-times-reglen er trådt i kraft hvis isTimeForcedBy15Min (beregnet i outer scope).
                              // effectiveType er allerede 'time' i dette tilfælde — vi viser banneret baseret på flaget.
                              const has1_5tRule = isTimeForcedBy15Min
                              const displayType: AfregningType = effectiveType

                              // B. Fordelings-blokering for godkend-knap:
                              // Multilæs-vejesedler der mangler komplet fordeling (sum != netto_tons)
                              // Puljelæs blokerer IKKE — tons går direkte til én ordre
                              const manglerFordelingExpanded = bilVejesedler.some(vs => {
                                if (!vs.multilaes_flag) return false
                                const fordeling = vejeseddelFordelinger[vs.id]
                                  ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                                const sum = fordeling.reduce((s, f) => s + f.tons, 0)
                                return Math.abs(vs.netto_tons - sum) >= 0.05
                              })

                              return (
                              <tr key={`${bil.regnr}-expand`} className={!isLast ? 'border-b border-hairline' : ''}>
                                <td colSpan={7} className="px-xs pb-xs pt-xxxs">
                                  <div className="bg-soft-aqua rounded-lg p-sm mt-xxxs border border-hairline">

                                    {/* ── Afregningsform-override (pr. bil) ───────────── */}
                                    {/* Formanden kan overstyre Planlægningens biltype-default her.
                                        Toggle vises altid, men låses når materiel-tvang eller 1,5-times-regel er aktiv. */}
                                    {(() => {
                                      const isLocked = bil.er_materiel_bil || isTimeForcedBy15Min
                                      const lockReason = bil.er_materiel_bil
                                        ? 'Materiel — altid timeløn'
                                        : 'Over 1,5-times-reglen — tvunget timeløn'
                                      // baseType (beregnet i outer scope) reflekterer override-opslaget INDEN materiel/1,5t-tvang
                                      const toggleValue: AfregningType = baseType
                                      return (
                                        <div className="flex items-center gap-xs mb-sm">
                                          <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">Afregningsform</span>
                                          <div className={[
                                            'flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit',
                                            isLocked ? 'opacity-60' : '',
                                          ].join(' ')}>
                                            {(['akkord', 'time'] as const).map(type => {
                                              const isActive = toggleValue === type
                                              const label = type === 'akkord' ? 'Akkord' : 'Timeløn'
                                              return (
                                                <button
                                                  key={type}
                                                  disabled={isLocked || isGodkendt}
                                                  aria-pressed={isActive}
                                                  onClick={() => !isLocked && !isGodkendt && setBilAfregningOverride(prev => ({ ...prev, [afregKey]: type }))}
                                                  className={[
                                                    'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                                                    isActive
                                                      ? 'bg-dark-teal text-white'
                                                      : 'text-text-muted hover:bg-soft-aqua',
                                                    isLocked ? 'cursor-not-allowed' : '',
                                                  ].join(' ')}
                                                >
                                                  {label}
                                                </button>
                                              )
                                            })}
                                          </div>
                                          {isLocked && (
                                            <span className="font-inter text-xxs text-text-muted italic">{lockReason}</span>
                                          )}
                                        </div>
                                      )
                                    })()}

                                    {/* ── 1,5-times-regel banner (akkord-biler) ──────── */}
                                    {has1_5tRule && (
                                      <div className="inline-flex items-center gap-xs bg-warn-bg border border-yellow px-sm py-xs rounded-lg mb-sm">
                                        <AlertTriangle size={14} className="text-warning flex-shrink-0" />
                                        <span className="font-inter text-xs font-medium text-deep-teal">
                                          1,5-times-reglen trådte i kraft for denne bil
                                        </span>
                                      </div>
                                    )}

                                    {/* ── Afregnings-felter ──────────────────────────── */}
                                    <div className="flex flex-wrap gap-xs items-end">
                                      {displayType === 'time' ? (
                                        <>
                                          <div className="flex flex-col gap-xxxs">
                                            <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">
                                              {bil.er_materiel_bil ? 'Timer' : 'Køretimer'}
                                            </label>
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={afrData?.koretimer ?? ''}
                                              disabled={isGodkendt}
                                              onChange={e => updateAfregningField(afregKey, 'koretimer', parseFloat(e.target.value) || 0)}
                                              className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-xxxs">
                                            <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Ventetid</label>
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={afrData?.ventetid ?? ''}
                                              disabled={isGodkendt}
                                              onChange={e => updateAfregningField(afregKey, 'ventetid', parseFloat(e.target.value) || 0)}
                                              className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                            />
                                          </div>
                                          {/* Hviletid-felt kun for asfalt-biler — ikke relevant for materiel */}
                                          {!bil.er_materiel_bil && (
                                            <div className="flex flex-col gap-xxxs">
                                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Hviletid</label>
                                              <input
                                                type="number"
                                                step="0.5"
                                                value={afrData?.hviletid ?? ''}
                                                disabled={isGodkendt}
                                                onChange={e => updateAfregningField(afregKey, 'hviletid', parseFloat(e.target.value) || 0)}
                                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                              />
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          {/* A. Akkord — Tons arves fra vejesedler (read-only). Label: "Dagens kørte tons" */}
                                          {bilVejesedler.length > 0 ? (
                                            <div className="flex flex-col gap-xxxs">
                                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Dagens kørte tons</label>
                                              <div className="flex items-center gap-xs bg-surface border border-hairline rounded-md px-xs py-xxxs w-fit whitespace-nowrap">
                                                <Layers size={12} className="text-text-muted flex-shrink-0" />
                                                <span className="font-inter text-sm tabular-nums font-semibold text-text-primary">{inheritedTons.toFixed(1).replace('.', ',')} Tons</span>
                                                <span className="font-inter text-xxs text-text-muted">(fra vejesedler)</span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex flex-col gap-xxxs">
                                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Tons kørt</label>
                                              <input
                                                type="number"
                                                value={afrData?.tons_koert ?? ''}
                                                disabled={isGodkendt}
                                                pattern="[0-9]*[.,]?[0-9]*"
                                                onChange={e => {
                                                  // F. Filtrer non-numeric input
                                                  const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                  updateAfregningField(afregKey, 'tons_koert', parseFloat(raw) || 0)
                                                }}
                                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                              />
                                            </div>
                                          )}
                                          {/* A. "Akkord-sats"-blokken er fjernet — økonomi er ikke formands domæne */}
                                          <div className="flex flex-col gap-xxxs">
                                            <label className="font-inter text-xxs text-text-muted uppercase tracking-widest">Ventetid</label>
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={afrData?.ventetid ?? ''}
                                              disabled={isGodkendt}
                                              onChange={e => updateAfregningField(afregKey, 'ventetid', parseFloat(e.target.value) || 0)}
                                              className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-sm tabular-nums w-[120px] focus:outline-none focus:border-dark-teal disabled:opacity-60"
                                            />
                                          </div>
                                        </>
                                      )}

                                      {isGodkendt ? (
                                        <div className="flex flex-col gap-xxxs ml-xs">
                                          <span className="font-inter text-xxs text-text-muted">{afrData?.godkendt_tidspunkt}</span>
                                          <button
                                            onClick={() => genaabnAfregning(afregKey)}
                                            className="font-inter text-xs text-text-muted underline cursor-pointer hover:text-text-primary transition-colors"
                                          >
                                            Genåbn afregning
                                          </button>
                                        </div>
                                      ) : (
                                        // B. Godkend-knap disables med tooltip hvis multilæs-fordeling mangler
                                        <div className="relative self-end" title={manglerFordelingExpanded ? 'Tons skal fordeles først' : undefined}>
                                          <button
                                            onClick={() => { if (!manglerFordelingExpanded) godkendAfregning(afregKey) }}
                                            disabled={manglerFordelingExpanded}
                                            aria-disabled={manglerFordelingExpanded}
                                            className={[
                                              'inline-flex items-center gap-xs font-inter font-medium text-sm px-sm py-xxxs rounded-lg transition-opacity',
                                              manglerFordelingExpanded
                                                ? 'bg-surface border border-hairline text-text-muted cursor-not-allowed opacity-50'
                                                : 'bg-yellow text-deep-teal font-semibold hover:opacity-90',
                                            ].join(' ')}
                                          >
                                            <CheckCircle2 size={14} />
                                            Godkend afregning
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* TODO: Fase 2 — returlæs (manuel formand-registrering) flyttes hertil */}

                                    {/* A. "Beregnet beløb pr. ordre"-sektionen er fjernet — økonomi er ikke formands domæne */}

                                    {/* ── Timer-fordeling (time-biler på samleordre med 2+ children) ── */}
                                    {displayType === 'time' && isSamleordreMode && samleordreCtx && samleordreCtx.children.length >= 2 && (() => {
                                      const koretimer = afrData?.koretimer ?? 0
                                      const ventetid = afrData?.ventetid ?? 0
                                      const isTimerOpen = bilTimerFordelingOpen.has(afregKey)
                                      // Initialisér fordeling: alt på anchor, resten 0
                                      const anchorChild = samleordreCtx.children.find(c => c.isAnchor) ?? samleordreCtx.children[0]
                                      const currentKoretimer: Record<string, number> = bilTimerFordelinger[afregKey]
                                        ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                          c.orderNumber,
                                          c.orderNumber === anchorChild.orderNumber ? koretimer : 0,
                                        ]))
                                      const currentVentetid: Record<string, number> = bilVentetidFordelinger[afregKey]
                                        ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                          c.orderNumber,
                                          c.orderNumber === anchorChild.orderNumber ? ventetid : 0,
                                        ]))
                                      const koretimerSum = Object.values(currentKoretimer).reduce((s, t) => s + t, 0)
                                      const ventetidSum = Object.values(currentVentetid).reduce((s, t) => s + t, 0)
                                      const koretimerRest = koretimer - koretimerSum
                                      const ventetidRest = ventetid - ventetidSum
                                      const koretimerMatch = Math.abs(koretimerRest) < 0.05
                                      const ventetidMatch = Math.abs(ventetidRest) < 0.05

                                      return (
                                        <div className="mt-sm border-t border-hairline pt-sm">
                                          {/* Overskrift + toggle-knap — samme mønster som "Fordel tons"-knap på vejeseddel */}
                                          <div className="flex items-center justify-between mb-xs">
                                            <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">
                                              Fordel timer på ordrer
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => setBilTimerFordelingOpen(prev => {
                                                const next = new Set(prev)
                                                if (next.has(afregKey)) next.delete(afregKey); else next.add(afregKey)
                                                return next
                                              })}
                                              className="inline-flex items-center gap-xxxs font-inter text-xs text-deep-teal font-semibold hover:opacity-80 transition-opacity whitespace-nowrap min-h-[28px] px-xs"
                                            >
                                              {isTimerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                              {isTimerOpen ? 'Skjul' : 'Fordel timer'}
                                            </button>
                                          </div>

                                          {isTimerOpen && (
                                            <div className="bg-surface border border-hairline rounded-md overflow-hidden">
                                              <div className="px-xs pb-xs pt-xs bg-soft-aqua">
                                                {/* Kolonne-labels */}
                                                <div className="flex items-center gap-xs mb-xxxs">
                                                  <div className="w-2 h-2 flex-shrink-0" />
                                                  <span className="font-inter text-xs flex-1 min-w-0" />
                                                  <span className="font-inter text-xxs text-text-muted uppercase tracking-widest w-[90px] text-center">Køretimer</span>
                                                  <span className="font-inter text-xxs text-text-muted uppercase tracking-widest w-[90px] text-center">Ventetid</span>
                                                </div>
                                                <div className="flex flex-col gap-xs">
                                                  {samleordreCtx.children
                                                    .slice()
                                                    .sort((a, b) => (a.isAnchor ? -1 : b.isAnchor ? 1 : 0))
                                                    .map((child) => {
                                                      const childKoretimer = currentKoretimer[child.orderNumber] ?? 0
                                                      const childVentetid = currentVentetid[child.orderNumber] ?? 0
                                                      return (
                                                        <div key={child.orderNumber} className="flex items-center gap-xs">
                                                          {/* Anchor-markering: gul prik — præcis som tons-fordeling */}
                                                          <div className={[
                                                            'w-2 h-2 rounded-full flex-shrink-0',
                                                            child.isAnchor ? 'bg-yellow' : 'bg-hairline-2',
                                                          ].join(' ')} title={child.isAnchor ? 'Anchor-ordre' : ''} />
                                                          <span className={[
                                                            'font-inter text-xs flex-1 min-w-0 truncate',
                                                            child.isAnchor ? 'font-semibold text-text-primary' : 'text-text-secondary',
                                                          ].join(' ')}>
                                                            {child.orderNumber} · {child.stedLabel}
                                                          </span>
                                                          {/* Køretimer-input */}
                                                          <input
                                                            type="number"
                                                            value={childKoretimer}
                                                            disabled={isGodkendt}
                                                            step="0.5"
                                                            pattern="[0-9]*[.,]?[0-9]*"
                                                            onChange={e => {
                                                              const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                              const newVal = parseFloat(raw) || 0
                                                              setBilTimerFordelinger(prev => {
                                                                const current = prev[afregKey]
                                                                  ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                                                    c.orderNumber,
                                                                    c.orderNumber === anchorChild.orderNumber ? koretimer : 0,
                                                                  ]))
                                                                return { ...prev, [afregKey]: { ...current, [child.orderNumber]: newVal } }
                                                              })
                                                            }}
                                                            className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                            aria-label={`Køretimer til ${child.orderNumber} · ${child.stedLabel}`}
                                                          />
                                                          {/* Ventetid-input */}
                                                          <input
                                                            type="number"
                                                            value={childVentetid}
                                                            disabled={isGodkendt}
                                                            step="0.5"
                                                            pattern="[0-9]*[.,]?[0-9]*"
                                                            onChange={e => {
                                                              const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                              const newVal = parseFloat(raw) || 0
                                                              setBilVentetidFordelinger(prev => {
                                                                const current = prev[afregKey]
                                                                  ?? Object.fromEntries(samleordreCtx.children.map(c => [
                                                                    c.orderNumber,
                                                                    c.orderNumber === anchorChild.orderNumber ? ventetid : 0,
                                                                  ]))
                                                                return { ...prev, [afregKey]: { ...current, [child.orderNumber]: newVal } }
                                                              })
                                                            }}
                                                            className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                            aria-label={`Ventetid til ${child.orderNumber} · ${child.stedLabel}`}
                                                          />
                                                        </div>
                                                      )
                                                    })}
                                                </div>
                                                {/* To sum-counters — køretimer og ventetid hver for sig */}
                                                <div className="flex justify-end gap-md mt-xs">
                                                  <span className={[
                                                    'font-inter text-xs tabular-nums font-semibold',
                                                    koretimerMatch ? 'text-good' : 'text-bad',
                                                  ].join(' ')}>
                                                    {koretimerMatch ? (
                                                      <>Køretimer: {koretimerSum.toFixed(1)}/{koretimer.toFixed(1)} Timer</>
                                                    ) : (
                                                      <>Køretimer: {koretimerSum.toFixed(1)}/{koretimer.toFixed(1)} Timer (rest {koretimerRest > 0 ? '+' : ''}{koretimerRest.toFixed(1)})</>
                                                    )}
                                                  </span>
                                                  <span className={[
                                                    'font-inter text-xs tabular-nums font-semibold',
                                                    ventetidMatch ? 'text-good' : 'text-bad',
                                                  ].join(' ')}>
                                                    {ventetidMatch ? (
                                                      <>Ventetid: {ventetidSum.toFixed(1)}/{ventetid.toFixed(1)} Timer</>
                                                    ) : (
                                                      <>Ventetid: {ventetidSum.toFixed(1)}/{ventetid.toFixed(1)} Timer (rest {ventetidRest > 0 ? '+' : ''}{ventetidRest.toFixed(1)})</>
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })()}

                                    {/* ── Vejesedler under afregnings-felterne ─────── */}
                                    {/* Alle vejesedler rendres ens — badgen signalerer "Samles på en bil" (puljelæs). Multilæs fjernet som visuel kategori. Ingen gruppering. */}
                                    {bilVejesedler.length > 0 && (
                                      <div className="mt-sm border-t border-hairline pt-sm">
                                        <span className="font-inter text-xxs text-text-muted uppercase tracking-widest block mb-xs">Vejesedler</span>
                                        <div className="flex flex-col gap-xs">

                                          {bilVejesedler.map(vs => {
                                            const isVsExpanded = vejeseddelExpanded.has(vs.id)
                                            // Fordeling-state for multilæs: fra lokal state eller pre_fordeling
                                            const fordeling = vejeseddelFordelinger[vs.id]
                                              ?? vs.pre_fordeling.map(pf => ({ ordre_id: pf.ordre_id, tons: pf.tons }))
                                            const fordelingSum = fordeling.reduce((s, f) => s + f.tons, 0)
                                            const rest = vs.netto_tons - fordelingSum
                                            const sumMatch = Math.abs(rest) < 0.05

                                            return (
                                              <div key={vs.id} className="bg-surface border border-hairline rounded-md overflow-hidden">
                                                {/* Vejeseddel-række — grid med kolonner der aligner badge med "Indeholder"-kolonnen og Fordel-knap med "Afregning"-kolonnen */}
                                                <div
                                                  className="grid items-center gap-xs px-xs py-xxxs"
                                                  style={{ gridTemplateColumns: 'minmax(140px, auto) 1fr 140px 140px' }}
                                                >
                                                  <div className="flex items-center gap-xs min-w-0">
                                                    <span className="font-inter text-xs font-semibold text-text-primary tabular-nums">{vs.vejeseddelNr}</span>
                                                    <span className="font-inter text-xs font-semibold text-text-primary tabular-nums">{vs.product_code}</span>
                                                    <span className="font-inter text-xs text-text-muted truncate">{vs.product_name}</span>
                                                  </div>
                                                  <div className="flex items-center justify-end gap-md tabular-nums whitespace-nowrap">
                                                    <span className="font-inter text-xs text-text-muted">Tara <span className="text-text-secondary">{vs.tara_tons.toFixed(1).replace('.', ',')}</span></span>
                                                    <span className="font-inter text-xs text-text-muted">Brutto <span className="text-text-secondary">{(vs.tara_tons + vs.netto_tons).toFixed(1).replace('.', ',')}</span></span>
                                                    <span className="font-inter text-xs text-text-muted">Netto <span className="font-semibold text-text-primary">{vs.netto_tons.toFixed(1).replace('.', ',')} Tons</span></span>
                                                  </div>
                                                  {/* Badge alignet med "Indeholder"-kolonnen */}
                                                  <div className="w-fit">
                                                    {/* Multilæs fjernet som visuel kategori — kun puljelæs ("Samles på en bil") vises */}
                                                    {vs.puljelaes_flag && (
                                                      <span className="inline-flex items-center gap-xxxs bg-soft-aqua text-deep-teal font-inter font-semibold text-xxs px-xs py-xxxs rounded-md uppercase tracking-wider whitespace-nowrap">
                                                        Samles på en bil
                                                      </span>
                                                    )}
                                                  </div>
                                                  {/* Fordel-knap alignet med "Afregning"-kolonnen */}
                                                  <div>
                                                    {vs.multilaes_flag && (
                                                      <button
                                                        type="button"
                                                        onClick={() => setVejeseddelExpanded(prev => {
                                                          const next = new Set(prev)
                                                          if (next.has(vs.id)) next.delete(vs.id); else next.add(vs.id)
                                                          return next
                                                        })}
                                                        className="inline-flex items-center gap-xxxs font-inter text-xs text-deep-teal font-semibold hover:opacity-80 transition-opacity whitespace-nowrap min-h-[28px] px-xs"
                                                      >
                                                        {isVsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        Fordel tons og timer
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Fordeling-expander — multilaes_flag er dataflag, badge er fjernet som visuel kategori */}
                                                {vs.multilaes_flag && isVsExpanded && (
                                                  <div className="border-t border-hairline px-xs pb-xs pt-xs bg-soft-aqua">
                                                    <div className="flex flex-col gap-xs">
                                                      {vs.pre_fordeling
                                                        .sort((a, b) => (a.is_anchor ? -1 : b.is_anchor ? 1 : 0))
                                                        .map((pf, idx) => {
                                                          const currentTons = fordeling.find(f => f.ordre_id === pf.ordre_id)?.tons ?? 0
                                                          return (
                                                            <div key={pf.ordre_id} className="flex items-center gap-xs">
                                                              {/* Anchor-markering: gul prik */}
                                                              <div className={[
                                                                'w-2 h-2 rounded-full flex-shrink-0',
                                                                pf.is_anchor ? 'bg-yellow' : 'bg-hairline-2',
                                                              ].join(' ')} title={pf.is_anchor ? 'Primær ordre' : ''} />
                                                              <span className={[
                                                                'font-inter text-xs flex-1 min-w-0 truncate',
                                                                idx === 0 ? 'font-semibold text-text-primary' : 'text-text-secondary',
                                                              ].join(' ')}>
                                                                {pf.ordre_label}
                                                              </span>
                                                              {/* F. Input-felter: ingen stepper-arrows, numeric-only filter */}
                                                              <input
                                                                type="number"
                                                                value={currentTons}
                                                                disabled={isGodkendt}
                                                                pattern="[0-9]*[.,]?[0-9]*"
                                                                onChange={e => {
                                                                  const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                                  const newTons = parseFloat(raw) || 0
                                                                  setVejeseddelFordelinger(prev => {
                                                                    const current = prev[vs.id] ?? vs.pre_fordeling.map(p => ({ ordre_id: p.ordre_id, tons: p.tons }))
                                                                    return {
                                                                      ...prev,
                                                                      [vs.id]: current.map(f =>
                                                                        f.ordre_id === pf.ordre_id ? { ...f, tons: newTons } : f
                                                                      ),
                                                                    }
                                                                  })
                                                                }}
                                                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                aria-label={`Tons til ${pf.ordre_label}`}
                                                              />
                                                              <span className="font-inter text-xs text-text-muted">Tons</span>
                                                              <input
                                                                type="number"
                                                                value={vejeseddelVentetidFordelinger[vs.id]?.[pf.ordre_id] ?? 0}
                                                                disabled={isGodkendt}
                                                                pattern="[0-9]*[.,]?[0-9]*"
                                                                onChange={e => {
                                                                  const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                                                                  const newTimer = parseFloat(raw) || 0
                                                                  setVejeseddelVentetidFordelinger(prev => ({
                                                                    ...prev,
                                                                    [vs.id]: {
                                                                      ...(prev[vs.id] ?? {}),
                                                                      [pf.ordre_id]: newTimer,
                                                                    },
                                                                  }))
                                                                }}
                                                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[90px] text-right focus:outline-none focus:border-dark-teal disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                aria-label={`Ventetid til ${pf.ordre_label}`}
                                                              />
                                                              <span className="font-inter text-xs text-text-muted">Timer</span>
                                                            </div>
                                                          )
                                                        })}
                                                    </div>
                                                    {/* E. Sum-counter: til højre under det sidste input-felt */}
                                                    <div className="flex justify-end mt-xs gap-md">
                                                      {/* Tons sum */}
                                                      <span className={[
                                                        'font-inter text-xs tabular-nums font-semibold',
                                                        sumMatch ? 'text-good' : 'text-bad',
                                                      ].join(' ')}>
                                                        {sumMatch ? (
                                                          <>Sum: {fordelingSum.toFixed(1)}/{vs.netto_tons.toFixed(1)} Tons</>
                                                        ) : (
                                                          <>Sum: {fordelingSum.toFixed(1)}/{vs.netto_tons.toFixed(1)} Tons (rest {rest > 0 ? '+' : ''}{rest.toFixed(1)} Tons)</>
                                                        )}
                                                      </span>
                                                      {/* Ventetid sum */}
                                                      {(() => {
                                                        const ventetidMap = vejeseddelVentetidFordelinger[vs.id] ?? {}
                                                        const ventetidSum = vs.pre_fordeling.reduce((s, pf) => s + (ventetidMap[pf.ordre_id] ?? 0), 0)
                                                        const totalVentetid = afrData?.ventetid ?? 0
                                                        const ventetidMatch = Math.abs(ventetidSum - totalVentetid) < 0.05
                                                        const ventetidRest = totalVentetid - ventetidSum
                                                        return (
                                                          <span className={[
                                                            'font-inter text-xs tabular-nums font-semibold',
                                                            ventetidMatch ? 'text-good' : 'text-bad',
                                                          ].join(' ')}>
                                                            {ventetidMatch ? (
                                                              <>Ventetid: {ventetidSum.toFixed(1)}/{totalVentetid.toFixed(1)} Timer</>
                                                            ) : (
                                                              <>Ventetid: {ventetidSum.toFixed(1)}/{totalVentetid.toFixed(1)} Timer (rest {ventetidRest > 0 ? '+' : ''}{ventetidRest.toFixed(1)} Timer)</>
                                                            )}
                                                          </span>
                                                        )
                                                      })()}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Chauffør-kommentar læs-only */}
                                    {afrData?.chauffoer_kommentar && (
                                      <div className="flex items-start gap-xs bg-warn-bg p-xs rounded-md mt-sm">
                                        <MessageSquare size={13} className="text-text-secondary flex-shrink-0 mt-[1px]" />
                                        <span className="font-inter text-xs italic text-text-secondary">{afrData.chauffoer_kommentar}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              )
                            })()}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
              {/* ── Subtotaler pr. afregningsform ─────────────────────────────────────── */}
              {/* Beregnes via beregnAfregningEligibility (single source of truth for effectiveType). */}
              {/* Reagerer automatisk når per-bil override eller 1,5-times-regel ændres. */}
              {/* Komponenter summeres separat: akkord→(tons, ventetid) / time→(køretimer, ventetid, hviletid) */}
              {(() => {
                const fmtTal = (n: number, d = 0) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: d }).format(n)
                let akkordBiler = 0
                let akkordTons = 0
                let akkordVentetid = 0
                let timeBiler = 0
                let timeKoretimer = 0
                let timeVentetid = 0
                let timeHviletid = 0
                for (const bil of vognmandBekraeftelse.biler) {
                  const afrData = afregningData[bil.regnr]
                  const { effectiveType } = beregnAfregningEligibility(bil, afrData, vejeseddelFordelinger)
                  if (effectiveType === 'akkord') {
                    akkordBiler++
                    akkordTons += (bil.vejesedler ?? []).reduce((s, vs) => s + vs.netto_tons, 0)
                    akkordVentetid += afrData?.ventetid ?? 0
                  } else {
                    timeBiler++
                    timeKoretimer += afrData?.koretimer ?? 0
                    timeVentetid += afrData?.ventetid ?? 0
                    timeHviletid += afrData?.hviletid ?? 0
                  }
                }
                return (
                  <div className="flex flex-wrap gap-xs px-xs py-xs border-t border-hairline bg-surface-2">
                    {/* Akkord-pille: tons + ventetid */}
                    <span className="inline-flex flex-wrap items-center gap-xs px-sm py-xxxs rounded-lg bg-surface border border-hairline font-inter text-xs text-deep-teal">
                      <span className="font-semibold">Akkord</span>
                      <span className="text-text-muted">·</span>
                      <span>{akkordBiler} {akkordBiler === 1 ? 'bil' : 'biler'}</span>
                      <span className="text-text-muted">·</span>
                      <span>{fmtTal(akkordTons, 1)} Tons</span>
                      <span className="text-text-muted">·</span>
                      <span>Ventetid {fmtTal(akkordVentetid, 1)} Timer</span>
                    </span>
                    {/* Time-pille: køretimer + ventetid + hviletid hver for sig */}
                    <span className="inline-flex flex-wrap items-center gap-xs px-sm py-xxxs rounded-lg bg-surface border border-hairline font-inter text-xs text-text-secondary">
                      <span className="font-semibold">Time</span>
                      <span className="text-text-muted">·</span>
                      <span>{timeBiler} {timeBiler === 1 ? 'bil' : 'biler'}</span>
                      <span className="text-text-muted">·</span>
                      <span>Køretimer {fmtTal(timeKoretimer, 1)}</span>
                      <span className="text-text-muted">·</span>
                      <span>Ventetid {fmtTal(timeVentetid, 1)}</span>
                      <span className="text-text-muted">·</span>
                      <span>Hviletid {fmtTal(timeHviletid, 1)} Timer</span>
                    </span>
                  </div>
                )
              })()}
            </div>
          ) : (
            <p className="font-inter text-xs text-text-muted px-sm pb-sm">
              Bilbestillingen er sendt — vognmanden disponerer og bekræfter snarest.
            </p>
          )}
        </section>
      )}

      {/* ── Materiel ─────────────────────────────────────────────── */}
      {/* TODO (produktion): Sektion (Materielafregning) filtreres på (selectedProductId, selectedDate) */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-sm mb-sm">
          <div className="flex items-center gap-xs">
            <h2 className="font-poppins font-semibold text-xl text-text-primary">Materielafregning</h2>
            {materielAfregningGodkendt && (
              <span className="inline-flex items-center bg-good text-white font-inter font-semibold text-xs px-sm py-xxxs rounded-full">
                Afregning godkendt
              </span>
            )}
            {/* TODO: Fjernes — kun til demo. I produktion kommer feltet fra PLAN */}
            <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">Demo:</span>
            {(['nej', 'ja'] as TimeafregningFraPlan[]).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setTimeafregningFraPlan(v)}
                className={[
                  'font-inter text-xs px-xs py-xxxs rounded-full border transition-colors',
                  timeafregningFraPlan === v
                    ? 'bg-deep-teal text-white border-deep-teal font-semibold'
                    : 'bg-surface text-text-secondary border-hairline hover:border-dark-teal',
                ].join(' ')}
              >
                Timeafregning: {v === 'ja' ? 'Ja' : 'Nej'}
              </button>
            ))}
          </div>
        </div>

        {!materielAfregningGodkendt && (
          <div className="overflow-hidden rounded-lg border border-hairline bg-surface mb-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-soft-aqua">
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Anlæg</th>
                    <th className="text-left font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">Beskrivelse</th>
                    <th className="text-right font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest px-xs py-xxxs">
                      {timeafregningFraPlan === 'nej' ? 'Anvendt' : 'Timer brugt'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MATERIEL_ENHEDER.map((enhed, i) => {
                    const isLast = i === MATERIEL_ENHEDER.length - 1
                    return (
                      <tr
                        key={enhed.anlaegsNr}
                        className={!isLast ? 'border-b border-hairline' : ''}
                      >
                        <td className="align-middle font-inter text-xs font-semibold text-text-primary tabular-nums px-xs py-xs">{enhed.anlaegsNr}</td>
                        <td className="align-middle font-inter text-xs text-text-primary px-xs py-xs">{enhed.beskrivelse}</td>
                        <td className="align-middle px-xs py-xs text-right">
                          {timeafregningFraPlan === 'nej' ? (
                            // Case A: toggle switch
                            <div className="flex justify-end">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={materielAnvendt[enhed.anlaegsNr] ?? true}
                                aria-label={`${enhed.beskrivelse} anvendt`}
                                onClick={() =>
                                  setMaterielAnvendt(prev => ({
                                    ...prev,
                                    [enhed.anlaegsNr]: !(prev[enhed.anlaegsNr] ?? true),
                                  }))
                                }
                                className={[
                                  'relative inline-flex items-center w-9 h-5 rounded-full transition-colors',
                                  (materielAnvendt[enhed.anlaegsNr] ?? true)
                                    ? 'bg-good'
                                    : 'bg-hairline-2',
                                ].join(' ')}
                              >
                                <span
                                  className={[
                                    'inline-block w-4 h-4 rounded-full bg-white shadow transition-transform',
                                    (materielAnvendt[enhed.anlaegsNr] ?? true) ? 'translate-x-[18px]' : 'translate-x-[2px]',
                                  ].join(' ')}
                                />
                              </button>
                            </div>
                          ) : (
                            // Case B: timer-input per enhed
                            <div className="flex justify-end">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={materielTimer[enhed.anlaegsNr] ?? ''}
                                onChange={e =>
                                  setMaterielTimer(prev => ({ ...prev, [enhed.anlaegsNr]: parseFloat(e.target.value) || 0 }))
                                }
                                className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[100px] text-right focus:outline-none focus:border-dark-teal"
                                aria-label={`Timer for ${enhed.beskrivelse}`}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-hairline">
                    <td colSpan={3} className="px-sm py-xs">
                      <div className="flex flex-wrap items-start justify-between gap-sm">
                        <div className="flex flex-col gap-xs">
                          {timeafregningFraPlan === 'nej' && (
                            <div className="flex items-center gap-xs">
                              <label className="font-inter text-xxs text-text-muted uppercase tracking-widest whitespace-nowrap">Anvendte timer for hele holdpakken</label>
                              <div className="flex items-center gap-xs">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={holdpakkeTimer}
                                  onChange={e => setHoldpakkeTimer(parseFloat(e.target.value) || 0)}
                                  className="bg-surface border border-hairline rounded-md px-xs py-xxxs text-xs tabular-nums w-[120px] focus:outline-none focus:border-dark-teal"
                                />
                                <span className="font-inter text-xxs text-text-muted uppercase tracking-widest">timer</span>
                              </div>
                            </div>
                          )}
                          <span className="inline-flex items-center bg-warn-bg text-text-secondary font-inter font-medium text-xs px-sm py-xxxs rounded-full whitespace-nowrap">
                            {timeafregningFraPlan === 'nej'
                              ? 'Holdpakke fast pris — angiv samlede timer for hele pakken'
                              : 'Timeafregning — angiv timer per materiel-enhed'}
                          </span>
                        </div>
                        {!materielAfregningGodkendt && (
                          <button
                            type="button"
                            onClick={() => { setMaterielAfregningGodkendt(true) }}
                            className="min-h-touch shrink-0 ml-auto bg-yellow text-deep-teal font-inter font-semibold text-sm py-xxxs px-sm rounded-lg hover:opacity-90 transition-all"
                          >
                            Godkend afregning
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}

        {materielAfregningGodkendt && (
          <div className="flex items-center gap-xs px-sm py-xs bg-good-bg rounded-xl border border-good/20 mb-sm">
            <CheckCircle2 size={16} className="text-good" />
            <span className="font-inter text-xs text-text-secondary">Afregning godkendt</span>
            <button
              type="button"
              onClick={() => setMaterielAfregningGodkendt(false)}
              className="ml-auto font-inter text-xs text-text-muted underline cursor-pointer hover:text-text-primary"
            >
              Genåbn afregning
            </button>
          </div>
        )}
      </section>

      {/* ── Timeafregning ─────────────────────────────────────── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      {/* Placeholder-sektion — selve timeafregningen håndteres i PLAN (åbnes via knap) */}
      <section>
        <div className="flex items-center mb-sm">
          <h2 className="font-poppins font-semibold text-xl text-text-primary">Timeafregning</h2>
        </div>

        <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
          <div className="flex flex-col items-center justify-center gap-md px-md py-lg">
            <p className="font-inter text-sm text-text-secondary text-center">
              Timeafregning for hold. Bemærk at knap åbner PLAN.
            </p>
            <button
              type="button"
              onClick={() => setPlanModalOpen(true)}
              className="font-poppins font-semibold text-xs px-md py-xs rounded-full bg-yellow text-deep-teal inline-flex items-center gap-xxxs hover:opacity-90 transition-opacity"
            >
              PLAN
            </button>
          </div>
        </div>
      </section>

      {/* ── Afslut dag CTA + bekræftet-banner ───────────────────── */}
      {dagAfsluttet ? (
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm px-md py-sm bg-good-bg border border-good/30 rounded-2xl">
            <CheckCircle2 size={20} className="text-good flex-shrink-0" />
            <div className="flex flex-col gap-xxxs flex-1 min-w-0">
              <span className="font-poppins font-semibold text-sm text-good">
                Dag afsluttet — sendt til PLAN
              </span>
              <span className="font-inter text-xs text-text-secondary">
                Afregningen er låst og klar til behandling.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRetDag}
              className="shrink-0 font-inter font-semibold text-xs text-text-secondary underline cursor-pointer hover:text-text-primary transition-colors min-h-[44px] px-xs"
            >
              Ret
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          {/* KS-husker — ikke-blokerende note. KS-felterne er uncontrolled og indgår
              bevidst IKKE i validerAfregning(). Fjernes når KS-felterne er klar. */}
          <div className="flex items-start gap-xs px-sm py-xs rounded-xl bg-surface-2 border border-hairline">
            <span className="font-inter text-xs text-text-muted leading-relaxed">
              Husk: KS-rapportering (A3/A4/MKS) skal udfyldes — felterne er under udvikling og indgår ikke i valideringen endnu.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAfslutDag}
            className="w-full min-h-[52px] bg-good text-white font-poppins font-semibold text-sm rounded-full px-md py-sm hover:opacity-90 transition-opacity inline-flex items-center justify-center shadow-sm"
          >
            Afslut dag
          </button>
        </div>
      )}

      {/* ── Validerings-modal — manglende afregning ──────────────── */}
      {afslutDagModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-md"
          onClick={() => setAfslutDagModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-md p-md w-full max-w-sm border border-hairline"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-poppins font-semibold text-md text-text-primary mb-xs">
              Du mangler udfyldelse
            </p>
            <p className="font-inter text-sm text-text-secondary mb-sm leading-relaxed">
              Du mangler udfyldelse af:
            </p>
            <ul className="flex flex-col gap-xxxs mb-md">
              {valideringsFejl.map((fejl, i) => (
                <li key={i} className="flex items-start gap-xs">
                  <span className="mt-[3px] flex-shrink-0 w-[6px] h-[6px] rounded-full bg-bad" />
                  <span className="font-inter text-xs text-text-primary">{fejl}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setAfslutDagModalOpen(false)}
              className="w-full py-xs rounded-xl bg-dark-teal text-white font-inter font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              OK, ret afregning
            </button>
          </div>
        </div>
      )}

      {/* ── PLAN Timeregistrering mock-modal ──────────────────────── */}
      {planModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-md"
          onClick={() => setPlanModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-md border-b border-hairline">
              <div>
                <p className="font-poppins font-semibold text-sm uppercase tracking-wide text-deep-teal">
                  TIMEREGISTRERING — ADMIN
                </p>
                <p className="font-inter text-xs text-text-muted mt-xxxs">Denne dag er lukket.</p>
              </div>
              <button
                type="button"
                aria-label="Luk PLAN-modal"
                onClick={() => setPlanModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none ml-md"
              >
                ✕
              </button>
            </div>

            {/* Top-controls (visuel placeholder — ikke funktionel) */}
            <div className="flex flex-wrap gap-xs items-center p-md border-b border-hairline bg-surface-2">
              <span className="font-inter text-xs text-text-secondary">Vælg dato: <strong>18-05-2026</strong></span>
              <span className="font-inter text-xs text-text-secondary">|</span>
              <span className="font-inter text-xs text-text-secondary">Vælg hold: <strong>24 Kim Sørensen</strong></span>
              <button
                type="button"
                disabled
                className="font-poppins font-semibold text-xs px-sm py-xxxs rounded bg-deep-teal text-white opacity-40 cursor-not-allowed"
              >
                Hent data
              </button>
            </div>

            {/* Grove skeleton-linjer — illustrerer at PLAN åbnes, ingen detaljer */}
            <div className="p-md flex flex-col gap-sm">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-surface-2 rounded-md" />
              ))}
            </div>

            {/* Bunden */}
            <div className="flex items-center justify-between p-md border-t border-hairline bg-surface-2">
              <p className="font-inter text-xs text-text-muted italic">
                Demo-mockup — den fulde PLAN-skærm har flere kolonner og funktioner
              </p>
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className="font-poppins font-semibold text-xs px-md py-xs rounded-full border border-hairline text-text-primary hover:bg-surface-2 transition-colors"
              >
                Luk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
