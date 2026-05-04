import type { Meta, StoryObj } from '@storybook/react-native';
import { InfoCard } from './InfoCard';

const meta: Meta<typeof InfoCard> = {
  title: 'UI/InfoCard',
  component: InfoCard,
};

export default meta;
type Story = StoryObj<typeof InfoCard>;

export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'Trafikadvarsel',
    message: 'Der er registreret en trafikulykke på ruten. Forvent forsinkelser og følg anvisninger fra vejmyndighed.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Bemærkning',
    message: 'Dagens læs er klar på fabrikken. Husk at tjekke ind ved ankomst og meld dig til vognmanden.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Opmærksomhed',
    message: 'Kørselsbemærkning: Særlig opmærksomhed ved vejarbejde på ruten. Kør forsigtigt og følg skilte.',
  },
};
