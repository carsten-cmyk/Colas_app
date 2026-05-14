import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { TemperaturBadge } from './TemperaturBadge'

const meta = {
  title: 'UI/TemperaturBadge',
  component: TemperaturBadge,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'light' },
  },
  args: {
    minTemperatur: 160,
    onSave: (temp: number) => console.log('onSave:', temp),
  },
} satisfies Meta<typeof TemperaturBadge>

export default meta
type Story = StoryObj<typeof meta>

/** Tilstand A — temperaturen er endnu ikke registreret */
export const TomAfventerInput: Story = {
  args: {
    temperatur: null,
  },
}

/** Registreret og over minimumstemperaturen → grøn OK-pill */
export const RegistreretOK: Story = {
  args: {
    temperatur: 168,
    minTemperatur: 160,
  },
}

/** Under minimumstemperaturen → gul Lav-pill */
export const RegistreretLav: Story = {
  args: {
    temperatur: 150,
    minTemperatur: 160,
  },
}

/** Præcis på grænseværdien (160 === 160) → OK */
export const GraensevaerdiPrecisOK: Story = {
  name: 'Grænseværdi — præcis min (160 °C) → OK',
  args: {
    temperatur: 160,
    minTemperatur: 160,
  },
}

/** Et enkelt trin under grænsen (159 < 160) → Lav */
export const GraensevaerdiEtUnder: Story = {
  name: 'Grænseværdi — ét under min (159 °C) → Lav',
  args: {
    temperatur: 159,
    minTemperatur: 160,
  },
}

/** Disabled uden registreret temperatur → viser stille "–" */
export const DisabledIngenTemperatur: Story = {
  name: 'Disabled — ingen temperatur',
  args: {
    temperatur: null,
    disabled: true,
  },
}

/** Disabled med registreret OK-temperatur → ikke klikbar */
export const DisabledRegistreretOK: Story = {
  name: 'Disabled — registreret OK (ikke klikbar)',
  args: {
    temperatur: 165,
    disabled: true,
  },
}

/**
 * Interaktiv story der viser hele flow:
 * Tryk på registreret værdi → åbner input → gem ny temperatur
 */
export const RedigeringAfEksisterendeVaerdi: Story = {
  name: 'Redigering — klik på værdi åbner input',
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [temp, setTemp] = useState<number | null>(168)
    return (
      <TemperaturBadge
        {...args}
        temperatur={temp}
        onSave={(ny) => {
          console.log('Ny temperatur gemt:', ny)
          setTemp(ny)
        }}
      />
    )
  },
  args: {
    temperatur: 168,
    minTemperatur: 160,
  },
}
