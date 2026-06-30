/**
 * PROTOTYPE — Ordre Planlægnings-mode (v2 layout)
 * Sprint 1 — Element 3
 * Viser dagfordeling, materiel og transport for én ordre.
 * Må ikke importeres i produktionskode.
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  Plus,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { useRecept } from '@/hooks/useRecept'
import { useDagsoverblik } from '@/hooks/useDagsoverblik'
import { clusterEtaper, getMaterielUiState, DEMO_TRANSPORT_PLANER, transportKey } from './etape'
import type { Etape, MaterielUiState, MaterielTransportPlan } from './etape'
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
  getEffectiveProductTotalTons,
} from './utils'
import {
  DEFAULT_KØRSEL_PARAMS, INITIAL_PRODUCTS, INITIAL_RESOURCES,
  INITIAL_COMMENTS, INITIAL_PHOTOS, MOCK_SAMLEORDRE,
  INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE, INITIAL_VOGNMAND_BEKRAEFTELSER,
} from './mocks'
import { AflysningCell } from './components/AflysningCell'
import { CommentCell } from './components/CommentCell'
import { SamleordreChildTabs } from './components/SamleordreChildTabs'
import { PlanlaegningContent } from './content/PlanlaegningContent'
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
  // showConfirmSend, bestillingForSent, kommentar, sentKommentarer, sentDayIds, fabrikSendtDates
  // → FLYTTET til AsfaltbestillingSection (lokal state) [Fase 2, Round 3, #9]
  //
  // tilfoejMaterielOpen, materielSoeg, fjernModalId
  // → FLYTTET til MaterielleveringSection (lokal state) [Fase 2, Round 3, #11]
  const [resources, setResources] = useState<MockResource[]>(INITIAL_RESOURCES)
  const [cancellingDayId, setCancellingDayId] = useState<string | null>(null)
  // Aflys-celle (i ordredetalje-grid): inline picker-state — uafhængig pr. produkt
  const [aflysPickerProductId, setAflysPickerProductId] = useState<string | null>(null)
  const [aflysPickerDayId, setAflysPickerDayId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<MockPhoto[]>(INITIAL_PHOTOS)
  // opmaalingOpen, photosOpen, notesOpen, docsOpen, besigtigelseComment
  // → FLYTTET til DokumentationSection (lokal state) [Fase 2, Round 3, #8]
  const [noteComments, setNoteComments] = useState<NoteComment[]>(INITIAL_COMMENTS)
  // sentDayIds → FLYTTET til AsfaltbestillingSection (lokal state) [Fase 2, Round 3, #9]
  // afhentningAdresse, afhentningPostnr, afhentningKlarDato/Tid, afhentningLeveringDato/Tid,
  // sammeAflæsning og materielKommentar er MIGRERET til transportPlaner (MaterielTransportPlan
  // pr. enhed × etape). Se transportPlaner-state nedenfor.
  // TODO Round 4b: swap til faktiskPlanlagteDage + reel transport-state fra Supabase.
  // kørselExpandedId → FLYTTET til AsfaltKoerselSection (lokal state) [Fase 2, Round 3, #10]
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
  // fabrikSendtDates → FLYTTET til AsfaltbestillingSection (lokal state) [Fase 2, Round 3, #9]
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

  // sendAlleForSelectedDate → FLYTTET til AsfaltbestillingSection (lokal) [Fase 2, Round 3, #9]

  function removeResource(id: string) {
    setResources(prev => prev.filter(r => r.id !== id))
    // setFjernModalId → FLYTTET til MaterielleveringSection (lokal state) [Fase 2, Round 3, #11]
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

  // gemKørsel: kørselExpandedId sættes IKKE til null her — det er nu lokal state i AsfaltKoerselSection [Fase 2, Round 3, #10].
  // onGemKørsel-callback trådes ned til sektionen og SKAL bevare:
  //   1. setKørselPlanlagtIds → sætter dag som planlagt
  //   2. setBekraeftedeDagIds → fjerner dag fra bekræftet (revert-on-edit)
  //   3. setSendtTilVognmandDates → fjerner dato (revert-on-edit via day.date lookup)
  // AsfaltKoerselSection-handoff: kalderen SKAL rydde sendtTilVognmandDates[dayDate].
  function gemKørsel(dayId: string) {
    setKørselPlanlagtIds(prev => new Set([...prev, dayId]))
    // Gem → "Planlagt" (fjern fra bekræftet-sæt). "Bekræftet vognmand" gensættes
    // kun når vognmand returnerer bekræftelse via Supabase Realtime.
    setBekraeftedeDagIds(prev => { const next = new Set(prev); next.delete(dayId); return next })
    // Rettelse efter afsendelse → tilbage til "Planlagt": vognmandens kopi er forældet når
    // formanden ændrer bestillingen, så sendt-status nulstilles og dagen skal sendes igen.
    const dayDate = days.find(d => d.id === dayId)?.date
    if (dayDate) setSendtTilVognmandDates(prev => { const next = new Set(prev); next.delete(dayDate); return next })
    // NOTE: setKørselExpandedId(null) fjernet — kørselExpandedId er nu lokal i AsfaltKoerselSection
  }

  // fjernModalResource beregnes nu lokalt i MaterielleveringSection [Fase 2, Round 3, #11]

  // Genbrugbar Ordredetaljer-visning: samleordre split-view med tabs ELLER fuld bredde Spec-grid.
  // Bruges både på Planlægning-mode (direkte synlig) og Udførsel-mode (i collapsed-expander).
  // hideTabs=true skjuler tab-rækken — bruges i Udførsel-mode hvor tabs er på selve Ordredetaljer-rækken.
  const makeOrdredetaljerCard = (
    hideTabs?: boolean,
  ) => (
    isSamleordreMode && samleordreCtx ? (
      <div className="mb-lg">
        {/* Tabs ovenpå spec-grid — skjules i Udførsel-mode (tabs er på Ordredetaljer-rækken).
            Genbruger den kanoniske SamleordreChildTabs (variant='attached'). */}
        {!hideTabs && (
          <SamleordreChildTabs
            children={samleordreCtx.children.map(c => ({ orderNumber: c.orderNumber, stedLabel: c.stedLabel, isAnchor: c.isAnchor }))}
            activeOrderNumber={samleordreTabOrderNr}
            onSelect={setSamleordreTabOrderNr}
            variant="attached"
          />
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

          {/* ── Planlægning-mode — løftet til PlanlaegningContent [Fase 2, Round 3, #12] ── */}
          {/* Originalkilde: OrdrePlanScreen.tsx ~L992–2160 */}
          {activeMode === 'planlaegning' && (
            <PlanlaegningContent
              planDays={planDays}
              selectedPlanDate={selectedPlanDate}
              onSelectPlanDate={setSelectedPlanDate}
              planlaegningOrdredetaljerExpanded={planlaegningOrdredetaljerExpanded}
              onTogglePlanlaegningOrdredetaljer={() => setPlanlaegningOrdredetaljerExpanded(prev => !prev)}
              makeOrdredetaljerCard={makeOrdredetaljerCard}
              renderOrdredetaljerCollapsedPille={renderOrdredetaljerCollapsedPille}
              products={products}
              productsForSelectedDate={productsForSelectedDate}
              activeDays={activeDays}
              activeProductId={activeProductId}
              onSetActiveProductId={setActiveProductId}
              onUpdateTons={updateTons}
              onUpdateMorgenTons={updateMorgenTons}
              photos={photos}
              onAddPhotos={(newPhotos) => setPhotos(prev => [...prev, ...newPhotos])}
              onRemovePhoto={(id) => setPhotos(prev => prev.filter(p => p.id !== id))}
              noteComments={noteComments}
              onAddComment={(comment) => setNoteComments(prev => [...prev, comment])}
              cancellingDayId={cancellingDayId}
              onCancelDay={(dayId) => setCancellingDayId(dayId)}
              onAbortCancel={() => setCancellingDayId(null)}
              onConfirmCancel={(productId, dayId, reason) => cancelDay(productId, dayId, reason)}
              onRestoreDay={restoreDay}
              productSamlesFlags={productSamlesFlags}
              onSetProductSamles={setProductSamles}
              isSamleordreMode={isSamleordreMode}
              samleordreCtx={samleordreCtx}
              samleordreTabOrderNr={samleordreTabOrderNr}
              onSelectSamleordreTab={setSamleordreTabOrderNr}
              kørselOrders={kørselOrders}
              onSetKørselOrders={setKørselOrders}
              kørselParams={kørselParams}
              onSetKørselParams={setKørselParams}
              startRaekkefoelge={startRaekkefoelge}
              onUpdateStartRaekkefoelge={updateStartRaekkefoelge}
              startTider={startTider}
              onUpdateStartTid={updateStartTid}
              kørselPlanlagtIds={kørselPlanlagtIds}
              bekraeftedeDagIds={bekraeftedeDagIds}
              sendtTilVognmandDates={sendtTilVognmandDates}
              onSetSendtTilVognmandDates={setSendtTilVognmandDates}
              kørselKommentar={kørselKommentar}
              onSetKørselKommentar={setKørselKommentar}
              dagVognmand={dagVognmand}
              onSetDagVognmand={setDagVognmand}
              dagAfregning={dagAfregning}
              onSetDagAfregning={setDagAfregning}
              onGemKørsel={gemKørsel}
              factoryKm={factoryKm}
              resources={resources}
              transportPlaner={transportPlaner}
              etaper={etaper}
              materielUiState={materielUiState}
              materielResources={materielResources}
              aktivEtape={aktivEtape}
              bekraeftedeEnhederIds={bekraeftedeEnhederIds}
              materielSendteEnhederIds={materielSendteEnhederIds}
              onTransportChange={handleTransportChange}
              onTransportGem={markTransportPlanlagt}
              onMaterielSend={handleMaterielSend}
              onFjernResource={removeResource}
              onTilfoejResource={(katalogItem) => {
                setResources(prev => [...prev, {
                  id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  plantNumber: katalogItem.plantNumber,
                  description: katalogItem.description,
                  transportTag: katalogItem.transportTag,
                  status: 'ikke-planlagt',
                }])
              }}
            />
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
              onSelectSamleordreTab={setSamleordreTabOrderNr}
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
              onSelectSamleordreTab={setSamleordreTabOrderNr}
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


      {/* FjernModal → FLYTTET til MaterielleveringSection [Fase 2, Round 3, #11] */}
      {/* Tilføj materiel-modal → FLYTTET til MaterielleveringSection [Fase 2, Round 3, #11] */}
      {/* Bekræftelses-modal (Send til fabrik) → FLYTTET til AsfaltbestillingSection [Fase 2, Round 3, #9] */}

    </div>
  )
}

// ─── Alle komponent- og content-definitioner er udskilt (Fase 1 dekomponering) ──
// Se: components/{AflysningCell,ProductBoxV2,EkstraBestillingBox,CommentCell,DocRow,
//         FjernModal,ForCheckbox,JaNejToggle,EkstraarbejdeBlok}.tsx
//     components/ks/{ksConstants,OvrigeOplysningerSkema3a,OvrigeOplysningerSkema,MksSkema}.tsx
//     content/{UdfoerselContent,AfregningContent}.tsx
