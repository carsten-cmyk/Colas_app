import type { Meta, StoryObj } from '@storybook/react'
import { OrdreInfoCard } from './OrdreInfoCard'

const meta = {
  title: 'UI/OrdreInfoCard',
  component: OrdreInfoCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Statisk info-kort til DagsoverblikSection — viser label, stor værdi, valgfri enhed og valgfri undertekst. Matcher dimensioner og stil for eksisterende status-bokse (Biler / Materiel / Forundersøgelse).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    unit: { control: 'text' },
    subtekst: { control: 'text' },
    ariaLabel: { control: 'text' },
  },
} satisfies Meta<typeof OrdreInfoCard>

export default meta
type Story = StoryObj<typeof meta>

/** Areal i dag — med enhed og undertekst */
export const ArealIDag: Story = {
  name: 'Areal i dag — med enhed og subtekst',
  args: {
    label: 'AREAL I DAG',
    value: '5.420',
    unit: 'm²',
    subtekst: 'á 31.200 m²',
  },
}

/** Produkt — uden enhed, med kode-subtekst */
export const Produkt: Story = {
  name: 'Produkt — uden enhed, med kode-subtekst',
  args: {
    label: 'PRODUKT',
    value: 'SMA 11S',
    subtekst: '82101H',
  },
}

/** Tykkelse — kun value + enhed, ingen subtekst */
export const Tykkelse: Story = {
  name: 'Tykkelse — kun value og enhed',
  args: {
    label: 'TYKKELSE',
    value: '45',
    unit: 'mm',
  },
}

/** Tons i dag — fuld variant */
export const TonsIDag: Story = {
  name: 'Tons i dag — fuld variant',
  args: {
    label: 'TONS I DAG',
    value: '312',
    unit: 't',
    subtekst: 'á 1.040 t',
  },
}

/** Tom — value som placeholder-streg */
export const Tom: Story = {
  name: 'Tom — value som "–" placeholder',
  args: {
    label: 'AREAL I DAG',
    value: '–',
  },
}

/** Alle 4 kort side om side — matcher DagsoverblikSection */
export const AlleKort: Story = {
  name: 'Alle 4 kort — DagsoverblikSection layout',
  args: {
    label: 'AREAL I DAG',
    value: '5.420',
  },
  render: () => (
    <div className="flex flex-wrap gap-xs">
      <OrdreInfoCard label="AREAL I DAG" value="5.420" unit="m²" subtekst="á 31.200 m²" />
      <OrdreInfoCard label="PRODUKT" value="SMA 11S" subtekst="82101H" />
      <OrdreInfoCard label="TYKKELSE" value="45" unit="mm" />
      <OrdreInfoCard label="TONS I DAG" value="312" unit="t" subtekst="á 1.040 t" />
    </div>
  ),
}

/** Lang tekst — edge case: lang value og undertekst */
export const LangTekst: Story = {
  name: 'Edge case — lang value og subtekst',
  args: {
    label: 'PRODUKT',
    value: 'AC 16 base (70/100-28)',
    subtekst: 'Stabilgrus med bitumenstabilisering',
  },
}

/** Eksplicit ariaLabel — override af beregnet label */
export const MedAriaLabel: Story = {
  name: 'Edge case — eksplicit ariaLabel',
  args: {
    label: 'TONS I DAG',
    value: '312',
    unit: 't',
    subtekst: 'á 1.040 t',
    ariaLabel: 'Tons i dag: 312 ton, planlagt á 1.040 ton',
  },
}
