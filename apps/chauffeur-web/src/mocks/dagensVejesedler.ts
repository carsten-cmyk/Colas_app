// TODO: Erstat med Supabase når klar
import type { Vejeseddel } from '@/types/task'

/** Dagens vejesedler — delt mock brugt af DagensVejesedlerScreen og TimeRegistrationScreen. Netto-sum = 73 tons. */
export const DAGENS_VEJESEDLER: Vejeseddel[] = [
  { vejeseddelNr: '240801', tidspunkt: '07.42', produkt: 'GAB 0/16', tara: 14.2, tons: 15.8 },
  { vejeseddelNr: '240802', tidspunkt: '09.15', produkt: 'GAB 0/16', tara: 14.4, tons: 16.2 },
  { vejeseddelNr: '240803', tidspunkt: '11.03', produkt: 'AB 0/8',   tara: 15.1, tons: 13.7 },
  { vejeseddelNr: '240804', tidspunkt: '13.28', produkt: 'AB 0/8',   tara: 14.9, tons: 14.3 },
  { vejeseddelNr: '240805', tidspunkt: '15.47', produkt: 'GAB 0/16', tara: 14.6, tons: 13.0 },
]
