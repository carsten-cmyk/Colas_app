import type {
  MockProduct,
  MockResource,
  VehicleOrder as _VehicleOrder,
  KørselDayParams,
  AndenOrdre,
  NoteComment,
  MockPhoto,
  SamleordreContext,
  VognmandMaterielBekraeftelse,
  VognmandBekraeftelse,
  MaterielEnhed,
  UnderlagType,
  UnderlaegsAarsag,
} from './types'

// TODO: Erstat med PLAN/Supabase standard-materiel-katalog når klar
export const STANDARD_MATERIEL_KATALOG: Array<{ plantNumber: string; description: string; transportTag: MockResource['transportTag'] }> = [
  { plantNumber: 'A-3042', description: 'HAMM HD+ 140i Tromle (vibrations)', transportTag: 'blokvogn' },
  { plantNumber: 'A-1187', description: 'VÖGELE SUPER 1900-3i Asfaltudlægger', transportTag: 'blokvogn' },
  { plantNumber: 'A-2205', description: 'WIRTGEN W 100 CFi Fræser', transportTag: 'blokvogn' },
  { plantNumber: 'A-3081', description: 'HAMM HD 12 VV Tandemtromle', transportTag: 'blokvogn' },
  { plantNumber: 'A-4412', description: 'DYNAPAC CC1200 Gummitromle', transportTag: 'blokvogn' },
  { plantNumber: 'A-2019', description: 'WIRTGEN W 220 CFi Stor fræser', transportTag: 'blokvogn' },
  { plantNumber: 'A-5503', description: 'VÖGELE SUPER 700-3i Lille udlægger', transportTag: 'kran-baand' },
  { plantNumber: 'A-6110', description: 'Broddpacker / Stamper BOMAG BT 65', transportTag: 'egen-korsel' },
  { plantNumber: 'A-7021', description: 'Fejemaskine Johnston VS651', transportTag: 'egen-korsel' },
  { plantNumber: 'A-7305', description: 'Skæremaskine Husqvarna K 6500', transportTag: 'egen-korsel' },
  { plantNumber: 'A-8801', description: 'BOMAG BW 120 AD-5 Tandemtromle', transportTag: 'blokvogn' },
  { plantNumber: 'A-9044', description: 'Vandvogn 8.000 l (kørende vandforsyning)', transportTag: 'kran-baand' },
]

// Bil-ordrenumre (<ordrenr>-DDMMYY-NN) genereres backend-side ved send til vognmand
// (LÅST 2026-06-13, se DATA_FIELDS.md confirmed_vehicles[].bil_ordre_nr). Vises ikke i
// asfaltkørsel-UI'en, men er fortsat væsentlig for vognmandens bestilling.

export const VEHICLE_TYPES: { label: string; tons: number }[] = [
  { label: '6 Aks',          tons: 32 },
  { label: '7 Aks',          tons: 35 },
  { label: 'Forvogn',        tons: 18 },
  { label: 'Forvogn/Kærre',  tons: 32 },
  { label: 'Grab',           tons: 28 },
  { label: 'Sneglebil',      tons: 15 },
  { label: 'Snegl m. kærre', tons: 30 },
  { label: 'Sideudlægger',   tons: 16 },
]

// TODO: Erstat med Supabase når klar — vognmænd fra vognmand-tabel; primær fra ordrens aftale
export const MOCK_VOGNMAEND = [
  { id: 'vm-1', navn: 'Kloster A/S' },                          // primær (default)
  { id: 'vm-2', navn: 'Vestsjællands Transport A/S' },
  { id: 'vm-3', navn: 'Roskilde Vognmandsforretning' },
]
export const DEFAULT_VOGNMAND_ID = 'vm-1'

export const DEFAULT_KØRSEL_PARAMS: KørselDayParams = {
  driveMinutes:    36,
  loadMinutes:     15,
  deliverMinutes:  10,
  intervalMinutes: undefined,
  firstLoadTime:   undefined,
  lastLoadTime:    '15:00',
  pauses:          [],
}

