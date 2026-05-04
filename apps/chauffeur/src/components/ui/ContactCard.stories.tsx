import type { Meta, StoryObj } from '@storybook/react-native';
import { ContactCard } from './ContactCard';

const meta: Meta<typeof ContactCard> = {
  title: 'UI/ContactCard',
  component: ContactCard,
  argTypes: {
    onPress: { action: 'pressed' },
  },
};

export default meta;
type Story = StoryObj<typeof ContactCard>;

export const MedBillede: Story = {
  args: {
    name: 'Henrik Thor',
    role: 'Projektleder',
    phone: '2399 1448',
    imageUrl: 'https://i.pravatar.cc/150?img=11',
  },
};

export const UdenBillede: Story = {
  args: {
    name: 'Ole Jensen',
    role: 'Formand',
    phone: '2399 1443',
  },
};

export const LangtNavn: Story = {
  args: {
    name: 'Christoffer Abrahamsen',
    role: 'Sikkerhedskoordinator',
    phone: '4012 5544',
  },
};

export const StrækketRolle: Story = {
  args: {
    name: 'Mads',
    role: '-',
    phone: '2012 3456',
  },
};
