import type { Meta, StoryObj } from '@storybook/react'
import { FremdriftInputRow } from './FremdriftInputRow'

const meta = {
  title: 'UI/FremdriftInputRow',
  component: FremdriftInputRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Input-linje til DagsoverblikSection — formanden taster faktisk udlagt m² og tons, gemmer, og ser beregnet faktisk tykkelse sammenlignet med planlagt. Formel: tykkelse_mm = tons × 1_000_000 / (m² × densitet).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    densitet: { control: { type: 'number', min: 1000, max: 4000, step: 100 } },
    planTykkelse: { control: { type: 'number', min: 10, max: 200, step: 5 } },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof FremdriftInputRow>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Tom state — ingen initial-værdi.
 * Gem-knap er disabled. Tykkelse-linjen viser "–".
 */
export const Default: Story = {
  name: 'Default — tom',
  args: {
    densitet: 2400,
    planTykkelse: 45,
    onSave: (values) => console.log('Gemt:', values),
  },
}

/**
 * Med initial-værdi der matcher plan.
 * tons=152.1, m²=1408, densitet=2400 → ≈ 45.0 mm (±0%)
 */
export const MedInitialMatcher: Story = {
  name: 'Med initial — matcher plan (±0%)',
  args: {
    densitet: 2400,
    planTykkelse: 45,
    initial: { faktiskM2: 1408, faktiskTons: 152.1 },
    onSave: (values) => console.log('Gemt:', values),
  },
}

/**
 * Med initial-værdi OVER plan.
 * tons=160, m²=1408, densitet=2400 → ≈ 47.3 mm (+4.9%)
 */
export const MedInitialOverPlan: Story = {
  name: 'Med initial — over plan (+)',
  args: {
    densitet: 2400,
    planTykkelse: 45,
    initial: { faktiskM2: 1408, faktiskTons: 160 },
    onSave: (values) => console.log('Gemt:', values),
  },
}

/**
 * Med initial-værdi UNDER plan.
 * tons=120, m²=1408, densitet=2400 → ≈ 35.5 mm (−21.2%)
 */
export const MedInitialUnderPlan: Story = {
  name: 'Med initial — under plan (−)',
  args: {
    densitet: 2400,
    planTykkelse: 45,
    initial: { faktiskM2: 1408, faktiskTons: 120 },
    onSave: (values) => console.log('Gemt:', values),
  },
}

/**
 * Disabled state — dagen er afsluttet.
 * Inputs og knap er deaktiverede. Tykkelse-linjen vises stadig.
 */
export const Disabled: Story = {
  name: 'Disabled — dagen afsluttet',
  args: {
    densitet: 2400,
    planTykkelse: 45,
    initial: { faktiskM2: 1408, faktiskTons: 152.1 },
    disabled: true,
    onSave: (values) => console.log('Gemt:', values),
  },
}

/**
 * Kun m² indtastet — tons mangler.
 * Gem-knap forbliver disabled (begge felter kræves).
 */
export const KunM2Indtastet: Story = {
  name: 'Edge case — kun m² (Gem disabled)',
  args: {
    densitet: 2400,
    planTykkelse: 45,
    onSave: (values) => console.log('Gemt:', values),
  },
  render: (args) => {
    // Komponentens interne state demonstreres via initial med kun m²-side
    // Vi sætter initial til en ugyldig kombination for at vise disabled-knap:
    // initial er ikke sat, men brugeren har kun udfyldt m²
    return (
      <div className="max-w-xl">
        <FremdriftInputRow {...args} />
        <p className="font-inter text-xs text-text-muted mt-xs">
          Tast kun i m²-feltet — Gem forbliver disabled indtil begge er udfyldt.
        </p>
      </div>
    )
  },
}

/**
 * Grænseværdi — meget lav densitet.
 * tons=10, m²=100, densitet=1200 → 83.3 mm (plan 45 mm → +85.2%)
 */
export const GraensevaerdiLavDensitet: Story = {
  name: 'Edge case — lav densitet, stor afvigelse',
  args: {
    densitet: 1200,
    planTykkelse: 45,
    initial: { faktiskM2: 100, faktiskTons: 10 },
    onSave: (values) => console.log('Gemt:', values),
  },
}

/**
 * Tyk belægning — planTykkelse=80mm, SMA16.
 * tons=83, m²=443, densitet=2400 → ≈ 78.0 mm (plan 80 mm → −2.5%)
 */
export const TykBelaegning: Story = {
  name: 'Tyk belægning — SMA 16 (planTykkelse=80mm)',
  args: {
    densitet: 2400,
    planTykkelse: 80,
    initial: { faktiskM2: 443, faktiskTons: 83 },
    onSave: (values) => console.log('Gemt:', values),
  },
}
