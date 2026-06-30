/**
 * PROTOTYPE — PlanlaegningContent (container)
 * Løftet fra OrdrePlanScreen.tsx ~L992–2160 (Fase 2, Round 3, #7 + #12).
 * Symmetrisk container med UdfoerselContent / AfregningContent.
 * Planlægning-JSX flyttes hertil — orkestratoren reduceres til state + 3-mode-switch.
 * Extraction ORDRET — adfærd 100% uændret.
 * Må ikke importeres i produktionskode.
 */
import type { ReactNode } from 'react'
import type {
  MockProduct,
  MockResource,
  DayPlan,
  VehicleOrder,
  KørselDayParams,
  MockPhoto,
  NoteComment,
  SamleordreContext,
  CancelReason,
} from '../types'
import type { Etape, MaterielUiState, MaterielTransportPlan } from '../etape'
import type { TransportPlanPatch, MaterielEnhed as MaterielEnhedTilstand } from '../MaterielTilstande'
import { OrdredetaljerSection } from '../components/OrdredetaljerSection'
import { PeriodeDatoVaelger } from '../components/PeriodeDatoVaelger'
import { DokumentationSection } from './sections/planlaegning/DokumentationSection'
import { AsfaltbestillingSection } from './sections/planlaegning/AsfaltbestillingSection'
import { AsfaltKoerselSection } from './sections/planlaegning/AsfaltKoerselSection'
import { MaterielleveringSection } from './sections/planlaegning/MaterielleveringSection'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PlanlaegningContentProps {
  // ── Dato-vælger ─────────────────────────────────────────────────────────────
  /** Sorterede ISO-datoer til dato-pille-stribe (planDays — faktisk planlagte + demo-dvale-dag) */
  planDays: string[]
  /** Den valgte dato i Planlægning-mode */
  selectedPlanDate: string
  /** Setter for valgt dato */
  onSelectPlanDate: (date: string) => void

  // ── Ordredetaljer — closures fra orkestrator (uændret fra Fase 1) ──────────
  /** Åbningstilstand for Ordredetaljer-sektionen i Planlægning-mode */
  planlaegningOrdredetaljerExpanded: boolean
  /** Toggle Ordredetaljer open/closed */
  onTogglePlanlaegningOrdredetaljer: () => void
  /**
   * Factory-funktion til Ordredetaljer-visning (closure i orkestratoren).
   * Kald uden args til Planlægning-mode (ingen hideTabs/cardMode-overskrivning nødvendig).
   */
  makeOrdredetaljerCard: (hideTabs?: boolean, cardMode?: 'planlaegning' | 'udfoersel', udfoerselSelectedDate?: string) => ReactNode
  /** Renderer kompakt pille der vises når Ordredetaljer er collapsed. */
  renderOrdredetaljerCollapsedPille: () => ReactNode

  // ── Produkt- og dag-data ─────────────────────────────────────────────────
  /** Alle produkter på ordren */
  products: MockProduct[]
  /** Produkter for den valgte dag (pre-beregnet af orkestratoren) */
  productsForSelectedDate: { product: MockProduct; day: DayPlan }[]
  /** Aktive (ikke-aflyst) dage for det valgte produkt */
  activeDays: DayPlan[]
  /** Id på det fokuserede produkt */
  activeProductId: string
  /** Sæt fokuseret produkt */
  onSetActiveProductId: (id: string) => void

  // ── Foto og noter (root-delt — bruges også i UdfoerselContent) ─────────────
  /** Alle billeder knyttet til ordren */
  photos: MockPhoto[]
  /** Tilføj nye fotos til root-state */
  onAddPhotos: (newPhotos: MockPhoto[]) => void
  /** Fjern et foto fra root-state */
  onRemovePhoto: (id: string) => void
  /** Noter / kommentarer til ordren */
  noteComments: NoteComment[]
  /** Tilføj en ny note til root-state */
  onAddComment: (comment: NoteComment) => void

  // ── Produktopdatering (callbacks trådt fra orkestrator) ─────────────────────
  /** Opdater tons for et produkt på en dag */
  onUpdateTons: (productId: string, dayId: string, v: number) => void
  /** Opdater morgen-tons for et produkt på en dag */
  onUpdateMorgenTons: (productId: string, dayId: string, v: number | undefined) => void

  // ── Aflysnings-flow (deles på tværs via cancelDay-closure i orkestrator) ───
  /** Id på dag der p.t. aflyses (picker åben) */
  cancellingDayId: string | null
  /** Åbn aflysnings-årsagspicker for en dag */
  onCancelDay: (dayId: string) => void
  /** Afbryd aflysnings-flowet */
  onAbortCancel: () => void
  /** Bekræft aflysning med årsag */
  onConfirmCancel: (productId: string, dayId: string, reason: CancelReason) => void
  /** Gendan aflyst dag */
  onRestoreDay: (dayId: string) => void

  // ── "Samles på en bil"-flags ─────────────────────────────────────────────
  /** Flags per `${productId}__${dayId}` */
  productSamlesFlags: Record<string, boolean>
  /** Sæt "Samles på én bil" for et produkt+dag */
  onSetProductSamles: (productId: string, dayId: string, value: boolean) => void

  // ── Samleordre ──────────────────────────────────────────────────────────
  isSamleordreMode: boolean
  samleordreCtx: SamleordreContext | null
  /** Aktivt ordrenummer i samleordre-tab (delt root-state) */
  samleordreTabOrderNr?: string
  /**
   * Callback der skifter aktiv child-ordre i delt root-state.
   * Eksponeres som callback (ikke rå setter) for at holde containere agnostiske.
   * Sektionerne forbruger den i Round 2.
   */
  onSelectSamleordreTab?: (orderNumber: string) => void

  // ── Kørsel-state (root-ejet — delt med Afregning) ───────────────────────
  kørselOrders: Record<string, VehicleOrder[]>
  onSetKørselOrders: React.Dispatch<React.SetStateAction<Record<string, VehicleOrder[]>>>
  kørselParams: Record<string, KørselDayParams>
  onSetKørselParams: React.Dispatch<React.SetStateAction<Record<string, KørselDayParams>>>
  startRaekkefoelge: Record<string, [string | null, string | null, string | null]>
  onUpdateStartRaekkefoelge: (dayId: string, position: 0 | 1 | 2, value: string | null) => void
  startTider: Record<string, [string | null, string | null, string | null]>
  onUpdateStartTid: (dayId: string, position: 0 | 1 | 2, value: string | null) => void
  kørselPlanlagtIds: Set<string>
  bekraeftedeDagIds: Set<string>
  sendtTilVognmandDates: Set<string>
  onSetSendtTilVognmandDates: React.Dispatch<React.SetStateAction<Set<string>>>
  kørselKommentar: Record<string, string>
  onSetKørselKommentar: React.Dispatch<React.SetStateAction<Record<string, string>>>
  dagVognmand: Record<string, string>
  onSetDagVognmand: React.Dispatch<React.SetStateAction<Record<string, string>>>
  dagAfregning: Record<string, 'time' | 'akkord'>
  onSetDagAfregning: React.Dispatch<React.SetStateAction<Record<string, 'time' | 'akkord'>>>
  /** Gem-callback for kørsel — sætter planlagt-state + revert-on-edit */
  onGemKørsel: (dayId: string) => void
  /** Km fra Google til fabrik — bruges i bilbehov-dashboard */
  factoryKm: number

  // ── Materiel-transport (root-ejet — delt med Udførsel) ──────────────────
  resources: MockResource[]
  transportPlaner: Record<string, MaterielTransportPlan>
  etaper: Etape[]
  materielUiState: MaterielUiState
  materielResources: MaterielEnhedTilstand[]
  aktivEtape: Etape | undefined
  bekraeftedeEnhederIds: Set<string>
  materielSendteEnhederIds: Set<string>
  /** Handler: opdater ét felt på én transport-plan */
  onTransportChange: (resourceId: string, etapeId: number, patch: TransportPlanPatch) => void
  /** Handler: gem + marker transport som planlagt */
  onTransportGem: (resourceId: string, etapeId: number) => void
  /** Handler: send alle planlagte usendte enheder i etapen til vognmand */
  onMaterielSend: (etape: Etape) => void
  /** Handler: fjern en ressource fra ordren */
  onFjernResource: (resourceId: string) => void
  /** Handler: tilføj en ny ressource fra katalog */
  onTilfoejResource: (katalogItem: { plantNumber: string; description: string; transportTag: MockResource['transportTag'] }) => void
}

