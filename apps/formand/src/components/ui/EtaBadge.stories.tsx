import type { Meta, StoryObj } from '@storybook/react'
import { EtaBadge } from './EtaBadge'

const meta = {
  title: 'UI/EtaBadge',
  component: EtaBadge,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'white' },
  },
} satisfies Meta<typeof EtaBadge>

export default meta
type Story = StoryObj<typeof meta>

/** ETA med kort ventetid */
export const EtaKortTid: Story = {
  args: {
    variant: 'eta',
    etaMinutter: 4,
  },
}

/** ETA med lang ventetid */
export const EtaLangTid: Story = {
  args: {
    variant: 'eta',
    etaMinutter: 47,
  },
}

/** ETA med 0 minutter — vises som "ETA 0 min" for konsistens (v1) */
export const EtaNulMinutter: Story = {
  args: {
    variant: 'eta',
    etaMinutter: 0,
  },
}

/** ETA uden minutter — fallback til "ETA –" */
export const EtaUdenMinutter: Story = {
  args: {
    variant: 'eta',
    etaMinutter: undefined,
  },
}

/** Bil disponeret men endnu ikke afhentet last */
export const PaaVejTilFabrik: Story = {
  args: {
    variant: 'paa-vej-til-fabrik',
  },
}

/** etaMinutter ignoreres ved paa-vej-til-fabrik-varianten */
export const PaaVejTilFabrikMedIgnoreretMinutter: Story = {
  args: {
    variant: 'paa-vej-til-fabrik',
    etaMinutter: 99,
  },
}

/** ETA neutral — indenfor 25% af forventet (18 min vs forventet 18 min) */
export const EtaNeutralMedForventet: Story = {
  args: {
    variant: 'eta',
    etaMinutter: 18,
    forventetEtaMinutter: 18,
  },
}

/** ETA warn — 25-50% over forventet (25 min vs forventet 20 min = 25% overskridelse) */
export const EtaForsinketWarn: Story = {
  args: {
    variant: 'eta',
    etaMinutter: 25,
    forventetEtaMinutter: 20,
  },
}

/** ETA bad — over 50% over forventet (35 min vs forventet 20 min = 75% overskridelse) */
export const EtaForsinketBad: Story = {
  args: {
    variant: 'eta',
    etaMinutter: 35,
    forventetEtaMinutter: 20,
  },
}
