import { useState, useMemo, type ReactNode } from 'react'
import { useRecept } from '@/hooks/useRecept'
import { useVejesedler } from '@/hooks/useVejesedler'
import type {
  MockPhoto,
  VognmandBekraeftelse,
  VognmandMaterielBekraeftelse,
  MockProduct,
  SamleordreContext,
  EkstraLinje,
} from '../types'
import type { Etape, MaterielUiState, MaterielTransportPlan } from '../etape'
import { OrdredetaljerSection } from '../components/OrdredetaljerSection'
import { PeriodeDatoVaelger } from '../components/PeriodeDatoVaelger'
import { BekraeftedeBilerSection } from './sections/udfoersel/BekraeftedeBilerSection'
import { ForundersoegelseSection } from './sections/udfoersel/ForundersoegelseSection'
import { KsRapporteringSection } from './sections/udfoersel/KsRapporteringSection'
import { KoerselSection } from './sections/udfoersel/KoerselSection'

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
  // ── Dagsdata — hardcoded for demo, TODO: hent fra ordre-objekt når Supabase klar ───
  const DEMO_ORDRE_ID = '260423891'
  const DEMO_DATO = new Date().toISOString().slice(0, 10)

  const { recept } = useRecept('82101H') // SMA 11S — TODO: Erstat med Supabase når klar — bruges i spec-grid
  const { vejesedler } = useVejesedler(DEMO_ORDRE_ID, DEMO_DATO)
  // Udlægning-state (tonsAnkommet, forventetUdlagtM2, faktiskRegistrering, gemFaktisk)
  // er løftet til OrdrePlanScreen-root så AfregningContent kan bruge det direkte.

  // Mini-strip: om fuld spec-grid er åben
  const [detailsExpanded, setDetailsExpanded] = useState(true)

  // ── Ekstraarbejde-callbacks — beholdes i containeren da de trådes til KsRapporteringSection.
  // ForundersoegelseSection bruger setEkstraLinjer-setter direkte (internt bygger den sine egne callbacks).
  // TODO: Erstat med Supabase når klar
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
      <PeriodeDatoVaelger
        heading="Udføres i perioden"
        days={udfoerselDays}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

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
          <BekraeftedeBilerSection
            vognmandBekraeftelse={vognmandBekraeftelse}
            vognmandMaterielBekraeftelse={vognmandMaterielBekraeftelse}
            materielUiState={materielUiState}
            selectedDate={selectedDate}
            etaper={etaper}
            transportPlaner={transportPlaner}
            isSamleordreMode={isSamleordreMode}
            samleordreCtx={samleordreCtx}
            samleordreTabOrderNr={samleordreTabOrderNr}
          />

          {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
          <ForundersoegelseSection
            forundersoegelseFotos={forundersoegelseFotos}
            onAddPhotos={onAddPhotos}
            isSamleordreMode={isSamleordreMode}
            samleordreCtx={samleordreCtx}
            samleordreTabOrderNr={samleordreTabOrderNr}
            ekstraLinjer={ekstraLinjer}
            setEkstraLinjer={setEkstraLinjer}
            ekstraSent={ekstraSent}
            setEkstraSent={setEkstraSent}
          />

          <KsRapporteringSection
            products={products}
            selectedDate={selectedDate}
            ekstraLinjer={ekstraLinjer}
            addEkstraLinje={addEkstraLinje}
            updateEkstraLinje={updateEkstraLinje}
            removeEkstraLinje={removeEkstraLinje}
            ekstraSent={ekstraSent}
            setEkstraSent={setEkstraSent}
            onResetEkstra={() => { setEkstraLinjer([]); setEkstraSent(false) }}
          />
        </>
      )}

      {/* ── Kørsel — udenfor detailsExpanded-gaten (spejler kildestrukturen L1062–) ── */}
      {/* TODO (produktion): Sektion filtreres på (selectedProductId, selectedDate) */}
      <KoerselSection
        vejesedler={vejesedler}
        minTemperatur={recept?.min_temperatur ?? 140}
        products={products}
        selectedDate={selectedDate}
        isSamleordreMode={isSamleordreMode}
        samleordreCtx={samleordreCtx}
      />

      {/* ── Bil- og tonsafregning + Materielafregning ─────────────────────────── */}
      {/* Sektionerne er flyttet til AfregningContent nedenfor (Afregning-mode i toggle). */}

    </div>
  )
}
