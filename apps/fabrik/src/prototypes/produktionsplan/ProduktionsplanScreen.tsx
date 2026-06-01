import { useMemo, useState } from 'react'
import { Clock, Truck, Factory, CloudRain, Plus, Layers } from 'lucide-react'

// ============================================================================
// Prototype: Fabrik · Produktionsplan
// ----------------------------------------------------------------------------
// Read-only overview af dagens produktion + én handling: silo-tildeling.
// Stil og tokens følger formand-appen (EtaBadge, Poppins/Inter, tokens-only).
// ============================================================================

type BilStatus = 'planlagt' | 'undervejs' | 'ankommet'

type Bil = {
  id: string
  forventetAnkomstFabrik: string // HH:mm
  status: BilStatus
  etaMinutter?: number
  forventetEtaMinutter?: number
  chauffoerNavn: string
  chauffoerTelefon: string
}

type Ordre = {
  id: string
  holdNr: string
  formandsNavn: string
  formandsTelefon: string
  udforselssted: string
  entreprise: string
  receptNummer: string
  asfalttype: string
  morgenTons: number
  forventetMaengde: number
  biltype: string
  intervalMin: number
  minusRegn: boolean
  kommentar?: string
  biler: Bil[]
  siloNr?: number
}

type Silo = {
  nr: number
  asfalttype?: string
  totalTons: number
  ordreIds: string[]
  naeste?: {
    asfalttype: string
    totalTons: number
    ordreIds: string[]
  }
}

// Mock "nu" — hardcoded for prototypen så vi har deterministiske ETA-stater.
const NU_HHMM = '09:00'
const NU_MINUTTER = hhmmTilMinutter(NU_HHMM)

const CHAUFFOER_POOL: Array<{ navn: string; telefon: string }> = [
  { navn: 'Kim Jensen',       telefon: '+45 22 14 87 03' },
  { navn: 'Brian Sørensen',   telefon: '+45 30 91 45 67' },
  { navn: 'Mikael Larsen',    telefon: '+45 26 78 33 12' },
  { navn: 'Thomas Mortensen', telefon: '+45 51 47 92 88' },
  { navn: 'Allan Hansen',     telefon: '+45 42 19 65 30' },
  { navn: 'Kenneth Bach',     telefon: '+45 28 53 76 41' },
  { navn: 'Steen Riis',       telefon: '+45 60 35 18 94' },
  { navn: 'Jan Bertelsen',    telefon: '+45 29 84 02 76' },
]

