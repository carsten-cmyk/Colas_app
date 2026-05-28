// Mock-vejesedler — kombineret view af plan_vejebilag + chauffør-GPS-status
// TODO: Erstat med PLAN-vejebilag når Supabase klar (10 min polling)
// Kilde: plan_vejebilag (PLAN) + status afledt fra task_timestamps (chauffør-app)
// Regnr matches mod MOCK_ORDERS + MOCK_DRIVER_TASKS for realisme
import type { Vejeseddel } from '@/types/order'

/**
 * Demo-data til Vejesedler-tabellen på ordrenummer '260423891'.
 * Fordelt på alle fem statusser:
 *   - 2 udlagte: temp registreret (1 OK, 1 Lav)
 *   - 1 udlagt: temp endnu ikke registreret
 *   - 1 aflaesning: ankommet plads, læsser af
 *   - 2 undervejs: ETA med neutral/warn/bad forsinkelse-status
 *   - 1 paa_fabrik: indvejning/læsning i gang
 *   - 2 paa_vej_til_fabrik: disponeret, ikke afhentet endnu
 *
 * Forsinkelse-status (EtaBadge):
 *   neutral: etaMinutter=18, forventetEtaMinutter=18 (0% overskridelse)
 *   warn:    etaMinutter=24, forventetEtaMinutter=18 (~33% overskridelse)
 *   bad:     etaMinutter=35, forventetEtaMinutter=18 (~94% overskridelse)
 *
 * Sortering i tabellen håndteres af VejesedlerTable-komponenten:
 *   1. paa_fabrik → 2. aflaesning → 3. undervejs (ASC eta) → 4. paa_vej_til_fabrik → 5. udlagt (DESC modtagetTidspunkt)
 */
