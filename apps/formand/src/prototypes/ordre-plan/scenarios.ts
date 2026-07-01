/**
 * PROTOTYPE — Scenarie-registry for OrdrePlanScreen
 *
 * Pakker hvert demonstrations-scenarie (Spor A/B/C) som ét selvstændigt, fuldt-seedet
 * `Scenario`-objekt, så OrdrePlanScreen kan initialisere ALT sin state fra ét bundt
 * frem for fra spredte globale INITIAL_*-konstanter.
 *
 * Ren data-fil — ingen React, ingen JSX, ingen hooks.
 *
 * TODO: Erstat med PLAN/Oracle når klar — alle tre spors seeds hentes fra PLAN-tabeller
 * (plan_dag, materiel_transport_plan, vognmand.aftaler.chauffoerer[], plan_vejebilag, samleordrer).
 */

import type {
  MockProduct,
  MockResource,
  VehicleOrder,
  SamleordreContext,
  VognmandBekraeftelse,
  VognmandMaterielBekraeftelse,
  MaterielEnhed,
} from './types'

import {
  transportKey,
  type MaterielTransportPlan,
  DEMO_TRANSPORT_PLANER,
} from './etape'

import {
  INITIAL_PRODUCTS,
  INITIAL_RESOURCES,
  INITIAL_VOGNMAND_BEKRAEFTELSER,
  INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE,
  MATERIEL_ENHEDER,
} from './mocks'

// ─── Scenarie-type ────────────────────────────────────────────────────────────

export type ScenarioId = 'A' | 'B' | 'C'

export interface Scenario {
  id: ScenarioId
  /** Kort label til dev-vælger, fx "A · Samleordre + afregning" */
  label: string
  /** Én-linje forklaring vist i dev-panel */
  beskrivelse: string

  // ── Kerne-seeds (i dag globale INITIAL_*) ──────────────────────────────────
  products: MockProduct[]                                    // i dag INITIAL_PRODUCTS
  resources: MockResource[]                                  // i dag INITIAL_RESOURCES
  vognmandBekraeftelser: Record<string, VognmandBekraeftelse>      // i dag INITIAL_VOGNMAND_BEKRAEFTELSER
  vognmandMaterielBekraeftelse: VognmandMaterielBekraeftelse       // i dag INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE
  materielEnheder: MaterielEnhed[]                           // i dag MATERIEL_ENHEDER
  transportPlaner: Record<string, MaterielTransportPlan>     // i dag DEMO_TRANSPORT_PLANER

  // ── Samleordre (null for enkelt-ordre = Spor B) ────────────────────────────
  samleordre: SamleordreContext | null                       // i dag MOCK_SAMLEORDRE | null

  // ── Inline-seedede demo-states (i dag hardcodet i useState-initial) ────────
  sendtTilVognmandDates: string[]                            // i dag new Set(['2026-03-16','2026-03-17'])
  korselPlanlagtIds: string[]                                // i dag new Set(['d2-1','d2-2'])
  korselOrders: Record<string, VehicleOrder[]>               // i dag inline kørselOrders-seed
  startRaekkefoelge: Record<string, [string | null, string | null, string | null]>
  startTider: Record<string, [string | null, string | null, string | null]>

  // ── Default-dato + fokus-produkt + dvale ───────────────────────────────────
  defaultPlanDate: string                                    // i dag '2026-03-17'
  /**
   * Produkt der er fokuseret ved mount (Spec-grid + produkt-bokse).
   * I dag hardcodet 'p2' i OrdrePlanScreen — men A/C har egne produkt-IDs
   * (a-p2/c-p2), så det MÅ komme fra bundtet ellers crasher `products.find(...)!`.
   * Skal pege på et produkt der har en ikke-aflyst dag på `defaultPlanDate`.
   */
  defaultProductId: string                                   // i dag 'p2'
  /** Dvale-demo-dag injiceres KUN i scenarier hvor den giver mening (Spor B). null = ingen injektion */
  demoDvaleDag: string | null                                // i dag global DEMO_DVALE_DAG = '2026-05-04'
}

// ─── Intern factory: blank transport-plan ────────────────────────────────────
// Forhindrer copy-paste-fejl for de mange "ikke-planlagt"-objekter.

