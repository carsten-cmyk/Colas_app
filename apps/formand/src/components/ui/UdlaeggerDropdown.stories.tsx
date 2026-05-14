import type { Meta, StoryObj } from '@storybook/react'
import { UdlaeggerDropdown } from './UdlaeggerDropdown'
import { INITIAL_UDLAEGGERE } from '../../mocks/udlaeggere'

// TODO: Erstat med Supabase når klar — comes from orders.materiel[]

const MOCK_MED_IKKE_UDLAEGGER = [
  ...INITIAL_UDLAEGGERE,
  { anlaegsNr: '7-0044', beskrivelse: 'HAMM HD10 VT' },
  { anlaegsNr: '5-0021', beskrivelse: 'HAMM H13i' },
]

const MOCK_LANG_LISTE = [
  { anlaegsNr: '9-0009', beskrivelse: 'VÖGELE 1900' },
  { anlaegsNr: '9-0024', beskrivelse: 'DYNAPAC SD2500' },
  { anlaegsNr: '9-0041', beskrivelse: 'VÖGELE 2100-3I' },
  { anlaegsNr: '9-0055', beskrivelse: 'VÖGELE Super 1800-3i' },
  { anlaegsNr: '9-0063', beskrivelse: 'DYNAPAC F1000CS' },
  { anlaegsNr: '9-0077', beskrivelse: 'VÖGELE Super 700-3i' },
]

const meta = {
  title: 'UI/UdlaeggerDropdown',
  component: UdlaeggerDropdown,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'light' },
  },
  args: {
    materielListe: INITIAL_UDLAEGGERE,
    selected: null,
    onChange: (materielnr: string) => console.log('Valgt:', materielnr),
  },
} satisfies Meta<typeof UdlaeggerDropdown>

export default meta
type Story = StoryObj<typeof meta>

/** Dropdown klar til valg — ingen valgt endnu */
export const TomAfventerValg: Story = {
  name: 'Tom — afventer valg',
  args: {
    selected: null,
  },
}

/** Udlægger 9-0009 er valgt */
export const Valgt: Story = {
  name: 'Valgt — 9-0009',
  args: {
    selected: '9-0009',
  },
}

/** Dropdown disabled — rækkens læs er endnu ikke ankommet */
export const Disabled: Story = {
  name: 'Disabled — ankommet endnu ikke',
  args: {
    selected: null,
    disabled: true,
  },
}

/** Materiel-listen indeholder ingen udlæggere (ingen "9-"-prefix) */
export const TomListe: Story = {
  name: 'Tom liste — ingen udlæggere på ordren',
  args: {
    materielListe: [
      { anlaegsNr: '7-0044', beskrivelse: 'HAMM HD10 VT' },
      { anlaegsNr: '5-0021', beskrivelse: 'HAMM H13i' },
    ],
    selected: null,
  },
}

/** Liste med 6 udlæggere — plus ikke-udlæggere der filtreres væk */
export const LangListe: Story = {
  name: 'Lang liste — 6 udlæggere',
  args: {
    materielListe: [...MOCK_LANG_LISTE, ...MOCK_MED_IKKE_UDLAEGGER.filter((m) => !m.anlaegsNr.startsWith('9-'))],
    selected: '9-0055',
  },
}

/** Valgfri placeholder-tekst overskriver default */
export const CustomPlaceholder: Story = {
  name: 'Custom placeholder',
  args: {
    selected: null,
    placeholder: 'Tildel udlægger…',
  },
}
