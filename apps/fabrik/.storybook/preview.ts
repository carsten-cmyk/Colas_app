import type { Preview } from '@storybook/react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white', value: '#FFFFFF' },
        { name: 'soft-aqua', value: '#F0F7FA' },
        { name: 'dark-teal', value: '#0E4764' },
      ],
    },
  },
}

export default preview