function blankTransportPlan(resourceId: string, etapeId: number): MaterielTransportPlan {
  return {
    resourceId,
    etapeId,
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

// ─── Spor B — Enkelt ordre + etaper (REFERENCE — bagudkompatibel) ─────────────
// TODO: Erstat med PLAN/Oracle når klar — Spor B seeds fra INITIAL_*-tabeller

const B: Scenario = {
  id: 'B',
  label: 'B · Enkelt ordre + etaper',
  beskrivelse: 'Den nuværende enkelt-ordre-demo med 2 etaper (marts + juli) og dvale-gap. Begge afregningsformer (time + akkord) demonstreret.',

  // Kerne-seeds — refererer eksisterende INITIAL_* direkte (bræk ikke disse exports)
  products: INITIAL_PRODUCTS,
  resources: INITIAL_RESOURCES,
  vognmandBekraeftelser: INITIAL_VOGNMAND_BEKRAEFTELSER,
  vognmandMaterielBekraeftelse: INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE,
  materielEnheder: MATERIEL_ENHEDER,
  transportPlaner: DEMO_TRANSPORT_PLANER,

  samleordre: null,

  // Inline-seeds kopieret fra OrdrePlanScreen useState-initialiseringer
  // (bevares her 1:1 for bagudkompatibilitet)
  sendtTilVognmandDates: ['2026-03-16', '2026-03-17'],
  korselPlanlagtIds: ['d2-1', 'd2-2'],
  korselOrders: {
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
  },
  startRaekkefoelge: {
    'd2-1': ['6 Aks', '7 Aks', null],
  },
  startTider: {
    'd2-1': ['06:39', '06:54', null],
  },

  defaultPlanDate: '2026-03-17',
  defaultProductId: 'p2',  // SMA 11S toplag — har dag d2-2 på 2026-03-17 (uændret nuværende adfærd)
  // Dvale-demo-dag: en dag i gap'et mellem etape 0 (marts) og etape 1 (juli)
  demoDvaleDag: '2026-05-04',
}

// ─── Spor A — Samleordre + afregning ─────────────────────────────────────────
// TODO: Erstat med PLAN/Oracle når klar — Spor A seeds fra samleordrer-tabel + plan_dag + plan_vejebilag

// Spor A benytter april-datoer (etape 0) og september-datoer (etape 1)
// så hverdags-hullet (maj–august) garanterer 2 etaper via clusterEtaper().

// Produkt 1 — GAB I (anchor-ordre p1 af samleordre samle-A)
const A_PRODUCTS: MockProduct[] = [
  {
    id: 'a-p1',
    recipeCode: '23001B',
    recipeName: 'GAB I',
    activityName: 'GAB I at levere og udlægge, 80mm',
    m2: 512,
    thicknessMm: 80,
    tonsTotal: 320,
    factory: { code: '29000', name: 'PROD A EAST KØGE PH', driveTimeMinutes: 36 },
    estimatedTrucks: 3,
    estimatedTonsPerTruck: 30,
    startDate: '2026-04-14',
    endDate: '2026-09-08',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: true,
    entreprisekontrol: 1,
    temperaturmaaling: 1,
    days: [
      // Etape 0 — april (bestillingen initieres på startdatoen 2026-04-14)
      { id: 'a-d1-1', day: 1, date: '2026-04-14', tonsPlanned: 110, cancelled: false },
      { id: 'a-d1-2', day: 2, date: '2026-04-15', tonsPlanned: 110, cancelled: false },
      { id: 'a-d1-3', day: 3, date: '2026-04-16', tonsPlanned: 100, cancelled: false },
      // Etape 1 — september (lang hverdags-gap → ny etape i clusterEtaper)
      { id: 'a-d1-4', day: 4, date: '2026-09-07', tonsPlanned: 110, cancelled: false },
      { id: 'a-d1-5', day: 5, date: '2026-09-08', tonsPlanned: 110, cancelled: false },
    ],
  },
  {
    id: 'a-p2',
    recipeCode: '82101H',
    recipeName: 'SMA 11S',
    activityName: 'SMA 11S at levere og udlægge, 45mm',
    m2: 3200,
    thicknessMm: 45,
    tonsTotal: 600,
    factory: { code: '29000', name: 'PROD A EAST KØGE PH', driveTimeMinutes: 36 },
    estimatedTrucks: 4,
    estimatedTonsPerTruck: 32,
    startDate: '2026-04-14',
    endDate: '2026-04-16',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: false,
    entreprisekontrol: 2,
    temperaturmaaling: 2,
    days: [
      // Etape 0 — april (starter på a-d2-1 = startdatoen)
      { id: 'a-d2-1', day: 1, date: '2026-04-14', tonsPlanned: 200, cancelled: false },
      { id: 'a-d2-2', day: 2, date: '2026-04-15', tonsPlanned: 200, cancelled: false },
      { id: 'a-d2-3', day: 3, date: '2026-04-16', tonsPlanned: 200, cancelled: false },
    ],
  },
]

// Materiel — genbrug af samme anæg-typer som B, men nye resource-IDs for Spor A
const A_RESOURCES: MockResource[] = [
  { id: 'a-r1', plantNumber: '5-0034', description: 'HAMM HD10 VT',      transportTag: 'blokvogn',    status: 'planlagt' },
  { id: 'a-r2', plantNumber: '3-0112', description: 'VÖGELE 1900-3I',    transportTag: 'blokvogn',    status: 'ikke-planlagt' },
  { id: 'a-r3', plantNumber: '7-0078', description: 'HAMM DV70VV',       transportTag: 'kran-baand',  status: 'ikke-planlagt' },
]

const A_MATERIEL_ENHEDER: MaterielEnhed[] = [
  { anlaegsNr: '5-0034', beskrivelse: 'HAMM HD10 VT' },
  { anlaegsNr: '3-0112', beskrivelse: 'VÖGELE 1900-3I' },
  { anlaegsNr: '7-0078', beskrivelse: 'HAMM DV70VV' },
]

// Samleordre: 2 børn.
// Anchor = ordre 1212400 (Skovvej, GAB I + SMA 11S)
// Barn 2  = ordre 1212401 (Havnegade, SMA 11S + ABB 11)
const A_SAMLEORDRE: SamleordreContext = {
  id: 'samle-A',
  children: [
    {
      // Anchor — den aktuelle ordre
      orderNumber: '1212400',
      jobnummer: '101. Skovvej Kalundborg',
      udfoerelseSted: 'Skovvej 18, 4400 Kalundborg',
      stedLabel: 'Skovvej',
      isAnchor: true,
      products: [
        { id: 'a-p1', recipeCode: '23001B', recipeName: 'GAB I',   tonsTotal: 320 },
        { id: 'a-p2', recipeCode: '82101H', recipeName: 'SMA 11S', tonsTotal: 600 },
      ],
      resources: A_RESOURCES,
      // TODO: Erstat med PLAN/Oracle når klar
      projektleder: 'Ole Jensen',
      projektlederTlf: '40 50 60 70',
      fabrik: 'Køge Fabrik',
      fabrikTlf: '56 78 12 34',
      kundeVirksomhed: 'Kalundborg Kommune',
      kundekontakt: 'Dorthe Nielsen',
      kundekontaktTlf: '30 11 22 33',
      antalBiler: 4,
      vognmandBekraeftet: true,
      antalMateriel: 3,
      materielBekraeftet: true,
      forundersoegelseOK: true,
      forundersoegelseStatus: 'OK',
      forundersoegelseDetails: {
        underlaegsType: 'asfalt',
        tilfredsstillende: true,
        besigtigelseComment: 'Underlag er fast og jævnt, kun mindre skader ved indkørsel',
        photoCount: 4,
      },
      udlaegningDetails: {
        status: 'i-gang',
        startTid: '07:00',
        noter: 'Starter med GAB I — god fremgang',
      },
    },
    {
      // Barn 2 — medfølgende ordre
      orderNumber: '1212401',
      jobnummer: '102. Havnegade Kalundborg',
      udfoerelseSted: 'Havnegade 4, 4400 Kalundborg',
      stedLabel: 'Havnegade',
      isAnchor: false,
      products: [
        { id: 'a-sp1', recipeCode: '82101H', recipeName: 'SMA 11S', tonsTotal: 190 },
        { id: 'a-sp2', recipeCode: 'ABB11',  recipeName: 'ABB 11',  tonsTotal: 80 },
      ],
      resources: [],
      // TODO: Erstat med PLAN/Oracle når klar
      projektleder: 'Mette Lund',
      projektlederTlf: '31 67 92 14',
      fabrik: 'Køge Fabrik',
      fabrikTlf: '56 78 12 34',
      kundeVirksomhed: 'Kalundborg Erhvervspark',
      kundekontakt: 'Bo Christensen',
      kundekontaktTlf: '27 44 81 09',
      antalBiler: 2,
      vognmandBekraeftet: true,  // KRAV (c): bekræftet overalt i Udførsel
      antalMateriel: 1,
      materielBekraeftet: true,  // KRAV (c): bekræftet overalt i Udførsel
      forundersoegelseOK: true,
      forundersoegelseStatus: 'OK',
      forundersoegelseDetails: {
        underlaegsType: 'asfalt',
        tilfredsstillende: true,
        besigtigelseComment: 'OK — gammel belægning fræset og ryddet',
        photoCount: 2,
      },
      udlaegningDetails: {
        status: 'ikke-startet',
        noter: '',
      },
    },
  ],
}

// Vognmand-bekræftelser for Spor A:
// Dag a-d2-1 (2026-04-14): startdatoen — BEGGE bestillingstyper initieres her.
//   1 akkord-bil m. multilæs + pre_fordeling fordelt på BEGGE børn (anchor 30t + barn2 19.2t)
//   1 time-bil m. timer fordelt på børn (multilæs-time-fordeling)
//   + materiel-biler (er_materiel_bil: true)
// Dag a-d2-2 (2026-04-15): bekræftet (Udførsel-dag)
// Dag a-d2-3 (2026-04-16): bekræftet
// TODO: Erstat med PLAN/Oracle når klar — fra vognmand.aftaler.chauffoerer[] + plan_vejebilag
const A_VOGNMAND_BEKRAEFTELSER: Record<string, VognmandBekraeftelse> = {
  'a-d2-1': {
    dayId: 'a-d2-1',
    bekraeftetTidspunkt: '13. april · 16:30',
    biler: [
      // ── 1: Akkord-bil m. multilæs → tons fordelt på BEGGE børn ──────────
      {
        regnr: 'KA 11 222',
        chauffoer: 'Søren Karlsen',
        tlf: '26 77 88 99',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:50',
        laes_nummer: 1,
        moedetid_fabrik: '06:14',
        sms_status: 'sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 49.2,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        // TODO: Erstat med PLAN/Oracle når klar — vejesedler fra plan_vejebilag-tabel
        vejesedler: [
          {
            id: 'a-vsb-1',
            vejeseddelNr: '26-0101-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 49.2,
            tara_tons: 15.0,
            multilaes_flag: true,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            // Pre-fordeling: anchor (Skovvej) 30t + barn 2 (Havnegade) 19.2t
            pre_fordeling: [
              { ordre_id: 'ord-1212400', ordre_label: '1212400 · Skovvej 18', tons: 30.0, is_anchor: true },
              { ordre_id: 'ord-1212401', ordre_label: '1212401 · Havnegade 4', tons: 19.2, is_anchor: false },
            ],
          },
        ],
      },
      // ── 2: Time-bil m. timer fordelt på børn (multilæs-time-fordeling) ──
      {
        regnr: 'KA 33 444',
        chauffoer: 'Lars Holm',
        tlf: '40 12 56 78',
        biltype: '7 Aks',
        ankomst_plads_tid: '07:10',
        laes_nummer: 2,
        moedetid_fabrik: '06:34',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'time',
          koretimer: 8.0,
          ventetid: 0.5,
          hviletid: 0.5,
          chauffoer_kommentar: 'Skiftevis læsset til Skovvej og Havnegade — timer fordelt ligeligt.',
          godkendt_af_formand: false,
        },
        // Timer fordelt på børn via pre_fordeling-kommentar-mønster (tons=0 for time-biler)
        // TODO: Erstat med PLAN/Oracle — timer-fordeling pr. barn modelleres via separat tabel
        vejesedler: [
          {
            id: 'a-vsb-2',
            vejeseddelNr: '26-0102-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 35.0,
            tara_tons: 14.5,
            multilaes_flag: true,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            // Pre-fordeling for time-bil: tons bruges kun til visuelt split pr. barn
            pre_fordeling: [
              { ordre_id: 'ord-1212400', ordre_label: '1212400 · Skovvej 18', tons: 20.0, is_anchor: true },
              { ordre_id: 'ord-1212401', ordre_label: '1212401 · Havnegade 4', tons: 15.0, is_anchor: false },
            ],
          },
        ],
      },
      // ── 3: Materiel-bil (Blokvogn) — er_materiel_bil: true ──────────────
      // TODO: Erstat med PLAN/Oracle når klar — materiel-biler fra vognmand.aftaler.materiel[]
      {
        regnr: 'BL44291',
        chauffoer: 'Frank Olesen',
        tlf: '71 82 93 04',
        biltype: 'Blokvogn',
        er_materiel_bil: true,
        koert_materiel: ['HAMM HD10 VT (5-0034)', 'VÖGELE 1900-3I (3-0112)'],
        afregning: {
          afregning_type: 'time',
          koretimer: 8.5,
          ventetid: 1,
          chauffoer_kommentar: 'Pakket ud og ind 2 gange — ændret placering af tromle.',
          godkendt_af_formand: false,
        },
      },
      {
        regnr: 'KK55901',
        chauffoer: 'Bent Sørensen',
        tlf: '31 42 53 64',
        biltype: 'Kran-bånd',
        er_materiel_bil: true,
        koert_materiel: ['HAMM DV70VV (7-0078)'],
        afregning: {
          afregning_type: 'time',
          koretimer: 7,
          ventetid: 0,
          godkendt_af_formand: false,
        },
      },
    ],
  },
  'a-d2-2': {
    dayId: 'a-d2-2',
    bekraeftetTidspunkt: '14. april · 15:45',
    biler: [
      {
        regnr: 'KA 55 666',
        chauffoer: 'Peter Hansen',
        tlf: '60 71 82 93',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:30',
        laes_nummer: 1,
        moedetid_fabrik: '05:54',
        sms_status: 'sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 33.4,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'a-vsb-3',
            vejeseddelNr: '26-0103-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 33.4,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212400', ordre_label: '1212400 · Skovvej 18', tons: 33.4, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'KA 77 888',
        chauffoer: 'Thomas Nielsen',
        tlf: '42 53 64 75',
        biltype: '7 Aks',
        ankomst_plads_tid: '06:50',
        laes_nummer: 2,
        moedetid_fabrik: '06:14',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 0,
          hviletid: 0.5,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'a-vsb-4',
            vejeseddelNr: '26-0104-A',
            product_code: 'GAB I',
            product_name: 'GAB I bundlag',
            netto_tons: 35.0,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212400', ordre_label: '1212400 · Skovvej 18', tons: 35.0, is_anchor: true },
            ],
          },
        ],
      },
    ],
  },
  'a-d2-3': {
    dayId: 'a-d2-3',
    bekraeftetTidspunkt: '15. april · 16:10',
    biler: [
      {
        regnr: 'KA 99 001',
        chauffoer: 'Anders Kristiansen',
        tlf: '53 74 82 91',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:20',
        laes_nummer: 1,
        moedetid_fabrik: '05:44',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 31.6,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'a-vsb-5',
            vejeseddelNr: '26-0105-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 31.6,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212400', ordre_label: '1212400 · Skovvej 18', tons: 31.6, is_anchor: true },
            ],
          },
        ],
      },
    ],
  },
}

