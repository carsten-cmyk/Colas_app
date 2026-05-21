// Mock-vejesedler — kombineret view af plan_vejebilag + chauffør-GPS-status
// TODO: Erstat med PLAN-vejebilag når Supabase klar (10 min polling)
// Kilde: plan_vejebilag (PLAN) + status afledt fra task_timestamps (chauffør-app)
// Regnr matches mod MOCK_ORDERS + MOCK_DRIVER_TASKS for realisme
import type { Vejeseddel } from '@/types/order'

/**
 * Demo-data til Vejesedler-tabellen på ordrenummer '260423891'.
 * Fordelt på alle tre statusser:
 *   - 3 ankomne: 2 med temperatur registreret (1 OK, 1 Lav), 1 afventer registrering
 *   - 3 undervejs: ETA med neutral/warn/bad forsinkelse-status
 *   - 2 på vej til fabrik: disponeret, ikke afhentet endnu
 *
 * Forsinkelse-status (EtaBadge):
 *   neutral: etaMinutter=18, forventetEtaMinutter=18 (0% overskridelse)
 *   warn:    etaMinutter=24, forventetEtaMinutter=18 (~33% overskridelse)
 *   bad:     etaMinutter=35, forventetEtaMinutter=18 (~94% overskridelse)
 *
 * Sortering i tabellen håndteres af VejesedlerTable-komponenten:
 *   1. ankommet (DESC modtagetTidspunkt) → 2. undervejs (ASC etaMinutter) → 3. paa-vej-til-fabrik
 */
export const INITIAL_VEJESEDLER: Vejeseddel[] = [
  // ── Ankomne ────────────────────────────────────────────────────────────────

  {
    // Ankommet — temperatur registreret, OK (168°C > 140°C min)
    // MULTILÆS: bilen leverede ABB 11 til 3 ordrer — formand skal fordele tons
    id: 'v-001',
    ordrenummer: '260423891',
    status: 'ankommet',
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
    // Ankommet — temperatur registreret, Lav (148°C < 140°C er OK, men 148 > 140 — skift til 132 for Lav-badge)
    // Lav-scenarie: 132°C < 140°C min_temperatur → badge "Lav"
    // PULJELÆS: bilen leverede SMA 11S + GAB 1 til samme ordre — denne vejeseddel er ét af to produkter
    id: 'v-002',
    ordrenummer: '260423891',
    status: 'ankommet',
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
    // Ankommet — temperatur IKKE registreret endnu (afventer formand)
    id: 'v-003',
    ordrenummer: '260423891',
    status: 'ankommet',
    vejeseddelNr: '25-1005-C',
    regnr: 'XK 78 312',
    chauffoerNavn: 'Lars Holm',
    receptkode: '82101H',
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: 24.6,
    modtagetTidspunkt: '2026-05-14T13:12:00Z',
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: null,
    forventetEtaMinutter: null,
  },

  // ── Undervejs ──────────────────────────────────────────────────────────────

  {
    // Undervejs — ETA neutral: 18 min = forventet 18 min (0% overskridelse)
    id: 'v-004',
    ordrenummer: '260423891',
    status: 'undervejs',
    vejeseddelNr: null,
    regnr: 'PL 44 901',
    chauffoerNavn: 'Jesper Madsen',
    receptkode: null,
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: null,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: 18,
    forventetEtaMinutter: 18,
  },
  {
    // Undervejs — ETA warn: 24 min vs forventet 18 min (~33% overskridelse, 25-50% grænse)
    id: 'v-005',
    ordrenummer: '260423891',
    status: 'undervejs',
    vejeseddelNr: null,
    regnr: 'TH 33 567',
    chauffoerNavn: 'Brian Olsen',
    receptkode: null,
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: null,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: 24,
    forventetEtaMinutter: 18,
  },
  {
    // Undervejs — ETA bad: 35 min vs forventet 18 min (~94% overskridelse, over 50% grænse)
    id: 'v-008',
    ordrenummer: '260423891',
    status: 'undervejs',
    vejeseddelNr: null,
    regnr: 'GV 12 445',
    chauffoerNavn: 'Henrik Dahl',
    receptkode: null,
    fabrikId: 'fab-001',
    fabrikNavn: 'PROD A EAST KØGE PH',
    tons: null,
    modtagetTidspunkt: null,
    temperatur: null,
    valgtUdlaeggerMaterielNr: null,
    etaMinutter: 35,
    forventetEtaMinutter: 18,
  },

  // ── På vej til fabrik ──────────────────────────────────────────────────────

  {
    // På vej til fabrik — bil disponeret, ingen GPS-afgang registreret endnu
    id: 'v-006',
    ordrenummer: '260423891',
    status: 'paa-vej-til-fabrik',
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
    // På vej til fabrik — second truck disponeret
    id: 'v-007',
    ordrenummer: '260423891',
    status: 'paa-vej-til-fabrik',
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
]
