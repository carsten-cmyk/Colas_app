import type { Meta, StoryObj } from '@storybook/react'
import { FremdriftCard } from './FremdriftCard'

const meta = {
  title: 'UI/FremdriftCard',
  component: FremdriftCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Fremdriftskort til DagsoverblikSection — viser label, stor værdi, ProgressBar, undertekst og valgfri afvigelsestekst med symmetrisk fortegns-baseret farve. Bruges i tre varianter: Tons ankommet, Forventet udlagt og Faktisk udlagt.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['tons-ankommet', 'forventet-udlagt', 'faktisk-udlagt'],
    },
    label: { control: 'text' },
    value: { control: 'text' },
    unit: { control: 'text' },
    subtekst: { control: 'text' },
    progress: { control: { type: 'range', min: 0, max: 150 } },
    progressVariant: {
      control: 'select',
      options: ['good', 'warn', 'bad'],
    },
    afvigelse: { control: 'number' },
    ariaLabel: { control: 'text' },
  },
} satisfies Meta<typeof FremdriftCard>

export default meta
type Story = StoryObj<typeof meta>

/** 1. Tons ankommet — normal progression (33 %) */
export const TonsAnkommet: Story = {
  name: 'Tons ankommet — normal progression (33 %)',
  args: {
    variant: 'tons-ankommet',
    label: 'TONS ANKOMMET',
    value: '83',
    unit: 't',
    subtekst: 'á 251 t dagens plan',
    progress: 33,
    progressVariant: 'good',
  },
}

/** 2. Forventet udlagt — beregnet fra tons × kg/m² (48 %) */
export const ForventetUdlagt: Story = {
  name: 'Forventet udlagt — beregnet (48 %)',
  args: {
    variant: 'forventet-udlagt',
    label: 'FORVENTET UDLAGT',
    value: '680',
    unit: 'm²',
    subtekst: 'beregnet fra tons × kg/m²',
    progress: 48,
    progressVariant: 'good',
  },
}

/** 3. Faktisk udlagt — endnu ikke registreret (0 %, ingen afvigelse) */
export const FaktiskUdlagtIkkeRegistreret: Story = {
  name: 'Faktisk udlagt — endnu ikke registreret',
  args: {
    variant: 'faktisk-udlagt',
    label: 'FAKTISK UDLAGT',
    value: '–',
    unit: 'm²',
    subtekst: 'ikke registreret endnu',
    progress: 0,
    progressVariant: 'good',
  },
}

/** 4. Faktisk udlagt — afvigelse +12 m² (grøn) */
export const FaktiskUdlagtAfvigelsePositiv: Story = {
  name: 'Faktisk udlagt — afvigelse +12 m² (grøn)',
  args: {
    variant: 'faktisk-udlagt',
    label: 'FAKTISK UDLAGT',
    value: '1.432',
    unit: 'm²',
    subtekst: 'senest gemt 14:32',
    progress: 31,
    progressVariant: 'good',
    afvigelse: 12,
  },
}

/** 5. Faktisk udlagt — afvigelse −25 m² (rød) */
export const FaktiskUdlagtAfvigelseNegativ: Story = {
  name: 'Faktisk udlagt — afvigelse −25 m² (rød)',
  args: {
    variant: 'faktisk-udlagt',
    label: 'FAKTISK UDLAGT',
    value: '1.395',
    unit: 'm²',
    subtekst: 'senest gemt 14:32',
    progress: 31,
    progressVariant: 'bad',
    afvigelse: -25,
  },
}

/** 6. Faktisk udlagt — afvigelse 0 (skjult) */
export const FaktiskUdlagtAfvigelseNul: Story = {
  name: 'Faktisk udlagt — afvigelse 0 (skjult)',
  args: {
    variant: 'faktisk-udlagt',
    label: 'FAKTISK UDLAGT',
    value: '1.420',
    unit: 'm²',
    subtekst: 'senest gemt 14:32',
    progress: 65,
    progressVariant: 'good',
    afvigelse: 0,
  },
}

/** 7. Overskridelse — 112 % progress (warn) */
export const Overskridelse: Story = {
  name: 'Overskridelse — 112 % progress',
  args: {
    variant: 'faktisk-udlagt',
    label: 'FAKTISK UDLAGT',
    value: '3.500',
    unit: 'm²',
    subtekst: 'senest gemt 15:10',
    progress: 112,
    progressVariant: 'warn',
    afvigelse: 1000,
  },
}

/** Alle 3 kort side om side — matcher DagsoverblikSection Rad 2 */
export const AlleTreKort: Story = {
  name: 'Alle 3 kort — DagsoverblikSection layout',
  args: {
    variant: 'tons-ankommet',
    label: 'TONS ANKOMMET',
    value: '83',
    unit: 't',
    subtekst: 'á 251 t dagens plan',
    progress: 33,
    progressVariant: 'good',
  },
  render: () => (
    <div className="flex flex-wrap gap-xs">
      <FremdriftCard
        variant="tons-ankommet"
        label="TONS ANKOMMET"
        value="83"
        unit="t"
        subtekst="á 251 t dagens plan"
        progress={33}
        progressVariant="good"
      />
      <FremdriftCard
        variant="forventet-udlagt"
        label="FORVENTET UDLAGT"
        value="680"
        unit="m²"
        subtekst="beregnet fra tons × kg/m²"
        progress={48}
        progressVariant="good"
      />
      <FremdriftCard
        variant="faktisk-udlagt"
        label="FAKTISK UDLAGT"
        value="1.408"
        unit="m²"
        subtekst="senest gemt 14:32"
        progress={65}
        progressVariant="bad"
        afvigelse={-12}
      />
    </div>
  ),
}