// Materiel-bekræftelse for Spor A
// TODO: Erstat med PLAN/Oracle når klar — fra materiel_transport_plan + vognmand.aftaler
const A_VOGNMAND_MATERIEL_BEKRAEFTELSE: VognmandMaterielBekraeftelse = {
  bekraeftetTidspunkt: '13. april · 17:00',
  items: [
    {
      resourceId: 'a-r1',
      anlaegsNr: '5-0034',
      beskrivelse: 'HAMM HD10 VT',
      regnr: 'BL44291',
      chauffoer: 'Frank Olesen',
      tlf: '71 82 93 04',
      transportType: 'Blokvogn',
      ankomst_plads_tid: '06:15',
      afregning_type: 'time',
      afregning_timer: 8.5,
      afregning_ventetid: 1,
      afregning_chauffoer_kommentar: 'Pakket ud og ind 2 gange — ændret placering af tromle.',
    },
    {
      resourceId: 'a-r2',
      anlaegsNr: '3-0112',
      beskrivelse: 'VÖGELE 1900-3I',
      regnr: 'BL44291',
      chauffoer: 'Frank Olesen',
      tlf: '71 82 93 04',
      transportType: 'Blokvogn',
      // Anden enhed for Frank Olesen → ingen afregning (gruppering)
    },
    {
      resourceId: 'a-r3',
      anlaegsNr: '7-0078',
      beskrivelse: 'HAMM DV70VV',
      regnr: 'KK55901',
      chauffoer: 'Bent Sørensen',
      tlf: '31 42 53 64',
      transportType: 'Kran-bånd',
      ankomst_plads_tid: '07:00',
      afregning_type: 'time',
      afregning_timer: 7,
      afregning_ventetid: 0,
    },
  ],
}

