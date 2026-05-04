import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { OrderMetrics } from './OrderMetrics';
import { theme } from '../../config/theme';

const meta = {
  title: 'UI/OrderMetrics',
  component: OrderMetrics,
  argTypes: {
    ton: { control: { type: 'number' } },
    produkt: { control: { type: 'text' } },
    runder: { control: { type: 'number' } },
    timer: { control: { type: 'number' } },
  },
  decorators: [
    (Story) => (
      <View
        style={{
          flex: 1,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.softAqua,
          justifyContent: 'center',
        }}
      >
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof OrderMetrics>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Standard ordre fra Figma-designet */
export const Default: Story = {
  args: {
    ton: 75,
    produkt: '82101H',
    runder: 3,
    timer: 4,
  },
};

/** Lang produktkode — tjekker at teksten ikke løber ud */
export const LangProduktKode: Story = {
  args: {
    ton: 75,
    produkt: '82101H-SPECIAL-VARIANT',
    runder: 3,
    timer: 4,
  },
};

/** Store tal — stress test af layout */
export const StoreTal: Story = {
  args: {
    ton: 1250,
    produkt: '99999Z',
    runder: 48,
    timer: 12,
  },
};

/** Nul-værdier */
export const NulVaerdier: Story = {
  args: {
    ton: 0,
    produkt: '—',
    runder: 0,
    timer: 0,
  },
};
