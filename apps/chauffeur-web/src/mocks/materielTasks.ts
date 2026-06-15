// TODO: Erstat med Supabase/PLAN når klar — confirmed_transport grupperet pr. chauffør-tlf

import type { MaterielTask } from '../types/materielTask'

export const MATERIEL_TASKS: MaterielTask[] = [
  // Opgave A: 1 unit, 1 pickup MED mapsQuery, 1 dropoff
  {
    id: 'mat-001',
    orderNumber: '4502-2026-0041',
    kind: 'materiel',
    units: [
      { beskrivelse: 'HAMM HD10 VT', anlaegsnr: '5-0034' },
    ],
    pickups: [
      {
        sted: 'Slagelse Depot',
        adresse: 'Industrivej 12, 4200 Slagelse',
        tid: '06.30',
        mapsQuery: 'Industrivej 12, 4200 Slagelse',
      },
    ],
    dropoffs: [
      {
        id: 'drop-a-1',
        sted: 'Nakskov Omfartsvej — Etape 3',
        adresse: 'Søvej 6D, 4900 Nakskov',
        mapsQuery: 'Søvej 6D, 4900 Nakskov',
        leveret: false,
      },
    ],
    formandNote: 'Hent nøgle til depot hos vagt — ring 10 min. før ankomst.',
    formand: { name: 'Lars Bøgelund', phone: '40 22 85 61' },
    state: 'idle',
  },

  // Opgave B: 2 units, 2 pickups (én MED / én UDEN mapsQuery, bevidst lagt seneste-tid FØRST
  // så skærmens sortering kan verificeres visuelt), 2 dropoffs med leveret: false
  {
    id: 'mat-002',
    orderNumber: '4502-2026-0057',
    kind: 'materiel',
    units: [
      { beskrivelse: 'VÖGELE Super 1900-3i', anlaegsnr: '5-0071' },
      { beskrivelse: 'HAMM DV70VV', anlaegsnr: '5-0089' },
    ],
    pickups: [
      // Seneste tid lagt FØRST i arrayet — skærmen skal sortere så 07.00 vises øverst
      {
        sted: 'Ringsted Maskinpark',
        adresse: 'Korsørvej 48, 4100 Ringsted',
        tid: '08.15',
        // UDEN mapsQuery — formand har ikke pin → intet kort-link
      },
      {
        sted: 'Køge Depot',
        adresse: 'Lyngvej 3, 4600 Køge',
        tid: '07.00',
        mapsQuery: 'Lyngvej 3, 4600 Køge',
      },
    ],
    dropoffs: [
      {
        id: 'drop-b-1',
        sted: 'Vordingborg Sydhavn — Felt A',
        adresse: 'Sydmotorvejen 1, 4760 Vordingborg',
        mapsQuery: 'Sydmotorvejen 1, 4760 Vordingborg',
        leveret: false,
      },
      {
        id: 'drop-b-2',
        sted: 'Vordingborg Sydhavn — Felt B',
        adresse: 'Sydmotorvejen 1, 4760 Vordingborg',
        leveret: false,
      },
    ],
    formandNote: 'Udstyr SKAL læsses i nummerorden — VT før DV70. Kontakt formand ved tvivl.',
    formand: { name: 'Mikkel Tranberg', phone: '51 77 30 44' },
    state: 'idle',
  },
]