// Transport-planer for Spor A: etape 0 (april) + etape 1 (september)
// a-r1 planlagt i etape 0; alle blank i etape 1 (demo: ny-etape-tilstand)
// TODO: Erstat med PLAN/Oracle når klar — fra materiel_transport_plan-tabellen
const A_TRANSPORT_PLANER: Record<string, MaterielTransportPlan> = {
  [transportKey('a-r1', 0)]: {
    resourceId: 'a-r1',
    etapeId: 0,
    status: 'planlagt',
    afhentning: {
      vejnavn: 'Industrivej',
      nummer: '12',
      postnr: '4600',
      koordinat: { lat: 55.3312, lng: 11.6847 },
    },
    klar: { dato: '2026-04-13', tid: '14:00' },
    lokation: { dato: '2026-04-14', tid: '06:00' },
    aflaesning: 'Skovvej 18, 4400 Kalundborg',
    aflaesningKoordinat: { lat: 55.6769, lng: 11.0856 },
    kommentar: 'Kran tilgængelig på pladsen',
    sendt: true,
    bekraeftet: true,
  },
  [transportKey('a-r2', 0)]: blankTransportPlan('a-r2', 0),
  [transportKey('a-r3', 0)]: blankTransportPlan('a-r3', 0),
  // Etape 1 — alle blank (demo: ny-etape-tilstand)
  [transportKey('a-r1', 1)]: blankTransportPlan('a-r1', 1),
  [transportKey('a-r2', 1)]: blankTransportPlan('a-r2', 1),
  [transportKey('a-r3', 1)]: blankTransportPlan('a-r3', 1),
}

