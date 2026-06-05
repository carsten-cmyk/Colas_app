import type { Meta, StoryObj } from '@storybook/react'
import { VejesedlerTable } from './VejesedlerTable'
import { INITIAL_VEJESEDLER } from '../../mocks/vejesedler'
import { INITIAL_RECEPTER } from '../../mocks/recepter'
import { INITIAL_UDLAEGGERE } from '../../mocks/udlaeggere'
import type { Vejeseddel } from '../../types/order'

// TODO: Erstat med Supabase når klar — vejesedler fra PLAN + recept-opslag

const meta = {
  title: 'UI/VejesedlerTable',
  component: VejesedlerTable,
  parameters: {
    layout: 'padded',
  },
  args: {
    recepter: INITIAL_RECEPTER,
    minTemperatur: 140,
    udlaeggerliste: INITIAL_UDLAEGGERE,
    fabriksNavne: {
      'fab-001': 'PROD A EAST KØGE PH',
    },
    onTemperatur: (vejeseddelId, temp) =>
      console.log('onTemperatur', vejeseddelId, temp),
    onUdlaegger: (vejeseddelId, materielNr) =>
      console.log('onUdlaegger', vejeseddelId, materielNr),
  },
} satisfies Meta<typeof VejesedlerTable>

export default meta
type Story = StoryObj<typeof meta>

/** Standard: alle tre statusser blandet — sorteres internt af komponenten */
export const Default: Story = {
  args: {
    vejesedler: INITIAL_VEJESEDLER,
  },
}

/** Kun udlagte — 3 læs med forskellig temperaturstatus */
export const KunUdlagte: Story = {
  args: {
    vejesedler: INITIAL_VEJESEDLER.filter((v) => v.status === 'udlagt'),
  },
}

/** Empty state — ingen vejesedler endnu i dag */
export const EmptyState: Story = {
  args: {
    vejesedler: [],
  },
}

/** Lang tabel — 10+ rækker for at teste scrolling og visuel rytme */
export const LangTabel: Story = {
  args: {
    vejesedler: [
      ...INITIAL_VEJESEDLER,
      // Ekstra udlagte
      {
        id: 'v-013',
        ordrenummer: '260423891',
        status: 'udlagt',
        vejeseddelNr: '25-1006-D',
        regnr: 'DP 88 114',
        chauffoerNavn: 'Henrik Sørensen',
        receptkode: '82101H',
        fabrikId: 'fab-001',
        fabrikNavn: 'PROD A EAST KØGE PH',
        tons: 23.4,
        modtagetTidspunkt: '2026-05-14T12:55:00Z',
        temperatur: 155,
        valgtUdlaeggerMaterielNr: '9-0041',
        etaMinutter: null,
        forventetEtaMinutter: null,
      } satisfies Vejeseddel,
      {
        id: 'v-014',
        ordrenummer: '260423891',
        status: 'udlagt',
        vejeseddelNr: '25-1007-E',
        regnr: 'GS 22 776',
        chauffoerNavn: 'Jens Christensen',
        receptkode: '23001B',
        fabrikId: 'fab-001',
        fabrikNavn: 'PROD A EAST KØGE PH',
        tons: 25.1,
        modtagetTidspunkt: '2026-05-14T12:10:00Z',
        temperatur: 128,
        valgtUdlaeggerMaterielNr: '9-0009',
        etaMinutter: null,
        forventetEtaMinutter: null,
      } satisfies Vejeseddel,
      // Ekstra undervejs
      {
        id: 'v-011',
        ordrenummer: '260423891',
        status: 'undervejs',
        vejeseddelNr: null,
        regnr: 'KL 44 339',
        chauffoerNavn: 'Poul Andersen',
        receptkode: null,
        fabrikId: 'fab-001',
        fabrikNavn: 'PROD A EAST KØGE PH',
        tons: null,
        modtagetTidspunkt: null,
        temperatur: null,
        valgtUdlaeggerMaterielNr: null,
        etaMinutter: 8,
        forventetEtaMinutter: 10,
      } satisfies Vejeseddel,
      // Ekstra på vej til fabrik
      {
        id: 'v-012',
        ordrenummer: '260423891',
        status: 'paa_vej_til_fabrik',
        vejeseddelNr: null,
        regnr: 'NR 77 452',
        chauffoerNavn: 'Ole Jensen',
        receptkode: null,
        fabrikId: 'fab-001',
        fabrikNavn: 'PROD A EAST KØGE PH',
        tons: null,
        modtagetTidspunkt: null,
        temperatur: null,
        valgtUdlaeggerMaterielNr: null,
        etaMinutter: null,
        forventetEtaMinutter: null,
      } satisfies Vejeseddel,
    ],
  },
}

/** Udlagt uden temperatur — TemperaturBadge-input synligt og klar til registrering */
export const UdlagtUdenTemperatur: Story = {
  args: {
    vejesedler: INITIAL_VEJESEDLER.filter(
      (v) => v.status === 'udlagt' && v.temperatur === null,
    ),
  },
}