// ─── Andre ordrer på dagen (for multilæs-picker + ordre-pille-strip) ──────
// Inline mock — matcher Dagsoversigt for de relevante datoer (alle bortset fra denne ordre 1212343).
// TODO: Erstat med Supabase — andre ordrer for samme formand og dato.

// Bevaret til fremtidig brug — andre ordrer på dagen kan genbruges i samleordre-flow
// @ts-ignore TS6133 — bruges ikke i UI pt., men mock-data bevares til næste iteration
export const ANDRE_ORDRER_FOR_DATO: Record<string, AndenOrdre[]> = {
  '2026-03-17': [
    {
      id: 'ord-1212344',
      orderNumber: '1212344',
      jobnummer: '187. Havnevej Roskilde',
      udfoerelseSted: 'Havnevej 12, 4000 Roskilde',
      products: [{ id: 'op2-1', recipeCode: 'ABB 11', recipeName: 'ABB 11' }],
    },
    {
      id: 'ord-1212350',
      orderNumber: '1212350',
      jobnummer: '412. Ringvej Næstved E3',
      udfoerelseSted: 'Ringvej Syd 44, 4700 Næstved',
      products: [{ id: 'op3-1', recipeCode: 'SMA 8S', recipeName: 'SMA 8S' }],
    },
    {
      id: 'ord-1212351',
      orderNumber: '1212351',
      jobnummer: '298. BMF Vordingborg',
      udfoerelseSted: 'Algade 18, 4760 Vordingborg',
      products: [{ id: 'op4-1', recipeCode: 'GAB 0/16', recipeName: 'GAB 0/16' }],
    },
  ],
  '2026-03-18': [
    {
      id: 'ord-1212346',
      orderNumber: '1212346',
      jobnummer: '377. Boligvej Køge',
      udfoerelseSted: 'Boligvej 5, 4600 Køge',
      products: [{ id: 'op6-1', recipeCode: 'GAB I', recipeName: 'GAB I' }],
    },
    {
      id: 'ord-1212347',
      orderNumber: '1212347',
      jobnummer: '289. SVR Greve',
      udfoerelseSted: 'Strandvejen 2, 2670 Greve',
      products: [{ id: 'op7-1', recipeCode: 'ABB 11', recipeName: 'ABB 11' }],
    },
  ],
}


// ─── Mock data ────────────────────────────────────────────────────────────────