const A: Scenario = {
  id: 'A',
  label: 'A · Samleordre + afregning',
  beskrivelse: 'Samleordre med 2 børn. Afregning demonstrerer BEGGE former: 1 akkord-bil m. multilæs (tons fordelt på 2 børn) + 1 time-bil (timer fordelt på børn).',

  products: A_PRODUCTS,
  resources: A_RESOURCES,
  vognmandBekraeftelser: A_VOGNMAND_BEKRAEFTELSER,
  vognmandMaterielBekraeftelse: A_VOGNMAND_MATERIEL_BEKRAEFTELSE,
  materielEnheder: A_MATERIEL_ENHEDER,
  transportPlaner: A_TRANSPORT_PLANER,
  samleordre: A_SAMLEORDRE,

  // Startdatoen (2026-04-14) initierer alle 3 bestillinger:
  // - bilbestilling: korselOrders + vognmandBekraeftelser seeded fra a-d2-1 (2026-04-14)
  // - materielbestilling: A_TRANSPORT_PLANER a-r1:0 sendt+bekræftet
  // - asfaltbestilling: A_PRODUCTS[].days[0].date = '2026-04-14' med tonsPlanned
  sendtTilVognmandDates: ['2026-04-14', '2026-04-15'],
  korselPlanlagtIds: ['a-d2-1', 'a-d2-2'],
  korselOrders: {
    'a-d2-1': [
      { id: 'vo-ad21-1', type: '6 Aks', antal: 1, afregning_type: 'akkord' },
      { id: 'vo-ad21-2', type: '7 Aks', antal: 1, afregning_type: 'time' },
    ],
    'a-d2-2': [
      { id: 'vo-ad22-1', type: '6 Aks', antal: 1, afregning_type: 'akkord' },
      { id: 'vo-ad22-2', type: '7 Aks', antal: 1, afregning_type: 'time' },
    ],
    'a-d2-3': [
      { id: 'vo-ad23-1', type: '6 Aks', antal: 1, afregning_type: 'akkord' },
    ],
  },
  startRaekkefoelge: {
    'a-d2-1': ['6 Aks', '7 Aks', null],
  },
  startTider: {
    'a-d2-1': ['06:50', '07:10', null],
  },

  defaultPlanDate: '2026-04-14',
  defaultProductId: 'a-p2',  // SMA 11S — har dag a-d2-1 på 2026-04-14
  demoDvaleDag: null,  // Ingen dvale-demo i Spor A — dvale-gap er juni-august (ikke angivet)
}

// ─── Spor C — Samleordre + ekstrabestilling ───────────────────────────────────
// TODO: Erstat med PLAN/Oracle når klar — Spor C seeds fra samleordrer-tabel + plan_dag_opdatering + plan_vejebilag

// Spor C benytter juni-datoer (etape 0) og november-datoer (etape 1)
// Ekstrabestilling: ekstraTons på startdagen for ét produkt → EkstraBestillingBox synlig ved default-dato

