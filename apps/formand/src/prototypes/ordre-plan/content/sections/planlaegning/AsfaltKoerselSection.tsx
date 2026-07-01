/**
 * PROTOTYPE — AsfaltKoerselSection
 *
 * Extraction fra OrdrePlanScreen.tsx L1380–1979 (ORDRET — ingen redesign).
 * Viser "Asfalt kørsel"-sektionen med dag-rækker, vognmand/afregning-valg og
 * bilbehov-dashboard. Gem = "Gem og send til vognmand" (kombineret gem + afsendelse,
 * da der kun planlægges én dag ad gangen) — ingen separat send-footer.
 *
 * Top-peer i PlanlaegningContent's rod-container (ikke inden i Ordredetaljer-wrapper).
 *
 * Lokale states (ingen — al state ejes af root/container):
 *   kørselExpandedId er lokal Planlægning-state → flyttes ned i sektionen.
 *
 * Props ind fra PlanlaegningContent-containeren (state der ejes af root).
 *
 * TODO: Erstat med Supabase når klar — kørselOrders, kørselPlanlagtIds,
 *   sendtTilVognmandDates, dagVognmand, dagAfregning fra vognmand_bestilling-tabel.
 */

import { useState } from 'react'
import { Truck, X, Plus, Info } from 'lucide-react'
import { formatWeekday, formatLongDate } from '@/utils/date'
import type {
  DayPlan,
  MockProduct,
  VehicleOrder,
  KørselDayParams,
} from '../../../types'
import {
  VEHICLE_TYPES,
  MOCK_VOGNMAEND,
  DEFAULT_VOGNMAND_ID,
  DEFAULT_KØRSEL_PARAMS,
} from '../../../mocks'
import { getEffectiveTons } from '../../../utils'

// ─── Props ───────────────────────────────────────────────────────────────────

export interface AsfaltKoerselSectionProps {
  /** Aktive (ikke-aflyst) dage for det valgte produkt */
  activeDays: DayPlan[]
  /** Den valgte plan-dato (YYYY-MM-DD) */
  selectedPlanDate: string
  /** Alle produkter — bruges til multi-produkt dagProdukter-beregning */
  products: MockProduct[]
  /** Km fra Google til fabrik — bruges i bilbehov-dashboard */
  factoryKm: number

  // ── Kørsels-state (root-ejet, delt med Afregning) ────────────────────────
  /** Bestilte bil-ordrer per dag-id */
  kørselOrders: Record<string, VehicleOrder[]>
  onSetKørselOrders: React.Dispatch<React.SetStateAction<Record<string, VehicleOrder[]>>>

  /** Kørselparametre per dag-id (aflæsningstid, interval, første læs osv.) */
  kørselParams: Record<string, KørselDayParams>
  onSetKørselParams: React.Dispatch<React.SetStateAction<Record<string, KørselDayParams>>>

  /** Start-rækkefølge (3 første biler) per dag-id */
  startRaekkefoelge: Record<string, [string | null, string | null, string | null]>
  onUpdateStartRaekkefoelge: (dayId: string, position: 0 | 1 | 2, value: string | null) => void

  /** Starttider for de 3 første biler per dag-id */
  startTider: Record<string, [string | null, string | null, string | null]>
  onUpdateStartTid: (dayId: string, position: 0 | 1 | 2, value: string | null) => void

  /** Planlagte dag-ids (gem-knap er trykket mindst én gang) */
  kørselPlanlagtIds: Set<string>

  /** Bekræftede dag-ids (vognmand har returneret bekræftelse) */
  bekraeftedeDagIds: Set<string>

  /** Datoer (ISO) sendt til vognmand */
  sendtTilVognmandDates: Set<string>
  onSetSendtTilVognmandDates: React.Dispatch<React.SetStateAction<Set<string>>>

  /** Kommentar til chauffør per dag-id */
  kørselKommentar: Record<string, string>
  onSetKørselKommentar: React.Dispatch<React.SetStateAction<Record<string, string>>>