export const INITIAL_PRODUCTS: MockProduct[] = [
  {
    id: 'p1',
    recipeCode: '23001B',
    recipeName: 'GAB I',
    activityName: 'GAB I at levere og udlægge, 80mm',
    m2: 67,
    thicknessMm: 80,
    tonsTotal: 200,
    factory: { code: '29000', name: 'PROD A EAST KØGE PH', driveTimeMinutes: 36 },
    estimatedTrucks: 2,
    estimatedTonsPerTruck: 26,
    startDate: '2026-03-17',
    endDate: '2026-07-07',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: true,
    entreprisekontrol: 1,
    temperaturmaaling: 1,
    days: [
      {
        id: 'd1-1', day: 1, date: '2026-03-17', tonsPlanned: 70, cancelled: false,
        // Flow 9b (OPDATERET 2026-06-09): PLAN-push fra fabrik — +5 tons ekstra
        ekstraTons: { tons: 5, bekraeftetAf: 'fabrik', tidspunkt: '2026-03-17T08:42:00+01:00' },
      },
      { id: 'd1-2', day: 2, date: '2026-03-18', tonsPlanned: 70, cancelled: false },
      { id: 'd1-3', day: 3, date: '2026-03-19', tonsPlanned: 60, cancelled: false },
      // Etape 1 — juli (matcher DEMO_PLANLAGTE_DAGE fra etape.ts for seed-konsistens)
      // TODO: Erstat med Supabase når klar — dage fra PLAN plan_dag-tabel
      { id: 'd1-4', day: 4, date: '2026-07-06', tonsPlanned: 80, cancelled: false },
      { id: 'd1-5', day: 5, date: '2026-07-07', tonsPlanned: 80, cancelled: false },
    ],
  },
  {
    id: 'p2',
    recipeCode: '82101H',
    recipeName: 'SMA 11S',
    activityName: 'SMA 11S at levere og udlægge, 45mm',
    m2: 4017,
    thicknessMm: 45,
    tonsTotal: 752,
    factory: { code: '29000', name: 'PROD A EAST KØGE PH', driveTimeMinutes: 36 },
    estimatedTrucks: 3,
    estimatedTonsPerTruck: 30,
    startDate: '2026-03-16',
    endDate: '2026-03-18',
    kravTilSamlinger: 'Klæbet',
    ekstraTemperaturmaalinger: true,
    entreprisekontrol: 2,
    temperaturmaaling: 2,
    days: [
      { id: 'd2-1', day: 1, date: '2026-03-16', tonsPlanned: 250, cancelled: false },
      {
        id: 'd2-2', day: 2, date: '2026-03-17', tonsPlanned: 250, cancelled: false,
        // Flow 9b (OPDATERET 2026-06-09): PLAN-push fra fabrik — +10 tons ekstra
        ekstraTons: { tons: 10, bekraeftetAf: 'fabrik', tidspunkt: '2026-03-17T09:15:00+01:00' },
      },
      { id: 'd2-3', day: 3, date: '2026-03-18', tonsPlanned: 252, cancelled: false },
    ],
  },
]

export const INITIAL_RESOURCES: MockResource[] = [
  { id: 'r1', plantNumber: '5-0034', description: 'HAMM HD10 VT',      transportTag: 'blokvogn',    status: 'planlagt' },
  { id: 'r2', plantNumber: '3-0112', description: 'VÖGELE 1900-3I',    transportTag: 'blokvogn',    status: 'ikke-planlagt' },
  { id: 'r3', plantNumber: '7-0078', description: 'HAMM DV70VV',       transportTag: 'kran-baand',  status: 'ikke-planlagt' },
  { id: 'r4', plantNumber: '9-0009', description: 'Sættevogn 7-aksel', transportTag: 'egen-korsel', status: 'ikke-planlagt' },
]



export const CANCEL_REASONS: { value: import('./types').CancelReason; label: string }[] = [
  { value: 'regn',     label: 'Regn' },
  { value: 'frost',    label: 'Frost' },
  { value: 'underlag', label: 'Underlag' },
  { value: 'andet',    label: 'Andet' },
]


// ─── Mock documentation data ──────────────────────────────────────────────────

export const INITIAL_COMMENTS: NoteComment[] = [
  {
    id: 'nc1',
    initials: 'OJ',
    name: 'Ole Jensen',
    timestamp: '14. marts · 08:42',
    text: 'Området er opmålt og klargjort. Underlag ser fornuftigt ud — mindre ujævnheder ved indkørslen mod nord er udbedret. Koordination med skolens vicevært er på plads, adgang sikret fra kl. 06:00.',
  },
  {
    id: 'nc2',
    initials: 'HT',
    name: 'Henrik Thor',
    timestamp: '14. marts · 11:15',
    text: 'Besigtigelse gennemført. Bemærk at det nordøstlige hjørne kræver ekstra komprimering — kunden har påpeget sætninger fra tidligere belægning. Aftalt med Ole at vi tager et ekstra gennemløb med HAMM HD10 i det område inden udlægning af lag 2.',
  },
]

export const INITIAL_PHOTOS: MockPhoto[] = [
  { id: 'ph1', color: 'bg-dark-teal/20',  label: 'Foto 1' },
  { id: 'ph2', color: 'bg-yellow/30',     label: 'Foto 2' },
  { id: 'ph3', color: 'bg-light-aqua/60', label: 'Foto 3' },
]