const C_PRODUCTS: MockProduct[] = [
  {
    id: 'c-p1',
    recipeCode: '23001B',
    recipeName: 'GAB I',
    activityName: 'GAB I at levere og udlægge, 80mm',
    m2: 420,
    thicknessMm: 80,
    tonsTotal: 280,
    factory: { code: '29000', name: 'PROD A EAST KØGE PH', driveTimeMinutes: 36 },
    estimatedTrucks: 3,
    estimatedTonsPerTruck: 30,
    startDate: '2026-06-08',
    endDate: '2026-11-09',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: true,
    entreprisekontrol: 1,
    temperaturmaaling: 1,
    days: [
      // Etape 0 — juni (startdatoen 2026-06-08 har ekstrabestilling)
      {
        id: 'c-d1-1',
        day: 1,
        date: '2026-06-08',
        tonsPlanned: 90,
        cancelled: false,
        // Ekstrabestilling: formanden ringede fabrik og bestilte +8 tons ekstra denne dag
        // → EkstraBestillingBox vises direkte ved default-datoen (Flow 9b / SPEC §Spor C)
        // TODO: Erstat med PLAN/Oracle når klar — fra plan_dag_opdatering-tabel
        ekstraTons: { tons: 8, bekraeftetAf: 'fabrik', tidspunkt: '2026-06-08T08:15:00+02:00' },
      },
      { id: 'c-d1-2', day: 2, date: '2026-06-09', tonsPlanned: 90, cancelled: false },
      { id: 'c-d1-3', day: 3, date: '2026-06-10', tonsPlanned: 100, cancelled: false },
      // Etape 1 — november (hverdags-gap august–oktober → ny etape i clusterEtaper)
      { id: 'c-d1-4', day: 4, date: '2026-11-09', tonsPlanned: 100, cancelled: false },
      { id: 'c-d1-5', day: 5, date: '2026-11-10', tonsPlanned: 100, cancelled: false },
    ],
  },
  {
    id: 'c-p2',
    recipeCode: '82101H',
    recipeName: 'SMA 11S',
    activityName: 'SMA 11S at levere og udlægge, 45mm',
    m2: 2800,
    thicknessMm: 45,
    tonsTotal: 520,
    factory: { code: '29000', name: 'PROD A EAST KØGE PH', driveTimeMinutes: 36 },
    estimatedTrucks: 3,
    estimatedTonsPerTruck: 28,
    startDate: '2026-06-08',
    endDate: '2026-06-10',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: false,
    entreprisekontrol: 2,
    temperaturmaaling: 2,
    days: [
      { id: 'c-d2-1', day: 1, date: '2026-06-08', tonsPlanned: 175, cancelled: false },
      { id: 'c-d2-2', day: 2, date: '2026-06-09', tonsPlanned: 175, cancelled: false },
      { id: 'c-d2-3', day: 3, date: '2026-06-10', tonsPlanned: 170, cancelled: false },
    ],
  },
]

const C_RESOURCES: MockResource[] = [
  { id: 'c-r1', plantNumber: '5-0034', description: 'HAMM HD10 VT',      transportTag: 'blokvogn',    status: 'planlagt' },
  { id: 'c-r2', plantNumber: '3-0112', description: 'VÖGELE 1900-3I',    transportTag: 'blokvogn',    status: 'ikke-planlagt' },
  { id: 'c-r3', plantNumber: '7-0078', description: 'HAMM DV70VV',       transportTag: 'kran-baand',  status: 'ikke-planlagt' },
]

const C_MATERIEL_ENHEDER: MaterielEnhed[] = [
  { anlaegsNr: '5-0034', beskrivelse: 'HAMM HD10 VT' },
  { anlaegsNr: '3-0112', beskrivelse: 'VÖGELE 1900-3I' },
  { anlaegsNr: '7-0078', beskrivelse: 'HAMM DV70VV' },
]

// Samleordre C: 2 børn — anchor + barn2 (samme struktur som Spor A, men anderledes sted)
const C_SAMLEORDRE: SamleordreContext = {
  id: 'samle-C',
  children: [
    {
      orderNumber: '1212500',
      jobnummer: '201. Ringgaden Slagelse',
      udfoerelseSted: 'Ringgaden 32, 4200 Slagelse',
      stedLabel: 'Ringgaden',
      isAnchor: true,
      products: [
        { id: 'c-p1', recipeCode: '23001B', recipeName: 'GAB I',   tonsTotal: 280 },
        { id: 'c-p2', recipeCode: '82101H', recipeName: 'SMA 11S', tonsTotal: 520 },
      ],
      resources: C_RESOURCES,
      // TODO: Erstat med PLAN/Oracle når klar
      projektleder: 'Henrik Thor',
      projektlederTlf: '51 62 73 84',
      fabrik: 'Køge Fabrik',
      fabrikTlf: '56 78 12 34',
      kundeVirksomhed: 'Slagelse Kommune',
      kundekontakt: 'Kirsten Ravn',
      kundekontaktTlf: '44 55 66 77',
      antalBiler: 3,
      vognmandBekraeftet: true,  // KRAV (c): bekræftet overalt i Udførsel
      antalMateriel: 3,
      materielBekraeftet: true,  // KRAV (c): bekræftet overalt i Udførsel
      forundersoegelseOK: true,
      forundersoegelseStatus: 'OK',
      forundersoegelseDetails: {
        underlaegsType: 'asfalt',
        tilfredsstillende: true,
        besigtigelseComment: 'Fræset lag fjernet og komprimeret — klar til udlægning',
        photoCount: 5,
      },
      udlaegningDetails: {
        status: 'i-gang',
        startTid: '07:15',
        noter: 'GAB I starter — god fremgang trods vind',
      },
    },
    {
      orderNumber: '1212501',
      jobnummer: '202. Boulevarden Slagelse',
      udfoerelseSted: 'Boulevarden 12, 4200 Slagelse',
      stedLabel: 'Boulevarden',
      isAnchor: false,
      products: [
        { id: 'c-sp1', recipeCode: '82101H', recipeName: 'SMA 11S', tonsTotal: 180 },
        { id: 'c-sp2', recipeCode: 'ABB11',  recipeName: 'ABB 11',  tonsTotal: 70 },
      ],
      resources: [],
      // TODO: Erstat med PLAN/Oracle når klar
      projektleder: 'Ole Jensen',
      projektlederTlf: '40 50 60 70',
      fabrik: 'Køge Fabrik',
      fabrikTlf: '56 78 12 34',
      kundeVirksomhed: 'Slagelse Erhvervspark',
      kundekontakt: 'Poul Eriksen',
      kundekontaktTlf: '21 32 43 54',
      antalBiler: 2,
      vognmandBekraeftet: true,  // KRAV (c): bekræftet overalt i Udførsel
      antalMateriel: 1,
      materielBekraeftet: true,  // KRAV (c): bekræftet overalt i Udførsel
      forundersoegelseOK: true,
      forundersoegelseStatus: 'OK',
      forundersoegelseDetails: {
        underlaegsType: 'asfalt',
        tilfredsstillende: true,
        besigtigelseComment: 'Gammel belægning stabil — OK til udlægning',
        photoCount: 2,
      },
      udlaegningDetails: {
        status: 'ikke-startet',
        noter: '',
      },
    },
  ],
}

