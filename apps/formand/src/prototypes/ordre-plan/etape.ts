/**
 * PROTOTYPE — etape-bevidst materiel-hjælpefunktioner
 *
 * Etape-modellen (LÅST 2026-06-23): planlægningsenheden for materiel er ETAPE,
 * ikke ORDRE. En etape = en klynge af faktisk-planlagte dage med weekend-tolerance.
 *
 * Disse helpers er rene funktioner — ingen React-afhængigheder.
 * Bruges i OrdrePlanScreen (Round 1: eksponeret via memo, ikke wired til UI endnu).
 */

// ─── Etape-datamodel ─────────────────────────────────────────────────────────

/**
 * Én etape = en klynge af sammenhængende produktions-dage.
 * Weekend-huller bryder IKKE en etape; kun hverdags-huller gør det.
 *
 * @property id         — 0-baseret indeks; etape 0 er ordrens første.
 * @property dates      — alle planlagte datoer i etapen (YYYY-MM-DD), sorteret.
 * @property startDate  — første dato i etapen (YYYY-MM-DD).
 * @property endDate    — sidste dato i etapen (YYYY-MM-DD).
 * @property firstDay   — alias for startDate — den dag transport skal planlægges.
 */
export interface Etape {
  id: number
  dates: string[]
  startDate: string
  endDate: string
  firstDay: string
}

// ─── Transport-plan pr. enhed × etape ────────────────────────────────────────

/**
 * Transport-plan for én materiel-enhed i én etape.
 * Nulstilles pr. etape — deles IKKE på tværs af etaper.
 *
 * Alle identifiers er ASCII-only (ingen æ/ø/å).
 *
 * TODO: Erstat med Supabase når klar — tabel: materiel_transport_plan(resourceId, etapeId, ...)
 */
export interface MaterielTransportPlan {
  resourceId: string
  etapeId: number
  status: 'ikke-planlagt' | 'planlagt'
  afhentning: {
    vejnavn: string
    nummer: string
    postnr: string
  }
  /** Klar til afhentning: dato + tid */
  klar: {
    dato: string  // YYYY-MM-DD
    tid: string   // HH:MM
  }
  /** Skal være på lokation: dato + tid */
  lokation: {
    dato: string  // YYYY-MM-DD
    tid: string   // HH:MM
  }
  /** Aflæsningsadresse (udførselssted) */
  aflaesning: string
  kommentar: string
  sendt: boolean
  bekraeftet: boolean
}

// ─── Opslags-nøgle ───────────────────────────────────────────────────────────

/**
 * Sammensætter en opslags-nøgle for transport-planer:
 * `Record<transportKey, MaterielTransportPlan>`.
 *
 * @example
 *   transportKey('r1', 0) // → "r1:0"
 */
export function transportKey(resourceId: string, etapeId: number): string {
  return `${resourceId}:${etapeId}`
}

// ─── Etape-klyngning ─────────────────────────────────────────────────────────

/**
 * Returnerer day-of-week (1=Man, 5=Fre, 6=Lør, 0=Søn) for en YYYY-MM-DD streng.
 * Intern helper — bruger lokal Date-konstruktion for at undgå timezone-drift.
 */
function weekdayOf(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay()
}

/**
 * Tæller antallet af HVERDAGE (man–fre) i det halvåbne interval [fromStr, toStr).
 *
 * TODO: helligdags-kalender (afventer PLAN) — kun weekend-tolerance nu.
 */