// ─── Samleordre mock-data ─────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar — samleordrer fra samleordrer-tabel

export const MOCK_SAMLEORDRE: SamleordreContext = {
  id: 'samle-001',
  children: [
    {
      // Anchor: den aktuelle ordre (1212343)
      orderNumber: '1212343',
      jobnummer: '52. VD Kibæk Vammen',
      udfoerelseSted: 'Søvej 6D, 4900 Nakskov',
      stedLabel: 'Søvej',
      isAnchor: true,
      products: [
        { id: 'p1', recipeCode: '23001B', recipeName: 'GAB I', tonsTotal: 200 },
        { id: 'p2', recipeCode: '82101H', recipeName: 'SMA 11S', tonsTotal: 752 },
      ],
      resources: [
        { id: 'r1', plantNumber: '5-0034', description: 'HAMM HD10 VT',      transportTag: 'blokvogn',    status: 'planlagt' },
        { id: 'r2', plantNumber: '3-0112', description: 'VÖGELE 1900-3I',    transportTag: 'blokvogn',    status: 'ikke-planlagt' },
        { id: 'r3', plantNumber: '7-0078', description: 'HAMM DV70VV',       transportTag: 'kran-baand',  status: 'ikke-planlagt' },
      ],
      // TODO: Erstat med Supabase når klar
      projektleder: 'Henrik Thor',
      projektlederTlf: '40 50 60 70',
      fabrik: 'Køge Fabrik',
      fabrikTlf: '56 78 12 34',
      kundeVirksomhed: 'Uddannelsescenter Syd',
      kundekontakt: 'Jens Christensen',
      kundekontaktTlf: '21 34 56 78',
      // TODO: Erstat med Supabase når klar — per-child dagsoverblik
      antalBiler: 4,
      vognmandBekraeftet: true,
      antalMateriel: 3,
      materielBekraeftet: true,
      forundersoegelseOK: true,
      forundersoegelseStatus: 'OK',
      // TODO: Erstat med Supabase når klar — per-child forundersøgelse
      forundersoegelseDetails: {
        underlaegsType: 'asfalt',
        tilfredsstillende: true,
        besigtigelseComment: 'Underlag er fast og jævnt',
        photoCount: 3,
      },
      // TODO: Erstat med Supabase når klar — per-child udlægning
      udlaegningDetails: {
        status: 'i-gang',
        startTid: '07:15',
        noter: 'Starter med GAB I',
      },
    },
    {
      // Anden ordre i samleordren
      orderNumber: '1212347',
      jobnummer: '289. SVR Greve',
      udfoerelseSted: 'Strandvejen 2, 2670 Greve',
      stedLabel: 'Strandvejen',
      isAnchor: false,
      products: [
        // SMA 11S overlapper med anchor → samles i bestillings-rækken
        { id: 'sp2', recipeCode: '82101H', recipeName: 'SMA 11S', tonsTotal: 200 },
        // Unikt produkt for denne ordre
        { id: 'sp3', recipeCode: 'ABB11',  recipeName: 'ABB 11',  tonsTotal: 100 },
      ],
      resources: [],
      // TODO: Erstat med Supabase når klar
      projektleder: 'Mette Lund',
      projektlederTlf: '31 67 92 14',
      fabrik: 'Køge Vest Fabrik',
      fabrikTlf: '44 32 11 55',
      kundeVirksomhed: 'Greve Erhvervspark',
      kundekontakt: 'Lars Madsen',
      kundekontaktTlf: '28 91 44 02',
      // TODO: Erstat med Supabase når klar — per-child dagsoverblik
      antalBiler: 2,
      vognmandBekraeftet: false,
      antalMateriel: 1,
      materielBekraeftet: false,
      forundersoegelseOK: false,
      forundersoegelseStatus: 'MANGLER',
      // TODO: Erstat med Supabase når klar — per-child forundersøgelse
      forundersoegelseDetails: {
        underlaegsType: null,
        tilfredsstillende: null,
        besigtigelseComment: 'Skal besigtiges efter morgenens regn',
        photoCount: 0,
      },
      // TODO: Erstat med Supabase når klar — per-child udlægning
      udlaegningDetails: {
        status: 'ikke-startet',
        noter: '',
      },
    },
  ],
}

