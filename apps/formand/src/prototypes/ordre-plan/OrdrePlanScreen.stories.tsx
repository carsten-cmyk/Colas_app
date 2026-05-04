import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { OrdrePlanScreen } from './OrdrePlanScreen'

const meta = {
  title: 'Prototypes/OrdrePlanScreen',
  component: OrdrePlanScreen,
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
} satisfies Meta<typeof OrdrePlanScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
