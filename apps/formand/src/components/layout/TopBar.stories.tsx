import type { Meta, StoryObj } from '@storybook/react'
import { TopBar } from './TopBar'

const meta = {
  title: 'Layout/TopBar',
  component: TopBar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'soft-aqua' },
  },
  args: {
    userInitials: 'OJ',
    userName: 'Ole J.',
  },
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSettingsPress: () => alert('Indstillinger'),
  },
}

export const UdenSettings: Story = {
  args: {
    onSettingsPress: undefined,
  },
}

export const LangtNavn: Story = {
  args: {
    userInitials: 'LH',
    userName: 'Lars-Henrik A.',
    onSettingsPress: () => {},
  },
}
