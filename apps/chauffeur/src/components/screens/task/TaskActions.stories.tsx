import type { Meta, StoryObj } from '@storybook/react-native';
import { TaskActions } from './TaskActions';

const meta: Meta<typeof TaskActions> = {
  title: 'Screens/Task/TaskActions',
  component: TaskActions,
  argTypes: {
    onStart: { action: 'start' },
    onPause: { action: 'pause' },
    onComplete: { action: 'complete' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskActions>;

export const Idle: Story = {
  args: { state: 'idle' },
};

export const Aktiv: Story = {
  args: { state: 'active' },
};

export const PåPause: Story = {
  args: { state: 'paused' },
};
