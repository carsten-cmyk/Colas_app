import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { GanttScreen } from './GanttScreen'

const meta = {
  title: 'Prototypes/GanttScreen',
  component: GanttScreen,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof GanttScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
