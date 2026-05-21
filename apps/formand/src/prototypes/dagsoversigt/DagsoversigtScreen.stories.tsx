/**
 * PROTOTYPE — Minimal Storybook story for DagsoversigtScreen
 * Må ikke importeres i produktionskode.
 */
import type { Meta, StoryObj } from '@storybook/react'
import { BrowserRouter } from 'react-router-dom'
import { DagsoversigtScreen } from './DagsoversigtScreen'

const meta = {
  title: 'Prototypes/DagsoversigtScreen',
  component: DagsoversigtScreen,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof DagsoversigtScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