// Vognmand-bekræftelser Spor C — startdatoen 2026-06-08 initierer alle bestillinger
// Bekræftede biler på ALLE dage (krav c)
// TODO: Erstat med PLAN/Oracle når klar — fra vognmand.aftaler.chauffoerer[] + plan_vejebilag
const C_VOGNMAND_BEKRAEFTELSER: Record<string, VognmandBekraeftelse> = {
  'c-d2-1': {
    dayId: 'c-d2-1',
    bekraeftetTidspunkt: '7. juni · 16:00',
    biler: [
      {
        regnr: 'SL 11 333',
        chauffoer: 'Morten Lund',
        tlf: '22 33 44 55',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:30',
        laes_nummer: 1,
        moedetid_fabrik: '05:54',
        sms_status: 'sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 32.8,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'c-vsb-1',
            vejeseddelNr: '26-0201-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 32.8,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212500', ordre_label: '1212500 · Ringgaden 32', tons: 32.8, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'SL 22 444',
        chauffoer: 'Jesper Madsen',
        tlf: '41 52 73 84',
        biltype: '7 Aks',
        ankomst_plads_tid: '06:50',
        laes_nummer: 2,
        moedetid_fabrik: '06:14',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'time',
          koretimer: 8.0,
          ventetid: 0,
          hviletid: 0.5,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'c-vsb-2',
            vejeseddelNr: '26-0202-A',
            product_code: 'GAB I',
            product_name: 'GAB I bundlag',
            netto_tons: 35.0,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212500', ordre_label: '1212500 · Ringgaden 32', tons: 35.0, is_anchor: true },
            ],
          },
        ],
      },
      // Materiel-biler (krav c): bekræftet
      // TODO: Erstat med PLAN/Oracle når klar
      {
        regnr: 'BL55382',
        chauffoer: 'Lars Pedersen',
        tlf: '20 30 40 50',
        biltype: 'Blokvogn',
        er_materiel_bil: true,
        koert_materiel: ['HAMM HD10 VT (5-0034)', 'VÖGELE 1900-3I (3-0112)'],
        afregning: {
          afregning_type: 'time',
          koretimer: 8.5,
          ventetid: 0.5,
          godkendt_af_formand: false,
        },
      },
    ],
  },
  'c-d2-2': {
    dayId: 'c-d2-2',
    bekraeftetTidspunkt: '8. juni · 15:50',
    biler: [
      {
        regnr: 'SL 33 555',
        chauffoer: 'Niels Dalgaard',
        tlf: '44 61 72 93',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:30',
        laes_nummer: 1,
        moedetid_fabrik: '05:54',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 30.4,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'c-vsb-3',
            vejeseddelNr: '26-0203-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 30.4,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212500', ordre_label: '1212500 · Ringgaden 32', tons: 30.4, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'SL 44 666',
        chauffoer: 'Claus Friis',
        tlf: '73 94 85 12',
        biltype: '7 Aks',
        ankomst_plads_tid: '06:50',
        laes_nummer: 2,
        moedetid_fabrik: '06:14',
        sms_status: 'sendt',
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 1.0,
          hviletid: 0.5,
          chauffoer_kommentar: 'Kø ved fabrik — 1 times ventetid.',
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'c-vsb-4',
            vejeseddelNr: '26-0204-A',
            product_code: 'GAB I',
            product_name: 'GAB I bundlag',
            netto_tons: 35.0,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212500', ordre_label: '1212500 · Ringgaden 32', tons: 35.0, is_anchor: true },
            ],
          },
        ],
      },
    ],
  },
  'c-d2-3': {
    dayId: 'c-d2-3',
    bekraeftetTidspunkt: '9. juni · 16:20',
    biler: [
      {
        regnr: 'SL 55 777',
        chauffoer: 'Ole Brandt',
        tlf: '62 83 94 71',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:20',
        laes_nummer: 1,
        moedetid_fabrik: '05:44',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 29.8,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'c-vsb-5',
            vejeseddelNr: '26-0205-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 29.8,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212500', ordre_label: '1212500 · Ringgaden 32', tons: 29.8, is_anchor: true },
            ],
          },
        ],
      },
    ],
  },
}

