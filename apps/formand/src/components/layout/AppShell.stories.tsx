import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { AppShell, type OrderMode } from './AppShell'

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

function Controlled(args: React.ComponentProps<typeof AppShell>) {
  const [mode, setMode] = useState<OrderMode>('planlægning')
  return (
    <AppShell {...args} activeMode={mode} onModeChange={setMode}>
      <div className="bg-surface border border-hairline rounded-xl p-md text-text-muted font-inter text-sm">
        Indhold for <strong className="text-text-primary">{mode}</strong>
      </div>
    </AppShell>
  )
}

export const Default: Story = {
  render: args => <Controlled {...args} />,
  args: {
    userInitials: 'OJ',
    userName: 'Ole J.',
    address: 'Søvej 6D\n4900 Nakskov',
    orderNumber: '1212343',
    activeMode: 'planlægning',
    onModeChange: () => {},
  },
}

export const Udfoersel: Story = {
  render: args => <Controlled {...args} />,
  args: {
    ...Default.args,
    activeMode: 'udførelse',
  },
}

export const MedRailFooter: Story = {
  render: args => (
    <Controlled
      {...args}
      railFooter={
        <div className="flex flex-col gap-xs">
          <div>
            <span className="font-inter text-xxs font-medium text-text-muted uppercase tracking-widest block mb-xxxs">Projektleder</span>
            <span className="font-inter text-sm font-semibold text-text-primary">Henrik Thor</span>
            <a href="tel:+4540506070" className="font-inter text-sm text-dark-teal block">40 50 60 70</a>
          </div>
        </div>
      }
    />
  ),
  args: { ...Default.args },
}