function weekdaysBetween(fromStr: string, toStr: string): number {
  const from = new Date(fromStr + 'T00:00:00')
  const to = new Date(toStr + 'T00:00:00')
  let count = 0
  const cur = new Date(from)
  while (cur < to) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/**
 * Klynger en liste af planlagte datoer til etaper med weekend-tolerance.
 *
 * **Regel:** bryd til ny etape KUN ved et hul på ≥1 HVERDAG (man–fre) mellem
 * to på-hinanden-følgende planlagte dage. Lørdage og søndage tæller IKKE som hul.
 *
 * TODO: helligdags-kalender (afventer PLAN) — kun weekend-tolerance nu.
 *
 * @param plannedDates — YYYY-MM-DD strenge; behøver ikke at være sorteret.
 * @returns            — Etape-array sorteret efter startDate; tomt array ved tom input.
 *
 * @example
 *   clusterEtaper(['2026-03-17', '2026-03-18', '2026-03-19', '2026-07-06', '2026-07-07'])
 *   // → [{ id:0, dates:['2026-03-17','2026-03-18','2026-03-19'], startDate:'2026-03-17', ... },
 *   //    { id:1, dates:['2026-07-06','2026-07-07'], startDate:'2026-07-06', ... }]
 */
export function clusterEtaper(plannedDates: string[]): Etape[] {
  if (plannedDates.length === 0) return []

  // Deduplicér og sortér
  const sorted = [...new Set(plannedDates)].sort()

  const etaper: Etape[] = []
  let currentCluster: string[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]

    // Tæl hverdage i hullet (ekskl. prev-dagen, inkl. alt frem til curr-dagen)
    const hullStart = new Date(prev + 'T00:00:00')
    hullStart.setDate(hullStart.getDate() + 1)
    // Lokal dato-formatering — IKKE toISOString(): toISOString konverterer til UTC
    // og skubber lokal midnat én dag tilbage i UTC+-tidszoner (fx dansk CET/CEST),
    // hvilket fejlagtigt får to på-hinanden-følgende hverdage til at se ud som et hul.
    const hullStartStr =
      `${hullStart.getFullYear()}-` +
      `${String(hullStart.getMonth() + 1).padStart(2, '0')}-` +
      `${String(hullStart.getDate()).padStart(2, '0')}`

    const hverdageIHul = weekdaysBetween(hullStartStr, curr)

    if (hverdageIHul >= 1) {
      // Hul med mindst én hverdag → ny etape
      etaper.push(buildEtape(etaper.length, currentCluster))
      currentCluster = [curr]
    } else {
      // Weekend-hul (0 hverdage) → fortsat samme etape
      currentCluster.push(curr)
    }
  }

  // Afslut sidste klynge
  etaper.push(buildEtape(etaper.length, currentCluster))

  return etaper
}

function buildEtape(id: number, dates: string[]): Etape {
  const sorted = [...dates].sort()
  return {
    id,
    dates: sorted,
    startDate: sorted[0],
    endDate: sorted[sorted.length - 1],
    firstDay: sorted[0],
  }
}

// ─── UX-tilstand for valgt dag ───────────────────────────────────────────────

/**
 * Fire UX-tilstande for materiel-sektionen afhængig af den valgte dag.
 *
 * - `planlaeg`     — etapens første dag: fuld transport-planlægning åben.
 * - `paa-pladsen`  — dag i etapen EFTER firstDay: read-only "Materiel på pladsen".
 * - `dvale`        — dag i et gap mellem etaper: "Frigivet — næste etape ikke planlagt endnu".
 * - `ny-etape`     — selectedDate er firstDay for en EFTERFØLGENDE etape (id > 0):
 *                    frisk transport-planlægning med pakken for-listet.
 *
 * Antagelse (Round 1): 'ny-etape' udledes udelukkende af om selectedDate matcher
 * firstDay for en etape med id > 0. I produktion vil der sandsynligvis yderligere
 * kræves en notifikations-mekanisme — dette raffineres i Round 4 ved wiring.
 */
export type MaterielUiState = 'planlaeg' | 'paa-pladsen' | 'dvale' | 'ny-etape'

/**
 * Afleder hvilken materiel-UX-tilstand der gælder for `selectedDate` givet
 * det aktuelle sæt af etaper.
 *
 * Returnerer `'dvale'` hvis etaper er tomme eller selectedDate ikke falder i
 * nogen etape.
 */
export function getMaterielUiState(
  selectedDate: string,
  etaper: Etape[],
): MaterielUiState {
  if (etaper.length === 0) return 'dvale'

  for (const etape of etaper) {
    if (etape.dates.includes(selectedDate)) {
      if (selectedDate === etape.firstDay && etape.id > 0) {
        // Antagelse: firstDay for etape 1+ = ny-etape-opgave (se JSDoc ovenfor)
        return 'ny-etape'
      }
      if (selectedDate === etape.firstDay) {
        return 'planlaeg'
      }
      return 'paa-pladsen'
    }
  }

  // Dagen er ikke i nogen etape → dvale-gap
  return 'dvale'
}

// ─── Mock-data til demo af 2+ etaper ─────────────────────────────────────────