// TODO: Erstat med Supabase Realtime subscription.
// Når vognmand godkender disponering (inkl. materiel) i VognmandDisponeringsScreen:
//   1. Supabase opdaterer ordre-rækken med bekræftede transport-data
//   2. Formand-app modtager via Realtime og opdaterer denne state
//   3. Badges i Planlægning → Materiellevering skifter til grønt
//   4. UdfoerselContent → Materiel-sektion viser bekræftede data
// Se .claude/docs/MATERIEL_FLOW.md for fuld spec.
// TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
export const INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE: VognmandMaterielBekraeftelse = {
  bekraeftetTidspunkt: '15. marts · 17:05',
  items: [
    {
      resourceId: 'r1',
      anlaegsNr: '5-0034',
      beskrivelse: 'HAMM HD10 VT',
      regnr: 'BL77331',
      chauffoer: 'Lars Pedersen',
      tlf: '20 30 40 50',
      transportType: 'Blokvogn',
      ankomst_plads_tid: '06:15',
      // Første og eneste materiel for Lars Pedersen → afregning herunder
      afregning_type: 'time',
      afregning_timer: 8.5,
      afregning_ventetid: 1,
      afregning_chauffoer_kommentar: 'Pakket ud og ind 2 gange — ændret placering af tromle.',
    },
    {
      resourceId: 'r2',
      anlaegsNr: '3-0112',
      beskrivelse: 'VÖGELE 1900-3I',
      regnr: 'BL77331',
      chauffoer: 'Lars Pedersen',
      tlf: '20 30 40 50',
      transportType: 'Blokvogn',
      // Anden enhed for Lars Pedersen → ingen afregning-knap (groupering)
    },
    {
      resourceId: 'r3',
      anlaegsNr: '7-0078',
      beskrivelse: 'HAMM DV70VV',
      regnr: 'KK45892',
      chauffoer: 'Bent Sørensen',
      tlf: '31 42 53 64',
      transportType: 'Kran-bånd',
      ankomst_plads_tid: '07:00',
      // Kun én enhed for Bent Sørensen → afregning herunder
      afregning_type: 'time',
      afregning_timer: 7,
      afregning_ventetid: 0,
    },
  ],
}