  /** Vognmand per dag-id */
  dagVognmand: Record<string, string>
  onSetDagVognmand: React.Dispatch<React.SetStateAction<Record<string, string>>>

  /** Afregningstype per dag-id */
  dagAfregning: Record<string, 'time' | 'akkord'>
  onSetDagAfregning: React.Dispatch<React.SetStateAction<Record<string, 'time' | 'akkord'>>>

  /** Gem-callback — sætter dag som planlagt og lukker expand */
  onGemKørsel: (dayId: string) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AsfaltKoerselSection({
  activeDays,
  selectedPlanDate,
  products,
  factoryKm,
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
}: AsfaltKoerselSectionProps) {
  // kørselExpandedId er Planlægning-lokal state — flyttes ned fra orkestrator
  const [kørselExpandedId, setKørselExpandedId] = useState<string | null>(null)

  function updateOrder(dayId: string, id: string, field: 'type' | 'antal' | 'afregning_type', value: string | number) {
    onSetKørselOrders(prev => ({
      ...prev,
      [dayId]: (prev[dayId] ?? []).map(o => o.id === id ? { ...o, [field]: value } : o),
    }))
  }
  function removeOrder(dayId: string, id: string) {
    onSetKørselOrders(prev => ({ ...prev, [dayId]: (prev[dayId] ?? []).filter(o => o.id !== id) }))
  }
  function addOrder(dayId: string) {
    const newOrder: VehicleOrder = { id: `vo-${Date.now()}`, type: VEHICLE_TYPES[0].label, antal: 1 }
    onSetKørselOrders(prev => ({ ...prev, [dayId]: [...(prev[dayId] ?? []), newOrder] }))
  }
  function updateParam<K extends keyof KørselDayParams>(dayId: string, key: K, value: KørselDayParams[K]) {
    onSetKørselParams(prev => ({ ...prev, [dayId]: { ...(prev[dayId] ?? DEFAULT_KØRSEL_PARAMS), [key]: value } }))
  }

  return (
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
                      {/* Vognmand status badge — 2-state: Sendt til vognmand (grøn) / Bekræftet vognmand.
                          "Gem og send til vognmand" kombinerer gem + afsendelse, så en planlagt dag
                          altid ER sendt → ingen separat "Planlagt"-mellemtilstand. */}
                      {erBekraeftet ? (
                        // downstream/Udførsel-tilstand — ikke seedet i planlægnings-demoen
                        <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good font-inter text-xs font-semibold text-white whitespace-nowrap">
                          Bekræftet vognmand
                        </span>
                      ) : sendtTilVognmandDates.has(day.date) ? (
                        // Samme pille-stil som Materiellevering's "Bekræftet vognmand" (bg-good-bg / text-good)
                        <span className="inline-flex items-center px-xs py-xxxs rounded-lg bg-good-bg font-inter text-xs font-semibold text-good whitespace-nowrap">
                          Sendt til vognmand
                        </span>
                      ) : null}
                      {/* "Planlæg transport"-knap (åbner kørsels-editoren igen) skjules når dagen
                          er bekræftet af vognmand (FUNCTIONAL_FLOWS Trin 2) */}
                      {!erBekraeftet && (
                        <div className="flex">
                          <button
                            onClick={() => {
                              setKørselExpandedId(day.id)
                              // Seed defaults så number-inputs ikke snapper tilbage ved redigering
                              onSetKørselParams(prev => ({
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
                                onUpdateStartTid(day.id, 0, '06:00')
                              }
                            }}
                            className="inline-flex items-center justify-center gap-xxxs font-inter text-xs font-semibold text-white bg-dark-teal px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap min-h-touch min-w-[135px]"
                          >
                            Ret transport
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          // Gem OG send til vognmand i ét klik (planlægger kun én dag ad gangen).
                          onGemKørsel(day.id)
                          onSetSendtTilVognmandDates(prev => new Set([...prev, day.date]))
                          setKørselExpandedId(null)
                        } else {
                          setKørselExpandedId(day.id)
                          if ((kørselOrders[day.id] ?? []).length === 0) {
                            onSetKørselOrders(prev => ({
                              ...prev,
                              [day.id]: [{ id: `vo-${Date.now()}`, type: '', antal: 1 }],
                            }))
                          }
                          // Seed defaults så number-inputs ikke snapper tilbage ved redigering
                          onSetKørselParams(prev => ({
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
                            onUpdateStartTid(day.id, 0, '06:00')
                          }
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-xxxs font-inter text-xs font-semibold px-sm py-xxxs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap min-h-touch min-w-[135px] ${isExpanded ? 'bg-yellow text-deep-teal' : 'bg-dark-teal text-white'}`}
                    >
                      {isExpanded ? 'Gem og send til vognmand' : 'Planlæg transport'}
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
                              onChange={e => onUpdateStartTid(day.id, 0, e.target.value || null)}
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
                              onChange={e => updateParam(day.id, 'aflaesningstidMin', e.target.value === '' ? undefined : Math.max(1, Number(e.target.value)))}
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
                              onChange={e => updateParam(day.id, 'intervalMinutes', e.target.value === '' ? undefined : Math.max(1, Number(e.target.value)))}
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
                        onChange={e => onSetDagVognmand(prev => ({ ...prev, [day.id]: e.target.value }))}
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
                              onClick={() => onSetDagAfregning(prev => ({ ...prev, [day.id]: type }))}
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
                                    onChange={e => updateOrder(day.id, o.id, 'type', e.target.value)}
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
                                  <button onClick={() => updateOrder(day.id, o.id, 'antal', Math.max(1, o.antal - 1))} className="w-8 h-8 font-inter text-sm text-text-muted hover:bg-soft-aqua transition-colors" aria-label="Færre">−</button>
                                  <span className="px-xxs font-inter text-xs font-semibold text-text-primary w-[26px] text-center tabular-nums">{o.antal}</span>
                                  <button onClick={() => updateOrder(day.id, o.id, 'antal', o.antal + 1)} className="w-8 h-8 font-inter text-sm text-text-muted hover:bg-soft-aqua transition-colors" aria-label="Flere">+</button>
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
                                            onClick={() => !isEgenBil && updateOrder(day.id, o.id, 'afregning_type', type)}
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
                                <button onClick={() => removeOrder(day.id, o.id)} className="w-8 h-8 rounded-md text-text-muted hover:bg-bad-bg hover:text-bad flex items-center justify-center transition-colors" aria-label="Fjern">
                                  <X size={15} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => addOrder(day.id)}
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
                                                    onChange={e => onUpdateStartRaekkefoelge(day.id, pos, e.target.value || null)}
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
                                                    onChange={e => onUpdateStartTid(day.id, pos, e.target.value || null)}
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
                      onChange={e => onSetKørselKommentar(prev => ({ ...prev, [day.id]: e.target.value }))}
                      rows={2}
                      placeholder="Fx 'Brug bagvejen', 'Aflæsningssted flyttet 50m mod vest', 'Støjrestriktion efter 22'..."
                      className="w-full font-inter text-xs text-text-primary bg-white border border-hairline rounded-lg px-xs py-xs focus:outline-none focus:border-dark-teal transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Gem og send til vognmand — kombineret gem + afsendelse i ét klik */}
                  <div className="flex justify-end gap-xs pt-xxxs">
                    <button
                      onClick={() => setKørselExpandedId(null)}
                      className="font-inter text-xs text-text-muted hover:text-text-primary px-xs py-xxxs"
                    >Annullér</button>
                    <button
                      onClick={() => {
                        onGemKørsel(day.id)
                        onSetSendtTilVognmandDates(prev => new Set([...prev, day.date]))
                        setKørselExpandedId(null)
                      }}
                      className="inline-flex items-center font-inter text-xs font-semibold text-deep-teal bg-yellow px-sm py-xxxs rounded-lg hover:opacity-90 min-h-touch"
                    >Gem og send til vognmand</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
