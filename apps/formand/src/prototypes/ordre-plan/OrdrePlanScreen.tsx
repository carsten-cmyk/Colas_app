/**
 * PROTOTYPE — Ordre Planlægnings-mode (v2 layout)
 * Sprint 1 — Element 3
 * Viser dagfordeling, materiel og transport for én ordre.
 * Må ikke importeres i produktionskode.
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  Truck,
  X,
  Plus,
  ChevronDown,
  ChevronLeft,
  Mic,
  Info,
  Camera,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { useRecept } from '@/hooks/useRecept'
import { useDagsoverblik } from '@/hooks/useDagsoverblik'
import { formatWeekday, formatLongDate } from '@/utils/date'
import { clusterEtaper, getMaterielUiState, DEMO_TRANSPORT_PLANER, transportKey } from './etape'
import type { Etape, MaterielUiState, MaterielTransportPlan } from './etape'
import {
  MaterielPlanlaegTilstand,
  MaterielNyEtapeTilstand,
  MaterielPaaPladsenTilstand,
  MaterielDvaleTilstand,
} from './MaterielTilstande'
import type { TransportPlanPatch, MaterielEnhed as MaterielEnhedTilstand } from './MaterielTilstande'
import { formatPhone, toE164 } from '@shared/utils/phone'
// ─── Interne moduler (udskilt fra denne fil) ──────────────────────────────────
import type {
  CancelReason, DayPlan, MockProduct, MockResource, VehicleOrder,
  KørselDayParams, NoteComment, MockPhoto,
  SamleordreChild, SamleordreContext, OrderMode,
  VognmandBekraeftelse, VognmandMaterielBekraeftelse, EkstraLinje,
} from './types'
import {
  getEffectiveTons, getEffectiveProductTotalTons, TODAY, dateToString,
} from './utils'
import {
  STANDARD_MATERIEL_KATALOG, VEHICLE_TYPES, MOCK_VOGNMAEND, DEFAULT_VOGNMAND_ID,
  DEFAULT_KØRSEL_PARAMS, INITIAL_PRODUCTS, INITIAL_RESOURCES,
  INITIAL_COMMENTS, INITIAL_PHOTOS, MOCK_SAMLEORDRE,
  INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE, INITIAL_VOGNMAND_BEKRAEFTELSER,
} from './mocks'
import { OrdredetaljerSection } from './components/OrdredetaljerSection'
import { AflysningCell } from './components/AflysningCell'
import { ProductBoxV2, EkstraBestillingBox } from './components/ProductBoxV2'
import { CommentCell } from './components/CommentCell'
import { DocRow } from './components/DocRow'
import { FjernModal } from './components/FjernModal'
import { UdfoerselContent } from './content/UdfoerselContent'
import { AfregningContent } from './content/AfregningContent'


export function OrdrePlanScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  // Læs initial-dato + samleordreId fra URL-params (primært) eller location.state (fallback).
  // URL-params giver bookmarkable + refreshable + deeplinkable samleordre-visning.
  // TODO (produktion): Også orderId fra path-param hvis nested route bygges.
  const navState = location.state as { selectedDate?: string; initialDate?: string; orderId?: string; samleordreId?: string } | null
  const urlSamleordreId = searchParams.get('samleordreId')
  const urlSelectedDate = searchParams.get('date')
  const initialPlanDate = urlSelectedDate ?? navState?.selectedDate ?? navState?.initialDate
  // Samleordre-mode: aktiveres når samleordreId er sat i URL eller navigation.state
  // TODO: Erstat med Supabase når klar — hent samleordre fra samleordrer-tabel
  const isSamleordreMode = !!(urlSamleordreId ?? navState?.samleordreId)
  // Samleordre-context er state så formanden kan tilføje ekstra ordrer på dagen
  // TODO: Erstat med Supabase når klar — mutationer skal persisteres til samleordre_children
  const [samleordreCtx, setSamleordreCtx] = useState<SamleordreContext | null>(
    isSamleordreMode ? MOCK_SAMLEORDRE : null
  )
  // Samleordre Ordredetaljer tab: hvilken child-ordre vises i spec-grid
  const [samleordreTabOrderNr, setSamleordreTabOrderNr] = useState<string>(() =>
    MOCK_SAMLEORDRE.children.find(c => c.isAnchor)?.orderNumber ?? MOCK_SAMLEORDRE.children[0].orderNumber
  )
  const [activeMode, setActiveMode] = useState<OrderMode>('planlaegning')
  const [activeProductId, setActiveProductId] = useState('p2')
  // "Skjul detaljer"-toggle for Ordredetaljer-spec-grid i Planlægning-mode
  const [planlaegningOrdredetaljerExpanded, setPlanlaegningOrdredetaljerExpanded] = useState(true)
  const [products, setProducts] = useState<MockProduct[]>(INITIAL_PRODUCTS)
  // Valgt dag i Bestilling-rækken (driver produkt-bokse + planlægning for ordren)
  // Prototype-default: 17. marts 2026 — den dag der har ekstra-bestillinger i mock,
  // så feature-præsentationen er umiddelbart synlig. Override via location.state.initialPlanDate
  // (fx fra Dagsoversigt-navigation).
  const [selectedPlanDate, setSelectedPlanDate] = useState<string>(
    initialPlanDate ?? '2026-03-17'
  )
  // "Samles på en bil" per produkt+dag: key = `${productId}__${dayId}`
  // TODO: Erstat med Supabase når klar
  const [productSamlesFlags, setProductSamlesFlags] = useState<Record<string, boolean>>({})

  function setProductSamles(productId: string, dayId: string, value: boolean) {
    setProductSamlesFlags(prev => ({ ...prev, [`${productId}__${dayId}`]: value }))
  }
  // Bekræftelses-modal før afsendelse til fabrik
  const [showConfirmSend, setShowConfirmSend] = useState(false)
  // "Bestilling for sent"-flag: deadline = kl 11 DAGEN FØR udlægningsdagen (selectedPlanDate).
  // Efter deadline kan ordren stadig sendes, men formanden skal ringe til fabrik for at sikre
  // produktionskapacitet. Vises pr. DEFAULT i prototypen så flowet kan ses uden tidssimulering.
  // TODO: Erstat med Supabase/PLAN — reel beregning: nu > (selectedPlanDate − 1 dag, kl 11:00).
  const bestillingForSent = true
  // TODO: Erstat med Supabase når klar — kommentar gemmes på ordren ved afsendelse
  const [kommentar, setKommentar] = useState('')
  // TODO: Erstat med Supabase når klar — kommentarer gemmes på ordren/dagen
  const [sentKommentarer, setSentKommentarer] = useState<Record<string, string>>({})
  const [resources, setResources] = useState<MockResource[]>(INITIAL_RESOURCES)
  const [tilfoejMaterielOpen, setTilfoejMaterielOpen] = useState(false)
  const [materielSoeg, setMaterielSoeg] = useState('')
  const [fjernModalId, setFjernModalId] = useState<string | null>(null)
  const [cancellingDayId, setCancellingDayId] = useState<string | null>(null)
  // Aflys-celle (i ordredetalje-grid): inline picker-state — uafhængig pr. produkt
  const [aflysPickerProductId, setAflysPickerProductId] = useState<string | null>(null)
  const [aflysPickerDayId, setAflysPickerDayId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<MockPhoto[]>(INITIAL_PHOTOS)
  const [opmaalingOpen, setOpmaalingOpen] = useState(false)
  const [photosOpen, setPhotosOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [besigtigelseComment, setBesigtigelseComment] = useState('')
  const [noteComments, setNoteComments] = useState<NoteComment[]>(INITIAL_COMMENTS)
  const [sentDayIds, setSentDayIds] = useState<Set<string>>(new Set())
  // afhentningAdresse, afhentningPostnr, afhentningKlarDato/Tid, afhentningLeveringDato/Tid,
  // sammeAflæsning og materielKommentar er MIGRERET til transportPlaner (MaterielTransportPlan
  // pr. enhed × etape). Se transportPlaner-state nedenfor.
  // TODO Round 4b: swap til faktiskPlanlagteDage + reel transport-state fra Supabase.
  const [kørselExpandedId, setKørselExpandedId] = useState<string | null>(null)
  // TODO: Erstat med Supabase når klar — afsendelsesgate for ASFALT-biler til vognmand, keyed på selectedPlanDate (ISO-dato-streng).
  // Seeder demo-dage som "Sendt til vognmand" (planlægnings-end-state: d2-1 = 16. marts, d2-2 = 17. marts).
  const [sendtTilVognmandDates, setSendtTilVognmandDates] = useState<Set<string>>(new Set(['2026-03-16', '2026-03-17']))
  // TODO: Erstat med Supabase når klar — afsendelsesgate for MATERIELLEVERING til vognmand.
  // Re-keyed til transportKey(resourceId, etapeId) (Round 4a).
  // Seeder r1×etape0 som "Sendt til vognmand" svarende til DEMO_TRANSPORT_PLANER (sendt:true, bekraeftet:true).
  const [materielSendteEnhederIds, setMaterielSendteEnhederIds] = useState<Set<string>>(
    () => new Set(
      INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE.items.map(it => transportKey(it.resourceId, 0))
    )
  )
  // TODO: Erstat med Supabase når klar — fabrik-bestilling sendt pr. dag, keyed på selectedPlanDate (ISO-dato-streng)
  const [fabrikSendtDates, setFabrikSendtDates] = useState<Set<string>>(new Set())
  // TODO: Erstat med Supabase — d2-1 og d2-2 er forudfyldte til demo
  const [kørselPlanlagtIds, setKørselPlanlagtIds] = useState<Set<string>>(new Set(['d2-1', 'd2-2']))
  // TODO: Erstat med Supabase — forudfyldte kørselordre til demo
  const [kørselOrders, setKørselOrders] = useState<Record<string, VehicleOrder[]>>({
    'd2-1': [
      { id: 'vo-d21-1', type: '6 Aks', antal: 2, afregning_type: 'akkord' },
      { id: 'vo-d21-2', type: '7 Aks', antal: 1, afregning_type: 'time' },
    ],
    'd2-2': [
      { id: 'vo-d22-1', type: '6 Aks', antal: 2, afregning_type: 'time' },
      { id: 'vo-d22-2', type: 'Sideudlægger', antal: 1, afregning_type: 'akkord' },
    ],
    'd2-3': [
      { id: 'vo-d23-1', type: '6 Aks', antal: 1, afregning_type: 'akkord' },
      { id: 'vo-d23-2', type: '7 Aks', antal: 1, afregning_type: 'time' },
    ],
  })
  // TODO: Erstat med Supabase når klar — anbefaling gemmes på ordrens dag-post
  // Demo: d2-1 (2026-03-16) viser anbefaling til vognmand-siden
  const [startRaekkefoelge, setStartRaekkefoelge] = useState<Record<string, [string | null, string | null, string | null]>>({
    'd2-1': ['6 Aks', '7 Aks', null],
  })

  function updateStartRaekkefoelge(dayId: string, position: 0 | 1 | 2, value: string | null) {
    setStartRaekkefoelge(prev => ({
      ...prev,
      [dayId]: (() => {
        const current = prev[dayId] ?? [null, null, null] as [string | null, string | null, string | null]
        const next = [...current] as [string | null, string | null, string | null]
        next[position] = value
        return next
      })()
    }))
  }

  // TODO: Erstat med Supabase når klar — starttider gemmes på ordrens dag-post
  // Demo: d2-1 har realistiske tider for de 2 første positioner
  const [startTider, setStartTider] = useState<Record<string, [string | null, string | null, string | null]>>({
    'd2-1': ['06:39', '06:54', null],
  })

  function updateStartTid(dayId: string, position: 0 | 1 | 2, value: string | null) {
    setStartTider(prev => ({
      ...prev,
      [dayId]: (() => {
        const current = prev[dayId] ?? [null, null, null] as [string | null, string | null, string | null]
        const next = [...current] as [string | null, string | null, string | null]
        next[position] = value
        return next
      })()
    }))
    // Bil 1's starttid spejles til "Første læs" — holder downstream (gantt-summary m.m.) i sync
    if (position === 0) {
      setKørselParams(prev => ({
        ...prev,
        [dayId]: { ...(prev[dayId] ?? DEFAULT_KØRSEL_PARAMS), firstLoadTime: value ?? undefined },
      }))
    }
  }

  const [kørselParams, setKørselParams] = useState<Record<string, KørselDayParams>>({})
  // TODO: Erstat med Supabase når klar — km-værdi gemmes på ordren, default fra Google API
  const GOOGLE_KM = 36 // Google-beregnet køreafstand — bruges som hint hvis formand redigerer
  const factoryKm = GOOGLE_KM // display-only — km fra Google-integration (drivetid = km × 1 min)
  const [kørselKommentar, setKørselKommentar] = useState<Record<string, string>>({})
  // materielKommentar MIGRERET til transportPlaner[key].kommentar — fjernet her.
  // TODO: Erstat med Supabase når klar — gemmes på plan_dag per ordre
  const [dagVognmand, setDagVognmand] = useState<Record<string, string>>({})             // dayId -> vognmandId
  const [dagAfregning, setDagAfregning] = useState<Record<string, 'time' | 'akkord'>>({}) // dayId -> 'time' | 'akkord'

  const [vognmandBekraeftelser] = useState<Record<string, VognmandBekraeftelse>>(INITIAL_VOGNMAND_BEKRAEFTELSER)
  // TODO: Erstat med Supabase når klar — opdateres via Realtime når vognmand bekræfter pr. dag.
  // Bekræftelse seedes IKKE i planlægnings-demoen — den er downstream (Udførsel).
  // Planlægnings-end-state = "Sendt til vognmand". Badge-lifecycle: gem → "Sendt til vognmand", vognmand-retur → "Bekræftet vognmand".
  const [bekraeftedeDagIds, setBekraeftedeDagIds] = useState<Set<string>>(
    () => new Set<string>()
  )
  const [vognmandMaterielBekraeftelse] = useState<VognmandMaterielBekraeftelse>(INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE)
  // TODO: Erstat med Supabase når klar — opdateres via Realtime når vognmand bekræfter pr. enhed.
  // Re-keyed til transportKey(resourceId, etapeId) (Round 4a).
  // Bekræftelse seedes IKKE i planlægnings-demoen — den er downstream (Udførsel).
  // Planlægnings-end-state = "Sendt til vognmand". Badge-lifecycle: gem → "Sendt til vognmand", vognmand-retur → "Bekræftet vognmand".
  const [bekraeftedeEnhederIds, setBekraeftedeEnhederIds] = useState<Set<string>>(
    () => new Set<string>()
  )


  // ── Udlægning state (løftet til root så AfregningContent + UdfoerselContent deler det) ──
  // TODO: Erstat med Supabase når klar — hent fra plan_vejebilag + dagplan
  const DEMO_TONS_I_DAG = 251        // t   — TODO: hent fra dagplan
  const DEMO_AREAL_I_DAG = 1339      // m² — TODO: beregn fra dagplan-tons × 1000/kg_per_m2
  const DEMO_TYKKELSE = 45           // mm  — TODO: hent fra ordre.planlaegning.tykkelse
  const DEMO_ORDRE_ID_UDLAEGNING = '260423891'
  const DEMO_DATO_UDLAEGNING = new Date().toISOString().slice(0, 10)
  const { recept } = useRecept('82101H') // SMA 11S — TODO: Erstat med Supabase når klar
  const { tonsAnkommet, forventetUdlagtM2, faktiskRegistrering, gemFaktisk } = useDagsoverblik(
    DEMO_ORDRE_ID_UDLAEGNING,
    DEMO_DATO_UDLAEGNING,
    recept
  )
  const [visUdlaegningInput, setVisUdlaegningInput] = useState(false)

  // ── Ekstraarbejde-state (løftet fra UdfoerselContent → deles med AfregningContent) ──
  // TODO: Erstat med Supabase når klar
  const [ekstraLinjer, setEkstraLinjer] = useState<EkstraLinje[]>([])
  const [ekstraSent, setEkstraSent] = useState(false)

  const activeProduct = products.find(p => p.id === activeProductId)!
  const days = activeProduct.days
  const activeDays = days.filter(d => !d.cancelled)

  // ─── Etape-bevidst materiel-model (Round 4c — LÅST 2026-06-23) ──────────────
  //
  // Datakilde: ordrens faktisk-planlagte dage fra ALLE produkters day-array,
  // filtreret på tonsPlanned > 0 && !cancelled — IKKE et contiguous dag-fill.
  // Dette spejler "Udføres i perioden = kun PLAN-planlagte dage"-reglen (FF Flow 1).
  //
  // TODO: Erstat med Supabase når klar — planlagte dage hentes fra plan_dag-tabellen.

  /** Faktisk-planlagte dage på tværs af alle produkter — deduplikeret og sorteret. */
  const faktiskPlanlagteDage = useMemo<string[]>(() => {
    const datoSet = new Set<string>()
    for (const p of products) {
      for (const d of p.days) {
        if (d.tonsPlanned > 0 && !d.cancelled) {
          datoSet.add(d.date)
        }
      }
    }
    return [...datoSet].sort()
  }, [products])

  // ── Dato-først model ──────────────────────────────────────────────────────
  // Dato-piller i Planlægning-mode: faktisk-planlagte dage + én demo-dvale-dag
  // så alle fire materiel-UX-tilstande kan nås via datovælgeren i prototype.
  //
  // DEMO_DVALE_DAG er en dag i gap'et mellem etape 0 (marts) og etape 1 (juli)
  // — giver 'dvale'-tilstand i materiel-sektionen.
  //
  // TODO: Erstat med Supabase når klar — i produktion er alle PLAN-dage synlige
  //   i datovælgeren; dvale-tilstanden opstår naturligt ved at vælge en dag uden
  //   planlagte produkter (eller via notifikations-flow for næste etape).
  const DEMO_DVALE_DAG = '2026-05-04'
  const planDays = useMemo(() => {
    const all = new Set([...faktiskPlanlagteDage, DEMO_DVALE_DAG])
    return [...all].sort()
  }, [faktiskPlanlagteDage])

  // Produkter for valgt dag (med deres day-objekt for den dag)
  // Frasorterer produkter med 0 tons i hele deres udlægningsperiode (ikke blot på valgt dag).
  // TODO: Erstat med Supabase når klar — periode-tjek: frasortér kun hvis 0 tons i HELE udførelsesperioden
  const productsForSelectedDate = useMemo(() => {
    return products
      .filter(p => p.days.some(d => d.tonsPlanned > 0))
      .map(p => ({ product: p, day: p.days.find(d => d.date === selectedPlanDate) }))
      .filter((x): x is { product: MockProduct; day: DayPlan } => !!x.day)
  }, [products, selectedPlanDate])

  /**
   * Etaper klynget fra faktisk-planlagte dage (Round 4c: kilde = faktiskPlanlagteDage).
   * Weekend-tolerant: lørdags-/søndagsgab bryder IKKE en etape.
   *
   * Med INITIAL_PRODUCTS' to etaper (marts + juli) giver dette:
   *   etape 0: 2026-03-16 … 2026-03-19 (union p1+p2, firstDay = 2026-03-16)
   *   etape 1: 2026-07-06 … 2026-07-07 (p1 july-dage, firstDay = 2026-07-06)
   *
   * TODO: Erstat med Supabase når klar — planlagte dage hentes fra plan_dag-tabellen.
   */
  const etaper = useMemo<Etape[]>(
    () => clusterEtaper(faktiskPlanlagteDage),
    [faktiskPlanlagteDage],
  )

  /**
   * Aktuel materiel-UX-tilstand for den valgte dag.
   */
  const materielUiState = useMemo<MaterielUiState>(
    () => getMaterielUiState(selectedPlanDate, etaper),
    [selectedPlanDate, etaper],
  )

  /**
   * Transport-planer keyed på transportKey(resourceId, etapeId).
   * Mutable container-state — presentere opdaterer via onTransportChange/onTransportGem.
   *
   * Seed: DEMO_TRANSPORT_PLANER (etape 0: r1 planlagt, r2+r3 ikke-planlagt; etape 1: alle blank).
   * Etape-id'erne 0 og 1 matcher clusterEtaper(faktiskPlanlagteDage) output ovenfor.
   *
   * TODO: Erstat med Supabase når klar — fra materiel_transport_plan-tabellen.
   */
  const [transportPlaner, setTransportPlaner] = useState<Record<string, MaterielTransportPlan>>(
    () => ({ ...DEMO_TRANSPORT_PLANER })
  )

  /**
   * Den etape der indeholder den valgte dag — bruges til transportKey-opslag i presentere.
   * Undefined hvis dagen falder i et dvale-gap (dvale-tilstand viser ingen transport-planer).
   */
  const aktivEtape = useMemo<Etape | undefined>(
    () => etaper.find(e => e.dates.includes(selectedPlanDate)),
    [etaper, selectedPlanDate],
  )

  /**
   * Pakke-ressourcer som MaterielEnhed-liste (subset til presentere).
   * Udelukker 'egen-korsel'-enheder, da de ikke transporteres via vognmand.
   */
  const materielResources: MaterielEnhedTilstand[] = useMemo(
    () =>
      resources
        .filter(r => r.transportTag !== 'egen-korsel')
        .map(r => ({ id: r.id, plantNumber: r.plantNumber, description: r.description })),
    [resources],
  )

  // ─── Round 4b: Auto-opret blanke transport-pladser ved ny etape ─────────────
  //
  // Idempotent effekt: når materielUiState er 'ny-etape' og aktivEtape er defineret,
  // sikres at transportPlaner har en blank MaterielTransportPlan for HVER enhed i
  // materielResources for den givne etape. Eksisterende planer overskrives IKKE.
  //
  // TODO: Erstat med Supabase når klar — auto-insert i materiel_transport_plan-tabellen
  //   når en ny etape oprettes i PLAN (Supabase trigger eller server-action).
  useEffect(() => {
    if (materielUiState !== 'ny-etape' || !aktivEtape) return

    setTransportPlaner(prev => {
      let changed = false
      const next = { ...prev }

      for (const r of materielResources) {
        const key = transportKey(r.id, aktivEtape.id)
        if (!next[key]) {
          changed = true
          next[key] = {
            resourceId: r.id,
            etapeId: aktivEtape.id,
            status: 'ikke-planlagt',
            afhentning: { vejnavn: '', nummer: '', postnr: '' },
            klar: { dato: '', tid: '' },
            lokation: { dato: '', tid: '' },
            aflaesning: '',
            kommentar: '',
            sendt: false,
            bekraeftet: false,
          }
        }
      }

      return changed ? next : prev
    })
  }, [materielUiState, aktivEtape, materielResources])

  // ─── End etape-model Round 4b ────────────────────────────────────────────

  // Default ordre/produkt på dato-skift: hvis det fokuserede produkt ikke har et
  // day-objekt for selectedPlanDate, skift til første produkt der HAR en day på dagen.
  // Sikrer at Spec-grid altid viser noget meningsfuldt.
  useEffect(() => {
    if (productsForSelectedDate.length === 0) return
    const currentMatches = productsForSelectedDate.some(({ product }) => product.id === activeProductId)
    if (!currentMatches) {
      setActiveProductId(productsForSelectedDate[0].product.id)
    }
  }, [selectedPlanDate, productsForSelectedDate, activeProductId])

  function updateTons(productId: string, dayId: string, value: number) {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, tonsPlanned: value } : d) }
        : p
    ))
  }

  function updateMorgenTons(productId: string, dayId: string, value: number | undefined) {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, morgenTons: value } : d) }
        : p
    ))
  }

  function cancelDay(productId: string, dayId: string, reason: CancelReason) {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, cancelled: true, cancelReason: reason, tonsPlanned: 0 } : d) }
        : p
    ))
    setCancellingDayId(null)
  }

  function restoreDay(dayId: string) {
    setProducts(prev => prev.map(p =>
      p.id === activeProductId
        ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, cancelled: false, cancelReason: undefined } : d) }
        : p
    ))
  }

  // Samleordrens dato — bruges af 'Tilføj ordre'-flow til at kalde Dagsoversigt
  // med korrekt dato-filter. TODO: hent fra samleordre.date i Supabase.
  const samleordreDate = '2026-03-17'

  // Når Dagsoversigt sender brugeren tilbage med location.state.addedChildren,
  // betyder det at en eller flere ordrer skal tilføjes til samleordren.
  // Vi læser ved mount og opdaterer samleordreCtx-state.
  // TODO: Erstat med Supabase når klar — server-side mutation på samleordre_children
  useEffect(() => {
    const state = location.state as { addedChildren?: SamleordreChild[] } | null
    const addedChildren = state?.addedChildren
    if (!addedChildren || addedChildren.length === 0 || !samleordreCtx) return
    const eksisterendeOrdrenumre = new Set(samleordreCtx.children.map(c => c.orderNumber))
    const newChildren = addedChildren.filter(c => !eksisterendeOrdrenumre.has(c.orderNumber))
    if (newChildren.length === 0) return
    setSamleordreCtx({ ...samleordreCtx, children: [...samleordreCtx.children, ...newChildren] })
    // Ryd location.state så refresh ikke gentager tilføjelsen
    navigate(location.pathname + location.search, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Send alle ikke-sendte morgen-bestillinger for valgt dag samtidigt
  function sendAlleForSelectedDate() {
    const dayIds = productsForSelectedDate
      .filter(({ day }) => !sentDayIds.has(day.id))
      .map(({ day }) => day.id)
    setSentDayIds(prev => new Set([...prev, ...dayIds]))
  }

  function removeResource(id: string) {
    setResources(prev => prev.filter(r => r.id !== id))
    setFjernModalId(null)
  }

  /**
   * Gem transport for én enhed i én etape.
   * Opdaterer: resources.status → 'planlagt', transportPlaner[key].status → 'planlagt',
   * og fjerner nøglen fra bekræftede/sendte sæt (revert-on-edit).
   */
  function markTransportPlanlagt(resourceId: string, etapeId: number) {
    const key = transportKey(resourceId, etapeId)
    setResources(prev => prev.map(r =>
      r.id === resourceId ? { ...r, status: 'planlagt' } : r
    ))
    // Opdater transport-planens status til 'planlagt'
    setTransportPlaner(prev => {
      const existing = prev[key]
      if (!existing) return prev
      return { ...prev, [key]: { ...existing, status: 'planlagt' } }
    })
    // Gem → "Planlagt" (fjern fra bekræftet-sæt).
    // "Bekræftet vognmand" gensættes kun når vognmand returnerer bekræftelse via Supabase Realtime.
    setBekraeftedeEnhederIds(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    // Revert-on-edit: rettelse efter afsendelse → tilbage til "Planlagt".
    // Vognmandens kopi er forældet når formanden ændrer — sendt-status nulstilles.
    setMaterielSendteEnhederIds(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  /**
   * Handler til presentere: opdaterer ét felt på én transport-plan.
   * Keyer automatisk på transportKey(resourceId, etapeId).
   */
  function handleTransportChange(resourceId: string, etapeId: number, patch: TransportPlanPatch) {
    const key = transportKey(resourceId, etapeId)
    setTransportPlaner(prev => {
      const existing = prev[key]
      if (!existing) return prev
      return { ...prev, [key]: { ...existing, ...patch } }
    })
  }

  /**
   * Handler til presentere: "Send til vognmand" section-level for alle planlagte usendte enheder
   * i den givne etape. Keyer sendt-sæt med transportKey.
   */
  function handleMaterielSend(etape: Etape) {
    const nyeSendte: string[] = []
    for (const r of resources) {
      const key = transportKey(r.id, etape.id)
      const plan = transportPlaner[key]
      if (plan?.status === 'planlagt' && !plan.sendt) {
        nyeSendte.push(key)
      }
    }
    if (nyeSendte.length === 0) return
    // Enkelt state-opdatering for alle enheder (undgår batch-stale-closure problem)
    setTransportPlaner(prev => {
      const next = { ...prev }
      for (const key of nyeSendte) {
        next[key] = { ...next[key], sendt: true }
      }
      return next
    })
    setMaterielSendteEnhederIds(prev => new Set([...prev, ...nyeSendte]))
  }

  function gemKørsel(dayId: string) {
    setKørselPlanlagtIds(prev => new Set([...prev, dayId]))
    // Gem → "Planlagt" (fjern fra bekræftet-sæt). "Bekræftet vognmand" gensættes
    // kun når vognmand returnerer bekræftelse via Supabase Realtime.
    setBekraeftedeDagIds(prev => { const next = new Set(prev); next.delete(dayId); return next })
    // Rettelse efter afsendelse → tilbage til "Planlagt": vognmandens kopi er forældet når
    // formanden ændrer bestillingen, så sendt-status nulstilles og dagen skal sendes igen.
    const dayDate = days.find(d => d.id === dayId)?.date
    if (dayDate) setSendtTilVognmandDates(prev => { const next = new Set(prev); next.delete(dayDate); return next })
    setKørselExpandedId(null)
  }

  const fjernModalResource = fjernModalId ? resources.find(r => r.id === fjernModalId) : null

  // Genbrugbar Ordredetaljer-visning: samleordre split-view med tabs ELLER fuld bredde Spec-grid.
  // Bruges både på Planlægning-mode (direkte synlig) og Udførsel-mode (i collapsed-expander).
  // hideTabs=true skjuler tab-rækken — bruges i Udførsel-mode hvor tabs er på selve Ordredetaljer-rækken.
  const makeOrdredetaljerCard = (
    hideTabs?: boolean,
  ) => (
    isSamleordreMode && samleordreCtx ? (
      <div className="mb-lg">
        {/* Tabs ovenpå spec-grid — skjules i Udførsel-mode (tabs er på Ordredetaljer-rækken) */}
        {!hideTabs && (
        <div className="inline-flex gap-xxxs">
          {samleordreCtx.children.map(child => {
            const isActive = child.orderNumber === samleordreTabOrderNr
            return (
              <button
                key={child.orderNumber}
                onClick={() => setSamleordreTabOrderNr(child.orderNumber)}
                aria-pressed={isActive}
                className={[
                  'inline-flex items-center gap-xs px-md py-xs border border-hairline rounded-t-lg transition-colors font-inter text-xs font-semibold',
                  isActive
                    ? 'bg-white border-b-white text-deep-teal relative z-10 -mb-[1px]'
                    : 'bg-surface-2 text-text-muted hover:text-deep-teal',
                ].join(' ')}
              >
                {child.isAnchor && (
                  <span
                    className="w-[6px] h-[6px] rounded-full bg-yellow flex-shrink-0"
                    aria-label="Primær ordre"
                  />
                )}
                <span>{child.stedLabel}</span>
              </button>
            )
          })}
        </div>
        )}
        {/* Hjørner: rounded-tr-xl kun når tabs vises (de danner en "browser-tab" kant); fuldt rounded ved hideTabs */}
        <div className={`bg-white border border-hairline overflow-hidden ${hideTabs ? 'rounded-xl' : 'rounded-tr-xl rounded-b-xl'}`}>
          {(() => {
            const tabChild = samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
            if (!tabChild) return null
            const tabProduct = tabChild.isAnchor ? activeProduct : null
            return (
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-5 auto-rows-fr divide-x divide-hairline bg-white items-stretch">
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Mængde tons</span>
                    <span className="font-poppins font-semibold text-md text-text-primary tabular-nums mt-auto">
                      {/* effective tons = produkt-total + evt. ekstra fra PLAN på produktets dage */}
                      {tabProduct ? getEffectiveProductTotalTons(tabProduct) : tabChild.products.reduce((s, p) => s + p.tonsTotal, 0)}
                    </span>
                  </div>
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Produkt</span>
                    <div className="mt-auto flex flex-col gap-xxxs">
                    {tabChild.products.map(p => (
                      <div key={p.id}>
                        <span className="font-poppins font-semibold text-md text-text-primary block leading-tight">
                          {p.recipeName}
                        </span>
                      </div>
                    ))}
                    </div>
                  </div>
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Tykkelse</span>
                    <span className="font-poppins font-semibold text-md text-text-primary tabular-nums mt-auto">
                      {tabProduct?.thicknessMm != null ? `${tabProduct.thicknessMm} mm` : '–'}
                    </span>
                  </div>
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
                    {tabProduct ? (
                      <div className="mt-auto flex flex-col gap-xxxs">
                        <span className="font-inter text-xs text-text-muted">
                          {tabProduct.factory.driveTimeMinutes} min til plads
                        </span>
                        <span className="font-poppins font-semibold text-sm text-text-primary leading-tight block">
                          {tabProduct.factory.name}
                        </span>
                      </div>
                    ) : (
                      <span className="font-inter text-xs text-text-muted mt-auto">–</span>
                    )}
                  </div>
                  {/* AFLYSNING-celle (6. kolonne) — kun aktiv når der er et tabProduct.
                      Ikke-anchor children har ikke selvstændige days. */}
                  <div className="p-sm flex flex-col h-full min-h-[96px]">
                    <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Aflysning</span>
                    {tabProduct ? (
                      <AflysningCell
                        product={tabProduct}
                        udfoerselSelectedDate={selectedPlanDate}
                        pickerOpenForDayId={aflysPickerProductId === tabProduct.id ? aflysPickerDayId : null}
                        onOpenPicker={(dayId) => { setAflysPickerProductId(tabProduct.id); setAflysPickerDayId(dayId) }}
                        onClosePicker={() => { setAflysPickerProductId(null); setAflysPickerDayId(null) }}
                        onCancelDay={(dayId, reason) => {
                          cancelDay(tabProduct.id, dayId, reason)
                          setAflysPickerProductId(null)
                          setAflysPickerDayId(null)
                        }}
                      />
                    ) : (
                      <span className="font-inter text-xs text-text-muted mt-auto">–</span>
                    )}
                  </div>
                </div>
                {tabProduct && (
                  <div className="border-t border-hairline bg-white grid grid-cols-2 divide-x divide-hairline">
                    <CommentCell text={tabProduct.activityName} />
                    <div className="p-sm flex flex-col gap-xs">
                      <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Krav til udførsel</span>
                      <div className="flex flex-col gap-xxxs">
                        <div className="flex items-center justify-between">
                          <span className="font-inter text-xs text-text-muted">Krav til samlinger</span>
                          <span className="font-inter text-xs font-semibold text-text-primary">{tabProduct.kravTilSamlinger ?? '–'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-inter text-xs text-text-muted">Ekstra temperaturmålinger</span>
                          <span className="font-inter text-xs font-semibold text-text-primary">{tabProduct.ekstraTemperaturmaalinger ? 'Ja' : 'Nej'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-inter text-xs text-text-muted">Entreprisekontrol og temperatur</span>
                          <span className="font-inter text-xs font-semibold text-text-primary">
                            {tabProduct.entreprisekontrol === 2 || tabProduct.temperaturmaaling === 2
                              ? 'Følgende skal udfyldes: A3, A4, MKS'
                              : tabProduct.entreprisekontrol === 1 || tabProduct.temperaturmaaling === 1
                                ? 'Følgende skal udfyldes: MKS'
                                : '–'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-xl border border-hairline overflow-hidden mb-lg">
        <div className="grid grid-cols-5 auto-rows-fr divide-x divide-hairline bg-white items-stretch">
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Mængde tons</span>
            <span className="font-poppins font-semibold text-md text-text-primary tabular-nums mt-auto">
              {/* effective tons = produkt-total + evt. ekstra fra PLAN på produktets dage */}
              {getEffectiveProductTotalTons(activeProduct)}
            </span>
          </div>
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Produkt</span>
            <div className="mt-auto flex flex-col gap-xxxs">
              <span className="font-poppins font-semibold text-md text-text-primary block leading-tight">
                {activeProduct.recipeName}
              </span>
            </div>
          </div>
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Tykkelse</span>
            <span className="font-poppins font-semibold text-md text-text-primary tabular-nums mt-auto">
              {activeProduct.thicknessMm != null ? `${activeProduct.thicknessMm} mm` : '–'}
            </span>
          </div>
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
            <div className="mt-auto flex flex-col gap-xxxs">
              <span className="font-inter text-xs text-text-muted">
                {activeProduct.factory.driveTimeMinutes} min til plads
              </span>
              <span className="font-poppins font-semibold text-sm text-text-primary leading-tight block">
                {activeProduct.factory.name}
              </span>
            </div>
          </div>
          {/* AFLYSNING-celle (6. kolonne) */}
          <div className="p-sm flex flex-col h-full min-h-[96px]">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Aflysning</span>
            <AflysningCell
              product={activeProduct}
              udfoerselSelectedDate={selectedPlanDate}
              pickerOpenForDayId={aflysPickerProductId === activeProduct.id ? aflysPickerDayId : null}
              onOpenPicker={(dayId) => { setAflysPickerProductId(activeProduct.id); setAflysPickerDayId(dayId) }}
              onClosePicker={() => { setAflysPickerProductId(null); setAflysPickerDayId(null) }}
              onCancelDay={(dayId, reason) => {
                cancelDay(activeProduct.id, dayId, reason)
                setAflysPickerProductId(null)
                setAflysPickerDayId(null)
              }}
            />
          </div>
        </div>
        <div className="border-t border-hairline bg-white grid grid-cols-2 divide-x divide-hairline">
          <CommentCell text={activeProduct.activityName} />
          <div className="p-sm flex flex-col gap-xs">
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Krav til udførsel</span>
            <div className="flex flex-col gap-xxxs">
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-text-muted">Krav til samlinger</span>
                <span className="font-inter text-xs font-semibold text-text-primary">{activeProduct.kravTilSamlinger ?? '–'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-text-muted">Ekstra temperaturmålinger</span>
                <span className="font-inter text-xs font-semibold text-text-primary">{activeProduct.ekstraTemperaturmaalinger ? 'Ja' : 'Nej'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-inter text-xs text-text-muted">Entreprisekontrol og temperatur</span>
                <span className="font-inter text-xs font-semibold text-text-primary">
                  {activeProduct.entreprisekontrol === 2 || activeProduct.temperaturmaaling === 2
                    ? 'Følgende skal udfyldes: A3, A4, MKS'
                    : activeProduct.entreprisekontrol === 1 || activeProduct.temperaturmaaling === 1
                      ? 'Følgende skal udfyldes: MKS'
                      : '–'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  )

  // Kompakt hvid pille der vises UNDER Ordredetaljer-toggle'en når sektionen er collapsed.
  // Viser 3 felter: dato-range, mængde tons, produkt. Bruges på alle 3 modes (Planlægning/Udførsel/Afregning).
  // Samleordre: bruger tabProduct (fra samleordreCtx.children) i stedet for activeProduct — matcher
  // makeOrdredetaljerCard-patternet. Ikke-anchor children har ikke selvstændige days/dato/tons-felter,
  // så vi fallback'er til child.products-aggregat når tabChild ikke er anchor.
  const renderOrdredetaljerCollapsedPille = () => {
    // Find aktuelt produkt afhængigt af samleordre-mode (matcher makeOrdredetaljerCard linje 1182-1184)
    const tabChild = isSamleordreMode && samleordreCtx
      ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
      : undefined
    const tabProduct = tabChild ? (tabChild.isAnchor ? activeProduct : null) : activeProduct

    if (!activeProduct) return null

    // Mængde tons: effektiv total inkl. ekstra fra PLAN; ikke-anchor children → summer over products
    const totalTons = tabProduct
      ? getEffectiveProductTotalTons(tabProduct)
      : (tabChild ? tabChild.products.reduce((s, p) => s + p.tonsTotal, 0) : 0)

    // Produkt: tabChild har products[]-array; ellers activeProduct.recipeName
    const produktLabel = tabChild
      ? tabChild.products.map(p => p.recipeName).join(', ')
      : activeProduct.recipeName

    return (
      // Container-styling (bg-surface/border/rounded/shadow) ligger nu på OrdredetaljerSection's
      // <button>-wrapper, så vi returnerer KUN det indre indhold (3 felter).
      <div className="flex items-center justify-between px-md py-sm gap-md">
        <div className="flex flex-col gap-xxxs items-start">
          <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Mængde tons</span>
          <span className="font-poppins font-semibold text-sm text-text-primary tabular-nums">{totalTons}</span>
        </div>
        <div className="flex flex-col gap-xxxs items-start">
          <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest">Produkt</span>
          <span className="font-poppins font-semibold text-sm text-text-primary">{produktLabel}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page">
      {/* ── TopBar ───────────────────────────────────────────────────── */}
      <TopBar
        userInitials="OJ"
        userName="Ole J."
        onSettingsPress={() => {}}
        nav={{
          items: [
            { id: 'kalenderoversigt', label: 'Kalenderoversigt', to: '/prototyper/gantt' },
            { id: 'dagens-opgaver',   label: 'Dagens opgaver',   to: '/prototyper/dagsoversigt' },
          ],
          // OrdrePlan er ikke selv et nav-mål → ingen activeId
          onNavigate: (item) => navigate(item.to),
        }}
      />

      <div
        className="grid"
        style={{ gridTemplateColumns: 'clamp(220px, 22vw, 320px) minmax(0, 1fr)' }}
      >

        {/* ── Venstre rail ─────────────────────────────────────────── */}
        <aside
          className="sticky border-r border-hairline flex flex-col gap-md px-md pb-md pt-xs overflow-y-auto"
          style={{ top: 52, height: 'calc(100vh - 52px)' }}
        >
          {/* Adresse + ordrenummer */}
          <div>
            {isSamleordreMode ? (
              <>
                <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xs">
                  Samleordre
                </span>
                {/* Begge adresser i samme størrelse — anchor markeret med gul prik */}
                <div className="flex flex-col gap-sm">
                  {samleordreCtx!.children.map(child => (
                    <div key={child.orderNumber} className="flex items-start gap-xs">
                      <span
                        className={[
                          'mt-[8px] w-[10px] h-[10px] rounded-full flex-shrink-0',
                          child.isAnchor
                            ? 'bg-yellow shadow-[0_0_0_2px_rgba(254,238,50,0.35)]'
                            : 'bg-transparent border-2 border-hairline-2',
                        ].join(' ')}
                        aria-label={child.isAnchor ? 'Anchor (primær)' : undefined}
                      />
                      <h1 className="font-poppins font-semibold text-lg text-text-primary leading-tight">
                        {child.udfoerelseSted.split(',').map((line, i) => (
                          <span key={i} className="block">{line.trim()}</span>
                        ))}
                      </h1>
                    </div>
                  ))}
                </div>
                {/* Tilføj-ordre-knap: sender brugeren til Dagsoversigt i 'tilføj-mode'
                    hvor det eksisterende checkbox-flow genbruges. Dagsoversigt navigerer
                    tilbage med ?addOrderNumbers=... når brugeren bekræfter via FAB. */}
                <button
                  type="button"
                  onClick={() => navigate(`/prototyper/dagsoversigt?date=${encodeURIComponent(samleordreDate)}&addToSamleordreId=${samleordreCtx!.id}`)}
                  className="mt-sm inline-flex items-center gap-xxxs px-sm py-xs font-inter text-xs font-medium text-dark-teal bg-white border border-dashed border-hairline-2 rounded-lg hover:text-deep-teal hover:bg-soft-aqua hover:border-deep-teal/40 transition-colors w-fit"
                  aria-label="Tilføj ordre til samleordre"
                >
                  <Plus size={14} />
                  Tilføj ordre
                </button>
              </>
            ) : (
              <>
                <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">
                  Udførselssted
                </span>
                <h1 className="font-poppins font-semibold text-xl text-text-primary leading-tight">
                  Søvej 6D<br />4900 Nakskov
                </h1>
                {/* TODO (produktion): Jobnummer + projektnavn kommer fra PLAN-systemet (én plan kan have flere ordrer). */}
                <span className="font-inter text-xs text-text-primary mt-xxxs block">
                  Jobnummer 52. VD Kibæk Vammen
                </span>
                <span className="font-inter text-xs text-text-muted mt-xxxs block">
                  Ordrenummer: 1212343
                </span>
              </>
            )}
          </div>

          {/* Kontakter — skifter med aktiv samleordre-tab når isSamleordreMode */}
          {(() => {
            const activeChild = isSamleordreMode && samleordreCtx
              ? samleordreCtx.children.find(c => c.orderNumber === samleordreTabOrderNr)
              : null
            const projektleder     = activeChild ? activeChild.projektleder     : 'Henrik Thor'
            const projektlederTlf  = activeChild ? activeChild.projektlederTlf  : '40 50 60 70'
            const fabrik           = activeChild ? activeChild.fabrik           : 'Køge Fabrik'
            const fabrikTlf        = activeChild ? activeChild.fabrikTlf        : '56 78 12 34'
            const kundeVirksomhed  = activeChild ? activeChild.kundeVirksomhed  : 'Uddannelsescenter Syd'
            const kundekontakt     = activeChild ? activeChild.kundekontakt     : 'Jens Christensen'
            const kundekontaktTlf  = activeChild ? activeChild.kundekontaktTlf  : '21 34 56 78'
            return (
              <div className="flex flex-col border-t border-hairline pt-xs">
                <div className="flex flex-col gap-xxxs px-xs pb-xs">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Projektleder</span>
                  <p className="font-inter text-sm font-semibold text-text-primary leading-tight">{projektleder}</p>
                  <a href={`tel:${toE164(projektlederTlf) ?? projektlederTlf.replace(/\s/g, '')}`} className="font-inter text-sm text-dark-teal hover:text-deep-teal transition-colors">
                    {formatPhone(projektlederTlf)}
                  </a>
                </div>
                <div className="flex flex-col gap-xxxs px-xs py-xs border-t border-hairline">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Fabrik</span>
                  <p className="font-inter text-sm font-semibold text-text-primary leading-tight">{fabrik}</p>
                  <a href={`tel:${toE164(fabrikTlf) ?? fabrikTlf.replace(/\s/g, '')}`} className="font-inter text-sm text-dark-teal hover:text-deep-teal transition-colors">
                    {formatPhone(fabrikTlf)}
                  </a>
                </div>
                <div className="flex flex-col gap-xxxs px-xs pt-xs border-t border-hairline">
                  <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Kundekontakt</span>
                  <p className="font-inter text-xxs text-text-muted leading-tight mb-xxxs">{kundeVirksomhed}</p>
                  <p className="font-inter text-sm font-semibold text-text-primary leading-tight">{kundekontakt}</p>
                  <a href={`tel:${toE164(kundekontaktTlf) ?? kundekontaktTlf.replace(/\s/g, '')}`} className="font-inter text-sm text-dark-teal hover:text-deep-teal transition-colors">
                    {formatPhone(kundekontaktTlf)}
                  </a>
                </div>
              </div>
            )
          })()}

        </aside>

        {/* ── Hoved-indhold ────────────────────────────────────────── */}
        <main className="px-lg pb-lg pt-xs">

          {/* ── Mode-toggle + tilbage-link på samme række ──────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-sm mb-md">
            <div className="inline-flex bg-white border border-hairline rounded-full p-xxxs gap-xxxs shadow-sm">
              {([ 'planlaegning', 'udfoersel', 'afregning' ] as OrderMode[]).map(mode => {
                const isActive = mode === activeMode
                const label = mode === 'planlaegning' ? 'Planlægning' : mode === 'udfoersel' ? 'Udførsel' : 'Afregning'
                return (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    aria-pressed={isActive}
                    className={[
                      'transition-colors',
                      isActive
                        ? 'bg-deep-teal text-white font-poppins font-semibold text-base px-lg py-sm rounded-full'
                        : 'text-text-muted font-inter font-semibold text-base px-lg py-sm rounded-full hover:text-deep-teal',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => navigate(`/prototyper/dagsoversigt?date=${encodeURIComponent(selectedPlanDate)}`)}
              className="flex items-center gap-xxxs px-sm py-xs font-inter text-xs font-medium text-dark-teal hover:text-deep-teal hover:bg-soft-aqua rounded-lg transition-colors"
            >
              <ChevronLeft size={14} />
              Tilbage til dagsoversigt
            </button>
          </div>

          {activeMode === 'planlaegning' && (
          <div className="flex flex-col gap-[48px]">

          {/* ── Asfaltbestilling — unified datovælger i toppen (matcher Udførsel/Afregning) ──
              Flyttet hertil 2026-06-15: datovælgeren placeres øverst på alle tre modes for
              ensartethed. 1:1 samme picker som Udførsels "Udføres i perioden" — fuld ordre-
              periode, overståede dage gennemstreget, ingen grøn afsendt-state. */}
          {planDays.length > 0 && (
            <section>
              <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Udføres i perioden</h2>
              <div className="flex items-center gap-xs flex-wrap">
                {planDays.map(ds => {
                  const isSelected = ds === selectedPlanDate
                  // Dato-pille-konvention (2026-06-05): passerede dage → hvid + gennemstreget
                  const isPast = ds < dateToString(TODAY)
                  return (
                    <button
                      key={ds}
                      onClick={() => setSelectedPlanDate(ds)}
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

          {/* ── Sektion: Udlægning ───────────────────────────────── */}
          <div>

            {/* Header-row (h2 + Skjul/Vis-toggle) + spec-grid/collapsed-pille
                indkapslet i OrdredetaljerSection. Identisk markup på tværs af
                Planlægning/Udførsel/Afregning — kun state og renderCard()-args
                varierer per mode. */}
            <OrdredetaljerSection
              expanded={planlaegningOrdredetaljerExpanded}
              onToggle={() => setPlanlaegningOrdredetaljerExpanded(prev => !prev)}
              renderCard={() => makeOrdredetaljerCard()}
              renderCollapsedPille={renderOrdredetaljerCollapsedPille}
            />

            {planlaegningOrdredetaljerExpanded && (
              <section>
                <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Dokumentation</h2>

                <div className="bg-white border border-hairline rounded-xl overflow-hidden">
                  {/* Toggle-header */}
                  <button
                    onClick={() => setDocsOpen(o => !o)}
                    className="w-full flex items-center justify-between px-sm py-sm hover:bg-[#F5F5F5] transition-colors"
                  >
                    <span className="flex items-center gap-md">
                      <span className="font-poppins font-semibold text-sm text-text-primary">Dokumentation</span>
                      <span className="flex items-center gap-sm font-inter text-xs text-text-muted">
                        {[
                          { label: 'Opmåling', ok: true },
                          { label: 'Billeder', ok: true },
                          { label: 'Noter', ok: false },
                        ].map(item => (
                          <span key={item.label} className="flex items-center gap-xxxs">
                            <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${item.ok ? 'bg-[#1F8A5B]' : 'bg-[#C8372D]'}`} />
                            <span className={item.ok ? 'text-text-muted' : 'text-[#C8372D] font-medium'}>{item.label}</span>
                          </span>
                        ))}
                      </span>
                    </span>
                    <ChevronDown size={16} className={`text-text-muted transition-transform ${docsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {docsOpen && (
                    <div className="border-t border-hairline">

                      {/* Opmåling */}
                      <DocRow
                        title="Opmåling af område"
                        meta="PDF · 2,1 MB"
                        status="ok"
                        open={opmaalingOpen}
                        onToggle={() => setOpmaalingOpen(o => !o)}
                      >
                        <div className="flex flex-col gap-sm">
                          <img src="/opmaalings-kort.png" alt="Opmåling af område" className="w-full rounded-lg border border-hairline grayscale-[30%]" />
                          <label className="flex items-center justify-center gap-xs border border-dashed border-hairline-2 rounded-lg py-sm cursor-pointer hover:border-dark-teal hover:bg-[#F5F9FA] transition-colors group">
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                              onChange={e => { if (e.target.files?.length) { /* TODO: håndter upload */ } }}
                            />
                            <Plus size={14} className="text-text-muted group-hover:text-dark-teal transition-colors" />
                            <span className="font-inter text-xs text-text-muted group-hover:text-dark-teal transition-colors">Upload fil (PDF eller billede)</span>
                          </label>
                        </div>
                      </DocRow>

                      {/* Billeder */}
                      <DocRow
                        title="Billedmateriale"
                        meta={`${photos.length} billeder`}
                        status="ok"
                        open={photosOpen}
                        onToggle={() => setPhotosOpen(o => !o)}
                      >
                        <div className="grid grid-cols-4 gap-xs">
                          {photos.map(photo => (
                            <div key={photo.id} className={`aspect-square rounded-lg ${photo.color} flex flex-col items-center justify-center relative group border border-hairline overflow-hidden`}>
                              <span className="font-inter text-xxs text-text-muted text-center px-xxxs leading-tight">{photo.label}</span>
                              {photo.source === 'forundersoegelse' && (
                                <span className="absolute bottom-0 left-0 right-0 bg-dark-teal/80 font-inter text-[9px] font-semibold text-white text-center py-[2px] leading-none">
                                  Forundersøgelse
                                </span>
                              )}
                              <button
                                onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                                className="absolute top-[4px] right-[4px] w-[16px] h-[16px] bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={8} className="text-bad" />
                              </button>
                            </div>
                          ))}
                          <label className="aspect-square rounded-lg border border-dashed border-hairline-2 flex flex-col items-center justify-center cursor-pointer hover:border-text-muted hover:bg-[#F5F5F5] transition-colors">
                            <input type="file" accept="image/*" capture="environment" className="hidden"
                              onChange={e => {
                                if (e.target.files?.length) {
                                  setPhotos(prev => [...prev, { id: `ph${Date.now()}`, color: 'bg-yellow/20', label: `Foto ${prev.length + 1}` }])
                                }
                              }}
                            />
                            <Camera size={16} className="text-text-muted" />
                            <span className="font-inter text-xxs text-text-muted mt-xxxs">Kamera</span>
                          </label>
                          <label className="aspect-square rounded-lg border border-dashed border-hairline-2 flex flex-col items-center justify-center cursor-pointer hover:border-text-muted hover:bg-[#F5F5F5] transition-colors">
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => {
                                if (e.target.files?.length) {
                                  setPhotos(prev => [...prev, { id: `ph${Date.now()}`, color: 'bg-light-aqua/30', label: `Foto ${prev.length + 1}` }])
                                }
                              }}
                            />
                            <Plus size={16} className="text-text-muted" />
                            <span className="font-inter text-xxs text-text-muted mt-xxxs">Upload</span>
                          </label>
                        </div>
                      </DocRow>

                      {/* Noter */}
                      <DocRow
                        title="Noter til opgave"
                        meta={`${noteComments.length} noter`}
                        status="bad"
                        open={notesOpen}
                        onToggle={() => setNotesOpen(o => !o)}
                        isLast
                      >
                        <div className="flex flex-col gap-sm">
                          {noteComments.map(c => (
                            <div key={c.id} className="flex gap-xs">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${c.initials === 'OJ' ? 'bg-deep-teal' : 'bg-[#F5F5F5]'}`}>
                                <span className={`font-inter font-bold text-[9px] ${c.initials === 'OJ' ? 'text-white' : 'text-deep-teal'}`}>{c.initials}</span>
                              </div>
                              <div className="flex-1 bg-[#F5F5F5] rounded-xl px-xs py-xs">
                                <div className="flex items-baseline gap-xs mb-xxxs">
                                  <b className="font-inter font-semibold text-xs text-text-primary">{c.name}</b>
                                  <time className="font-inter text-xxs text-text-muted">{c.timestamp}</time>
                                </div>
                                <p className="font-inter text-xs text-text-secondary leading-relaxed">{c.text}</p>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-xs">
                            <div className="w-7 h-7 rounded-full bg-deep-teal flex items-center justify-center flex-shrink-0">
                              <span className="font-inter font-bold text-[9px] text-white">OJ</span>
                            </div>
                            <div className="flex-1">
                              <div className="relative">
                                <textarea
                                  value={besigtigelseComment}
                                  onChange={e => setBesigtigelseComment(e.target.value)}
                                  placeholder="Tilføj bemærkning..."
                                  rows={2}
                                  className="w-full rounded-xl border border-hairline bg-white px-xs py-xs pr-[40px]
                                             font-inter text-xs text-text-primary placeholder:text-text-muted
                                             focus:outline-none focus:border-dark-teal resize-none"
                                />
                                <button
                                  className="absolute bottom-[10px] right-[10px] w-7 h-7 rounded-full bg-dark-teal
                                             flex items-center justify-center hover:bg-deep-teal transition-colors"
                                  aria-label="Dikter bemærkning"
                                >
                                  <Mic size={12} className="text-white" />
                                </button>
                              </div>
                              {besigtigelseComment.trim().length > 0 && (
                                <button
                                  onClick={() => {
                                    setNoteComments(prev => [...prev, { id: `nc${Date.now()}`, initials: 'OJ', name: 'Ole Jensen', timestamp: 'Nu', text: besigtigelseComment.trim() }])
                                    setBesigtigelseComment('')
                                  }}
                                  className="mt-xxxs self-end float-right bg-dark-teal text-white font-inter font-semibold text-xxs px-sm py-xxxs rounded-lg hover:bg-deep-teal transition-colors"
                                >
                                  Gem
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </DocRow>

                    </div>
                  )}
                </div>
              </section>
            )}

            <hr className="my-lg border-t border-hairline" />

            {/* ── Bestillings-række for valgt dag ──────────────────────── */}
            {/* Produkter (én boks pr. produkt) + "Send alle"-knap */}
            {/* Samleordre: produkter samles per recipeCode på tværs af ordrer */}
            {/* TODO: Erstat med Supabase når klar — produktdata fra samleordre-join */}
            <div className="flex flex-col gap-sm">
              <h2 className="font-poppins font-semibold text-xl text-deep-teal leading-tight mb-sm">Asfaltbestilling</h2>
              {/* Datovælgeren er flyttet til toppen af Planlægning-mode (unified picker —
                  se sektionen øverst). Bestillings-rækken viser produkterne for den valgte dato. */}
              {productsForSelectedDate.length === 0 && (
                <span className="font-inter text-xs text-text-muted">Ingen produkter denne dag</span>
              )}

              {/* Flow 9b (OPDATERET 2026-06-09): "Tons opdateret af Fabrik"-banner ERSTATTET
                  af synlig EkstraBestillingBox + "Bekræftet fabrik"-pille per produkt med ekstra-tons.
                  Se EkstraBestillingBox-komponenten.
                  Bevaret som dokumentation: ./v1/TonsOpdateretBanner.v1.tsx */}

              {/* items-stretch + flex-1 på bokse: alle kolonner stretcher til samme højde
                  (drevet af højeste boks). */}
              <div className="flex gap-xs flex-wrap items-stretch">
                {/* Produkt-bokse for valgt dag — status-pill under (ingen send-knap, kun statusfelt) */}
                {(() => {
                  // Samleordre: beregn ordre-tags per recipeCode
                  // Produkter samles per recipeCode — vises KUN ÉN gang selv om begge ordrer har det
                  // TODO: Erstat med Supabase når klar
                  const samleordreTags: Record<string, string[]> = {}
                  if (isSamleordreMode && samleordreCtx) {
                    // Byg map: recipeCode → [stedLabel] for alle ordrer der har produktet
                    const rcToChildren: Record<string, { stedLabel: string }[]> = {}
                    for (const child of samleordreCtx.children) {
                      for (const cp of child.products) {
                        if (!rcToChildren[cp.recipeCode]) rcToChildren[cp.recipeCode] = []
                        rcToChildren[cp.recipeCode].push({ stedLabel: child.stedLabel })
                      }
                    }
                    for (const [rc, entries] of Object.entries(rcToChildren)) {
                      samleordreTags[rc] = entries.map(e => e.stedLabel)
                    }
                  }
                  return productsForSelectedDate.flatMap(({ product, day }) => {
                    const isSent = sentDayIds.has(day.id)
                    const isFocused = product.id === activeProductId
                    const ordreTagLabels = isSamleordreMode ? (samleordreTags[product.recipeCode] ?? [product.recipeName]) : undefined
                    const nodes = [
                      <div key={product.id} className="flex flex-col gap-xs">
                        <ProductBoxV2
                          product={product}
                          day={day}
                          isFocused={isFocused}
                          isSelectingReason={cancellingDayId === day.id}
                          isSent={isSent}
                          onFocus={() => setActiveProductId(product.id)}
                          onUpdateTons={(v) => updateTons(product.id, day.id, v)}
                          onUpdateMorgenTons={(v) => updateMorgenTons(product.id, day.id, v)}
                          onCancel={() => setCancellingDayId(day.id)}
                          onAbortCancel={() => setCancellingDayId(null)}
                          onConfirmCancel={(r) => cancelDay(product.id, day.id, r)}
                          onRestore={() => restoreDay(day.id)}
                          ordreTagLabels={ordreTagLabels}
                          samlesPaaEnBil={productSamlesFlags[`${product.id}__${day.id}`] ?? false}
                          onSamlesPaaEnBilChange={(v) => setProductSamles(product.id, day.id, v)}
                        />
                        {/* Status-pills fjernet 2026-06-19: aflyst-tilstand vises af ProductBoxV2 selv
                            (rød kant + "Aflyst"-tekst + Fortryd-link). Sendt/afventer-status
                            afspejles af den fælles "Send til fabrik"-knap nedenfor. */}
                      </div>,
                    ]
                    // Flow 9b (OPDATERET 2026-06-09): PLAN-pushet ekstra-bestilling vises som
                    // selvstændig boks ved siden af produktet — med "Bekræftet fabrik"-pille under.
                    if (day.ekstraTons) {
                      nodes.push(
                        <div key={`${product.id}-ekstra`} className="flex flex-col gap-xs">
                          <EkstraBestillingBox product={product} day={day} />
                          {/* "Bekræftet fabrik"-pille fjernet 2026-06-19: bekræftelsestilstand
                              håndteres nu af den fælles fabrikSendtDates-state nedenfor */}
                        </div>
                      )
                    }
                    return nodes
                  })
                })()}

                {/* "Send til fabrik" CTA — gul knap → grøn sendt-tilstand + Ret-link (samme model som bilbestilling) */}
                {productsForSelectedDate.length > 0 && (
                  /* h-full + flex-1: wrapper stretcher til samme højde som items-stretch-parent.
                     flex flex-col + flex-1 på boksen: boksen fylder wrapperens fulde højde → matcher ProductBoxV2. */
                  <div className="relative flex flex-col gap-xs">
                    {fabrikSendtDates.has(selectedPlanDate) ? (
                      /* ── Sendt-tilstand: grøn ikon-boks (ingen Ret — afsendelse til fabrik er endelig) ── */
                      <div className="w-[160px] min-h-[172px] flex-1 rounded-xl flex flex-col items-center justify-center gap-xs p-sm border border-good/30 bg-good/5">
                        <div className="my-auto flex flex-col items-center gap-xs">
                          <div className="w-10 h-10 rounded-full bg-good/15 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-good" />
                          </div>
                          <span className="font-poppins font-medium text-sm text-good text-center leading-tight">
                            Sendt til fabrik
                          </span>
                          <span className="font-inter text-xxs text-text-muted text-center px-xxs leading-tight">
                            PROD A EAST KØGE PH
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* ── Ikke sendt: gul boks-knap (beholder boks-form + ikon) ── */
                      (() => {
                        const ikkeSendteProdukter = productsForSelectedDate.filter(({ day }) => !sentDayIds.has(day.id))
                        const disabled = ikkeSendteProdukter.length === 0
                        return (
                          <button
                            onClick={() => setShowConfirmSend(true)}
                            disabled={disabled}
                            className={[
                              'w-[160px] min-h-[172px] flex-1 rounded-xl flex flex-col items-center p-sm transition-all border',
                              disabled
                                ? 'bg-surface border-hairline opacity-40 cursor-not-allowed'
                                : 'bg-yellow border-yellow hover:opacity-90 active:scale-[0.98]',
                            ].join(' ')}
                          >
                            <div className="my-auto flex flex-col items-center gap-xs">
                              <div className={`w-10 h-10 rounded-full ${disabled ? 'bg-white' : 'bg-deep-teal/15'} flex items-center justify-center`}>
                                <Truck size={20} className="text-deep-teal" />
                              </div>
                              <span className="font-poppins font-medium text-sm text-deep-teal text-center leading-tight">
                                Send til fabrik
                              </span>
                              <span className="font-inter text-xxs text-deep-teal/70 text-center px-xxs leading-tight">
                                {disabled ? 'Intet at sende' : 'Bestilling skal ske inden kl 11'}
                              </span>
                            </div>
                            <span className="font-inter text-xxs text-deep-teal/70 text-center leading-tight">
                              PROD A EAST KØGE PH
                            </span>
                          </button>
                        )
                      })()
                    )}
                    {/* Kommentar-/placeholder-række tages UD af flow (absolut, under boksen) så
                        send-boksen kan fylde wrapperens fulde højde og matche produktboksene. */}
                    <div className="absolute top-full inset-x-0 mt-xxxs flex justify-center">
                    {sentKommentarer[selectedPlanDate] ? (
                      <span
                        className="group relative inline-flex items-center gap-xxxs px-xs py-xxxs font-inter text-xs font-medium text-text-muted hover:text-deep-teal cursor-help w-[180px] justify-center"
                        aria-label={`Kommentarer sendt til fabrik: ${sentKommentarer[selectedPlanDate]}`}
                      >
                        <MessageSquare size={12} />
                        Kommentarer sendt til fabrik
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full right-0 mb-xxxs z-50 hidden group-hover:block bg-deep-teal text-white text-xs font-inter font-normal px-sm py-xs rounded-md shadow-lg whitespace-pre-line max-w-[280px] min-w-[180px] text-left leading-snug"
                        >
                          {sentKommentarer[selectedPlanDate]}
                        </span>
                      </span>
                    ) : (
                      <div className="w-[180px] h-[24px]" aria-hidden="true" />
                    )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

            {/* Kørsel */}
            <div className="mt-lg">
              <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Asfalt kørsel</h2>
              <div className="bg-white border border-hairline rounded-xl overflow-hidden">
                {activeDays.filter(day => day.date === selectedPlanDate).length === 0 && (
                  <p className="font-inter text-xs text-text-muted px-sm py-sm">Ingen kørsel denne dag</p>
                )}
                {activeDays.filter(day => day.date === selectedPlanDate).map((day, i, shownDays) => {
                  const isExpanded = kørselExpandedId === day.id
                  const isPlanlagt = kørselPlanlagtIds.has(day.id)
                  const erBekraeftet = bekraeftedeDagIds.has(day.id)
                  const orders = kørselOrders[day.id] ?? []
                  const params = kørselParams[day.id] ?? DEFAULT_KØRSEL_PARAMS
                  const singleLoadCapacity = orders.reduce((sum, o) => {
                    const vt = VEHICLE_TYPES.find(v => v.label === o.type)
                    return sum + (vt ? vt.tons * o.antal : 0)
                  }, 0)
                  const totalTrucks = orders.reduce((s, o) => s + o.antal, 0)
                  // Køretid = Google Maps-køreafstand (km × 1 min) + 10% buffer (reel kørsel vs. Google-estimat).
                  // FUNCTIONAL_FLOWS Flow 1, Trin 1 (Bilbehov-dashboard): +10% er kanonisk køretid og slår
                  // igennem i ALLE afledte tal (Afstand, Rundtid, Anbefalet).
                  const koeretidMin = Math.round(factoryKm * 1.1)
                  const aflaesningstidMin = params.aflaesningstidMin ?? 15
                  const dagInterval = params.intervalMinutes ?? 20
                  // Rundtid = 2× køretid + 15 min læsning + aflæsningstid (editerbar, prefill 15)
                  const roundTime = koeretidMin * 2 + 15 + aflaesningstidMin
                  // Starttidspunkt plads bruger editerbartfelt (startTider[0]) med prefill 06:00
                  const startPladsTid = startTider[day.id]?.[0] ?? '06:00'
                  const [rsh, rsm] = startPladsTid.split(':').map(Number)
                  const workEndMinutes = 15 * 60 + 30 // 15:30
                  const roundsPerTruck = Math.max(0, Math.floor((workEndMinutes - (rsh * 60 + rsm)) / roundTime))

                  // effective tons = planlagt + evt. ekstra fra PLAN
                  const dayTons = getEffectiveTons(day)

                  function updateOrder(id: string, field: 'type' | 'antal' | 'afregning_type', value: string | number) {
                    setKørselOrders(prev => ({
                      ...prev,
                      [day.id]: (prev[day.id] ?? []).map(o => o.id === id ? { ...o, [field]: value } : o),
                    }))
                  }
                  function removeOrder(id: string) {
                    setKørselOrders(prev => ({ ...prev, [day.id]: (prev[day.id] ?? []).filter(o => o.id !== id) }))
                  }
                  function addOrder() {
                    const newOrder: VehicleOrder = { id: `vo-${Date.now()}`, type: VEHICLE_TYPES[0].label, antal: 1 }
                    setKørselOrders(prev => ({ ...prev, [day.id]: [...(prev[day.id] ?? []), newOrder] }))
                  }
                  function updateParam<K extends keyof KørselDayParams>(key: K, value: KørselDayParams[K]) {
                    setKørselParams(prev => ({ ...prev, [day.id]: { ...(prev[day.id] ?? DEFAULT_KØRSEL_PARAMS), [key]: value } }))
                  }

                  return (
                    <div key={day.id} className={i < shownDays.length - 1 || isExpanded ? 'border-b border-hairline' : ''}>
                      {/* Hoved-række */}
                      <div className={`grid items-center gap-md px-sm py-sm transition-colors ${!isExpanded ? 'hover:bg-[#F5F5F5]' : ''}`}
                        style={{ gridTemplateColumns: '1fr auto' }}>
                        <div>
                          <p className="font-inter text-sm font-medium text-text-primary">
                            {formatWeekday(day.date)} · {formatLongDate(day.date)}
                          </p>
                          {/* effective tons = planlagt + evt. ekstra fra PLAN */}
                          <p className="font-inter text-xs text-text-muted">{dayTons} tons</p>
                        </div>
                        <div className="flex items-center gap-xxxs">
                          {isPlanlagt && !isExpanded ? (
                            <div className="flex items-center gap-xs flex-wrap justify-end">
                              <span className="inline-flex items-center gap-sm px-sm py-xxxs rounded-lg bg-[#E7F4EE] font-inter text-xs font-medium text-text-primary whitespace-nowrap">
                                <span>{orders.reduce((s, o) => s + o.antal, 0)} biler bestilt</span>
                                {/* Multi-produkt: vis "Multi-produkt" i stedet for ét sæt tal */}
                                {(() => {
                                  const dagProdukter = products.filter(p => p.days.some(d => d.date === day.date))
                                  if (dagProdukter.length >= 2) {
                                    return (
                                      <>
                                        <span className="text-text-muted">·</span>
                                        <span>{dagProdukter.length} produkter · per-produkt interval</span>
                                      </>
                                    )
                                  }
                                  return (
                                    <>
                                      <span className="text-text-muted">·</span>
                                      <span>Interval {params.intervalMinutes != null ? `${params.intervalMinutes} min` : '–'}</span>
                                      <span className="text-text-muted">·</span>
                                      <span>Første læs {params.firstLoadTime || '–'}</span>
                                    </>
                                  )
                                })()}
                              </span>
                              {/* Vognmand status badge — 3-state: Planlagt / Sendt til vognmand / Bekræftet */}
                              {erBekraeftet ? (
                                // downstream/Udførsel-tilstand — ikke seedet i planlægnings-demoen
                                <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good font-inter text-xs font-semibold text-white whitespace-nowrap">
                                  Bekræftet vognmand
                                </span>
                              ) : sendtTilVognmandDates.has(day.date) ? (
                                <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-yellow/25 font-inter text-xs font-semibold text-[#8A6A00] whitespace-nowrap">
                                  Sendt til vognmand
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-[#F5F5F5] font-inter text-xs font-semibold text-text-muted whitespace-nowrap">
                                  Planlagt
                                </span>
                              )}
                              {/* Ret-knap skjules når dagen er bekræftet af vognmand (FUNCTIONAL_FLOWS Trin 2) */}
                              {!erBekraeftet && (
                                <div className="flex">
                                  <button
                                    onClick={() => {
                                      setKørselExpandedId(day.id)
                                      // Seed defaults så number-inputs ikke snapper tilbage ved redigering
                                      setKørselParams(prev => ({
                                        ...prev,
                                        [day.id]: {
                                          ...DEFAULT_KØRSEL_PARAMS,
                                          ...(prev[day.id] ?? {}),
                                          aflaesningstidMin: prev[day.id]?.aflaesningstidMin ?? 15,
                                          intervalMinutes: prev[day.id]?.intervalMinutes ?? 20,
                                          firstLoadTime: prev[day.id]?.firstLoadTime ?? '06:00',
                                        },
                                      }))
                                      if (startTider[day.id]?.[0] == null) {
                                        updateStartTid(day.id, 0, '06:00')
                                      }
                                    }}
                                    className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-lg border border-hairline font-inter text-xs font-medium text-dark-teal hover:bg-surface-2 transition-colors whitespace-nowrap min-h-touch"
                                  >
                                    Ret
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (isExpanded) {
                                  gemKørsel(day.id)
                                } else {
                                  setKørselExpandedId(day.id)
                                  if ((kørselOrders[day.id] ?? []).length === 0) {
                                    setKørselOrders(prev => ({
                                      ...prev,
                                      [day.id]: [{ id: `vo-${Date.now()}`, type: '', antal: 1 }],
                                    }))
                                  }
                                  // Seed defaults så number-inputs ikke snapper tilbage ved redigering
                                  setKørselParams(prev => ({
                                    ...prev,
                                    [day.id]: {
                                      ...DEFAULT_KØRSEL_PARAMS,
                                      ...(prev[day.id] ?? {}),
                                      aflaesningstidMin: prev[day.id]?.aflaesningstidMin ?? 15,
                                      intervalMinutes: prev[day.id]?.intervalMinutes ?? 20,
                                      firstLoadTime: prev[day.id]?.firstLoadTime ?? '06:00',
                                    },
                                  }))
                                  if (startTider[day.id]?.[0] == null) {
                                    updateStartTid(day.id, 0, '06:00')
                                  }
                                }
                              }}
                              className="inline-flex items-center gap-xxxs font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                            >
                              {isExpanded ? 'Gem kørsel' : 'Planlæg kørsel'}
                            </button>
                          )}
                        </div>
                      </div>


                      {/* Expand */}
                      {isExpanded && (
                        <div className="mx-sm mb-lg rounded-xl border border-dark-teal/20 bg-soft-aqua shadow-sm flex flex-col gap-md p-md">

                          {/* Bilbehov — read-only beregningsoverblik (FLYTTET ØVERST 2026-06-15). FUNCTIONAL_FLOWS Flow 1, Trin 1 — LÅST 2026-06-10 */}
                          {orders.length > 0 && (() => {
                            const harBiler = totalTrucks > 0 && singleLoadCapacity > 0
                            // avgTons fra de faktisk valgte biler; 30 = synligt fallback (FF Flow 1 Trin 1, præcisering 2026-06-15)
                            const avgTons = harBiler ? Math.round(singleLoadCapacity / totalTrucks) : 30
                            const recommended = roundsPerTruck > 0 ? Math.ceil(dayTons / (avgTons * roundsPerTruck)) : 0
                            // Kapacitet-dækket: valgte bilers kapacitet over dagen = kapacitet/runde × runder pr. bil
                            const totalCapacity = singleLoadCapacity * roundsPerTruck
                            const capacityOk = harBiler && totalCapacity >= dayTons
                            const tonsMangler = Math.max(0, dayTons - totalCapacity)
                            const dagProdukter = products
                              .map(p => ({ product: p, dayEntry: p.days.find(d => d.date === day.date) }))
                              .filter((x): x is { product: MockProduct; dayEntry: DayPlan } => !!x.dayEntry)
                            // Forventet sidste bil pr. produkt — P1: startPladsTid + dagInterval.
                            // P2+: altid sekventielt direkte efter forrige produkts slut (samme biler i loop).
                            let cursorMin: number | null = null
                            const slutPerProdukt = dagProdukter.map(({ product, dayEntry }, pi) => {
                              const tons = getEffectiveTons(dayEntry)
                              const runder = harBiler ? Math.ceil(tons / singleLoadCapacity) : 0
                              let startMin: number | null = null
                              if (pi === 0) {
                                // Produkt 1: bruger startPladsTid (prefill 06:00) + dagInterval (prefill 20)
                                const [h, m] = startPladsTid.split(':').map(Number)
                                startMin = h * 60 + m
                              } else {
                                // P2+: starter sekventielt direkte efter forrige produkts slut
                                startMin = cursorMin
                              }
                              const slut = (harBiler && startMin != null) ? startMin + runder * roundTime : null
                              cursorMin = slut
                              return { product, slut }
                            })
                            const nogenKendt = slutPerProdukt.some(s => s.slut != null)
                            const fmtTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`
                            return (
                              <div>
                                <div className="flex items-center gap-sm mb-xs flex-wrap">
                                  <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest">Bilbehov</p>
                                  <span className="inline-flex items-center gap-xxxs font-inter text-xxs text-text-muted">
                                    <Info size={13} className="text-light-aqua" />
                                    Beregnet ud fra tonnage, fabrik og rundtid
                                  </span>
                                  {/* Kapacitet-dækket-indikator — grøn når valgte biler dækker forventet tons (genindført 2026-06-15) */}
                                  <span className={`inline-flex items-center gap-xxxs px-xs py-xxxs rounded-md border font-inter text-xxs font-semibold ${capacityOk ? 'bg-good-bg border-good/30 text-good' : 'bg-bad-bg border-bad/30 text-bad'}`}>
                                    {capacityOk ? 'Kapacitet dækket' : `${tonsMangler} Tons mangler`}
                                  </span>
                                </div>
                                {/* 8 bokse: 3 editerbare (gul) + 5 read-only (hvid) */}
                                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-xs">
                                  {/* Boks 1: Forventet tons (grøn, read-only) */}
                                  <div className="bg-good-bg border border-good/20 rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Forventet tons</span>
                                    <span className="font-poppins text-xl font-bold text-deep-teal tabular-nums leading-none mt-auto">{dayTons}<span className="font-inter text-xs font-medium text-text-muted ml-xxxs">Tons</span></span>
                                    <span className="font-inter text-xxs text-text-muted">Incl. ekstra best.</span>
                                  </div>
                                  {/* Boks 2: Starttidspunkt plads (gul, editerbar) — to-vejs via startTider[0] */}
                                  <div className="bg-warn-bg border border-hairline rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Starttidspunkt plads</span>
                                    <input
                                      type="time"
                                      value={startTider[day.id]?.[0] ?? '06:00'}
                                      onChange={e => updateStartTid(day.id, 0, e.target.value || null)}
                                      className="font-poppins text-xl font-bold text-deep-teal bg-transparent border-0 p-0 tabular-nums focus:outline-none mt-auto leading-none h-[1lh] [&::-webkit-calendar-picker-indicator]:hidden"
                                    />
                                    <span className="font-inter text-xxs text-text-muted">Kan rettes</span>
                                  </div>
                                  {/* Boks 3: Forventet aflæsning (gul, editerbar) */}
                                  <div className="bg-warn-bg border border-hairline rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Forventet aflæsning (Minutter)</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      min={1}
                                      value={params.aflaesningstidMin ?? ''}
                                      onChange={e => updateParam('aflaesningstidMin', e.target.value === '' ? undefined : Math.max(1, Number(e.target.value)))}
                                      className="font-poppins text-xl font-bold text-deep-teal bg-transparent border-0 p-0 tabular-nums focus:outline-none mt-auto leading-none h-[1lh] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="font-inter text-xxs text-text-muted">Kan rettes</span>
                                  </div>
                                  {/* Boks 4: Interval (gul, editerbar) — flyttet fra "Starttider"-sektion */}
                                  <div className="bg-warn-bg border border-hairline rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Interval (Minutter)</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      min={1}
                                      value={params.intervalMinutes ?? ''}
                                      onChange={e => updateParam('intervalMinutes', e.target.value === '' ? undefined : Math.max(1, Number(e.target.value)))}
                                      className="font-poppins text-xl font-bold text-deep-teal bg-transparent border-0 p-0 tabular-nums focus:outline-none mt-auto leading-none h-[1lh] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="font-inter text-xxs text-text-muted">Kan rettes</span>
                                  </div>
                                  {/* Boks 5: Anbefalet (grøn, read-only) */}
                                  <div className="bg-good-bg border border-good/20 rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Anbefalet</span>
                                    <span className="font-poppins text-xl font-bold text-deep-teal tabular-nums leading-none mt-auto">{recommended}<span className="font-inter text-xs font-medium text-text-muted ml-xxxs">biler</span></span>
                                    <span className="font-inter text-xxs text-text-muted">{harBiler ? `á gns. ${avgTons} Tons` : `antaget gns. ${avgTons} Tons`}</span>
                                  </div>
                                  {/* Boks 6: Runder (grøn, read-only) */}
                                  <div className="bg-good-bg border border-good/20 rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Runder</span>
                                    <span className="font-poppins text-xl font-bold text-deep-teal tabular-nums leading-none mt-auto">{roundsPerTruck}<span className="font-inter text-xs font-medium text-text-muted ml-xxxs">pr. bil</span></span>
                                    <span className="font-inter text-xxs text-text-muted">{roundTime} M. pr. runde</span>
                                  </div>
                                  {/* Boks 7: Afstand til fabrik (grøn, read-only) */}
                                  <div className="bg-good-bg border border-good/20 rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Afstand til fabrik</span>
                                    <span className="font-poppins text-xl font-bold text-deep-teal tabular-nums leading-none mt-auto">{factoryKm}<span className="font-inter text-xs font-medium text-text-muted ml-xxxs">km</span></span>
                                    <span className="font-inter text-xxs text-text-muted">{koeretidMin} Minutter</span>
                                  </div>
                                  {/* Boks 8: Forventet sidste bil (grøn, read-only) — nu altid beregnet for P1 via prefill */}
                                  <div className="bg-good-bg border border-good/20 rounded-lg p-sm flex flex-col gap-xxxs min-h-[78px]">
                                    <span className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-wider">Forventet sidste bil</span>
                                    {!harBiler ? (
                                      <span className="font-inter text-xs text-text-muted mt-auto">Vælg biler først</span>
                                    ) : !nogenKendt ? (
                                      <span className="font-inter text-xs text-text-muted mt-auto leading-snug">Afventer starttider og interval</span>
                                    ) : (
                                      <div className="flex flex-col gap-xxs mt-auto">
                                        {slutPerProdukt.map((s, i) => (
                                          <div key={s.product.id} className="flex items-center gap-xs">
                                            <span className="font-inter text-xxs font-bold text-white bg-deep-teal rounded-sm px-xxxs tracking-wide">P{i + 1}</span>
                                            <span className="font-poppins text-md font-bold text-deep-teal tabular-nums leading-none">{s.slut != null ? fmtTime(s.slut) : '–'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}

                          <hr className="border-hairline" />

                          {/* Vognmand + Afregning — på én række */}
                          <div className="flex items-end gap-sm">
                            {/* Vognmand */}
                            <div className="flex-1">
                              <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Vognmand</p>
                              <select
                                value={dagVognmand[day.id] ?? DEFAULT_VOGNMAND_ID}
                                onChange={e => setDagVognmand(prev => ({ ...prev, [day.id]: e.target.value }))}
                                className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                              >
                                {MOCK_VOGNMAEND.map(vm => (
                                  <option key={vm.id} value={vm.id}>{vm.navn}{vm.id === DEFAULT_VOGNMAND_ID ? ' (primær)' : ''}</option>
                                ))}
                              </select>
                            </div>

                            {/* Afregning */}
                            <div>
                              <p className="font-inter text-xs font-semibold text-text-primary mb-xs">Afregning</p>
                              {/* Segmented control — samme mønster som Produkt 2+ direktekørsel-toggle */}
                              <div className="flex bg-surface-2 rounded-md p-xxxs border border-hairline w-fit">
                                {(['akkord', 'time'] as const).map(type => {
                                  const isActive = (dagAfregning[day.id] ?? 'akkord') === type
                                  const label = type === 'akkord' ? 'Akkord' : 'Timeløn'
                                  return (
                                    <button
                                      key={type}
                                      onClick={() => setDagAfregning(prev => ({ ...prev, [day.id]: type }))}
                                      aria-pressed={isActive}
                                      className={[
                                        'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                                        isActive
                                          ? 'bg-dark-teal text-white'
                                          : 'text-text-muted hover:bg-soft-aqua',
                                      ].join(' ')}
                                    >
                                      {label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Biler — vognmandens flåde (kompakt liste) */}
                          <div>
                            <p className="font-inter text-xxs font-semibold text-text-muted uppercase tracking-widest mb-xxxs">Biler — vognmandens flåde</p>
                            {/* Hver bestilt bil får et unikt bil-ordrenummer (ordrenr-DDMMYY-NN, løbenr pr. dag) der
                                sendes til vognmanden — som behandler hver bil som en separat ordre. LÅST 2026-06-13. */}
                            <p className="font-inter text-xxs text-text-muted mb-xs">Hver bil sendes som separat ordre med eget nummer til vognmanden.</p>
                            {orders.length > 0 && (
                              <div className="rounded-lg border border-hairline overflow-hidden bg-white">
                                {orders.map((o, idx) => {
                                  const vt = VEHICLE_TYPES.find(v => v.label === o.type)
                                  return (
                                    <div
                                      key={o.id}
                                      className={idx < orders.length - 1 ? 'border-b border-hairline' : ''}
                                    >
                                      <div
                                        className="grid items-center gap-xs px-xs"
                                        style={{ gridTemplateColumns: '2rem 1fr 5.625rem 4rem 7.5rem 2rem' }}
                                      >
                                        <span className="w-8 h-8 rounded-md bg-soft-aqua text-deep-teal flex items-center justify-center flex-shrink-0">
                                          <Truck size={16} />
                                        </span>
                                        {/* Biltype — én linje */}
                                        <div className="min-w-0 py-xs">
                                          <select
                                            value={o.type}
                                            onChange={e => updateOrder(o.id, 'type', e.target.value)}
                                            className="min-w-0 font-inter text-xs font-medium text-text-primary bg-transparent border-none outline-none cursor-pointer focus:text-deep-teal"
                                          >
                                            <option value="">Vælg biltype</option>
                                            <option value="Egen bil">Egen bil</option>
                                            {VEHICLE_TYPES.map(v => (
                                              <option key={v.label} value={v.label}>{v.label} · {v.tons} Tons</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex items-center border border-hairline rounded-md overflow-hidden bg-white">
                                          <button onClick={() => updateOrder(o.id, 'antal', Math.max(1, o.antal - 1))} className="w-8 h-8 font-inter text-sm text-text-muted hover:bg-soft-aqua transition-colors" aria-label="Færre">−</button>
                                          <span className="px-xxs font-inter text-xs font-semibold text-text-primary w-[26px] text-center tabular-nums">{o.antal}</span>
                                          <button onClick={() => updateOrder(o.id, 'antal', o.antal + 1)} className="w-8 h-8 font-inter text-sm text-text-muted hover:bg-soft-aqua transition-colors" aria-label="Flere">+</button>
                                        </div>
                                        <span className="font-poppins text-xs font-semibold text-deep-teal tabular-nums w-[64px] text-right whitespace-nowrap">
                                          {vt ? vt.tons * o.antal : 0} Tons
                                        </span>
                                        {/* Per-række afregnings-toggle — arver dag-default, sticky override ved klik.
                                            FF-regel: Egen bil = altid timeløn (disabled). Placeret som selvst. grid-kolonne til højre for Tons. */}
                                        {(() => {
                                          const isEgenBil = o.type === 'Egen bil'
                                          const rowAfr: 'akkord' | 'time' = isEgenBil
                                            ? 'time'
                                            : (o.afregning_type ?? (dagAfregning[day.id] ?? 'akkord'))
                                          return (
                                            <div className={['flex bg-surface-2 rounded-md p-xxxs border border-hairline justify-self-end', isEgenBil ? 'opacity-60' : ''].join(' ').trim()}>
                                              {(['akkord', 'time'] as const).map(type => {
                                                const isActive = rowAfr === type
                                                const label = type === 'akkord' ? 'Akkord' : 'Timeløn'
                                                return (
                                                  <button
                                                    key={type}
                                                    disabled={isEgenBil}
                                                    onClick={() => !isEgenBil && updateOrder(o.id, 'afregning_type', type)}
                                                    aria-pressed={isActive}
                                                    className={[
                                                      'px-xs py-xxxs rounded-sm font-inter text-xxs font-semibold transition-colors',
                                                      isActive
                                                        ? 'bg-dark-teal text-white'
                                                        : 'text-text-muted hover:bg-soft-aqua',
                                                      isEgenBil ? 'cursor-not-allowed' : '',
                                                    ].join(' ')}
                                                  >
                                                    {label}
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          )
                                        })()}
                                        <button onClick={() => removeOrder(o.id)} className="w-8 h-8 rounded-md text-text-muted hover:bg-bad-bg hover:text-bad flex items-center justify-center transition-colors" aria-label="Fjern">
                                          <X size={15} />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            <button
                              onClick={addOrder}
                              className="inline-flex items-center gap-xs font-inter text-xs font-semibold text-dark-teal bg-white border border-dashed border-light-aqua rounded-full px-sm py-xs hover:bg-soft-aqua hover:border-dark-teal transition-colors mt-xs"
                            >
                              <Plus size={15} />
                              Tilføj biltype
                            </button>
                          </div>

                          {/* Starttider og intervaller — produkter stablet LODRET med connector (skalerer til 3+) */}
                          {orders.length > 0 && (() => {
                            const dagProdukter = products
                              .map(p => ({ product: p, dayEntry: p.days.find(d => d.date === day.date) }))
                              .filter((x): x is { product: MockProduct; dayEntry: DayPlan } => !!x.dayEntry)
                            if (dagProdukter.length === 0) return null
                            const availableTypes = Array.from(new Set(orders.filter(o => o.antal > 0).map(o => o.type)))
                            return (
                              <>
                                <hr className="border-hairline" />
                                <div>
                                  <h4 className="font-poppins text-lg font-semibold text-deep-teal">Starttider og intervaller</h4>
                                  <p className="font-inter text-xs text-text-muted mb-sm">Anbefaling til vognmand for de første biler. Ikke bindende — vognmand kan afvige.</p>
                                  <div className="flex flex-col">
                                    {dagProdukter.map(({ product, dayEntry }, pi) => {
                                      const tons = getEffectiveTons(dayEntry)
                                      const isFirst = pi === 0
                                      // P2+ fjernet — sektionen viser kun Produkt 1 (Bil 1/2/3 start-rækkefølge + starttider)
                                      if (!isFirst) return null
                                      return (
                                        <div key={product.id}>
                                          <div className="bg-white border border-hairline rounded-lg p-sm">
                                            {/* Samlet blød pille: Produkt N · navn · tons */}
                                            <div className="mb-sm">
                                              <span className="inline-flex items-center bg-soft-aqua rounded-full px-sm py-xxs font-inter text-xs">
                                                <span className="font-semibold text-deep-teal">Produkt {pi + 1}</span>
                                                <span className="text-light-aqua mx-xxs">·</span>
                                                <span className="font-poppins font-semibold text-text-primary">{product.recipeName}</span>
                                                <span className="text-light-aqua mx-xxs">·</span>
                                                <span className="font-poppins font-semibold text-deep-teal tabular-nums">{tons} Tons</span>
                                              </span>
                                            </div>

                                            {isFirst ? (
                                              /* Produkt 1: start-rækkefølge (3 første biler) + starttider.
                                                 Interval er flyttet til Bilbehov-dashboardet (Boks 4).
                                                 Bil-select: defaults til de 3 første bestilte biler (flåde[pos]).
                                                 Starttid: pos 0 = startPladsTid (to-vejs via dashboard); pos 1/2 = pos 0 + pos×dagInterval. */
                                              <div className="flex flex-col gap-xs">
                                                {(() => {
                                                  // Præudfyld flåde fra bestilte biler — reaktiv default, manuelle ændringer vinder
                                                  const flåde = orders.flatMap(o => Array(o.antal).fill(o.type) as string[])
                                                  // Beregn default starttid for pos N: startPladsTid + N×dagInterval
                                                  function defaultStartTid(pos: number): string {
                                                    const [bh, bm] = startPladsTid.split(':').map(Number)
                                                    const total = bh * 60 + bm + pos * dagInterval
                                                    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
                                                  }
                                                  return ([0, 1, 2] as const).map(pos => {
                                                    const currentValue = (startRaekkefoelge[day.id] ?? [null, null, null])[pos]
                                                    const currentTid = (startTider[day.id] ?? [null, null, null])[pos]
                                                    return (
                                                      <div key={pos} className="grid gap-xs items-end" style={{ gridTemplateColumns: '1fr 130px' }}>
                                                        <div className="min-w-0">
                                                          <p className="font-inter text-xxs text-text-muted mb-xxxs">Bil nr. {pos + 1}</p>
                                                          <select
                                                            value={currentValue ?? (flåde[pos] ?? '')}
                                                            onChange={e => updateStartRaekkefoelge(day.id, pos, e.target.value || null)}
                                                            className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                                          >
                                                            <option value="">Ingen anbefaling</option>
                                                            {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                          </select>
                                                        </div>
                                                        <div>
                                                          <p className="font-inter text-xxs text-text-muted mb-xxxs">Starttid plads</p>
                                                          <input
                                                            type="time"
                                                            value={currentTid ?? defaultStartTid(pos)}
                                                            onChange={e => updateStartTid(day.id, pos, e.target.value || null)}
                                                            className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal"
                                                          />
                                                        </div>
                                                      </div>
                                                    )
                                                  })
                                                })()}
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </>
                            )
                          })()}

                          {/* Kommentar til chauffør — sendes med ordren til chauffør-appen (se FUNCTIONAL_FLOWS Flow 1 Trin 8) */}
                          <div className="flex flex-col gap-xxxs">
                            <label className="font-inter text-xxs text-text-muted">Kommentar til chauffør</label>
                            <textarea
                              value={kørselKommentar[day.id] ?? ''}
                              onChange={e => setKørselKommentar(prev => ({ ...prev, [day.id]: e.target.value }))}
                              rows={2}
                              placeholder="Fx 'Brug bagvejen', 'Aflæsningssted flyttet 50m mod vest', 'Støjrestriktion efter 22'..."
                              className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal transition-colors resize-none leading-relaxed"
                            />
                          </div>

                          {/* Gem */}
                          <div className="flex justify-end gap-xs pt-xxxs">
                            <button
                              onClick={() => setKørselExpandedId(null)}
                              className="font-inter text-xs text-text-muted hover:text-text-primary px-xs py-xxxs"
                            >Annullér</button>
                            <button
                              onClick={() => gemKørsel(day.id)}
                              className="font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90"
                            >Gem kørsel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Send til vognmand — section-level afledt tilstand.
                    Vises KUN når der er mindst én planlagt dag.
                    Gul = usendte planlagte dage findes; grøn = alle planlagte dage er sendt.
                    Klik sender ALLE usendte planlagte dage (allerede-sendte røres ikke).
                    TODO: Erstat med Supabase når klar — insert i vognmand_bestilling-tabel */}
                {(() => {
                  const planlagteDage = activeDays.filter(d => kørselPlanlagtIds.has(d.id))
                  if (planlagteDage.length === 0) return null
                  const usendteDage = planlagteDage.filter(d => !sendtTilVognmandDates.has(d.date))
                  const harUsendte = usendteDage.length > 0
                  return (
                    <div className="border-t border-hairline px-sm py-sm flex items-center justify-between">
                      {harUsendte ? (
                        <button
                          type="button"
                          onClick={() => setSendtTilVognmandDates(prev => new Set([...prev, ...usendteDage.map(d => d.date)]))}
                          className="inline-flex items-center font-inter text-sm font-semibold text-deep-teal bg-yellow px-sm py-xs rounded-lg hover:opacity-90 active:scale-[0.98] transition-all min-h-[44px]"
                        >
                          Send til vognmand
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center font-inter text-sm font-semibold text-white bg-good px-sm py-xs rounded-lg min-h-[44px] cursor-default"
                        >
                          Sendt til vognmand
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

          {/* ── Materiel ─────────────────────────────────────────── */}
          <section>
            <h2 className="font-poppins font-semibold text-xl text-text-primary mb-sm">Materiellevering</h2>

            {/* Ny-etape container-niveau notifikation.
                NOTE: MaterielNyEtapeTilstand (presenter) indeholder allerede et internt
                warn-bg-banner med samme budskab ("Planlæg materiel-transport for etape N").
                Det banner er synligt øverst i presenter-kortet, umiddelbart under denne
                overskrift — et yderligere container-banner her ville være redundant.
                Vi stoler på presenter-banneret og tilføjer i stedet kun en diskret
                sektion-label-tilføjelse via mb-justering nedenfor.
                Kilde: Round 4b-opgave, kriterium (b). */}
            {!isSamleordreMode && materielUiState === 'ny-etape' && (
              <p className="font-inter text-xs text-text-muted mb-xs">
                Ny etape planlagt — materiel-transport skal planlægges
              </p>
            )}

            {/* Samleordre: vis sub-header pr. ordre */}
            {isSamleordreMode && samleordreCtx && (
              <>
                {samleordreCtx.children.map((child, childIdx) => (
                  <div key={child.orderNumber} className={childIdx > 0 ? 'mt-md' : undefined}>
                    {/* Sub-header pr. ordre */}
                    <div className="flex items-center gap-xs mb-xs">
                      <span
                        className={[
                          'w-[8px] h-[8px] rounded-full flex-shrink-0',
                          child.isAnchor
                            ? 'bg-yellow shadow-[0_0_0_2px_rgba(254,238,50,0.35)]'
                            : 'bg-transparent border-2 border-hairline-2',
                        ].join(' ')}
                        aria-hidden="true"
                      />
                      <h3 className="font-poppins font-semibold text-md text-deep-teal">
                        {child.udfoerelseSted}
                      </h3>
                    </div>

                    {child.resources.length > 0 ? (
                      <div className="bg-white border border-hairline rounded-xl overflow-hidden mb-sm">
                        {child.resources.map((r, i) => (
                          <div key={r.id} className={i < child.resources.length - 1 ? 'border-b border-hairline' : ''}>
                            <div
                              className="grid items-center gap-md px-sm py-sm"
                              style={{ gridTemplateColumns: '36px 1fr auto' }}
                            >
                              <div className="w-9 h-9 rounded-md bg-soft-aqua flex items-center justify-center text-deep-teal">
                                <Truck size={16} />
                              </div>
                              <div>
                                <p className="font-inter text-sm font-medium text-text-primary">{r.description}</p>
                                <div className="flex items-center gap-xs mt-xxxs">
                                  <span className="font-inter text-xs text-text-muted tabular-nums">{r.plantNumber}</span>
                                </div>
                              </div>
                              <div>
                                {/* Vognmand status badge — 3-state — re-keyed til transportKey(resourceId, etapeId) (Round 4a). */}
                                {(() => {
                                  const etapeId = aktivEtape?.id ?? 0
                                  const key = transportKey(r.id, etapeId)
                                  if (r.status !== 'planlagt') {
                                    return (
                                      <span className="inline-flex items-center px-xs py-xxxs rounded-lg font-inter text-xs font-semibold whitespace-nowrap bg-surface-2 text-text-muted">
                                        Ikke planlagt
                                      </span>
                                    )
                                  }
                                  if (bekraeftedeEnhederIds.has(key)) {
                                    return (
                                      <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good-bg font-inter text-xs font-semibold text-good whitespace-nowrap">
                                        Bekræftet vognmand
                                      </span>
                                    )
                                  }
                                  if (materielSendteEnhederIds.has(key)) {
                                    return (
                                      <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-warn-bg font-inter text-xs font-semibold text-text-secondary whitespace-nowrap">
                                        Sendt til vognmand
                                      </span>
                                    )
                                  }
                                  return (
                                    <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-surface-2 font-inter text-xs font-semibold text-text-muted whitespace-nowrap">
                                      Planlagt
                                    </span>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-hairline rounded-xl px-sm py-sm mb-sm flex items-center gap-xs text-text-muted">
                        <span className="font-inter text-sm">Ingen materiel planlagt</span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Normal mode: etape-bevidste presentere (Round 4a) */}
            {!isSamleordreMode && (() => {
              // Brancher på materielUiState — afledt af selectedPlanDate + etaper
              if (materielUiState === 'planlaeg' && aktivEtape) {
                return (
                  <>
                    <MaterielPlanlaegTilstand
                      resources={materielResources}
                      etape={aktivEtape}
                      transportPlaner={transportPlaner}
                      onChange={(resourceId, patch) =>
                        handleTransportChange(resourceId, aktivEtape.id, patch)
                      }
                      onGem={(resourceId) =>
                        markTransportPlanlagt(resourceId, aktivEtape.id)
                      }
                      onSend={() => handleMaterielSend(aktivEtape)}
                    />
                    <button
                      type="button"
                      onClick={() => { setTilfoejMaterielOpen(true); setMaterielSoeg('') }}
                      className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border border-hairline rounded-xl bg-surface hover:bg-surface-2 transition-colors mt-xxxs"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Tilføj materiel
                    </button>
                  </>
                )
              }
              if (materielUiState === 'ny-etape' && aktivEtape) {
                return (
                  <>
                    <MaterielNyEtapeTilstand
                      resources={materielResources}
                      etape={aktivEtape}
                      transportPlaner={transportPlaner}
                      onChange={(resourceId, patch) =>
                        handleTransportChange(resourceId, aktivEtape.id, patch)
                      }
                      onGem={(resourceId) =>
                        markTransportPlanlagt(resourceId, aktivEtape.id)
                      }
                      onSend={() => handleMaterielSend(aktivEtape)}
                    />
                    <button
                      type="button"
                      onClick={() => { setTilfoejMaterielOpen(true); setMaterielSoeg('') }}
                      className="w-full flex items-center justify-center gap-xs py-xs font-inter text-sm text-text-muted border border-hairline rounded-xl bg-surface hover:bg-surface-2 transition-colors mt-xxxs"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Tilføj materiel
                    </button>
                  </>
                )
              }
              if (materielUiState === 'paa-pladsen' && aktivEtape) {
                return (
                  <MaterielPaaPladsenTilstand
                    resources={materielResources}
                    etape={aktivEtape}
                    transportPlaner={transportPlaner}
                  />
                )
              }
              // dvale (gap mellem etaper eller dag uden etape)
              const naestEtape = etaper.find(e => e.firstDay > selectedPlanDate)
              return (
                <MaterielDvaleTilstand
                  naestEtapeStartDato={naestEtape?.firstDay}
                />
              )
            })()}

          </section>

          </div>
          )}

          {activeMode === 'udfoersel' && (
            <UdfoerselContent
              forundersoegelseFotos={photos.filter(p => p.source === 'forundersoegelse')}
              onAddPhotos={(newPhotos) => setPhotos(prev => [...prev, ...newPhotos])}
              // Bekræftelsen følger den valgte dato-pille — dashboardet hænger sammen med datoen (LÅST 2026-06-13).
              // Hver dag har sin egen vognmand-bekræftelse; matcher selectedDate ingen aktiv dag → undefined (= "Afventer").
              vognmandBekraeftelse={(() => {
                const d = activeDays.find(day => day.date === selectedPlanDate)
                return d ? vognmandBekraeftelser[d.id] : undefined
              })()}
              vognmandMaterielBekraeftelse={vognmandMaterielBekraeftelse}
              products={products}
              isSamleordreMode={isSamleordreMode}
              samleordreCtx={samleordreCtx}
              samleordreTabOrderNr={samleordreTabOrderNr}
              makeOrdredetaljerCard={makeOrdredetaljerCard}
              renderOrdredetaljerCollapsedPille={renderOrdredetaljerCollapsedPille}
              selectedDate={selectedPlanDate}
              onSelectDate={setSelectedPlanDate}
              ekstraLinjer={ekstraLinjer}
              setEkstraLinjer={setEkstraLinjer}
              ekstraSent={ekstraSent}
              setEkstraSent={setEkstraSent}
              materielUiState={materielUiState}
              etaper={etaper}
              transportPlaner={transportPlaner}
            />
          )}

          {activeMode === 'afregning' && (
            <AfregningContent
              vognmandBekraeftelse={(() => {
                // Følger valgt dato-pille — identisk mønster som UdfoerselContent (LÅST 2026-06-22).
                const afrDay = activeDays.find(d => d.date === selectedPlanDate) ?? activeDays[0]
                return afrDay ? vognmandBekraeftelser[afrDay.id] : undefined
              })()}
              vognmandMaterielBekraeftelse={vognmandMaterielBekraeftelse}
              todayDay={activeDays.find(d => d.date === selectedPlanDate) ?? activeDays[0]}
              biltypeAfregning={(() => {
                // Fase 2: udled biltype→afregningsform fra Planlægningens kørselOrders for afregningsdagen.
                // Slår igennem i AfregningContent som base-form pr. bil (ovenpå: materiel + 1,5-times-override).
                // TODO: Erstat med Supabase når klar — afregningsform pr. biltype gemmes på kørselordre-rækken
                const afrDay = activeDays.find(d => d.date === selectedPlanDate) ?? activeDays[0]
                const dayId = afrDay?.id
                if (!dayId) return {}
                const map: Record<string, 'time' | 'akkord'> = {}
                for (const o of kørselOrders[dayId] ?? []) {
                  map[o.type] = o.type === 'Egen bil' ? 'time' : (o.afregning_type ?? dagAfregning[dayId] ?? 'akkord')
                }
                return map
              })()}
              isSamleordreMode={isSamleordreMode}
              samleordreCtx={samleordreCtx}
              samleordreTabOrderNr={samleordreTabOrderNr}
              recept={recept}
              tonsAnkommet={tonsAnkommet}
              forventetUdlagtM2={forventetUdlagtM2}
              faktiskRegistrering={faktiskRegistrering}
              visUdlaegningInput={visUdlaegningInput}
              onSetVisUdlaegningInput={setVisUdlaegningInput}
              onGemFaktisk={gemFaktisk}
              demoTonsIDag={DEMO_TONS_I_DAG}
              demoArealIDag={DEMO_AREAL_I_DAG}
              demoTykkelse={DEMO_TYKKELSE}
              makeOrdredetaljerCard={makeOrdredetaljerCard}
              renderOrdredetaljerCollapsedPille={renderOrdredetaljerCollapsedPille}
              products={products}
              selectedDate={selectedPlanDate}
              onSelectDate={setSelectedPlanDate}
              harEkstraarbejde={ekstraSent && ekstraLinjer.length > 0}
            />
          )}

        </main>
      </div>


      {/* ── Fjern-modal ──────────────────────────────────────────────── */}
      {fjernModalResource && (
        <FjernModal
          resource={fjernModalResource}
          onConfirm={() => removeResource(fjernModalResource.id)}
          onCancel={() => setFjernModalId(null)}
        />
      )}

      {/* ── Tilføj materiel-modal ─────────────────────────────────── */}
      {tilfoejMaterielOpen && (() => {
        const soegLower = materielSoeg.toLowerCase()
        const filtered = STANDARD_MATERIEL_KATALOG.filter(m =>
          m.description.toLowerCase().includes(soegLower) ||
          m.plantNumber.toLowerCase().includes(soegLower)
        )
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tilfoej-materiel-modal-title"
          >
            {/* Luk på klik udenfor */}
            <button
              type="button"
              aria-label="Luk dialog"
              onClick={() => setTilfoejMaterielOpen(false)}
              className="absolute inset-0 bg-deep-teal/40"
            />
            <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-md flex flex-col gap-md p-lg max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between gap-sm">
                <h2
                  id="tilfoej-materiel-modal-title"
                  className="font-poppins font-semibold text-lg text-deep-teal leading-tight"
                >
                  Tilføj materiel
                </h2>
                <button
                  type="button"
                  aria-label="Luk"
                  onClick={() => setTilfoejMaterielOpen(false)}
                  className="flex items-center justify-center w-[44px] h-[44px] rounded-xl border border-hairline text-text-muted hover:text-text-primary hover:border-hairline-2 transition-colors"
                >
                  ✕
                </button>
              </div>
              {/* Søgefelt */}
              <input
                type="search"
                placeholder="Søg på navn eller anlægsnr."
                value={materielSoeg}
                onChange={e => setMaterielSoeg(e.target.value)}
                className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-lg px-sm py-xs focus:outline-none focus:border-deep-teal transition-colors"
              />
              {/* Katalog-liste */}
              <div className="flex flex-col divide-y divide-hairline overflow-y-auto -mx-lg px-lg">
                {filtered.length === 0 && (
                  <p className="font-inter text-sm text-text-muted py-sm text-center">Ingen maskiner matcher søgningen.</p>
                )}
                {filtered.map(mat => (
                  <button
                    key={mat.plantNumber}
                    type="button"
                    onClick={() => {
                      setResources(prev => [...prev, {
                        id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        plantNumber: mat.plantNumber,
                        description: mat.description,
                        transportTag: mat.transportTag,
                        status: 'ikke-planlagt',
                      }])
                      setTilfoejMaterielOpen(false)
                    }}
                    className="flex items-center justify-between gap-sm py-xs min-h-[44px] text-left hover:bg-surface-2 transition-colors rounded-lg -mx-xs px-xs"
                  >
                    <div className="flex flex-col gap-xxs min-w-0">
                      <span className="font-inter text-sm font-semibold text-text-primary truncate">{mat.description}</span>
                      <span className="font-inter text-xxs text-text-muted">{mat.plantNumber}</span>
                    </div>
                  </button>
                ))}
              </div>
              {/* Annuller-knap */}
              <button
                type="button"
                onClick={() => setTilfoejMaterielOpen(false)}
                className="w-full py-xs rounded-xl border border-hairline font-inter font-semibold text-sm text-text-secondary hover:border-hairline-2 transition-colors"
              >
                Annuller
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Bekræftelses-modal: Send til fabrik ────────────────────── */}
      {/* Genbrug af Dagsoversigt-modal-mønster (DagsoversigtScreen linje 675-720) */}
      {showConfirmSend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-modal-title"
        >
          <button
            type="button"
            aria-label="Luk dialog"
            onClick={() => { setShowConfirmSend(false); setKommentar('') }}
            className="absolute inset-0 bg-deep-teal/40"
          />
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-lg flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <h2
                id="send-modal-title"
                className="font-poppins font-semibold text-lg text-deep-teal leading-tight"
              >
                Send bestilling til fabrik?
              </h2>
              {bestillingForSent ? (
                <p className="font-inter text-sm text-bad leading-relaxed bg-bad-bg border border-bad/30 rounded-lg px-sm py-xs">
                  Bestillingen er lavet efter kl 11. Du skal derfor ringe til fabrikken for at sikre produktionskapacitet.
                </p>
              ) : (
                <p className="font-inter text-sm text-text-secondary leading-relaxed">
                  Ordren afsendes til fabrikken nu.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-xxs">
              <label className="font-inter font-medium text-sm text-deep-teal">
                Vil du knytte en kommentar til ordren inden afsendelse?
              </label>
              <span className="font-inter text-xs text-text-muted leading-relaxed">
                Kommentaren sendes med til fabrikken sammen med bestillingen.
              </span>
              <textarea
                value={kommentar}
                onChange={e => setKommentar(e.target.value)}
                rows={3}
                placeholder="Fx ekstra holdtid pga. mange biler i morgenmyldretid"
                className="w-full font-inter text-sm text-text-primary bg-white border border-hairline rounded-lg px-sm py-xs resize-none focus:outline-none focus:border-deep-teal transition-colors"
              />
            </div>
            <div className="flex items-center justify-end gap-xs">
              <button
                type="button"
                onClick={() => { setShowConfirmSend(false); setKommentar('') }}
                className="font-inter font-medium text-sm text-text-secondary bg-white border border-hairline rounded-lg px-md py-xs hover:bg-surface-2 transition-colors"
              >
                Annullér
              </button>
              <button
                type="button"
                onClick={() => {
                  if (kommentar.trim().length > 0) {
                    setSentKommentarer(prev => ({ ...prev, [selectedPlanDate]: kommentar.trim() }))
                  }
                  sendAlleForSelectedDate()
                  setFabrikSendtDates(prev => new Set([...prev, selectedPlanDate]))
                  setShowConfirmSend(false)
                  setKommentar('')
                }}
                className="font-poppins font-medium text-sm text-white bg-good rounded-lg px-md py-xs hover:opacity-90 transition-opacity"
              >
                Send til fabrik
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Alle komponent- og content-definitioner er udskilt (Fase 1 dekomponering) ──
// Se: components/{AflysningCell,ProductBoxV2,EkstraBestillingBox,CommentCell,DocRow,
//         FjernModal,ForCheckbox,JaNejToggle,EkstraarbejdeBlok}.tsx
//     components/ks/{ksConstants,OvrigeOplysningerSkema3a,OvrigeOplysningerSkema,MksSkema}.tsx
//     content/{UdfoerselContent,AfregningContent}.tsx