// Mock: dag d2-1 er bekræftet af vognmand, d2-2 afventer vognmand
// TODO: Erstat med Supabase Realtime subscription.
// Når vognmand godkender disponering i VognmandDisponeringsScreen:
//   1. dispMap (Record<dato, reg[]>) sendes til Supabase
//   2. Formand-app modtager via Realtime og opdaterer denne state
//   3. Badges i Planlægning → Asfalt kørsel skifter per dag
//   4. UdfoerselContent → Bestilte biler viser bekræftede biler for dagens dato
// Se .claude/docs/MATERIEL_FLOW.md for fuld spec.
// TODO: Erstat med Supabase når klar — afregning_type kommer fra vognmand.aftaler.chauffoerer[], timer fra chauffeur-app, tons fra plan_vejebilag-tabel
export const INITIAL_VOGNMAND_BEKRAEFTELSER: Record<string, VognmandBekraeftelse> = {
  'd2-1': {
    dayId: 'd2-1',
    bekraeftetTidspunkt: '15. marts · 16:42',
    biler: [
      {
        regnr: 'AB 12 345',
        chauffoer: 'Morten Lund',
        tlf: '22 33 44 55',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:30',
        laes_nummer: 1,
        moedetid_fabrik: '05:54',
        sms_status: 'sendt',
        // time-afregning med prædufyldte værdier fra chauffør-app
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 0.5,
          hviletid: 0.5,
          chauffoer_kommentar: 'Ventet 30 min ved fabrikken pga. kø ved indvejning.',
          godkendt_af_formand: false,
        },
        // TODO: Erstat med Supabase når klar — vejesedler fra plan_vejebilag-tabel
        vejesedler: [
          {
            id: 'vsb-1',
            vejeseddelNr: '25-1013-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 28.0,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 28.0, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'CD 67 890',
        chauffoer: 'Søren Karlsen',
        tlf: '26 77 88 99',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:50',
        laes_nummer: 2,
        moedetid_fabrik: '06:14',
        sms_status: 'ikke_sendt',
        // akkord-afregning — tons arves fra vejesedler (49.2t multilæs)
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 49.2,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        // TODO: Erstat med Supabase når klar — vejesedler fra plan_vejebilag-tabel
        vejesedler: [
          {
            id: 'vsb-2',
            vejeseddelNr: '25-1014-A',
            product_code: 'ABB 11',
            product_name: 'ABB 11 toplag',
            netto_tons: 49.2,
            tara_tons: 15.0,
            multilaes_flag: true,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            // Pre-mock fordeling: A=30t (anchor), B=10t, C=9.2t
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 30.0, is_anchor: true },
              { ordre_id: 'ord-1212344', ordre_label: '1212344 · Havnevej 12', tons: 10.0, is_anchor: false },
              { ordre_id: 'ord-1212350', ordre_label: '1212350 · Ringvej Syd 44', tons: 9.2, is_anchor: false },
            ],
          },
        ],
      },
      {
        regnr: 'EF 11 223',
        chauffoer: 'Lars Holm',
        tlf: '40 12 56 78',
        biltype: '7 Aks',
        ankomst_plads_tid: '07:10',
        laes_nummer: 3,
        moedetid_fabrik: '06:34',
        sms_status: 'ikke_sendt',
        // INGEN afregning_type → trigger fallback-banner + default time
        afregning: {
          afregning_type: undefined,
          koretimer: 8,
          ventetid: 0,
          hviletid: 0,
          godkendt_af_formand: true,
          godkendt_tidspunkt: '16. marts · 09:14',
        },
      },
      // Akkord-bil med 1,5-times-reglen triggered
      // TODO: Erstat med Supabase når klar — vejesedler og 1.5t-flag fra plan_vejebilag-tabel
      {
        regnr: 'GH 33 441',
        chauffoer: 'Kim Vestergaard',
        tlf: '51 62 73 84',
        biltype: '7 Aks',
        ankomst_plads_tid: '07:30',
        laes_nummer: 4,
        moedetid_fabrik: '06:54',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 35.0,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-6',
            vejeseddelNr: '25-1015-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 35.0,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            // 1.5-times-reglen er trådt i kraft for dette læs
            aflæsset_efter_1_5t: true,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 35.0, is_anchor: true },
            ],
          },
        ],
      },
      // Bil 5 — interval-fremskrevet (ikke pinned), sms_status: ikke_sendt
      // TODO: Erstat med Supabase når klar
      {
        regnr: 'JK 55 678',
        chauffoer: 'Peter Hansen',
        tlf: '60 71 82 93',
        biltype: '6 Aks',
        ankomst_plads_tid: '07:50',
        laes_nummer: 5,
        moedetid_fabrik: '07:14',
        sms_status: 'ikke_sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 32.4,
          ventetid: 0,
          godkendt_af_formand: false,
        },
      },
      // Bil 6 — interval-fremskrevet, sms allerede sendt (demo af sendt-tilstand)
      // TODO: Erstat med Supabase når klar
      {
        regnr: 'LM 88 901',
        chauffoer: 'Thomas Nielsen',
        tlf: '42 53 64 75',
        biltype: '7 Aks',
        ankomst_plads_tid: '08:10',
        laes_nummer: 6,
        moedetid_fabrik: '07:34',
        sms_status: 'sendt',
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 38.0,
          ventetid: 0,
          godkendt_af_formand: false,
        },
      },
      // TODO: Erstat med Supabase når klar — materiel-biler fra vognmand.aftaler.materiel[]
      {
        regnr: 'BL77331',
        chauffoer: 'Lars Pedersen',
        tlf: '20 30 40 50',
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
        regnr: 'KK45892',
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
  // TODO: Erstat med Supabase når klar — d2-2 og d2-3 mock-bekræftelser
  'd2-2': {
    dayId: 'd2-2',
    bekraeftetTidspunkt: '16. marts · 15:30',
    biler: [
      {
        regnr: 'NP 21 654',
        chauffoer: 'Jesper Madsen',
        tlf: '+4541527836',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:20',
        laes_nummer: 1,
        moedetid_fabrik: '05:44',
        sms_status: 'ikke_sendt',
        // time-afregning (matcher kørselOrders d2-2: 6 Aks → 'time')
        afregning: {
          afregning_type: 'time',
          koretimer: 8.0,
          ventetid: 0.5,
          hviletid: 0.5,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-d22-1',
            vejeseddelNr: '25-1016-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 30.5,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 30.5, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'QR 44 782',
        chauffoer: 'Anders Kristiansen',
        tlf: '+4553748291',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:40',
        laes_nummer: 2,
        moedetid_fabrik: '06:04',
        sms_status: 'sendt',
        // time-afregning (6 Aks → 'time' pr. d2-2 kørselOrders)
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 0,
          hviletid: 0.5,
          godkendt_af_formand: true,
          godkendt_tidspunkt: '17. marts · 14:22',
        },
        vejesedler: [
          {
            id: 'vsb-d22-2',
            vejeseddelNr: '25-1017-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 29.8,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 29.8, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'ST 66 319',
        chauffoer: 'Ole Brandt',
        tlf: '+4562839471',
        biltype: 'Sideudlægger',
        ankomst_plads_tid: '07:00',
        laes_nummer: 3,
        moedetid_fabrik: '06:24',
        sms_status: 'ikke_sendt',
        // akkord (Sideudlægger → 'akkord' pr. d2-2 kørselOrders)
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 45.2,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-d22-3',
            vejeseddelNr: '25-1018-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 45.2,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212344', ordre_label: '1212344 · Havnevej 12', tons: 45.2, is_anchor: true },
            ],
          },
        ],
      },
      // Materiel-bil (Blokvogn) — er_materiel_bil: true
      // TODO: Erstat med Supabase når klar
      {
        regnr: 'BL44219',
        chauffoer: 'Frank Olesen',
        tlf: '+4571829364',
        biltype: 'Blokvogn',
        er_materiel_bil: true,
        koert_materiel: ['HAMM HD10 VT (5-0034)'],
        afregning: {
          afregning_type: 'time',
          koretimer: 7.5,
          ventetid: 0,
          godkendt_af_formand: false,
        },
      },
    ],
  },
  'd2-3': {
    dayId: 'd2-3',
    bekraeftetTidspunkt: '17. marts · 16:05',
    biler: [
      {
        regnr: 'UV 12 537',
        chauffoer: 'Niels Dalgaard',
        tlf: '+4544617293',
        biltype: '6 Aks',
        ankomst_plads_tid: '06:30',
        laes_nummer: 1,
        moedetid_fabrik: '05:54',
        sms_status: 'ikke_sendt',
        // akkord (6 Aks → 'akkord' pr. d2-3 kørselOrders)
        afregning: {
          afregning_type: 'akkord',
          tons_koert: 33.6,
          ventetid: 0,
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-d23-1',
            vejeseddelNr: '25-1019-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 33.6,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 33.6, is_anchor: true },
            ],
          },
        ],
      },
      {
        regnr: 'XY 89 064',
        chauffoer: 'Claus Friis',
        tlf: '+4573948512',
        biltype: '7 Aks',
        ankomst_plads_tid: '06:50',
        laes_nummer: 2,
        moedetid_fabrik: '06:14',
        sms_status: 'ikke_sendt',
        // time (7 Aks → 'time' pr. d2-3 kørselOrders)
        afregning: {
          afregning_type: 'time',
          koretimer: 8.5,
          ventetid: 1.0,
          hviletid: 0.5,
          chauffoer_kommentar: 'Lang ventetid ved losseplads.',
          godkendt_af_formand: false,
        },
        vejesedler: [
          {
            id: 'vsb-d23-2',
            vejeseddelNr: '25-1020-A',
            product_code: 'SMA 11S',
            product_name: 'SMA 11S toplag',
            netto_tons: 38.4,
            tara_tons: 14.5,
            multilaes_flag: false,
            puljelaes_flag: false,
            aflæsset_efter_1_5t: false,
            pre_fordeling: [
              { ordre_id: 'ord-1212343', ordre_label: '1212343 · Søvej 6D', tons: 38.4, is_anchor: true },
            ],
          },
        ],
      },
    ],
  },
}

