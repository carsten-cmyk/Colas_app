/**
 * PROTOTYPE — Transportberegner
 * Sprint 1 — Element 4
 * Beregner antal lastbiler og daglig køreplan for asfaltleverancer.
 * Åbnes fra OrdrePlanScreen → "Beregn køreplan".
 * Må ikke importeres i produktionskode.
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Truck, Clock, ChevronDown, ChevronUp, Factory, Plus, X, CheckCircle2, Coffee } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Pause {
  id: string
  time: string       // HH:MM
  durationMin: number
}

interface Params {
  tonsPerDay: number
  storeTrucks: number      // 30t biler
  smaaTrucks: number       // 15t biler
  driveMinutes: number     // en vej: fabrik → plads
  loadMinutes: number      // pålæsning på fabrik
  deliverMinutes: number   // aflæsning på plads
  intervalMinutes: number  // ønsket leveringsinterval
  firstLoadTime: string    // HH:MM — første læs ankommer til plads
  lastLoadTime: string     // HH:MM — sidste læs ankommer til plads
}

interface TripSegment {
  phase: 'load' | 'drive-out' | 'deliver' | 'drive-back'
  startMin: number
  endMin: number
}

interface TruckSchedule {
  truckId: number
  trips: TripSegment[][]
  deliveries: number[]
}

interface TripRow {
  truckId: number
  licensePlate: string
  truckSize: 'store' | 'smaa'
  tons: number
  ankomstFabrik: string
  lastningMin: number
  koretidMin: number
  aflaesningMin: number
  ankomstPlads: string
  aflaesningFaerdig: string
  kanAfmeldes: boolean
  ventetidHold: number
  ventetidFabrik: number
  ventetidPlads: number
  tripIndex: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar

const MOCK_PLATES = [
  'AB12345', 'CD67890', 'EF23456', 'GH78901',
  'IJ01234', 'KL56789', 'MN90123', 'OP45678',
]

const DEFAULT_PARAMS: Params = {
  tonsPerDay: 250,
  storeTrucks: 5,
  smaaTrucks: 0,
  driveMinutes: 36,
  loadMinutes: 15,
  deliverMinutes: 10,
  intervalMinutes: 20,
  firstLoadTime: '07:51',
  lastLoadTime: '15:30',
}

// ─── Dage for ordre ─────────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar

type DayState = 'completed' | 'active' | 'planned'

interface OrderDay {
  date: string       // YYYY-MM-DD
  label: string      // 'ma 16. mar'
  tons: number
  state: DayState
}

const ORDER_DAYS: OrderDay[] = [
  { date: '2026-03-14', label: 'fr 14. mar', tons: 130, state: 'completed' },
  { date: '2026-03-16', label: 'ma 16. mar', tons: 250, state: 'active'    },
  { date: '2026-03-17', label: 'ti 17. mar', tons: 230, state: 'planned'   },
  { date: '2026-03-18', label: 'on 18. mar', tons: 200, state: 'planned'   },
  { date: '2026-03-19', label: 'to 19. mar', tons: 142, state: 'planned'   },
]

const TODAY_INDEX = ORDER_DAYS.findIndex(d => d.state === 'active')

// ─── Mock produkter ─────────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar

interface MockProductMeta {
  id: string
  recipeCode: string
  tonsTotal: number
  tonsPerDay: Record<string, number>
}

const MOCK_PRODUCTS: MockProductMeta[] = [
  {
    id: 'p1',
    recipeCode: '23001B',
    tonsTotal: 200,
    tonsPerDay: {
      '2026-03-14': 50,
      '2026-03-16': 80,
      '2026-03-17': 70,
    },
  },
  {
    id: 'p2',
    recipeCode: '82101H',
    tonsTotal: 752,
    tonsPerDay: {
      '2026-03-14': 80,
      '2026-03-16': 170,
      '2026-03-17': 160,
      '2026-03-18': 200,
      '2026-03-19': 142,
    },
  },
]


// ─── Beregning ────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface CalcResult {
  roundTripMinutes: number
  tripsPerTruck: number
  optimalTrucks: number
  trucksNeeded: number
  truckDelta: number
  deliveryIntervalMinutes: number
  firstTruckFabrik: string
  firstTruckPlads: string
  lastTruckFabrik: string
  lastTruckPlads: string
  holdWaitMinutes: number
  driverWaitMinutes: number
  totalTons: number
  totalVentetidHold: number
  totalVentetidFabrik: number
  totalVentetidPlads: number
  tripRows: TripRow[]
  schedules: TruckSchedule[]
}

function calculate(p: Params): CalcResult {
  const roundTrip = p.loadMinutes + p.driveMinutes + p.deliverMinutes + p.driveMinutes

  const firstDeliveryMin = timeToMinutes(p.firstLoadTime)
  const startMin = firstDeliveryMin - p.loadMinutes - p.driveMinutes
  const endMin = timeToMinutes(p.lastLoadTime)
  const workMinutes = Math.max(0, endMin - startMin)

  const tripsPerTruck = workMinutes > 0 ? Math.floor(workMinutes / roundTrip) : 0

  // Optimal antal biler (beregnet anbefaling)
  const totalUserTrucks = p.storeTrucks + p.smaaTrucks
  const avgTons = totalUserTrucks > 0
    ? (p.storeTrucks * 30 + p.smaaTrucks * 15) / totalUserTrucks
    : 30
  const tonsPerTruckDay = tripsPerTruck * avgTons
  const trucksForCapacity = tonsPerTruckDay > 0 ? Math.ceil(p.tonsPerDay / tonsPerTruckDay) : 1
  const trucksForContinuity = Math.ceil(roundTrip / p.intervalMinutes)
  const optimalTrucks = Math.max(trucksForCapacity, trucksForContinuity, 1)

  const trucksNeeded = Math.max(totalUserTrucks, 1)
  const truckDelta = trucksNeeded - optimalTrucks
  const interval = roundTrip / trucksNeeded

  const firstTruckFabrik = minutesToTime(startMin)
  const firstTruckPlads = minutesToTime(firstDeliveryMin)
  const holdWaitMinutes = Math.max(0, Math.round(interval - p.deliverMinutes))

  // Tildel biltyper: første storeTrucks er 30t, resten 15t
  const truckTypes: ('store' | 'smaa')[] = [
    ...Array(p.storeTrucks).fill('store' as const),
    ...Array(Math.max(0, trucksNeeded - p.storeTrucks)).fill('smaa' as const),
  ]

  // Byg køreplan
  const schedules: TruckSchedule[] = []
  for (let i = 0; i < trucksNeeded; i++) {
    const trips: TripSegment[][] = []
    const deliveries: number[] = []
    let cursor = startMin + Math.round(i * interval)

    while (cursor + p.loadMinutes + p.driveMinutes + p.deliverMinutes < endMin) {
      const load: TripSegment      = { phase: 'load',       startMin: cursor,           endMin: cursor + p.loadMinutes }
      const driveOut: TripSegment  = { phase: 'drive-out',  startMin: load.endMin,      endMin: load.endMin + p.driveMinutes }
      const deliver: TripSegment   = { phase: 'deliver',    startMin: driveOut.endMin,  endMin: driveOut.endMin + p.deliverMinutes }
      const driveBack: TripSegment = { phase: 'drive-back', startMin: deliver.endMin,   endMin: deliver.endMin + p.driveMinutes }
      trips.push([load, driveOut, deliver, driveBack])
      deliveries.push(driveOut.endMin)
      cursor = driveBack.endMin
    }
    schedules.push({ truckId: i + 1, trips, deliveries })
  }

  // Byg TripRows
  const rawRows: TripRow[] = []
  for (const schedule of schedules) {
    const tSize = truckTypes[schedule.truckId - 1] ?? 'store'
    const tons = tSize === 'store' ? 30 : 15
    schedule.trips.forEach((trip, tripIdx) => {
      rawRows.push({
        truckId: schedule.truckId,
        licensePlate: MOCK_PLATES[(schedule.truckId - 1) % MOCK_PLATES.length],
        truckSize: tSize,
        tons,
        ankomstFabrik:     minutesToTime(trip[0].startMin),
        lastningMin:       p.loadMinutes,
        koretidMin:        p.driveMinutes,
        aflaesningMin:     p.deliverMinutes,
        ankomstPlads:      minutesToTime(trip[1].endMin),
        aflaesningFaerdig: minutesToTime(trip[2].endMin),
        kanAfmeldes:       tripIdx === schedule.trips.length - 1,
        ventetidHold:      0,
        ventetidFabrik:    0,
        ventetidPlads:     0,
        tripIndex:         tripIdx,
      })
    })
  }

  // Sortér kronologisk efter ankomst fabrik
  rawRows.sort((a, b) =>
    timeToMinutes(a.ankomstFabrik) - timeToMinutes(b.ankomstFabrik) ||
    timeToMinutes(a.ankomstPlads)  - timeToMinutes(b.ankomstPlads)
  )

  // Beregn ventetider
  for (let i = 1; i < rawRows.length; i++) {
    const prev = rawRows[i - 1]
    const curr = rawRows[i]
    const gap = timeToMinutes(curr.ankomstPlads) - timeToMinutes(prev.aflaesningFaerdig)
    if (gap > 0) rawRows[i].ventetidHold  = gap
    else if (gap < 0) rawRows[i].ventetidPlads = Math.abs(gap)
  }

  const totalVentetidHold   = rawRows.reduce((s, r) => s + r.ventetidHold,   0)
  const totalVentetidFabrik = rawRows.reduce((s, r) => s + r.ventetidFabrik, 0)
  const totalVentetidPlads  = rawRows.reduce((s, r) => s + r.ventetidPlads,  0)

  // Sidste bil
  let lastFabrikMin = startMin
  let lastPladsMin  = firstDeliveryMin
  for (const s of schedules) {
    for (const trip of s.trips) {
      if (trip[1].startMin > lastFabrikMin) lastFabrikMin = trip[1].startMin
      if (trip[1].endMin   > lastPladsMin)  lastPladsMin  = trip[1].endMin
    }
  }

  const totalTons = rawRows.reduce((s, r) => s + r.tons, 0)

  return {
    roundTripMinutes: roundTrip,
    tripsPerTruck,
    optimalTrucks,
    trucksNeeded,
    truckDelta,
    deliveryIntervalMinutes: Math.round(interval),
    firstTruckFabrik,
    firstTruckPlads,
    lastTruckFabrik:  minutesToTime(lastFabrikMin),
    lastTruckPlads:   minutesToTime(lastPladsMin),
    holdWaitMinutes,
    driverWaitMinutes: 0,
    totalTons,
    totalVentetidHold,
    totalVentetidFabrik,
    totalVentetidPlads,
    tripRows: rawRows,
    schedules,
  }
}

// ─── Farver (Rundtur-bar) ─────────────────────────────────────────────────────

const PHASE_COLOR: Record<TripSegment['phase'], string> = {
  'load':       '#A0C7D7',
  'drive-out':  '#CAE6E3',
  'deliver':    '#FEEE32',
  'drive-back': '#2A6E96',
}

const PHASE_LABEL: Record<TripSegment['phase'], string> = {
  'load':       'Pålæsning',
  'drive-out':  'Kørsel ud',
  'deliver':    'Aflæsning',
  'drive-back': 'Kørsel hjem',
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TransportberegnerScreen() {
  const navigate = useNavigate()
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS)
  const [paramsOpen, setParamsOpen] = useState(true)
  const [simOpen, setSimOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [savedDays, setSavedDays] = useState<Set<number>>(new Set([0]))
  const [dayIndex, setDayIndex] = useState(TODAY_INDEX)
  const [showLeaveAlert, setShowLeaveAlert] = useState(false)
  const [activeProductId, setActiveProductId] = useState(MOCK_PRODUCTS[0].id)
  const [pauses, setPauses] = useState<Pause[]>([
    { id: 'pause-1', time: '11:30', durationMin: 30 },
  ])

  const currentDay = ORDER_DAYS[dayIndex]
  const activeProduct = MOCK_PRODUCTS.find(p => p.id === activeProductId) ?? MOCK_PRODUCTS[0]

  // Sync tonsPerDay fra dagfordeling når produkt eller dag skiftes
  useEffect(() => {
    const tons = activeProduct.tonsPerDay[ORDER_DAYS[dayIndex].date]
    if (tons !== undefined) {
      setParams(prev => ({ ...prev, tonsPerDay: tons }))
      setAccepted(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductId, dayIndex])

  function handleBack() {
    if (!savedDays.has(dayIndex)) {
      setShowLeaveAlert(true)
    } else {
      navigate('/prototyper/ordre-plan')
    }
  }

  const result = useMemo(() => calculate(params), [params])

  function updateParam<K extends keyof Params>(key: K, value: Params[K]) {
    setParams(prev => ({ ...prev, [key]: value }))
    setAccepted(false)
  }

  function addPause() {
    setPauses(prev => [...prev, { id: `pause-${Date.now()}`, time: '12:00', durationMin: 30 }])
  }

  function removePause(id: string) {
    setPauses(prev => prev.filter(p => p.id !== id))
  }

  function updatePause(id: string, field: keyof Omit<Pause, 'id'>, value: string | number) {
    setPauses(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function pauseEndTime(pause: Pause): string {
    const [h, m] = pause.time.split(':').map(Number)
    const endMin = h * 60 + m + pause.durationMin
    return `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
  }

  function goToDay(idx: number) {
    const day = ORDER_DAYS[idx]
    setDayIndex(idx)
    setParams(prev => ({ ...prev, tonsPerDay: day.tons }))
    setAccepted(false)
  }

  const capacityOk = result.totalTons >= params.tonsPerDay

  return (
    <div className="min-h-screen bg-soft-aqua flex flex-col">
      <TopBar
        userInitials="OJ"
        userName="Ole J."
        onSettingsPress={() => {}}
        onLogoPress={() => navigate('/prototyper/dagsoversigt')}
        nav={{
          items: [
            { id: 'kalenderoversigt', label: 'Kalenderoversigt', to: '/prototyper/gantt' },
            { id: 'dagens-opgaver',   label: 'Dagens opgaver',   to: '/prototyper/dagsoversigt' },
          ],
          // activeId udeladt — TransportberegnerScreen er et sub-værktøj, intet nav-mål er aktivt
          onNavigate: (item) => navigate(item.to),
        }}
      />

      <main className="flex-1 overflow-y-auto pb-lg">

        <div className="px-sm pb-sm pt-sm flex flex-col gap-sm">

          {/* ── Tilbage + Overskrift ────────────────────────────── */}
          <button
            onClick={handleBack}
            className="flex items-center gap-xxxs text-text-muted pl-sm"
          >
            <ArrowLeft size={15} />
            <span className="font-inter text-xs">Tilbage</span>
          </button>

          <h1 className="font-poppins font-bold text-2xl text-deep-teal leading-none pl-sm">
            Beregn køreplan
          </h1>

          {/* ── Dagsnavigation + Kørselsdetaljer overskrift ─────── */}
          <div className="flex items-center gap-sm">
          <div className="flex-1 flex items-center gap-sm pl-sm">
            <button
              onClick={() => goToDay(dayIndex - 1)}
              disabled={dayIndex === 0}
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#0E4764' }}
            >
              <ArrowLeft size={14} className="text-white" />
            </button>

            <div className="flex items-center gap-xs">
              {ORDER_DAYS.map((day, i) => (
                <button
                  key={day.date}
                  onClick={() => goToDay(i)}
                  className="flex items-center gap-xxxs px-xs py-xxxs rounded-full transition-colors"
                  style={{
                    backgroundColor: i === dayIndex ? '#2E9E65' : 'transparent',
                    outline: savedDays.has(i) && i !== dayIndex ? '1.5px solid #2E9E65' : undefined,
                    outlineOffset: '0px',
                  }}
                >
                  {savedDays.has(i) ? (
                    <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2E9E65' }}>
                      <span className="text-white leading-none" style={{ fontSize: 8 }}>✓</span>
                    </div>
                  ) : i !== dayIndex ? (
                    <div
                      className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#F04E4E' }}
                    />
                  ) : null}
                  <span
                    className="font-inter text-xs whitespace-nowrap"
                    style={{ color: i === dayIndex ? '#ffffff' : '#717182' }}
                  >
                    {day.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => goToDay(dayIndex + 1)}
              disabled={dayIndex === ORDER_DAYS.length - 1}
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#0E4764' }}
            >
              <ArrowRight size={14} className="text-white" />
            </button>
          </div>
            <h2 className="flex-1 font-poppins font-bold text-lg text-deep-teal leading-none">
              Kørselsdetaljer
            </h2>
          </div>

          {/* ── Parametre + Resultat — side om side ─────────────── */}
          <div className="flex gap-sm items-stretch">

            {/* Parametre — venstre 50% */}
            <div className="flex-1 min-w-0 bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setParamsOpen(o => !o)}
                className="w-full flex items-center justify-between px-sm py-xs hover:bg-soft-aqua/50 transition-colors"
              >
                <p className="font-poppins font-semibold text-xs text-deep-teal">
                  Præcisering af kørsel
                </p>
                {paramsOpen
                  ? <ChevronUp size={16} className="text-text-muted" />
                  : <ChevronDown size={16} className="text-text-muted" />
                }
              </button>

              {paramsOpen && (
                <div className="px-sm pb-sm flex flex-col gap-xs border-t border-box-outline">

                  {/* Tons i dag */}
                  <div className="pt-xs px-xs">
                    <ParamInput
                      label="Tons i dag (Hentet fra dagsfordeling)"
                      unit="t"
                      value={params.tonsPerDay}
                      onChange={v => updateParam('tonsPerDay', v)}
                      icon={<Truck size={13} className="text-dark-teal" />}
                    />
                  </div>

                  {/* Bilstørrelse */}
                  <div className="flex flex-col gap-xxxs px-xs">
                    <label className="font-inter text-xxs text-text-muted flex items-center gap-xxxs">
                      <Truck size={13} className="text-dark-teal" />
                      Bilstørrelse
                    </label>
                    <div className="flex flex-col gap-xxxs">
                      {([
                        { key: 'storeTrucks' as const, label: 'Store', note: '30t pr. bil',                       value: params.storeTrucks },
                        { key: 'smaaTrucks'  as const, label: 'Små',   note: '15t pr. bil — begrænset adgang',   value: params.smaaTrucks },
                      ] as const).map(opt => (
                        <div
                          key={opt.key}
                          className="flex items-center justify-between bg-soft-aqua rounded-md px-xs py-xs"
                        >
                          <div>
                            <p className="font-inter font-semibold text-xs text-deep-teal leading-none">{opt.label}</p>
                            <p className="font-inter text-[9px] text-text-muted leading-none mt-xxxs">{opt.note}</p>
                          </div>
                          <div className="flex items-center gap-xs">
                            <button
                              onClick={() => updateParam(opt.key, Math.max(0, opt.value - 1))}
                              className="w-[24px] h-[24px] rounded-md flex items-center justify-center font-bold text-sm"
                              style={{ backgroundColor: '#0E4764', color: '#ffffff' }}
                            >−</button>
                            <span className="font-poppins font-bold text-xs text-deep-teal w-[20px] text-center">
                              {opt.value}
                            </span>
                            <button
                              onClick={() => updateParam(opt.key, opt.value + 1)}
                              className="w-[24px] h-[24px] rounded-md flex items-center justify-center font-bold text-sm"
                              style={{ backgroundColor: '#0E4764', color: '#ffffff' }}
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fabrik – Plads */}
                  <div className="bg-soft-aqua rounded-md p-xs flex flex-col gap-xs">
                    <div className="flex items-center gap-xs">
                      <Factory size={13} className="text-dark-teal flex-shrink-0" />
                      <p className="font-inter font-semibold text-xxs text-dark-teal">Fabrik – Plads</p>
                    </div>
                    <div className="grid grid-cols-4 gap-xs">
                      <ParamInput label="Køretid (en vej)" unit="min" value={params.driveMinutes}    onChange={v => updateParam('driveMinutes', v)} />
                      <ParamInput label="Pålæsning"                                  unit="min" value={params.loadMinutes}     onChange={v => updateParam('loadMinutes', v)} />
                      <ParamInput label="Aflæsning"                                  unit="min" value={params.deliverMinutes}  onChange={v => updateParam('deliverMinutes', v)} />
                      <ParamInput label="Interval"                                   unit="min" value={params.intervalMinutes} onChange={v => updateParam('intervalMinutes', v)} />
                    </div>
                  </div>

                  {/* Leveringstid */}
                  <div className="bg-soft-aqua rounded-md p-xs flex flex-col gap-xs">
                    <div className="flex items-center gap-xs">
                      <Clock size={13} className="text-dark-teal flex-shrink-0" />
                      <p className="font-inter font-semibold text-xxs text-dark-teal">Leveringstid på pladsen</p>
                    </div>
                    <div className="grid grid-cols-2 gap-xs">
                      <div className="flex flex-col gap-xxxs">
                        <label className="font-inter text-xxs text-text-muted">Første læs</label>
                        <input
                          type="time"
                          value={params.firstLoadTime}
                          onChange={e => updateParam('firstLoadTime', e.target.value)}
                          className="font-inter text-xs text-deep-teal rounded-md px-xs py-[6px] border-2 border-dark-teal bg-white focus:outline-none accent-dark-teal"
                        />
                      </div>
                      <div className="flex flex-col gap-xxxs">
                        <label className="font-inter text-xxs text-text-muted">Sidste læs</label>
                        <input
                          type="time"
                          value={params.lastLoadTime}
                          onChange={e => updateParam('lastLoadTime', e.target.value)}
                          className="font-inter text-xs text-deep-teal rounded-md px-xs py-[6px] border-2 border-dark-teal bg-white focus:outline-none accent-dark-teal"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pauser */}
                  <div className="bg-soft-aqua rounded-md p-xs flex flex-col gap-xs">
                    <div className="flex items-center gap-xs">
                      <Coffee size={13} className="text-dark-teal flex-shrink-0" />
                      <p className="font-inter font-semibold text-xxs text-dark-teal">Pauser</p>
                    </div>

                    {pauses.map(pause => (
                      <div key={pause.id} className="flex items-center gap-xs">
                        <div className="flex flex-col gap-xxxs flex-1">
                          <label className="font-inter text-xxs text-text-muted">Tidspunkt</label>
                          <input
                            type="time"
                            value={pause.time}
                            onChange={e => updatePause(pause.id, 'time', e.target.value)}
                            className="font-inter text-xs text-deep-teal rounded-md px-xs py-[6px] border-2 border-dark-teal bg-white focus:outline-none accent-dark-teal w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-xxxs w-[64px]">
                          <label className="font-inter text-xxs text-text-muted">Varighed</label>
                          <div className="flex items-center gap-xxxs bg-white rounded-md border-2 border-dark-teal overflow-hidden">
                            <input
                              type="number"
                              value={pause.durationMin}
                              min={5}
                              onChange={e => updatePause(pause.id, 'durationMin', Math.max(5, parseInt(e.target.value, 10) || 5))}
                              className="flex-1 min-w-0 bg-transparent font-poppins font-semibold text-xs text-deep-teal px-xs py-[6px] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <span className="font-inter text-xxs text-text-muted pr-xs flex-shrink-0">m</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removePause(pause.id)}
                          aria-label="Fjern pause"
                          className="mt-[18px] w-[24px] h-[24px] flex items-center justify-center rounded-md hover:bg-error/10 transition-colors flex-shrink-0"
                        >
                          <X size={12} className="text-text-muted" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={addPause}
                      className="flex items-center gap-xxxs text-dark-teal hover:text-deep-teal transition-colors mt-xxxs"
                    >
                      <Plus size={12} />
                      <span className="font-inter text-xxs font-semibold">Tilføj pause</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Resultat-kort — højre 50% */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex flex-col rounded-lg shadow-md overflow-hidden flex-1">
              {/* Produkt-faner — flush på toppen af boksen */}
              <div className="flex" style={{ backgroundColor: '#0E4764' }}>
                {MOCK_PRODUCTS.map(p => {
                  const tonsForDay = p.tonsPerDay[currentDay.date]
                  const isActive = p.id === activeProductId
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveProductId(p.id)}
                      className="flex-1 relative flex items-center justify-center gap-xs px-xs py-xs"
                    >
                      <span className={`font-poppins font-semibold text-sm leading-tight ${isActive ? 'text-white' : 'text-white/50'}`}>
                        {p.recipeCode}
                      </span>
                      <span className={`font-inter text-xs leading-none ${isActive ? 'text-white/70' : 'text-white/35'}`}>
                        {tonsForDay !== undefined ? `${tonsForDay}t` : '–t'}
                      </span>
                      <div className={`absolute bottom-0 left-0 right-0 h-[5px] ${isActive ? 'bg-yellow' : 'bg-white/10'}`} />
                    </button>
                  )
                })}
              </div>

              <div className="px-sm py-sm flex flex-col flex-1 justify-between gap-sm" style={{ backgroundColor: '#0E4764' }}>

              <div className="grid grid-cols-3 gap-md pt-sm">
                <ResultStat label="Antal biler"               value={`${result.trucksNeeded}`}            unit="" delta={result.truckDelta} />
                <ResultStat label="Første bil plads"          value={result.firstTruckPlads}              unit="" />
                <ResultStat label="Første bil fabrik"         value={result.firstTruckFabrik}             unit="" />
                <ResultStat label="Interval (min)"            value={`${result.deliveryIntervalMinutes}`} unit="" />
                <ResultStat label="Sidste bil plads"          value={result.lastTruckPlads}               unit="" />
                <ResultStat label="Sidste bil fabrik"         value={result.lastTruckFabrik}              unit="" />
                <ResultStat label="Ventetid hold (akk.)"      value={`${result.totalVentetidHold}`}       unit=""
                  warn={result.totalVentetidHold > 0} ok={result.totalVentetidHold === 0} />
                <ResultStat label="Ventetid plads (akk.)"     value={`${result.totalVentetidPlads}`}      unit=""
                  warn={result.totalVentetidPlads > 0} ok={result.totalVentetidPlads === 0} />
                <ResultStat label="Ventetid fabrik (akk.)"    value={`${result.totalVentetidFabrik}`}     unit=""
                  warn={result.totalVentetidFabrik > 0} ok={result.totalVentetidFabrik === 0} />
              </div>

              {!capacityOk && (
                <div className="mt-xs bg-error/20 rounded-md px-xs py-xs">
                  <p className="font-inter text-xxs text-error leading-relaxed">
                    {result.totalTons}t dækker ikke {params.tonsPerDay}t krævet.
                  </p>
                </div>
              )}

              {/* Pause anbefaling — hardcodet prototype */}
              {/* TODO: Erstat med Supabase når klar */}
              {pauses.length > 0 && (
                <div className="mt-sm pt-sm border-t border-white/10">
                  <div className="flex items-center gap-xs mb-xs">
                    <Coffee size={12} className="text-white/60 flex-shrink-0" />
                    <p className="font-inter font-semibold text-xxs text-white/60">Anbefalet hold-pause</p>
                  </div>
                  <div className="flex flex-col gap-xs">
                    {pauses.map(pause => (
                      <div key={pause.id} className="bg-white/10 rounded-md px-xs py-xs flex flex-col gap-xxxs">
                        <p className="font-poppins font-bold text-md text-white leading-none">
                          {pause.time} – {pauseEndTime(pause)}
                          <span className="font-inter font-normal text-xxs text-white/50 ml-xs">{pause.durationMin} min</span>
                        </p>
                        <div className="flex flex-col gap-xxxs mt-xxxs">
                          <p className="font-inter text-xxs text-white/70 flex items-center gap-xxxs">
                            <CheckCircle2 size={10} className="flex-shrink-0 text-yellow" />
                            Ingen leverancer i vinduet
                          </p>
                          <p className="font-inter text-xxs text-white/70 flex items-center gap-xxxs">
                            <CheckCircle2 size={10} className="flex-shrink-0 text-yellow" />
                            Alle chauffører på fabrik
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rundtur */}
              <div>
                <div className="flex h-[20px] rounded-md overflow-hidden gap-[2px]">
                  {(['load', 'drive-out', 'deliver', 'drive-back'] as const).map(phase => {
                    const durations: Record<TripSegment['phase'], number> = {
                      'load':       params.loadMinutes,
                      'drive-out':  params.driveMinutes,
                      'deliver':    params.deliverMinutes,
                      'drive-back': params.driveMinutes,
                    }
                    const dur = durations[phase]
                    const pct = (dur / result.roundTripMinutes) * 100
                    return (
                      <div
                        key={phase}
                        className="flex items-center justify-center overflow-hidden"
                        style={{ width: `${pct}%`, backgroundColor: PHASE_COLOR[phase] }}
                        title={`${PHASE_LABEL[phase]}: ${dur} min`}
                      >
                        <span
                          className="font-inter font-semibold text-[9px] leading-none whitespace-nowrap px-xxxs"
                          style={{ color: phase === 'deliver' || phase === 'drive-out' ? '#0B3950' : '#ffffff' }}
                        >
                          {dur}m
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-xs mt-xs items-center">
                  <span className="font-inter font-bold text-xxs text-white">
                    Rundtur: {result.roundTripMinutes} min
                  </span>
                  {(['load', 'drive-out', 'deliver', 'drive-back'] as const).map(phase => (
                    <div key={phase} className="flex items-center gap-xxxs">
                      <div className="w-[7px] h-[7px] rounded-[2px] flex-shrink-0" style={{ backgroundColor: PHASE_COLOR[phase] }} />
                      <span className="font-inter text-xxs text-white">{PHASE_LABEL[phase]}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* /px-sm py-sm */}
            </div>{/* /rounded box */}
            </div>{/* /resultat-kort wrapper */}

          </div>{/* /side-om-side */}

          {/* ── Kørselsoversigt ─────────────────────────────────── */}
          <h2 className="font-poppins font-bold text-lg text-deep-teal leading-none pl-sm">
            Kørselsoversigt
          </h2>

          <div className="rounded-lg overflow-hidden shadow-md">

            <button
              onClick={() => setSimOpen(o => !o)}
              className="w-full flex flex-col items-center justify-center gap-xxxs py-sm"
              style={{ backgroundColor: '#0E4764' }}
            >
              <span className="font-poppins font-semibold text-sm text-white">
                Se simulering
              </span>
              {simOpen
                ? <ChevronUp size={18} className="text-white/70" />
                : <ChevronDown size={18} className="text-white/70" />
              }
            </button>

            {/* Tabel */}
            {simOpen && <div className="overflow-x-auto bg-white">
              <table className="w-full border-collapse" style={{ minWidth: 980 }}>
                <thead>
                  <tr className="bg-dark-teal">
                    {['Bil', 'Nummerplade', 'Tons', 'Ankomst fabrik', 'Lastning', 'Køretid', 'Aflæsning', 'Ankomst plads', 'Aflæsning færdig', 'Kan afmeldes', 'Ventetid hold', 'Ventetid fabrik', 'Ventetid plads'].map(col => (
                      <th
                        key={col}
                        className="font-inter font-semibold text-[10px] text-white text-left px-xs py-xs whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.tripRows.map((row, idx) => {
                    const key = `${row.truckId}-${row.tripIndex}`
                    const isOdd = idx % 2 === 1
                    return (
                      <tr
                        key={key}
                        style={{ backgroundColor: isOdd ? '#F8FBFC' : '#ffffff' }}
                        className="border-b border-box-outline last:border-0"
                      >
                        {/* Bil — størrelses-ikon */}
                        <td className="px-xs py-[7px]">
                          <div className="flex flex-col gap-[3px]">
                            <div className="h-[3px] rounded-full w-[18px]" style={{ backgroundColor: row.truckSize === 'store' ? '#0E4764' : '#A0C7D7' }} />
                            <div className="h-[3px] rounded-full w-[18px]" style={{ backgroundColor: row.truckSize === 'store' ? '#0E4764' : '#A0C7D7' }} />
                            {row.truckSize === 'store' && (
                              <div className="h-[3px] rounded-full w-[18px]" style={{ backgroundColor: '#0E4764' }} />
                            )}
                          </div>
                        </td>

                        {/* Nummerplade */}
                        <td className="px-xs py-[7px]">
                          <span className="font-inter font-semibold text-[10px] text-deep-teal border border-box-outline rounded px-[5px] py-[2px] bg-white whitespace-nowrap">
                            {row.licensePlate}
                          </span>
                        </td>

                        {/* Tons */}
                        <td className="px-xs py-[7px] font-inter text-xs text-text-secondary whitespace-nowrap">
                          {row.tons} ton
                        </td>

                        {/* Ankomst fabrik */}
                        <td className="px-xs py-[7px] font-poppins font-semibold text-xs text-deep-teal">
                          {row.ankomstFabrik}
                        </td>

                        {/* Lastning */}
                        <td className="px-xs py-[7px] font-inter text-xs text-text-secondary">
                          {row.lastningMin} min
                        </td>

                        {/* Køretid */}
                        <td className="px-xs py-[7px] font-inter text-xs text-text-secondary">
                          {row.koretidMin} min
                        </td>

                        {/* Aflæsning (varighed) */}
                        <td className="px-xs py-[7px] font-inter text-xs text-text-secondary">
                          {row.aflaesningMin} min
                        </td>

                        {/* Ankomst plads */}
                        <td className="px-xs py-[7px] font-poppins font-semibold text-xs text-deep-teal">
                          {row.ankomstPlads}
                        </td>

                        {/* Aflæsning færdig */}
                        <td className="px-xs py-[7px] font-poppins font-semibold text-xs text-deep-teal">
                          {row.aflaesningFaerdig}
                        </td>

                        {/* Kan afmeldes */}
                        <td className="px-xs py-[7px] text-center">
                          <div
                            className="w-[10px] h-[10px] rounded-full mx-auto"
                            style={{ backgroundColor: row.kanAfmeldes ? '#2E9E65' : '#F04E4E' }}
                          />
                        </td>

                        {/* Ventetid hold */}
                        <td className="px-xs py-[7px] font-inter text-xs whitespace-nowrap"
                          style={{ color: row.ventetidHold > 0 ? '#F04E4E' : '#717182' }}>
                          {row.ventetidHold} min
                        </td>

                        {/* Ventetid fabrik */}
                        <td className="px-xs py-[7px] font-inter text-xs text-text-muted whitespace-nowrap">
                          {row.ventetidFabrik} min
                        </td>

                        {/* Ventetid plads */}
                        <td className="px-xs py-[7px] font-inter text-xs text-text-muted whitespace-nowrap">
                          {row.ventetidPlads} min
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {/* Total */}
              <div className="px-sm py-xs border-t border-box-outline flex justify-between items-center">
                <span className="font-inter text-xxs text-text-muted">Total leveret</span>
                <span className="font-poppins font-semibold text-xs text-deep-teal">{result.totalTons}t</span>
              </div>
            </div>}{/* /simOpen */}

          </div>

          {/* ── Bekræft-knap ─────────────────────────────────────── */}
          <button
            onClick={() => { setAccepted(true); setSavedDays(prev => new Set(prev).add(dayIndex)) }}
            className="w-full font-inter font-semibold text-sm py-[14px] rounded-xl transition-colors"
            style={
              accepted
                ? { backgroundColor: '#CAE6E3', color: '#0B3950' }
                : { backgroundColor: '#2E9E65', color: '#ffffff' }
            }
          >
            {accepted ? `✓ Køreplan gemt — ${currentDay.label}` : `Gem køreplan — ${currentDay.label}`}
          </button>

        </div>
      </main>

      {/* ── Forlad-alert ─────────────────────────────────────────── */}
      {showLeaveAlert && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-lg px-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="px-sm pt-sm pb-xs">
              <p className="font-poppins font-bold text-base text-deep-teal text-center leading-snug">
                Forlad uden at gemme?
              </p>
              <p className="font-inter text-xs text-text-muted text-center mt-xxxs leading-snug">
                Køreplan for {currentDay.label} er ikke gemt endnu.
              </p>
            </div>
            <div className="border-t border-box-outline">
              <button
                onClick={() => navigate('/prototyper/ordre-plan')}
                className="w-full py-sm font-inter font-semibold text-sm text-error border-b border-box-outline"
              >
                Forlad uden at gemme
              </button>
              <button
                onClick={() => setShowLeaveAlert(false)}
                className="w-full py-sm font-inter text-sm text-deep-teal"
              >
                Bliv og gem
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── ParamInput ───────────────────────────────────────────────────────────────

function ParamInput({
  label, unit, value, onChange, icon,
}: {
  label: string
  unit: string
  value: number
  onChange: (v: number) => void
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-xxxs">
      <label className="font-inter text-xxs text-text-muted flex items-center gap-xxxs">
        {icon}
        {label}
      </label>
      <div className="flex items-center gap-xxxs bg-soft-aqua rounded-md border-2 border-light-aqua focus-within:border-dark-teal overflow-hidden">
        <input
          type="number"
          value={value}
          min={1}
          onChange={e => onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="flex-1 min-w-0 bg-transparent font-poppins font-semibold text-xs text-deep-teal px-xs py-[6px] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="font-inter text-xxs text-text-muted pr-xs flex-shrink-0">{unit}</span>
      </div>
    </div>
  )
}

// ─── ResultStat ───────────────────────────────────────────────────────────────

function ResultStat({
  label, value, unit, warn, ok, delta,
}: {
  label: string
  value: string
  unit: string
  warn?: boolean
  ok?: boolean
  delta?: number
}) {
  const valueColor = warn ? '#F04E4E' : ok ? '#2E9E65' : '#ffffff'
  return (
    <div className="flex flex-col items-center gap-xs">
      <p className="font-inter text-xxs leading-none text-white text-center">{label}</p>
      <div className="flex items-baseline gap-xxxs">
        <p
          className="font-poppins font-bold leading-none"
          style={{ fontSize: 22, color: valueColor }}
        >
          {value}
        </p>
        {delta !== undefined && delta !== 0 && (
          <span
            className="font-inter text-xs font-semibold leading-none"
            style={{ color: delta > 0 ? '#2E9E65' : '#F04E4E' }}
          >
            ({delta > 0 ? '+' : ''}{delta})
          </span>
        )}
        {unit && (
          <p className="font-inter text-xxs leading-none" style={{ color: valueColor }}>{unit}</p>
        )}
      </div>
    </div>
  )
}