const MOCK_ORDRER: Ordre[] = [
  {
    id: 'B-1042',
    holdNr: 'H-12',
    formandsNavn: 'Per Nielsen',
    formandsTelefon: '+45 24 18 73 02',
    udforselssted: 'Motorvej E45, etape 3',
    entreprise: 'E-2026-118',
    receptNummer: 'R-2847',
    asfalttype: 'SMA 11S',
    morgenTons: 60,
    forventetMaengde: 180,
    biltype: '7 Aks',
    intervalMin: 20,
    minusRegn: false,
    biler: lavBiler('B-1042', '08:00', 9, 20, [0, 1, 2]),
    siloNr: 1,
  },
  {
    id: 'B-1043',
    holdNr: 'H-08',
    formandsNavn: 'Lars Andersen',
    formandsTelefon: '+45 51 32 64 89',
    udforselssted: 'Ringvej Aarhus N',
    entreprise: 'E-2026-094',
    receptNummer: 'R-2849',
    asfalttype: 'SMA 11S',
    morgenTons: 40,
    forventetMaengde: 160,
    biltype: '7 Aks',
    intervalMin: 25,
    minusRegn: false,
    biler: lavBiler('B-1043', '08:45', 8, 25, []),
    siloNr: 1,
  },
  {
    id: 'B-1044',
    holdNr: 'H-21',
    formandsNavn: 'Mads Thomsen',
    formandsTelefon: '+45 40 57 21 93',
    udforselssted: 'P-plads Bilka Skanderborg',
    entreprise: 'E-2026-201',
    receptNummer: 'R-2851',
    asfalttype: 'SMA 11S',
    morgenTons: 30,
    forventetMaengde: 90,
    biltype: '5 Aks',
    intervalMin: 30,
    minusRegn: true,
    kommentar: 'Kun ved tørvejr — formand bekræfter kl. 08:30',
    biler: lavBiler('B-1044', '09:30', 6, 30, []),
  },
  {
    id: 'B-1045',
    holdNr: 'H-15',
    formandsNavn: 'Søren Pedersen',
    formandsTelefon: '+45 29 84 46 17',
    udforselssted: 'Vejle havnefront',
    entreprise: 'E-2026-153',
    receptNummer: 'R-3104',
    asfalttype: 'GAB 0/16',
    morgenTons: 0,
    forventetMaengde: 120,
    biltype: '7 Aks',
    intervalMin: 20,
    minusRegn: false,
    biler: lavBiler('B-1045', '09:15', 7, 20, []),
    siloNr: 2,
  },
  {
    id: 'B-1046',
    holdNr: 'H-04',
    formandsNavn: 'Niels Holm',
    formandsTelefon: '+45 61 90 35 54',
    udforselssted: 'Industrivej Horsens',
    entreprise: 'E-2026-077',
    receptNummer: 'R-4012',
    asfalttype: 'AB 8t',
    morgenTons: 20,
    forventetMaengde: 70,
    biltype: '5 Aks',
    intervalMin: 25,
    minusRegn: false,
    biler: lavBiler('B-1046', '10:00', 5, 25, []),
  },
  {
    id: 'B-1047',
    holdNr: 'H-19',
    formandsNavn: 'Henrik Møller',
    formandsTelefon: '+45 42 63 08 71',
    udforselssted: 'Skolevej Hedensted',
    entreprise: 'E-2026-188',
    receptNummer: 'R-4015',
    asfalttype: 'AB 8t',
    morgenTons: 25,
    forventetMaengde: 100,
    biltype: '7 Aks',
    intervalMin: 30,
    minusRegn: true,
    biler: lavBiler('B-1047', '10:30', 6, 30, []),
  },
  {
    id: 'B-1048',
    holdNr: 'H-07',
    formandsNavn: 'Jens Olesen',
    formandsTelefon: '+45 30 77 52 26',
    udforselssted: 'Hovedgaden Ry',
    entreprise: 'E-2026-220',
    receptNummer: 'R-2853',
    asfalttype: 'SMA 11A',
    morgenTons: 35,
    forventetMaengde: 110,
    biltype: '5 Aks',
    intervalMin: 20,
    minusRegn: false,
    biler: lavBiler('B-1048', '11:30', 7, 20, []),
  },
]

const MOCK_SILOER_INITIAL: Silo[] = [
  { nr: 1, asfalttype: 'SMA 11S', totalTons: 240, ordreIds: ['B-1042', 'B-1043'] },
  { nr: 2, asfalttype: 'GAB 0/16', totalTons: 120, ordreIds: ['B-1045'] },
  { nr: 3, totalTons: 0, ordreIds: [] },
  { nr: 4, totalTons: 0, ordreIds: [] },
]

// ============================================================================
// Helpers
// ============================================================================

const DAG_START_MIN = 7 * 60 + 30  // 07:30
const DAG_SLUT_MIN  = 18 * 60      // 18:00
const DAG_VARIGHED_MIN = DAG_SLUT_MIN - DAG_START_MIN  // 630
const PX_PER_MIN = 8
const DAG_BREDDE_PX = DAG_VARIGHED_MIN * PX_PER_MIN    // 5040
const INFO_BREDDE_PX = 520         // 240 (info) + 120 (interval) + 160 (næste bil)
void INFO_BREDDE_PX                // kun dokumentation — bruges via Tailwind-klasser nedenfor

function hhmmTilMinutter(hhmm: string): number {
  const [t, m] = hhmm.split(':').map(Number)
  return t * 60 + m
}

