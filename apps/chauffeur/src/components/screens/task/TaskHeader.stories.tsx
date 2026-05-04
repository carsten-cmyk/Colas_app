import type { Meta, StoryObj } from '@storybook/react-native';
import { TaskHeader } from './TaskHeader';

const meta: Meta<typeof TaskHeader> = {
  title: 'Screens/Task/TaskHeader',
  component: TaskHeader,
  argTypes: {
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskHeader>;

export const Default: Story = {
  args: {
    orderNumber: '1212343',
  },
};

export const KortNummer: Story = {
  args: {
    orderNumber: '42',
  },
};
