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

// Nav-slot stories — round 2 (TopBar NavSlot udvidelse)

export const MedNav: Story = {
  args: {
    onSettingsPress: () => alert('Indstillinger'),
    nav: {
      items: [
        { id: 'kalenderoversigt', label: 'Kalenderoversigt', to: '/kalenderoversigt' },
        { id: 'dagens-opgaver', label: 'Dagens opgaver', to: '/dagens-opgaver' },
      ],
      activeId: undefined,
      onNavigate: (item) => alert(`Navigerer til ${item.label}`),
    },
  },
}

export const MedNavKalenderAktiv: Story = {
  args: {
    onSettingsPress: () => {},
    nav: {
      items: [
        { id: 'kalenderoversigt', label: 'Kalenderoversigt', to: '/kalenderoversigt' },
        { id: 'dagens-opgaver', label: 'Dagens opgaver', to: '/dagens-opgaver' },
      ],
      activeId: 'kalenderoversigt',
      onNavigate: () => {},
    },
  },
}

export const MedNavDagensOpgaverAktiv: Story = {
  args: {
    onSettingsPress: () => {},
    nav: {
      items: [
        { id: 'kalenderoversigt', label: 'Kalenderoversigt', to: '/kalenderoversigt' },
        { id: 'dagens-opgaver', label: 'Dagens opgaver', to: '/dagens-opgaver' },
      ],
      activeId: 'dagens-opgaver',
      onNavigate: () => {},
    },
  },
}

export const MedNavTomItems: Story = {
  args: {
    onSettingsPress: () => {},
    nav: {
      items: [],
      onNavigate: () => {},
    },
  },
}