/**
 * Demo-seed med to etaper på samme ordre:
 *   - Etape 0 (marts): 2026-03-17, 2026-03-18, 2026-03-19 — planlagt med transport
 *   - Etape 1 (juli):  2026-07-06, 2026-07-07            — tom transport (demo: dvale + ny-etape)
 *
 * Etape 0 og 1 er adskilt af ~3 måneder hverdage → klyngnings-util splitter korrekt.
 *
 * TODO: Erstat med Supabase når klar — planlagte dage hentes fra plan_dag-tabellen
 *   for ordrens resourceIds, filtreret på tonsPlanned > 0 && !cancelled.
 */
export const DEMO_PLANLAGTE_DAGE: string[] = [
  // Etape 0 — marts
  '2026-03-17',
  '2026-03-18',
  '2026-03-19',
  // Etape 1 — juli (nyt hold; lange gap → ny etape i klyngning)
  '2026-07-06',
  '2026-07-07',
]

/**
 * Mock transport-planer pr. enhed × etape.
 * Etape 0: r1 planlagt, r2+r3 ikke-planlagt.
 * Etape 1: alle ikke-planlagt (demo: ny-etape-tilstand viser blank transport).
 *
 * TODO: Erstat med Supabase når klar — fra materiel_transport_plan-tabellen.
 */
export const DEMO_TRANSPORT_PLANER: Record<string, MaterielTransportPlan> = {
  // Etape 0 — r1 planlagt
  [transportKey('r1', 0)]: {
    resourceId: 'r1',
    etapeId: 0,
    status: 'planlagt',
    afhentning: { vejnavn: 'Industrivej', nummer: '12', postnr: '4600' },
    klar: { dato: '2026-03-16', tid: '14:00' },
    lokation: { dato: '2026-03-17', tid: '06:00' },
    aflaesning: 'Søvej 6D, 4900 Nakskov',
    kommentar: 'Kran tilgængelig på pladsen',
    sendt: true,
    bekraeftet: true,
  },
  // Etape 0 — r2 ikke-planlagt
  [transportKey('r2', 0)]: {
    resourceId: 'r2',
    etapeId: 0,
    status: 'ikke-planlagt',
    afhentning: { vejnavn: '', nummer: '', postnr: '' },
    klar: { dato: '', tid: '' },
    lokation: { dato: '', tid: '' },
    aflaesning: '',
    kommentar: '',
    sendt: false,
    bekraeftet: false,
  },
  // Etape 0 — r3 ikke-planlagt
  [transportKey('r3', 0)]: {
    resourceId: 'r3',
    etapeId: 0,
    status: 'ikke-planlagt',
    afhentning: { vejnavn: '', nummer: '', postnr: '' },
    klar: { dato: '', tid: '' },
    lokation: { dato: '', tid: '' },
    aflaesning: '',
    kommentar: '',
    sendt: false,
    bekraeftet: false,
  },
  // Etape 1 — alle blank (ny-etape-tilstand)
  [transportKey('r1', 1)]: {
    resourceId: 'r1',
    etapeId: 1,
    status: 'ikke-planlagt',
    afhentning: { vejnavn: '', nummer: '', postnr: '' },
    klar: { dato: '', tid: '' },
    lokation: { dato: '', tid: '' },
    aflaesning: '',
    kommentar: '',
    sendt: false,
    bekraeftet: false,
  },
  [transportKey('r2', 1)]: {
    resourceId: 'r2',
    etapeId: 1,
    status: 'ikke-planlagt',
    afhentning: { vejnavn: '', nummer: '', postnr: '' },
    klar: { dato: '', tid: '' },
    lokation: { dato: '', tid: '' },
    aflaesning: '',
    kommentar: '',
    sendt: false,
    bekraeftet: false,
  },
  [transportKey('r3', 1)]: {
    resourceId: 'r3',
    etapeId: 1,
    status: 'ikke-planlagt',
    afhentning: { vejnavn: '', nummer: '', postnr: '' },
    klar: { dato: '', tid: '' },
    lokation: { dato: '', tid: '' },
    aflaesning: '',
    kommentar: '',
    sendt: false,
    bekraeftet: false,
  },
}

// Verificer at weekdayOf eksporteres korrekt (bruges i tests — ikke i UI)
export { weekdayOf, weekdaysBetween }
