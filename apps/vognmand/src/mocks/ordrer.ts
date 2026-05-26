// TODO: Erstat med Supabase når klar
import type { Ordre, MaterielLinje } from '@/types/vognmand'

// TODO: Erstat med Supabase — materiel-linjer hentes fra PLAN per ordre
const MOCK_MATERIEL_O1: MaterielLinje[] = [
  { id: 'm1', anlaegsNr: '5-0034', beskrivelse: 'HAMM HD10 VT',      transportType: 'Blokvogn',  afhentning: 'Viby Depot, 4000 Roskilde',  aflæsning: 'Søvej 6D, 4900 Nakskov' },
  { id: 'm2', anlaegsNr: '3-0112', beskrivelse: 'VÖGELE 1900-3I',    transportType: 'Blokvogn',  afhentning: 'Viby Depot, 4000 Roskilde',  aflæsning: 'Søvej 6D, 4900 Nakskov' },
  { id: 'm3', anlaegsNr: '7-0078', beskrivelse: 'HAMM DV70VV',       transportType: 'Kran-bånd', afhentning: 'Glostrup Depot, 2600 Glostrup', aflæsning: 'Søvej 6D, 4900 Nakskov' },
]

export const MOCK_ORDRER: Ordre[] = [
  {
    id: 'o1',
    ordrenr: '1212343',
    titel: 'Uddannelsescenter Syd',
    adresse: 'Søndre Boulevard 44, 4900 Nakskov',
    lokation: 'Nakskov',
    fabrik: 'PROD A · KØGE PH',
    produktKode: 'AB 11t',
    mængdeTotal: 480,
    startDate: '2026-03-16',
    endDate: '2026-03-18',
    dage: [
      // Mandag 16/3 — ingen disponeret → rød
      { dato: '2026-03-16', bestilteBiler: 3, disponeredeBiler: 0, ændretAfFormand: false, mødetidFabrik: '06:30', tidFabrikTilPlads: 45, førsteLæsPåPlads: '07:15', intervalMinutter: 15 },
      // Tirsdag 17/3 — delvist disponeret → orange
      { dato: '2026-03-17', bestilteBiler: 3, disponeredeBiler: 1, ændretAfFormand: false, mødetidFabrik: '06:30', tidFabrikTilPlads: 45, kommentar: 'Smal adgangsvej', førsteLæsPåPlads: '07:15', intervalMinutter: 15 },
      // Onsdag 18/3 — fuldt disponeret → grøn
      { dato: '2026-03-18', bestilteBiler: 2, disponeredeBiler: 2, ændretAfFormand: false, mødetidFabrik: '07:00', tidFabrikTilPlads: 60, førsteLæsPåPlads: '07:15', intervalMinutter: 15 },
    ],
    materiel: MOCK_MATERIEL_O1,
    tidligereKørte: [
      {
        ordrenr: '1212343',
        fraDato: '2026-02-10',
        tilDato: '2026-02-12',
        biler: [
          { reg: 'XE32114', chauffør: 'Lars' },
          { reg: 'AB54231', chauffør: 'Brian' },
          { reg: 'CV98012', chauffør: 'Mads' },
        ],
      },
    ],
  },
  {
    id: 'o2',
    ordrenr: '1212401',
    titel: 'Vestre Ringvej',
    adresse: 'Vestre Ringvej 112, 4700 Næstved',
    lokation: 'Næstved',
    fabrik: 'PROD B · GLOSTRUP',
    produktKode: 'SMA 8t',
    mængdeTotal: 210,
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    // Fredag–søndag — spænder over weekenden
    tidsvindue: 'weekend',
    dage: [
      // Fredag 20/3 — ændret af formand → gul
      { dato: '2026-03-20', bestilteBiler: 2, disponeredeBiler: 2, ændretAfFormand: true, mødetidFabrik: '06:00', tidFabrikTilPlads: 30, førsteLæsPåPlads: '06:30', intervalMinutter: 20 },
    ],
  },
  {
    id: 'o3',
    ordrenr: '1212455',
    titel: 'Lufthavnsvej etape 2',
    adresse: 'Lufthavnsvej 1, 4000 Roskilde',
    lokation: 'Roskilde',
    fabrik: 'PROD A · KØGE PH',
    produktKode: 'AB 16t',
    mængdeTotal: 760,
    startDate: '2026-03-24',
    endDate: '2026-03-27',
    // Aftenhold — udføres uden for normal arbejdstid
    tidsvindue: 'aften',
    dage: [
      // Tirsdag–fredag 24–27/3 — alle ikke disponeret → rød
      { dato: '2026-03-24', bestilteBiler: 3, disponeredeBiler: 0, ændretAfFormand: false, mødetidFabrik: '06:30', tidFabrikTilPlads: 40, førsteLæsPåPlads: '17:00', intervalMinutter: 12 },
      { dato: '2026-03-25', bestilteBiler: 3, disponeredeBiler: 0, ændretAfFormand: false, mødetidFabrik: '06:30', tidFabrikTilPlads: 40, førsteLæsPåPlads: '17:00', intervalMinutter: 12 },
      { dato: '2026-03-26', bestilteBiler: 2, disponeredeBiler: 0, ændretAfFormand: false, mødetidFabrik: '07:00', tidFabrikTilPlads: 60, førsteLæsPåPlads: '17:00', intervalMinutter: 12 },
      { dato: '2026-03-27', bestilteBiler: 2, disponeredeBiler: 0, ændretAfFormand: false, mødetidFabrik: '07:00', tidFabrikTilPlads: 60, kommentar: 'Afvent signal fra formand', førsteLæsPåPlads: '17:00', intervalMinutter: 12 },
    ],
  },
  {
    id: 'o4',
    ordrenr: '1212512',
    titel: 'Motorring 3 – natasfalterin',
    adresse: 'Motorring 3, afkørsel 25, 2730 Herlev',
    lokation: 'Herlev',
    fabrik: 'PROD B · GLOSTRUP',
    produktKode: 'SMA 11t',
    mængdeTotal: 320,
    startDate: '2026-03-17',
    endDate: '2026-03-19',
    // Nathold — vejarbejde i nattetimerne
    tidsvindue: 'nat',
    dage: [
      // Tirsdag–torsdag 17–19/3
      { dato: '2026-03-17', bestilteBiler: 2, disponeredeBiler: 2, ændretAfFormand: false, mødetidFabrik: '22:00', tidFabrikTilPlads: 20 },
      { dato: '2026-03-18', bestilteBiler: 2, disponeredeBiler: 1, ændretAfFormand: false, mødetidFabrik: '22:00', tidFabrikTilPlads: 20 },
      { dato: '2026-03-19', bestilteBiler: 2, disponeredeBiler: 0, ændretAfFormand: false, mødetidFabrik: '22:00', tidFabrikTilPlads: 20 },
    ],
  },
]