function minutterTilHhmm(min: number): string {
  const t = Math.floor(min / 60)
  const m = min % 60
  return `${t.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function lavBiler(
  ordreId: string,
  forsteBil: string,
  antal: number,
  interval: number,
  ankomneIndex: number[]
): Bil[] {
  const start = hhmmTilMinutter(forsteBil)
  // Offset poolen per ordre baseret på ordreId så vi får variation
  const ordreOffset = ordreId.replace(/\D/g, '').split('').reduce((s, d) => s + Number(d), 0)
  return Array.from({ length: antal }, (_, i) => {
    const tid = start + i * interval
    const forventetEta = Math.max(0, tid - NU_MINUTTER)
    let status: BilStatus = 'planlagt'
    let etaMinutter: number | undefined
    let forventetEtaMinutter: number | undefined

    if (ankomneIndex.includes(i)) {
      status = 'ankommet'
    } else if (tid - NU_MINUTTER <= 30 && tid - NU_MINUTTER > -10) {
      // Bil indenfor 30 min af "nu" — viser som undervejs med ETA-badge
      status = 'undervejs'
      forventetEtaMinutter = forventetEta
      // Lav lidt variation: nogle er præcis, nogle warn, nogle bad
      const variation = (i % 3) - 1 // -1, 0, +1
      etaMinutter = Math.max(0, forventetEta + variation * Math.ceil(forventetEta * 0.3))
    }

    const chauffoer = CHAUFFOER_POOL[(ordreOffset + i) % CHAUFFOER_POOL.length]

    return {
      id: `${ordreId}-bil-${i + 1}`,
      forventetAnkomstFabrik: minutterTilHhmm(tid),
      status,
      etaMinutter,
      forventetEtaMinutter,
      chauffoerNavn: chauffoer.navn,
      chauffoerTelefon: chauffoer.telefon,
    }
  })
}

function dagensDatoFormatted(): string {
  // Bevidst statisk for prototype så snapshots/screenshots er deterministiske
  return '1. juni 2026'
}

// Finder næste bil i ordren: prioriterer 'undervejs' med ETA, fallback til næste 'planlagt' efter nu
function findNaesteBil(biler: Bil[]): Bil | null {
  const undervejs = biler.find(b => b.status === 'undervejs')
  if (undervejs) return undervejs
  const planlagteFremover = biler.filter(b => {
    if (b.status !== 'planlagt') return false
    return hhmmTilMinutter(b.forventetAnkomstFabrik) > NU_MINUTTER
  })
  if (planlagteFremover.length > 0) return planlagteFremover[0]
  return null
}

// 5%-recept-match: samme asfalt-type + receptnumre indenfor 5%
function findAnbefaledeFlet(ordrer: Ordre[]): Array<{ asfalttype: string; ordrer: Ordre[] }> {
  const grupper: Record<string, Ordre[]> = {}
  for (const o of ordrer) {
    if (!grupper[o.asfalttype]) grupper[o.asfalttype] = []
    grupper[o.asfalttype].push(o)
  }
  const anbefalinger: Array<{ asfalttype: string; ordrer: Ordre[] }> = []
  for (const [asfalttype, gruppe] of Object.entries(grupper)) {
    if (gruppe.length < 2) continue
    // Antag receptnummer er R-NNNN; ekstrahér tal og tjek 5% variation
    const tal = gruppe.map(o => Number(o.receptNummer.replace(/\D/g, '')))
    const min = Math.min(...tal)
    const max = Math.max(...tal)
    if (min > 0 && (max - min) / min <= 0.05) {
      anbefalinger.push({ asfalttype, ordrer: gruppe })
    }
  }
  return anbefalinger
}

// ============================================================================
// Sub-komponenter
// ============================================================================

function MiniEtaBadge({
  bil,
  erForsteLaes,
  biltype,
}: {
  bil: Bil
  erForsteLaes?: boolean
  biltype: string
}) {
  const ringKlasse = erForsteLaes ? 'ring-2 ring-good ring-offset-1' : ''

  if (bil.status === 'ankommet') {
    return (
      <div
        className={[
          'flex flex-col gap-xxxs px-xs py-xxs rounded-md bg-good-bg text-good min-w-[150px] text-left',
          ringKlasse,
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-xxxs font-inter text-sm font-semibold">
          <Factory className="w-3 h-3 shrink-0" aria-hidden="true" />
          Ankommet
        </span>
        <span className="font-inter text-xs font-medium">{biltype} · {bil.chauffoerNavn}</span>
        <span className="font-inter text-xxs">{bil.chauffoerTelefon}</span>
      </div>
    )
  }

  // 'undervejs' og 'planlagt' vises ens — mørkeblå Truck-pille med klokkeslæt
  // Forsinkelse-farver er kun i Næste bil-kolonnen (EtaBadge), ikke her
  return (
    <div
      className={[
        'flex flex-col gap-xxxs px-xs py-xxs rounded-md bg-dark-teal text-white min-w-[150px] text-left',
        ringKlasse,
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-xxxs font-inter text-sm font-semibold">
        <Truck className="w-3 h-3 shrink-0" aria-hidden="true" />
        {bil.forventetAnkomstFabrik}
      </span>
      <span className="font-inter text-xs font-medium">{biltype} · {bil.chauffoerNavn}</span>
      <span className="font-inter text-xxs">{bil.chauffoerTelefon}</span>
    </div>
  )
}

const ROW_HEIGHT_PX = 124

function Timeline({ ordrer }: { ordrer: Ordre[] }) {
  // Tidsmarkører hver 15. min
  const ticks: number[] = []
  for (let t = DAG_START_MIN; t <= DAG_SLUT_MIN; t += 15) ticks.push(t)

  // Filtrér ordrer der har mindst én bil indenfor dag-vinduet
  const synligeOrdrer = ordrer.filter(o =>
    o.biler.some(b => {
      const min = hhmmTilMinutter(b.forventetAnkomstFabrik)
      return min >= DAG_START_MIN && min <= DAG_SLUT_MIN
    })
  )

  const nuPx = (NU_MINUTTER - DAG_START_MIN) * PX_PER_MIN

  return (
    <div className="flex-1 bg-surface border border-hairline rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-md py-xs border-b border-hairline">
        <h2 className="font-poppins font-semibold text-deep-teal text-md">Tidslinje</h2>
        <span className="font-inter text-xs text-text-muted">
          {minutterTilHhmm(DAG_START_MIN)} – {minutterTilHhmm(DAG_SLUT_MIN)}
        </span>
      </div>

      {/* Body — venstre kolonner (fast) + højre scrollende kalender */}
      <div className="flex">
        {/* Venstre: info-kolonner, ingen scroll */}
        <div className="w-[520px] shrink-0 border-r border-hairline">
          {/* Tidsskala-placeholder for at synce højde med højre */}
          <div className="h-sm bg-soft-aqua border-b border-hairline" />
          <div className="divide-y divide-hairline">
            {synligeOrdrer.length === 0 && (
              <div className="px-md py-md font-inter text-sm text-text-muted">
                Ingen biler indenfor dag-vinduet.
              </div>
            )}
            {synligeOrdrer.map(ordre => (
              <OrdreLaneInfo key={ordre.id} ordre={ordre} />
            ))}
          </div>
        </div>

        {/* Højre: tidsskala + bil-spor, horisontalt scrollbar kun her */}
        <div className="flex-1 overflow-x-auto">
          {/* Tidsskala-strip */}
          <div
            className="relative h-sm bg-soft-aqua border-b border-hairline"
            style={{ width: `${DAG_BREDDE_PX}px` }}
          >
            {ticks.map(t => {
              const px = (t - DAG_START_MIN) * PX_PER_MIN
              return (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 flex items-center"
                  style={{ left: `${px}px`, transform: 'translateX(-50%)' }}
                >
                  <span className="font-inter text-xxs text-text-muted bg-soft-aqua px-xxxs">
                    {minutterTilHhmm(t)}
                  </span>
                </div>
              )
            })}
            {/* "Nu"-markør i tidsskala */}
            <div
              className="absolute top-0 bottom-0 w-px bg-good"
              style={{ left: `${nuPx}px` }}
              aria-hidden="true"
            />
          </div>
          {/* Lanes — bil-spor */}
          <div className="divide-y divide-hairline" style={{ width: `${DAG_BREDDE_PX}px` }}>
            {synligeOrdrer.map(ordre => (
              <OrdreLaneCars key={ordre.id} ordre={ordre} nuPx={nuPx} />
            ))}
          </div>
        </div>
      </div>

      {/* Legende */}
      <div className="flex items-center gap-xs px-md py-sm border-t border-hairline bg-soft-aqua">
        <span className="inline-flex items-center gap-xxxs px-xxs py-xxxs rounded-sm bg-surface-2 text-text-muted font-inter text-xxs font-medium ring-2 ring-good ring-offset-1">
          <Truck className="w-3 h-3" aria-hidden="true" />
          00:00
        </span>
        <span className="font-inter text-xxs text-text-muted">= Første læs</span>
      </div>
    </div>
  )
}

function OrdreLaneInfo({ ordre }: { ordre: Ordre }) {
  const naesteBil = useMemo(() => findNaesteBil(ordre.biler), [ordre.biler])

  return (
    <div className="flex items-stretch bg-surface" style={{ height: `${ROW_HEIGHT_PX}px` }}>
      {/* Info-kolonne */}
      <div className="w-[240px] shrink-0 px-md py-xs border-r border-hairline flex flex-col justify-center">
        {/* Linje 1: asfalttype + recept + tons */}
        <div className="flex items-center justify-between gap-xxs">
          <div className="flex items-center gap-xxs min-w-0">
            <span className="font-poppins font-semibold text-sm text-text-primary">
              {ordre.asfalttype}
            </span>
            <span className="font-inter text-xxs text-text-muted shrink-0">{ordre.receptNummer}</span>
            {ordre.minusRegn && (
              <span
                title="Minus regn — kun ved tørvejr"
                className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-deep-teal text-white shrink-0"
              >
                <CloudRain className="w-3 h-3" aria-hidden="true" />
              </span>
            )}
          </div>
          <span className="font-poppins font-semibold text-sm text-text-primary shrink-0">
            {ordre.forventetMaengde}t
          </span>
        </div>
        {/* Linje 2: udførselssted */}
        <div className="mt-xxxs font-inter text-xs text-text-secondary truncate">
          {ordre.udforselssted}
        </div>
        {/* Linje 3: hold + formand + telefon */}
        <div className="mt-xxxs">
          <div className="font-inter text-sm text-text-primary font-medium">
            {ordre.holdNr} · {ordre.formandsNavn}
          </div>
          <div className="font-inter text-xxs text-text-muted">{ordre.formandsTelefon}</div>
        </div>
      </div>

      {/* Interval-kolonne */}
      <div className="w-[120px] shrink-0 px-md py-xs border-r border-hairline flex flex-col justify-center">
        <div className="font-inter text-xxs text-text-muted uppercase tracking-wide">Interval</div>
        <div className="font-poppins font-semibold text-sm text-text-primary">
          Hver {ordre.intervalMin}. min
        </div>
      </div>

      {/* Næste bil-kolonne */}
      <div className="w-[160px] shrink-0 px-md py-xs flex flex-col justify-center">
        <div className="font-inter text-xxs text-text-muted uppercase tracking-wide">Næste bil</div>
        {naesteBil ? (
          naesteBil.status === 'undervejs' ? (() => {
            const overskridelse =
              naesteBil.etaMinutter !== undefined && naesteBil.forventetEtaMinutter
                ? (naesteBil.etaMinutter - naesteBil.forventetEtaMinutter) / naesteBil.forventetEtaMinutter
                : 0
            const pilleFarve =
              overskridelse > 0.5
                ? 'bg-bad-bg text-bad'
                : overskridelse > 0.25
                  ? 'bg-warn-bg text-text-primary'
                  : 'bg-surface-2 text-text-secondary'
            return (
              <span className={`inline-flex items-center gap-xxxs px-xs py-xxs rounded-md font-inter text-sm font-medium mt-xxxs ${pilleFarve}`}>
                <Clock className="w-4 h-4" aria-hidden="true" />
                ETA {naesteBil.etaMinutter} min
              </span>
            )
          })() : (
            <span className="inline-flex items-center gap-xxxs px-xs py-xxs rounded-md font-inter text-sm font-medium mt-xxxs bg-surface-2 text-text-secondary">
              <Clock className="w-4 h-4" aria-hidden="true" />
              ETA {naesteBil.forventetAnkomstFabrik}
            </span>
          )
        ) : (
          <span className="font-inter text-sm text-text-muted">—</span>
        )}
      </div>
    </div>
  )
}

function OrdreLaneCars({ ordre, nuPx }: { ordre: Ordre; nuPx: number }) {
  const synligeBiler = ordre.biler.filter(b => {
    const min = hhmmTilMinutter(b.forventetAnkomstFabrik)
    return min >= DAG_START_MIN && min <= DAG_SLUT_MIN
  })

  // Første bil i ordren (index 0) — markeres med grøn ring
  const forsteBilId = ordre.biler[0]?.id

  // Vertikale streger hver 30. min — hele timer markeres tydeligere
  const streger: Array<{ tid: number; erHelTime: boolean }> = []
  for (let t = DAG_START_MIN; t <= DAG_SLUT_MIN; t += 30) {
    streger.push({ tid: t, erHelTime: t % 60 === 0 })
  }

  return (
    <div
      className="relative"
      style={{ width: `${DAG_BREDDE_PX}px`, height: `${ROW_HEIGHT_PX}px` }}
    >
      {/* Vertikale streger — bag piller (ingen z-index) */}
      {streger.map(({ tid, erHelTime }) => {
        const px = (tid - DAG_START_MIN) * PX_PER_MIN
        return (
          <div
            key={tid}
            className={`absolute top-0 bottom-0 w-px pointer-events-none ${erHelTime ? 'bg-divider-strong' : 'bg-hairline-2'}`}
            style={{ left: `${px}px` }}
            aria-hidden="true"
          />
        )
      })}
      {/* "Nu"-markør */}
      <div
        className="absolute top-0 bottom-0 w-px bg-good pointer-events-none z-20"
        style={{ left: `${nuPx}px` }}
        aria-hidden="true"
      />
      {/* Piller */}
      {synligeBiler.map(bil => {
        const min = hhmmTilMinutter(bil.forventetAnkomstFabrik)
        const px = (min - DAG_START_MIN) * PX_PER_MIN
        return (
          <div
            key={bil.id}
            className="absolute"
            style={{ left: `${px}px`, top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <MiniEtaBadge bil={bil} erForsteLaes={bil.id === forsteBilId} biltype={ordre.biltype} />
          </div>
        )
      })}
    </div>
  )
}

function ReceptAggregat({
  ordrer,
  anbefalinger,
}: {
  ordrer: Ordre[]
  anbefalinger: Array<{ asfalttype: string; ordrer: Ordre[] }>
}) {
  const perAsfalttype = useMemo(() => {
    const map: Record<string, { total: number; antal: number }> = {}
    for (const o of ordrer) {
      if (!map[o.asfalttype]) map[o.asfalttype] = { total: 0, antal: 0 }
      map[o.asfalttype].total += o.forventetMaengde
      map[o.asfalttype].antal += 1
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total)
  }, [ordrer])

  return (
    <aside className="w-[300px] shrink-0 bg-surface border border-hairline rounded-md overflow-hidden">
      <div className="px-md py-xs border-b border-hairline">
        <h2 className="font-poppins font-semibold text-deep-teal text-md">Recepter i dag</h2>
      </div>

      <ul className="divide-y divide-hairline">
        {perAsfalttype.map(([type, { total, antal }]) => (
          <li key={type} className="px-md py-xs">
            <div className="flex items-center justify-between">
              <span className="font-poppins font-semibold text-sm text-text-primary">{type}</span>
              <span className="font-inter text-sm font-medium text-text-primary">{total}t</span>
            </div>
            <div className="mt-xxxs font-inter text-xxs text-text-muted">
              {antal} {antal === 1 ? 'ordre' : 'ordrer'}
            </div>
          </li>
        ))}
      </ul>

      {anbefalinger.length > 0 && (
        <div className="border-t border-hairline bg-soft-aqua">
          <div className="px-md py-xs flex items-center gap-xxs">
            <Layers className="w-4 h-4 text-deep-teal" aria-hidden="true" />
            <h3 className="font-poppins font-semibold text-sm text-deep-teal">
              Anbefalede flet
            </h3>
          </div>
          <ul className="divide-y divide-hairline">
            {anbefalinger.map(a => (
              <li key={a.asfalttype} className="px-md py-xs">
                <div className="font-inter text-sm font-medium text-text-primary">
                  {a.asfalttype} — {a.ordrer.length} ordrer
                </div>
                <div className="mt-xxxs font-inter text-xxs text-text-muted">
                  Recepter indenfor 5%:{' '}
                  {a.ordrer.map(o => o.receptNummer).join(', ')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

// DropdownTarget identifies which slot a dropdown belongs to per silo
type DropdownTarget = { siloNr: number; target: 'current' | 'naeste' } | null

function SiloRaekke({
  siloer,
  ordrer,
  onTildel,
  onTildelNaeste,
}: {
  siloer: Silo[]
  ordrer: Ordre[]
  onTildel: (siloNr: number, ordreId: string) => void
  onTildelNaeste: (siloNr: number, ordreId: string) => void
}) {
  // Single dropdown state covering both top (current) and bottom (naeste) per silo
  const [aabenDropdown, setAabenDropdown] = useState<DropdownTarget>(null)

  const alleUtildelte = ordrer.filter(o => o.siloNr === undefined)

  function currentKandidater(silo: Silo): Ordre[] {
    if (!silo.asfalttype) return alleUtildelte
    return alleUtildelte.filter(o => o.asfalttype === silo.asfalttype)
  }

  function naesteKandidater(silo: Silo): Ordre[] {
    if (silo.naeste?.asfalttype) {
      // naeste-slot har allerede asfalttype — vis kun matchende utildelte
      return alleUtildelte.filter(o => o.asfalttype === silo.naeste!.asfalttype)
    }
    if (silo.asfalttype) {
      // udeluk current-asfalttype — de hører til current-slotten
      return alleUtildelte.filter(o => o.asfalttype !== silo.asfalttype)
    }
    return alleUtildelte
  }

  return (
    <div className="bg-surface border border-hairline rounded-md overflow-hidden">
      <div className="px-md py-xs border-b border-hairline">
        <h2 className="font-poppins font-semibold text-deep-teal text-md">Siloer</h2>
      </div>
      <div className="grid grid-cols-4 divide-x divide-hairline">
        {siloer.map(silo => {
          const ordrerISilo = ordrer.filter(o => silo.ordreIds.includes(o.id))
          const naesteOrdrer = silo.naeste
            ? ordrer.filter(o => silo.naeste!.ordreIds.includes(o.id))
            : []

          const currentErAaben =
            aabenDropdown?.siloNr === silo.nr && aabenDropdown.target === 'current'
          const naesteErAaben =
            aabenDropdown?.siloNr === silo.nr && aabenDropdown.target === 'naeste'

          const kandidaterCurrent = currentKandidater(silo)
          const kandidaterNaeste = naesteKandidater(silo)

          return (
            <div key={silo.nr} className="p-md min-w-0 flex flex-col">
              {/* Header: Silo N + total-tons */}
              <div className="flex items-center justify-between">
                <span className="font-poppins font-semibold text-sm text-text-primary">
                  Silo {silo.nr}
                </span>
                {silo.totalTons > 0 && (
                  <span className="font-inter text-sm font-medium text-text-primary">
                    {silo.totalTons}t
                  </span>
                )}
              </div>

              {/* Asfalttype-label (når sat) */}
              {silo.asfalttype && (
                <div className="mt-xxxs font-inter text-xs text-text-secondary">
                  {silo.asfalttype}
                </div>
              )}

              {/* Tildel ordre-knap — altid synlig */}
              <div className="mt-xs">
                <button
                  onClick={() =>
                    setAabenDropdown(
                      currentErAaben ? null : { siloNr: silo.nr, target: 'current' }
                    )
                  }
                  className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-sm bg-yellow text-deep-teal font-inter text-xs font-semibold hover:opacity-90"
                >
                  <Plus className="w-3 h-3" aria-hidden="true" />
                  Tildel ordre
                </button>
                {currentErAaben && (
                  <div className="mt-xs rounded-sm border border-hairline bg-surface-2 divide-y divide-hairline">
                    {kandidaterCurrent.length === 0 && (
                      <div className="px-xs py-xxs font-inter text-xxs text-text-muted">
                        Ingen matchende utildelte ordrer
                      </div>
                    )}
                    {kandidaterCurrent.map(o => (
                      <button
                        key={o.id}
                        onClick={() => {
                          onTildel(silo.nr, o.id)
                          setAabenDropdown(null)
                        }}
                        className="w-full text-left px-xs py-xxs hover:bg-surface font-inter text-xxs"
                      >
                        <div className="font-medium text-text-primary">{o.asfalttype}</div>
                        <div className="text-text-muted">
                          {o.id} · {o.forventetMaengde}t
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tildelte ordrer */}
              {ordrerISilo.length > 0 && (
                <ul className="mt-xs space-y-xxxs">
                  {ordrerISilo.map(o => (
                    <li key={o.id} className="font-inter text-xs text-text-secondary">
                      {o.id} · {o.forventetMaengde}t · {o.udforselssted}
                    </li>
                  ))}
                </ul>
              )}

              {/* Næste produkt-sektion */}
              <div className="border-t border-hairline pt-xs mt-xs">
                {/* Header */}
                <div className="font-poppins font-semibold text-xs text-text-primary">
                  {silo.naeste
                    ? `Næste produkt — ${silo.naeste.asfalttype} · ${silo.naeste.totalTons}t`
                    : 'Næste produkt'}
                </div>

                {/* Næste-ordrer (når der er nogen) */}
                {naesteOrdrer.length > 0 && (
                  <ul className="mt-xxxs space-y-xxxs">
                    {naesteOrdrer.map(o => (
                      <li key={o.id} className="font-inter text-xs text-text-secondary">
                        {o.id} · {o.forventetMaengde}t · {o.udforselssted}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Knap: Tilføj / Tilføj flere */}
                <div className="mt-xs">
                  <button
                    onClick={() =>
                      setAabenDropdown(
                        naesteErAaben ? null : { siloNr: silo.nr, target: 'naeste' }
                      )
                    }
                    className="inline-flex items-center gap-xxxs px-xs py-xxxs rounded-sm bg-surface-2 text-text-secondary font-inter text-xs font-semibold hover:opacity-80"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                    {silo.naeste ? 'Tilføj flere' : 'Tilføj næste produkt'}
                  </button>
                  {naesteErAaben && (
                    <div className="mt-xs rounded-sm border border-hairline bg-surface-2 divide-y divide-hairline">
                      {kandidaterNaeste.length === 0 && (
                        <div className="px-xs py-xxs font-inter text-xxs text-text-muted">
                          Ingen matchende utildelte ordrer
                        </div>
                      )}
                      {kandidaterNaeste.map(o => (
                        <button
                          key={o.id}
                          onClick={() => {
                            onTildelNaeste(silo.nr, o.id)
                            setAabenDropdown(null)
                          }}
                          className="w-full text-left px-xs py-xxs hover:bg-surface font-inter text-xxs"
                        >
                          <div className="font-medium text-text-primary">{o.asfalttype}</div>
                          <div className="text-text-muted">
                            {o.id} · {o.forventetMaengde}t
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Screen
// ============================================================================

export function ProduktionsplanScreen() {
  const [siloer, setSiloer] = useState<Silo[]>(MOCK_SILOER_INITIAL)
  const [ordrer, setOrdrer] = useState<Ordre[]>(MOCK_ORDRER)

  const totalDagTons = useMemo(
    () => ordrer.reduce((sum, o) => sum + o.forventetMaengde, 0),
    [ordrer]
  )

  const anbefalinger = useMemo(() => findAnbefaledeFlet(ordrer), [ordrer])

  function handleTildel(siloNr: number, ordreId: string) {
    const ordre = ordrer.find(o => o.id === ordreId)
    if (!ordre) return
    setSiloer(prev =>
      prev.map(s =>
        s.nr === siloNr
          ? {
              ...s,
              asfalttype: s.asfalttype ?? ordre.asfalttype,
              totalTons: s.totalTons + ordre.forventetMaengde,
              ordreIds: [...s.ordreIds, ordreId],
            }
          : s
      )
    )
    setOrdrer(prev => prev.map(o => (o.id === ordreId ? { ...o, siloNr } : o)))
  }

  function handleTildelNaeste(siloNr: number, ordreId: string) {
    const ordre = ordrer.find(o => o.id === ordreId)
    if (!ordre) return
    setSiloer(prev =>
      prev.map(s => {
        if (s.nr !== siloNr) return s
        const eksisterendeNaeste = s.naeste
        return {
          ...s,
          naeste: {
            asfalttype: eksisterendeNaeste?.asfalttype ?? ordre.asfalttype,
            totalTons: (eksisterendeNaeste?.totalTons ?? 0) + ordre.forventetMaengde,
            ordreIds: [...(eksisterendeNaeste?.ordreIds ?? []), ordreId],
          },
        }
      })
    )
    // Markér ordren som tildelt (siloNr peger på samme silo — naeste-slot)
    setOrdrer(prev => prev.map(o => (o.id === ordreId ? { ...o, siloNr } : o)))
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-surface border-b border-hairline px-md py-sm">
        <div className="flex items-center justify-between flex-wrap gap-sm">
          <div>
            <h1 className="font-poppins font-semibold text-lg text-deep-teal">
              Produktionsplan
            </h1>
            <p className="font-inter text-xs text-text-muted">
              {dagensDatoFormatted()} · Nu kl. {NU_HHMM}
            </p>
          </div>
          <div className="flex items-center gap-md">
            <div className="text-right">
              <div className="font-inter text-xxs text-text-muted uppercase tracking-wide">
                Total i dag
              </div>
              <div className="font-poppins font-semibold text-lg text-text-primary">
                {totalDagTons.toLocaleString('da-DK')} t
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hoved-grid */}
      <div className="p-md flex gap-md items-start">
        <Timeline ordrer={ordrer} />
        <ReceptAggregat ordrer={ordrer} anbefalinger={anbefalinger} />
      </div>

      {/* Silo-række */}
      <div className="px-md pb-md">
        <SiloRaekke
          siloer={siloer}
          ordrer={ordrer}
          onTildel={handleTildel}
          onTildelNaeste={handleTildelNaeste}
        />
      </div>
    </div>
  )
}
