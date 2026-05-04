import type { Meta, StoryObj } from '@storybook/react-native';
import { ActionButton } from './ActionButton';

const meta: Meta<typeof ActionButton> = {
  title: 'UI/ActionButton',
  component: ActionButton,
  argTypes: {
    onPress: { action: 'pressed' },
  },
};

export default meta;
type Story = StoryObj<typeof ActionButton>;

export const Start: Story = {
  args: {
    variant: 'start',
    label: 'Start opgave',
  },
};

export const Pause: Story = {
  args: {
    variant: 'pause',
    label: 'Pause opgave',
  },
};

export const Stop: Story = {
  args: {
    variant: 'stop',
    label: 'Afslut opgave',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'start',
    label: 'Start opgave',
    disabled: true,
  },
};

export const LongLabel: Story = {
  args: {
    variant: 'start',
    label: 'Start opgave nu og registrer tid',
  },
};