// ─── Container ────────────────────────────────────────────────────────────────

export function PlanlaegningContent({
  planDays,
  selectedPlanDate,
  onSelectPlanDate,
  planlaegningOrdredetaljerExpanded,
  onTogglePlanlaegningOrdredetaljer,
  makeOrdredetaljerCard,
  renderOrdredetaljerCollapsedPille,
  products,
  productsForSelectedDate,
  activeDays,
  activeProductId,
  onSetActiveProductId,
  onUpdateTons,
  onUpdateMorgenTons,
  photos,
  onAddPhotos,
  onRemovePhoto,
  noteComments,
  onAddComment,
  cancellingDayId,
  onCancelDay,
  onAbortCancel,
  onConfirmCancel,
  onRestoreDay,
  productSamlesFlags,
  onSetProductSamles,
  isSamleordreMode,
  samleordreCtx,
  samleordreTabOrderNr,
  onSelectSamleordreTab,
  kørselOrders,
  onSetKørselOrders,
  kørselParams,
  onSetKørselParams,
  startRaekkefoelge,
  onUpdateStartRaekkefoelge,
  startTider,
  onUpdateStartTid,
  kørselPlanlagtIds,
  bekraeftedeDagIds,
  sendtTilVognmandDates,
  onSetSendtTilVognmandDates,
  kørselKommentar,
  onSetKørselKommentar,
  dagVognmand,
  onSetDagVognmand,
  dagAfregning,
  onSetDagAfregning,
  onGemKørsel,
  factoryKm,
  resources,
  transportPlaner,
  etaper,
  materielUiState,
  materielResources,
  aktivEtape,
  bekraeftedeEnhederIds,
  materielSendteEnhederIds,
  onTransportChange,
  onTransportGem,
  onMaterielSend,
  onFjernResource,
  onTilfoejResource,
}: PlanlaegningContentProps) {
  return (
    // PATTERN: rod-container identisk med UdfoerselContent + AfregningContent
    // TOKEN-VIOLATION: gap-[48px] kopieret ORDRET fra OrdrePlanScreen.tsx L993 — ret ikke (cleanup-pass)
    <div className="flex flex-col gap-[48px]">

      {/* ── Udføres i perioden — dato-pille-stribe øverst (unified picker) ── */}
      {/* SPEC #7: PeriodeDatoVaelger erstatter inline-blok OrdrePlanScreen.tsx L999–1028 */}
      <PeriodeDatoVaelger
        heading="Udføres i perioden"
        days={planDays}
        selectedDate={selectedPlanDate}
        onSelectDate={onSelectPlanDate}
      />

      {/* ── Delt wrapper-div: Ordredetaljer + Dokumentation + hr + Asfaltbestilling ──
          SPEC: KRITISK nesting (ORDRET — må ikke "rettes") — OrdrePlanScreen.tsx L1031–1378.
          De tre sektioner deler ét <div>-wrapper med <hr> imellem Dokumentation og Asfaltbestilling. */}
      <div>

        {/* Ordredetaljer-section — identisk mønster på alle 3 modes (allerede delt fra Fase 1) */}
        <OrdredetaljerSection
          expanded={planlaegningOrdredetaljerExpanded}
          onToggle={onTogglePlanlaegningOrdredetaljer}
          renderCard={() => makeOrdredetaljerCard()}
          renderCollapsedPille={renderOrdredetaljerCollapsedPille}
        />

        {/* Dokumentation — conditionel på planlaegningOrdredetaljerExpanded (via visible-prop) */}
        <DokumentationSection
          visible={planlaegningOrdredetaljerExpanded}
          photos={photos}
          onAddPhotos={onAddPhotos}
          onRemovePhoto={onRemovePhoto}
          noteComments={noteComments}
          onAddComment={onAddComment}
          isSamleordreMode={isSamleordreMode}
          samleordreCtx={samleordreCtx}
          samleordreTabOrderNr={samleordreTabOrderNr}
          onSelectSamleordreTab={onSelectSamleordreTab}
        />

        {/* hr-skille: kopieret ORDRET fra OrdrePlanScreen.tsx L1214 */}
        <hr className="my-lg border-t border-hairline" />

        {/* Asfaltbestilling — produktbokse + send-til-fabrik-flow + bekræftelsesmodal */}
        <AsfaltbestillingSection
          productsForSelectedDate={productsForSelectedDate}
          selectedPlanDate={selectedPlanDate}
          activeProductId={activeProductId}
          onSetActiveProductId={onSetActiveProductId}
          onUpdateTons={onUpdateTons}
          onUpdateMorgenTons={onUpdateMorgenTons}
          cancellingDayId={cancellingDayId}
          onCancelDay={onCancelDay}
          onAbortCancel={onAbortCancel}
          onConfirmCancel={onConfirmCancel}
          onRestoreDay={onRestoreDay}
          productSamlesFlags={productSamlesFlags}
          onSetProductSamles={onSetProductSamles}
          isSamleordreMode={isSamleordreMode}
          samleordreCtx={samleordreCtx}
        />

      </div>

      {/* ── Asfalt kørsel — top-peer (OrdrePlanScreen.tsx L1380–1979) ── */}
      <AsfaltKoerselSection
        activeDays={activeDays}
        selectedPlanDate={selectedPlanDate}
        products={products}
        factoryKm={factoryKm}
        kørselOrders={kørselOrders}
        onSetKørselOrders={onSetKørselOrders}
        kørselParams={kørselParams}
        onSetKørselParams={onSetKørselParams}
        startRaekkefoelge={startRaekkefoelge}
        onUpdateStartRaekkefoelge={onUpdateStartRaekkefoelge}
        startTider={startTider}
        onUpdateStartTid={onUpdateStartTid}
        kørselPlanlagtIds={kørselPlanlagtIds}
        bekraeftedeDagIds={bekraeftedeDagIds}
        sendtTilVognmandDates={sendtTilVognmandDates}
        onSetSendtTilVognmandDates={onSetSendtTilVognmandDates}
        kørselKommentar={kørselKommentar}
        onSetKørselKommentar={onSetKørselKommentar}
        dagVognmand={dagVognmand}
        onSetDagVognmand={onSetDagVognmand}
        dagAfregning={dagAfregning}
        onSetDagAfregning={onSetDagAfregning}
        onGemKørsel={onGemKørsel}
      />

      {/* ── Materiellevering — top-peer (OrdrePlanScreen.tsx L1982–2157) ── */}
      <MaterielleveringSection
        resources={resources}
        transportPlaner={transportPlaner}
        etaper={etaper}
        materielUiState={materielUiState}
        materielResources={materielResources}
        aktivEtape={aktivEtape}
        selectedPlanDate={selectedPlanDate}
        bekraeftedeEnhederIds={bekraeftedeEnhederIds}
        materielSendteEnhederIds={materielSendteEnhederIds}
        isSamleordreMode={isSamleordreMode}
        samleordreCtx={samleordreCtx}
        onTransportChange={onTransportChange}
        onTransportGem={onTransportGem}
        onMaterielSend={onMaterielSend}
        onFjernResource={onFjernResource}
        onTilfoejResource={onTilfoejResource}
      />

    </div>
  )
}
