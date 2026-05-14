import type { Meta, StoryObj } from '@storybook/react'
import type { Decorator } from '@storybook/react'
import { VejeseddelRow } from './VejeseddelRow'
import type { Vejeseddel, Recept } from '../../types/order'
import type { UdlaeggerEnhed } from '../../types/udlaegger'

// ─── Table wrapper decorator ─────────────────────────────────────────────────
// VejeseddelRow renderer <tr> og skal placeres i <table><tbody> for korrekt HTML
const TableDecorator: Decorator = (Story) => (
  <table className="w-full border-collapse font-inter text-sm">
    <thead>
      <tr className="border-b border-hairline bg-surface-2">
        <th className="px-sm py-xs text-left font-inter text-xs font-semibold text-text-muted uppercase tracking-widest">Vejeseddel</th>
        <th className="px-sm py-xs text-left font-inter text-xs font-semibold text-text-muted uppercase tracking-widest">Nummerplade</th>
        <th className="px-sm py-xs text-left font-inter text-xs font-semibold text-text-muted uppercase tracking-widest">Chauffør</th>
        <th className="px-sm py-xs text-left font-inter text-xs font-semibold text-text-muted uppercase tracking-widest">Produkt</th>
        <th className="px-sm py-xs text-left font-inter text-xs font-semibold text-text-muted uppercase tracking-widest">Fabrik</th>
        <th className="px-sm py-xs text-left font-inter text-xs font-semibold text-text-muted uppercase tracking-widest">Tons</th>
        <th className="px-sm py-xs text-left font-inter text-xs font-semibold text-text-muted uppercase tracking-widest">Udlægger</th>
        <th className="px-sm py-xs text-left font-inter text-xs font-semibold text-text-muted uppercase tracking-widest">Status/Temp</th>
      </tr>
    </thead>
    <tbody>
      <Story />
    </tbody>
  </table>
)

// ─── Mock-data ────────────────────────────────────────────────────────────────
// TODO: Erstat med Supabase når klar

const MOCK_RECEPT: Recept = {
  kode: '82101H',
  navn: 'SMA 11S',
  kg_per_m2: 110,
  densitet: 2400,
  min_temperatur: 155,
}

const MOCK_UDLAEGGERE: UdlaeggerEnhed[] = [
  { anlaegsNr: '9-0009', beskrivelse: 'VÖGELE 1900' },
  { anlaegsNr: '9-0024', beskrivelse: 'DYNAPAC SD2500' },
  { anlaegsNr: '9-0041', beskrivelse: 'VÖGELE 2100-3I' },
]

const BASE_VEJESEDDEL: Vejeseddel = {
  id: 'v-1',
  ordrenummer: 'ORD-2026-001',
  status: 'ankommet',
  vejeseddelNr: '25-1003-A',
  regnr: 'AB 12 345',
  chauffoerNavn: 'Morten Lund',
  receptkode: '82101H',
  fabrikId: 'fab-001',
  fabrikNavn: 'Aarhus Asfalt',
  tons: 24.2,
  modtagetTidspunkt: '2026-05-14T14:21:00Z',
  temperatur: 168,
  valgtUdlaeggerMaterielNr: '9-0009',
  etaMinutter: null,
}

const noop = () => {}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'UI/VejeseddelRow',
  component: VejeseddelRow,
  decorators: [TableDecorator],
  parameters: {
    layout: 'padded',
  },
  args: {
    recept: MOCK_RECEPT,
    minTemperatur: 155,
    udlaeggerliste: MOCK_UDLAEGGERE,
    onTemperatur: noop,
    onUdlaegger: noop,
  },
} satisfies Meta<typeof VejeseddelRow>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Ankommet med temperatur registreret — grøn OK-status.
 * Udlægger-dropdown er aktiv og viser valgt enhed.
 */
export const AnkommetMedTemperatur: Story = {
  name: 'Ankommet — fuldt registreret',
  args: {
    vejeseddel: {
      ...BASE_VEJESEDDEL,
      temperatur: 168,
      valgtUdlaeggerMaterielNr: '9-0009',
    },
  },
}

/**
 * Ankommet men temperatur er ikke registreret endnu.
 * Viser inputfelt i Status/Temp-kolonnen.
 * Udlægger-dropdown er aktiv.
 */
export const AnkommetUdenTemperatur: Story = {
  name: 'Ankommet — temperatur mangler',
  args: {
    vejeseddel: {
      ...BASE_VEJESEDDEL,
      temperatur: null,
      valgtUdlaeggerMaterielNr: null,
    },
  },
}

/**
 * Ankommet med temperatur under minimumgrænse — viser "Lav"-badge.
 */
export const AnkommetTemperaturForLav: Story = {
  name: 'Ankommet — temperatur for lav',
  args: {
    vejeseddel: {
      ...BASE_VEJESEDDEL,
      temperatur: 140,
      valgtUdlaeggerMaterielNr: '9-0009',
    },
  },
}

/**
 * Bil på vej fra fabrik mod udførselssted.
 * Vejeseddelnr, Produkt og Tons vises som "–".
 * Status/Temp viser ETA-badge. Udlægger-dropdown disabled.
 */
export const UndervejesMedEta: Story = {
  name: 'Undervejs — ETA 12 min',
  args: {
    vejeseddel: {
      ...BASE_VEJESEDDEL,
      id: 'v-2',
      status: 'undervejs',
      vejeseddelNr: null,
      receptkode: null,
      tons: null,
      temperatur: null,
      valgtUdlaeggerMaterielNr: null,
      etaMinutter: 12,
    },
  },
}

/**
 * Bil disponeret men endnu ikke afhentet last.
 * Status/Temp viser "På vej til fabrik"-badge. Udlægger-dropdown disabled.
 */
export const PaaVejTilFabrik: Story = {
  name: 'På vej til fabrik',
  args: {
    vejeseddel: {
      ...BASE_VEJESEDDEL,
      id: 'v-3',
      status: 'paa-vej-til-fabrik',
      vejeseddelNr: null,
      receptkode: null,
      tons: null,
      temperatur: null,
      valgtUdlaeggerMaterielNr: null,
      etaMinutter: null,
    },
  },
}

/**
 * Ankommet men recept ikke fundet i systemet.
 * Produkt-kolonnen viser receptkode direkte i muted-farve som fallback.
 */
export const ManglendereceptOpslag: Story = {
  name: 'Manglende recept-opslag',
  args: {
    vejeseddel: {
      ...BASE_VEJESEDDEL,
      receptkode: '82101H',
    },
    recept: undefined,
  },
}
