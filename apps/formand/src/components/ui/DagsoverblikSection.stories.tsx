import type { Meta, StoryObj } from '@storybook/react'
import { DagsoverblikSection } from './DagsoverblikSection'

const meta = {
  title: 'UI/DagsoverblikSection',
  component: DagsoverblikSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Rad 1 under Udførelses-siden. Viser 4 × OrdreInfoCard med statisk dagsdata: areal, produkt, tykkelse og tons.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DagsoverblikSection>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 1. Default — standard dagsdata.
 */
export const Default: Story = {
  name: 'Default — standard dagsdata',
  args: {
    arealIDag: 1339,
    produkt: { navn: 'SMA 11S', kode: '82101H' },
    tykkelse: 45,
    tonsIDag: 251,
    ordreTotalArealM2: 31200,
    ordreTotalTons: 1040,
  },
}

/**
 * 2. Lang produktnavn — tester tekstombrydning.
 */
export const LangtProduktNavn: Story = {
  name: 'Langt produktnavn',
  args: {
    arealIDag: 5420,
    produkt: { navn: 'Genbrug Asfalt Beton 16 Special', kode: '99001X' },
    tykkelse: 80,
    tonsIDag: 312,
    ordreTotalArealM2: 12500,
    ordreTotalTons: 890,
  },
}

/**
 * 3. Store tal — ordretotaler i millioner-klassen.
 */
export const StoreTal: Story = {
  name: 'Store tal',
  args: {
    arealIDag: 8750,
    produkt: { navn: 'GAB I', kode: '23001B' },
    tykkelse: 120,
    tonsIDag: 980,
    ordreTotalArealM2: 250000,
    ordreTotalTons: 45000,
  },
}
