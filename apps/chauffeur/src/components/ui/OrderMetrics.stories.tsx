import type { Meta, StoryObj } from '@storybook/react-native';
import { OrderMetrics } from './OrderMetrics';

const meta: Meta<typeof OrderMetrics> = {
  title: 'UI/OrderMetrics',
  component: OrderMetrics,
};

export default meta;
type Story = StoryObj<typeof OrderMetrics>;

export const Standard: Story = {
  args: {
    ton: 75,
    produkt: '82101H',
    runder: 3,
    timer: 4,
  },
};

export const StorOrdre: Story = {
  args: {
    ton: 240,
    produkt: '94202A',
    runder: 10,
    timer: 12,
  },
};

export const LangtProduktNavn: Story = {
  args: {
    ton: 45,
    produkt: 'Asfaltbeton AB 16t fin',
    runder: 2,
    timer: 3,
  },
};