// ─── Forundersøgelse data ─────────────────────────────────────────────────────

export const EKSTRA_OPTIONS = [
  'Regulering af fast rendestensrist',
  'Regulering af fast stophane',
  'Regulering af fast Ø 300',
  'Regulering af fast Ø 600 dæksel',
  'Regulering af flydende rist',
  'Regulering af flydende stophane',
  'Regulering af flydende Ø 300 dæksel',
  'Regulering af flydende Ø 600 dæksel',
  'Udskiftning af dæksel excl. brøndgods',
  'Udskiftning af dæksel incl. brøndgods',
  'Udskiftning af rist excl. brøndgods',
  'Udskiftning af rist incl. brøndgods',
  'Ø 300 flydende rendestensrist',
  'Ø 300 overtopstykke (beton) 30 mm',
  'Ø 300 overtopstykke (beton) 50 mm',
  'Ø 300 overtopstykke (beton) 100 mm',
  'Ø 325 kombinringe (plast)',
  'Ø 475 mellemlægsskiver',
  'Ø 600 dæksel (40t)',
  'Ø 600 flydende karm (40t)',
  'Ø 600 kombinringe (plast)',
  'Ø 600 topringe (beton) h. 30 mm',
  'Ø 600 topringe (beton) h. 50 mm',
  'Ø 600 topringe (beton) h. 100 mm',
  'Ø 750 mellemlægsskiver',
]

