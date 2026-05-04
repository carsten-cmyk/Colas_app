import type { Meta, StoryObj } from '@storybook/react'
import { BottomTabBar } from './BottomTabBar'

const meta = {
  title: 'Layout/BottomTabBar',
  component: BottomTabBar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark-teal' },
  },
  args: {
    activeTab: 'mine-opgaver',
    messageCount: 0,
    onTabPress: () => {},
  },
} satisfies Meta<typeof BottomTabBar>

export default meta
type Story = StoryObj<typeof meta>

export const MineOpgaverAktiv: Story = {}

export const DagensOpgaverAktiv: Story = {
  args: { activeTab: 'dagens-opgaver' },
}

export const BeskederAktivMedBadge: Story = {
  args: { activeTab: 'beskeder', messageCount: 3 },
}

export const BeskederBadgeInaktiv: Story = {
  args: { activeTab: 'mine-opgaver', messageCount: 2 },
}
