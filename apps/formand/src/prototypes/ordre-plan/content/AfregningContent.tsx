import { useState, useMemo, useEffect, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useRecept } from '@/hooks/useRecept'
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
import { formatTimestamp } from '../utils'
import { OrdredetaljerSection } from '../components/OrdredetaljerSection'
import { PeriodeDatoVaelger } from '../components/PeriodeDatoVaelger'
import { UdlaegningSection } from './sections/afregning/UdlaegningSection'
import { BilTonsAfregningSection } from './sections/afregning/BilTonsAfregningSection'
import { MaterielafregningSection } from './sections/afregning/MaterielafregningSection'
import { TimeafregningSection } from './sections/afregning/TimeafregningSection'

// ─── AfregningContent ─────────────────────────────────────────────────────────
// Container (Round 4 / Trin #17): tynd orkestrering — ejer cross-cutting state +
// "Afslut dag"-CTA + valideringsmodal + PLAN-modal. De 4 afregnings-sektioner
// er udflyttet til sections/afregning/ og trådes ned via props.

export function AfregningContent({ vognmandBekraeftelse, todayDay, isSamleordreMode, samleordreCtx, samleordreTabOrderNr, onSelectSamleordreTab,
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
  /**
   * Callback der skifter aktiv child-ordre i delt root-state.
   * Modtages af containeren og trådes til UdlaegningSection i Round 2.
   */
  onSelectSamleordreTab?: (orderNumber: string) => void
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
      {/* PeriodeDatoVaelger erstatter inline dato-pille-blok (L373–406). Guard (days.length === 0
          returnerer null) er inde i PeriodeDatoVaelger — identisk adfærd med originalen. */}
      <PeriodeDatoVaelger
        heading="Afregningsperiode"
        days={afregningDays}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

      {/* ── Ordredetaljer + Udlægning — delt wrapper-div (kilde L409–589) ──────── */}
      {/* SPEC note: Ordredetaljer og Udlægning deler ÉT wrapper-div, identisk med kilden. */}
      <div>
        <OrdredetaljerSection
          expanded={detailsExpandedAfregning}
          onToggle={() => setDetailsExpandedAfregning(e => !e)}
          renderCard={() => makeOrdredetaljerCard()}
          renderCollapsedPille={renderOrdredetaljerCollapsedPille}
        />

        <hr className="my-lg border-t border-hairline" />

        {/* ── Udlægning — INDE i Ordredetaljer-section som sibling til hr ───────── */}
        {/* UdlaegningSection erstatter inline JSX L419–588. Sektionen vises kun
            når recept er truthy (guard er inde i UdlaegningSection: returnerer null). */}
        {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
        <UdlaegningSection
          recept={recept}
          tonsAnkommet={tonsAnkommet}
          forventetUdlagtM2={forventetUdlagtM2}
          faktiskRegistrering={faktiskRegistrering}
          visUdlaegningInput={visUdlaegningInput}
          onSetVisUdlaegningInput={onSetVisUdlaegningInput}
          onGemFaktisk={onGemFaktisk}
          demoTonsIDag={demoTonsIDag}
          demoArealIDag={demoArealIDag}
          demoTykkelse={demoTykkelse}
          harEkstraarbejde={harEkstraarbejde}
          products={products}
          isSamleordreMode={isSamleordreMode}
          samleordreCtx={samleordreCtx}
          samleordreTabOrderNr={samleordreTabOrderNr}
          onSelectSamleordreTab={onSelectSamleordreTab}
          selectedAfregningProductId={selectedAfregningProductId}
          setSelectedAfregningProductId={setSelectedAfregningProductId}
        />
      </div>

      {/* ── Bestilte biler (Bil- og tonsafregning) ─────────────────────────────── */}
      {/* BilTonsAfregningSection erstatter inline JSX L591–1306.
          State-slices + callbacks trådes ned — sektionen returnerer null når todayDay er undefined. */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <BilTonsAfregningSection
        todayDay={todayDay}
        vognmandBekraeftelse={vognmandBekraeftelse}
        isSamleordreMode={isSamleordreMode}
        samleordreCtx={samleordreCtx}
        samleordreTabOrderNr={samleordreTabOrderNr}
        biltypeAfregning={biltypeAfregning}
        bilAfregningOverride={bilAfregningOverride}
        setBilAfregningOverride={setBilAfregningOverride}
        vejeseddelFordelinger={vejeseddelFordelinger}
        setVejeseddelFordelinger={setVejeseddelFordelinger}
        vejeseddelExpanded={vejeseddelExpanded}
        setVejeseddelExpanded={setVejeseddelExpanded}
        vejeseddelVentetidFordelinger={vejeseddelVentetidFordelinger}
        setVejeseddelVentetidFordelinger={setVejeseddelVentetidFordelinger}
        bilTimerFordelinger={bilTimerFordelinger}
        setBilTimerFordelinger={setBilTimerFordelinger}
        bilVentetidFordelinger={bilVentetidFordelinger}
        setBilVentetidFordelinger={setBilVentetidFordelinger}
        bilTimerFordelingOpen={bilTimerFordelingOpen}
        setBilTimerFordelingOpen={setBilTimerFordelingOpen}
        afregningOpen={afregningOpen}
        setAfregningOpen={setAfregningOpen}
        afregningData={afregningData}
        setAfregningData={setAfregningData}
        beregnAfregningEligibility={beregnAfregningEligibility}
        toggleAfregning={toggleAfregning}
        updateAfregningField={updateAfregningField}
        godkendAfregning={godkendAfregning}
        genaabnAfregning={genaabnAfregning}
        formatTimestamp={formatTimestamp}
      />

      {/* ── Materiel ─────────────────────────────────────────────────────────── */}
      {/* MaterielafregningSection erstatter inline JSX L1309–1468.
          Note: MaterielafregningSection bruger on-prefix-konvention (onSetX) for setters.
          timeafregningFraPlan + holdpakkeTimer trådes hertil (bruges i BilTons OG Materiel). */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <MaterielafregningSection
        materielAfregningGodkendt={materielAfregningGodkendt}
        onSetMaterielAfregningGodkendt={setMaterielAfregningGodkendt}
        timeafregningFraPlan={timeafregningFraPlan}
        onSetTimeafregningFraPlan={setTimeafregningFraPlan}
        materielAnvendt={materielAnvendt}
        onSetMaterielAnvendt={setMaterielAnvendt}
        materielTimer={materielTimer}
        onSetMaterielTimer={setMaterielTimer}
        holdpakkeTimer={holdpakkeTimer}
        onSetHoldpakkeTimer={setHoldpakkeTimer}
        MATERIEL_ENHEDER={MATERIEL_ENHEDER}
      />

      {/* ── Timeafregning ─────────────────────────────────────────────────────── */}
      {/* TimeafregningSection erstatter inline JSX L1472–1491.
          PLAN-modal forbliver i denne container — onOpenPlanModal callback trådes ned.
          timeafregningFraPlan + holdpakkeTimer trådes hertil (SPEC note C: bruges i BilTons). */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <TimeafregningSection
        timeafregningFraPlan={timeafregningFraPlan}
        setTimeafregningFraPlan={setTimeafregningFraPlan}
        holdpakkeTimer={holdpakkeTimer}
        setHoldpakkeTimer={setHoldpakkeTimer}
        onOpenPlanModal={() => setPlanModalOpen(true)}
      />

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
              className="shrink-0 font-inter font-semibold text-xs text-text-secondary underline cursor-pointer hover:text-text-primary transition-colors min-h-touch px-xs"
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