export const UNDERLAG_OPTIONS: { value: UnderlagType; label: string }[] = [
  { value: 'asfalt',  label: 'Asfalt'  },
  { value: 'grus',    label: 'Grus'    },
  { value: 'beton',   label: 'Beton'   },
  { value: 'fraeset', label: 'Fræset'  },
  { value: 'andet',   label: 'Andet'   },
]

export const AARSAG_OPTIONS: { value: UnderlaegsAarsag; label: string }[] = [
  { value: 'revner',       label: 'Revner'      },
  { value: 'sporkoert',    label: 'Sporkørt'    },
  { value: 'krakeleret',   label: 'Krakeleret'  },
  { value: 'ujaevn',       label: 'Ujævn'       },
  { value: 'saetninger',   label: 'Sætninger'   },
  { value: 'snavs',        label: 'Snavs'       },
  { value: 'bloed',        label: 'Blød'        },
  { value: 'graes-ukrudt', label: 'Græs/ukrudt' },
]

// De tre anlæg fra holdpakken — data fra INITIAL_VOGNMAND_MATERIEL_BEKRAEFTELSE
// TODO: Erstat med Supabase når klar — anlæg kommer fra holdpakke knyttet til ordren
export const MATERIEL_ENHEDER: MaterielEnhed[] = [
  { anlaegsNr: '5-0034', beskrivelse: 'HAMM HD10 VT' },
  { anlaegsNr: '3-0112', beskrivelse: 'VÖGELE 1900-3I' },
  { anlaegsNr: '7-0078', beskrivelse: 'HAMM DV70VV' },
]
