import type { Meta, StoryObj } from '@storybook/react'
import { ProgressBar } from './ProgressBar'

const meta = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'surface' },
  },
  args: {
    variant: 'good',
    value: 65,
  },
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

// 1. Default — good 65 % med label og subtekst
export const Default: Story = {
  args: {
    value: 65,
    variant: 'good',
    label: '65 t af 100 t',
    subtekst: 'á 1.040 t total',
  },
}

// 2. Warn 85 %
export const Warn85: Story = {
  name: 'Warn — 85 %',
  args: {
    value: 85,
    variant: 'warn',
    label: '85 t af 100 t',
    subtekst: 'Nærmer sig mål',
  },
}

// 3. Bad 30 % — under target
export const Bad30: Story = {
  name: 'Bad — 30 % (under target)',
  args: {
    value: 30,
    variant: 'bad',
    label: '30 t af 100 t',
    subtekst: 'Markant under plan',
  },
}

// 4. Overskridelse — bad 112 %
export const Overskridelse: Story = {
  name: 'Overskridelse — bad 112 %',
  args: {
    value: 112,
    variant: 'bad',
    label: '112 t af 100 t',
    subtekst: '+12 t over mål',
  },
}

// 5. Tom — value = 0
export const Tom: Story = {
  name: 'Tom — value 0 %',
  args: {
    value: 0,
    variant: 'good',
    label: '0 t af 100 t',
    subtekst: 'Ikke startet',
  },
}

// 6. Kun bar — ingen label eller subtekst
export const KunBar: Story = {
  name: 'Kun bar — ingen label/subtekst',
  args: {
    value: 55,
    variant: 'good',
  },
}

// 7. Negativ value — clampes til 0 %
export const NegativClamped: Story = {
  name: 'Negativ value (clampes til 0 %)',
  args: {
    value: -20,
    variant: 'bad',
    label: 'Ugyldig negativ input',
  },
}

// 8. Good 100 % — helt fyldt
export const Good100: Story = {
  name: 'Good — 100 % (fyldt)',
  args: {
    value: 100,
    variant: 'good',
    label: '100 t af 100 t',
    subtekst: 'Mål nået',
  },
}

// 9. Warn med custom ariaLabel
export const WarnMedAriaLabel: Story = {
  name: 'Warn — med ariaLabel',
  args: {
    value: 75,
    variant: 'warn',
    label: '75 t af 100 t',
    ariaLabel: 'Fremgang: 75 ud af 100 tons — advarsel',
  },
}

// 10. Alle tre varianter side om side (sammenligning)
export const AlleVarianter: Story = {
  name: 'Alle varianter — sammenligning',
  render: () => (
    <div className="flex flex-col gap-sm w-[320px]">
      <ProgressBar value={70} variant="good" label="Good — 70 %" />
      <ProgressBar value={70} variant="warn" label="Warn — 70 %" />
      <ProgressBar value={70} variant="bad" label="Bad — 70 %" />
    </div>
  ),
}
