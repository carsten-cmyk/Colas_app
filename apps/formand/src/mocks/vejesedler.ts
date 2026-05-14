// Mock-vejesedler — kombineret view af plan_vejebilag + chauffør-GPS-status
// TODO: Erstat med PLAN-vejebilag når Supabase klar (10 min polling)
// Kilde: plan_vejebilag (PLAN) + status afledt fra task_timestamps (chauffør-app)
// Regnr matches mod MOCK_ORDERS + MOCK_DRIVER_TASKS for realisme
import type { Vejeseddel } from '@/types/order'

/**
 * Demo-data til Vejesedler-tabellen på ordrenummer '260423891'.
 * Fordelt på alle tre statusser:
 *   - 3 ankomne: 2 med temperatur registreret (1 OK, 1 Lav), 1 afventer registrering
 *   - 2 undervejs: ETA henholdsvis 18 og 34 minutter
 *   - 2 på vej til fabrik: disponeret, ikke afhentet endnu
 *
 * Sortering i tabellen håndteres af VejesedlerTable-komponenten:
 *   1. ankommet (DESC modtagetTidspunkt) → 2. undervejs (ASC etaMinutter) → 3. paa-vej-til-fabrik
 */
export const INITIAL_VEJESEDLER: Vejeseddel[] = [
  // ── Ankomne ────────────────────────────────────────────────────────────────

  {
    // Ankommet — temperatur registreret, OK (168°C > 140°C min)
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
  },
  {
    // Ankommet — temperatur registreret, Lav (148°C < 140°C er OK, men 148 > 140 — skift til 132 for Lav-badge)
    // Lav-scenarie: 132°C < 140°C min_temperatur → badge "Lav"
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
  },

  // ── Undervejs ──────────────────────────────────────────────────────────────

  {
    // Undervejs — ETA 18 minutter (bil kørt fra fabrik, vejebilag ikke modtaget endnu)
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
  },
  {
    // Undervejs — ETA 34 minutter
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
    etaMinutter: 34,
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
  },
]