export const INITIAL_VEJESEDLER: Vejeseddel[] = [
  // ── Udlagte ────────────────────────────────────────────────────────────────

  {
    // Udlagt — temperatur registreret, OK (168°C > 140°C min)
    // MULTILÆS (datafelt bevares): bilen leverede ABB 11 til 3 ordrer — formand skal fordele tons. Ikke vist visuelt som "Multilæs" — indlejret i samleordre-kontekst.
    id: 'v-001',
    ordrenummer: '260423891',
    status: 'udlagt',
    vejeseddelNr: '25-1003-A',
    regnr: 'FH 51 069',
    chauffoerNavn: 'Morten Lund',
    receptkode: '82101H',
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: 24.2,
    modtagetTidspunkt: '2026-05-14T14:21:00Z',
    temperatur: 168,
    valgtUdlaeggerMaterielNr: '9-0009',
    etaMinutter: null,
    forventetEtaMinutter: null,
    multilaesFlag: true,
  },
  {
    // Udlagt — temperatur registreret, Lav (132°C < 140°C min_temperatur → badge "Lav")
    // PULJELÆS (visuelt: "Samles på en bil"): bilen leverede SMA 11S + GAB 1 til samme ordre
    id: 'v-002',
    ordrenummer: '260423891',
    status: 'udlagt',
    vejeseddelNr: '25-1004-B',
    regnr: 'BD 22 847',
    chauffoerNavn: 'Søren Kristensen',
    receptkode: '82101H',
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: 23.8,
    modtagetTidspunkt: '2026-05-14T13:47:00Z',
    temperatur: 132,
    valgtUdlaeggerMaterielNr: '9-0024',
    etaMinutter: null,
    forventetEtaMinutter: null,
    puljelaesFlag: true,
  },
  {
    // Sidste læs — forventet rest-mængde (12.4 t). Vejeseddel oprettes først efter udvejning på fabrik.
    // XK 78 312 kom med 12.4t (vs normale 24–25t) = restmængde da bestilt total næsten nåedes
    id: 'v-003',
    ordrenummer: '260423891',
    status: 'paa_vej_til_fabrik',
    vejeseddelNr: null,
    regnr: 'XK 78 312',
    chauffoerNavn: 'Lars Holm',
    receptkode: '82101H',
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: 12.4,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: null,
    forventetEtaMinutter: null,
    er_sidste_laes: true,
  },

  // ── Aflæsning ──────────────────────────────────────────────────────────────

  {
    // Aflæsning — ankommet plads, i gang med at læsse af (temp kan registreres nu)
    id: 'v-009',
    ordrenummer: '260423891',
    status: 'aflaesning',
    vejeseddelNr: '25-1009-F',
    regnr: 'PK 88 201',
    chauffoerNavn: 'Mikkel Hansen',
    receptkode: '82101H',
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: 25.0,
    modtagetTidspunkt: '2026-05-14T14:35:00Z',
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: null,
    forventetEtaMinutter: null,
  },

  // ── Undervejs ──────────────────────────────────────────────────────────────

  {
    // Undervejs — ETA neutral: 18 min = forventet 18 min (0% overskridelse)
    // Bil HAR afsluttet vejning på fabrik — vejeseddelNr + tons udfyldt
    id: 'v-004',
    ordrenummer: '260423891',
    status: 'undervejs',
    vejeseddelNr: '25-1010-A',
    regnr: 'PL 44 901',
    chauffoerNavn: 'Jesper Madsen',
    receptkode: '82101H',
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: 24.6,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: 18,
    forventetEtaMinutter: 18,
  },
  {
    // Undervejs — ETA warn: 24 min vs forventet 18 min (~33% overskridelse, 25-50% grænse)
    // Bil HAR afsluttet vejning på fabrik — vejeseddelNr + tons udfyldt
    id: 'v-005',
    ordrenummer: '260423891',
    status: 'undervejs',
    vejeseddelNr: '25-1011-A',
    regnr: 'TH 33 567',
    chauffoerNavn: 'Brian Olsen',
    receptkode: '82101H',
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: 24.8,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: 24,
    forventetEtaMinutter: 18,
  },
  {
    // Undervejs — ETA bad: 35 min vs forventet 18 min (~94% overskridelse, over 50% grænse)
    // Bil HAR afsluttet vejning på fabrik — vejeseddelNr + tons udfyldt
    id: 'v-008',
    ordrenummer: '260423891',
    status: 'undervejs',
    vejeseddelNr: '25-1012-A',
    regnr: 'GV 12 445',
    chauffoerNavn: 'Henrik Dahl',
    receptkode: '82101H',
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: 25.1,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: 35,
    forventetEtaMinutter: 18,
  },

  // ── På fabrik ──────────────────────────────────────────────────────────────

  {
    // På fabrik — ankommet fabrik, indvejning/læsning/udvejning i gang
    id: 'v-010',
    ordrenummer: '260423891',
    status: 'paa_fabrik',
    vejeseddelNr: null,
    regnr: 'RF 29 114',
    chauffoerNavn: 'Niels Christensen',
    receptkode: null,
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: null,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: null,
    forventetEtaMinutter: null,
  },

  // ── På vej til fabrik ──────────────────────────────────────────────────────

  {
    // Dag afsluttet — bil var disponeret men sidste-læs er taget af anden bil (v-003).
    // Markeret som overflødig → frigives via SL-flow (se FUNCTIONAL_FLOWS Flow 1, Variant Sidste læs).
    id: 'v-006',
    ordrenummer: '260423891',
    status: 'dag_afsluttet',
    vejeseddelNr: null,
    regnr: 'CK 19 882',
    chauffoerNavn: 'Kim Pedersen',
    receptkode: null,
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: null,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: null,
    forventetEtaMinutter: null,
  },
  {
    // Dag afsluttet — bil var disponeret men overflødiggjort efter sidste-læs-allokering.
    id: 'v-007',
    ordrenummer: '260423891',
    status: 'dag_afsluttet',
    vejeseddelNr: null,
    regnr: 'MN 55 230',
    chauffoerNavn: 'Torben Nielsen',
    receptkode: null,
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: null,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: null,
    forventetEtaMinutter: null,
  },

  // ── Dag afsluttet ──────────────────────────────────────────────────────────
  // Biler hvis planlagte næste-tur er overflødiggjort fordi sidste-læs er taget
  // af en anden bil (v-003). Disse biler skal ikke mere for dagen.
  // TODO: Erstat med Supabase når klar

  {
    id: 'v-020',
    ordrenummer: '260423891',
    status: 'dag_afsluttet',
    vejeseddelNr: null,
    regnr: 'BK 55 102',
    chauffoerNavn: 'Mads Sørensen',
    receptkode: null,
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: null,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: null,
    forventetEtaMinutter: null,
  },
]
