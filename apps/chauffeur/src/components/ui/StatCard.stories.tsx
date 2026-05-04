import type { Meta, StoryObj } from '@storybook/react-native';
import { StatCard } from './StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'UI/StatCard',
  component: StatCard,
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const TalVærdi: Story = {
  args: { label: 'Ton', value: 75 },
};

export const TekstVærdi: Story = {
  args: { label: 'Produkt', value: '82101H' },
};

export const LangTekst: Story = {
  args: { label: 'Produkt', value: 'Asfaltbeton AB 16t' },
};

export const NulVærdi: Story = {
  args: { label: 'Runder', value: 0 },
};