// Materiel-bekræftelse for Spor C
// TODO: Erstat med PLAN/Oracle når klar — fra materiel_transport_plan + vognmand.aftaler
const C_VOGNMAND_MATERIEL_BEKRAEFTELSE: VognmandMaterielBekraeftelse = {
  bekraeftetTidspunkt: '7. juni · 17:10',
  items: [
    {
      resourceId: 'c-r1',
      anlaegsNr: '5-0034',
      beskrivelse: 'HAMM HD10 VT',
      regnr: 'BL55382',
      chauffoer: 'Lars Pedersen',
      tlf: '20 30 40 50',
      transportType: 'Blokvogn',
      ankomst_plads_tid: '06:15',
      afregning_type: 'time',
      afregning_timer: 8.5,
      afregning_ventetid: 0.5,
    },
    {
      resourceId: 'c-r2',
      anlaegsNr: '3-0112',
      beskrivelse: 'VÖGELE 1900-3I',
      regnr: 'BL55382',
      chauffoer: 'Lars Pedersen',
      tlf: '20 30 40 50',
      transportType: 'Blokvogn',
      // Anden enhed for Lars → ingen afregning (gruppering)
    },
    {
      resourceId: 'c-r3',
      anlaegsNr: '7-0078',
      beskrivelse: 'HAMM DV70VV',
      regnr: 'KK12345',
      chauffoer: 'Bent Sørensen',
      tlf: '31 42 53 64',
      transportType: 'Kran-bånd',
      ankomst_plads_tid: '07:00',
      afregning_type: 'time',
      afregning_timer: 7,
      afregning_ventetid: 0,
    },
  ],
}

// Transport-planer for Spor C: etape 0 (juni) + etape 1 (november)
// TODO: Erstat med PLAN/Oracle når klar — fra materiel_transport_plan-tabellen
const C_TRANSPORT_PLANER: Record<string, MaterielTransportPlan> = {
  [transportKey('c-r1', 0)]: {
    resourceId: 'c-r1',
    etapeId: 0,
    status: 'planlagt',
    afhentning: {
      vejnavn: 'Industrivej',
      nummer: '12',
      postnr: '4600',
      koordinat: { lat: 55.3312, lng: 11.6847 },
    },
    klar: { dato: '2026-06-07', tid: '14:00' },
    lokation: { dato: '2026-06-08', tid: '06:00' },
    aflaesning: 'Ringgaden 32, 4200 Slagelse',
    aflaesningKoordinat: { lat: 55.3613, lng: 11.3590 },
    kommentar: 'Kran tilgængelig — ring Lars 30 min i forvejen',
    sendt: true,
    bekraeftet: true,
  },
  [transportKey('c-r2', 0)]: blankTransportPlan('c-r2', 0),
  [transportKey('c-r3', 0)]: blankTransportPlan('c-r3', 0),
  // Etape 1 — alle blank (demo: ny-etape-tilstand)
  [transportKey('c-r1', 1)]: blankTransportPlan('c-r1', 1),
  [transportKey('c-r2', 1)]: blankTransportPlan('c-r2', 1),
  [transportKey('c-r3', 1)]: blankTransportPlan('c-r3', 1),
}

const C: Scenario = {
  id: 'C',
  label: 'C · Samleordre + ekstrabestilling',
  beskrivelse: 'Samleordre med 2 børn. Ekstrabestilling synlig på startdagen (+8t fabrik-push) → EkstraBestillingBox vises ved default-datoen.',

  products: C_PRODUCTS,
  resources: C_RESOURCES,
  vognmandBekraeftelser: C_VOGNMAND_BEKRAEFTELSER,
  vognmandMaterielBekraeftelse: C_VOGNMAND_MATERIEL_BEKRAEFTELSE,
  materielEnheder: C_MATERIEL_ENHEDER,
  transportPlaner: C_TRANSPORT_PLANER,
  samleordre: C_SAMLEORDRE,

  // Startdatoen (2026-06-08) initierer alle 3 bestillinger:
  // - bilbestilling: korselOrders + vognmandBekraeftelser seeded fra c-d2-1 (2026-06-08)
  // - materielbestilling: C_TRANSPORT_PLANER c-r1:0 sendt+bekræftet
  // - asfaltbestilling: C_PRODUCTS[].days[0].date = '2026-06-08' med tonsPlanned + ekstraTons
  sendtTilVognmandDates: ['2026-06-08', '2026-06-09'],
  korselPlanlagtIds: ['c-d2-1', 'c-d2-2'],
  korselOrders: {
    'c-d2-1': [
      { id: 'vo-cd21-1', type: '6 Aks', antal: 1, afregning_type: 'akkord' },
      { id: 'vo-cd21-2', type: '7 Aks', antal: 1, afregning_type: 'time' },
    ],
    'c-d2-2': [
      { id: 'vo-cd22-1', type: '6 Aks', antal: 1, afregning_type: 'akkord' },
      { id: 'vo-cd22-2', type: '7 Aks', antal: 1, afregning_type: 'time' },
    ],
    'c-d2-3': [
      { id: 'vo-cd23-1', type: '6 Aks', antal: 1, afregning_type: 'akkord' },
    ],
  },
  startRaekkefoelge: {
    'c-d2-1': ['6 Aks', '7 Aks', null],
  },
  startTider: {
    'c-d2-1': ['06:30', '06:50', null],
  },

  defaultPlanDate: '2026-06-08',
  defaultProductId: 'c-p2',  // SMA 11S — har dag c-d2-1 på 2026-06-08
  demoDvaleDag: null,  // Ingen dvale-demo i Spor C — gap er juli-oktober
}

// ─── Registry-eksport ─────────────────────────────────────────────────────────

export const SCENARIOS: Record<ScenarioId, Scenario> = { A, B, C }

/**
 * Default-scenarie er B: bagudkompatibel med nuværende enkelt-ordre-demo.
 * OrdrePlanScreen initialiserer med Spor B når ingen `?scenarie`-param er sat.
 */
export const DEFAULT_SCENARIO_ID: ScenarioId = 'B'
