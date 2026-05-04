import type { Meta, StoryObj } from '@storybook/react-native';
import { LocationCard } from './LocationCard';

const meta: Meta<typeof LocationCard> = {
  title: 'UI/LocationCard',
  component: LocationCard,
};

export default meta;
type Story = StoryObj<typeof LocationCard>;

export const Afhentning: Story = {
  args: {
    type: 'pickup',
    name: 'Køge Asfaltfabrik',
    address: 'Nordhavnsvej 9, 4600 Køge',
    meetingTime: '05.30',
  },
};

export const Levering: Story = {
  args: {
    type: 'delivery',
    name: 'Uddannelsescenter Syd',
    address: 'Søvej 6 D, 4900 Nakskov',
  },
};

export const UdenMødetid: Story = {
  args: {
    type: 'pickup',
    name: 'Asfaltfabrikken Køge Nord',
    address: 'Industrivej 14, 4600 Køge',
  },
};

export const LangtAdressenavn: Story = {
  args: {
    type: 'delivery',
    name: 'Motorvej E47, Sydmotorvejen – Afkørsel Nykøbing',
    address: 'E47 afkørsel 28, 4800 Nykøbing F',
    meetingTime: '12.00',
  },
};
