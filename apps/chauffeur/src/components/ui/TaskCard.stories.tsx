import type { Meta, StoryObj } from '@storybook/react-native';
import { TaskCard } from './TaskCard';
import { mockTask, mockTask2 } from '@/mocks/tasks';

const meta: Meta<typeof TaskCard> = {
  title: 'UI/TaskCard',
  component: TaskCard,
  argTypes: {
    onPress: { action: 'pressed' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskCard>;

export const MedMødetid: Story = {
  args: {
    task: mockTask,
  },
};

export const UdenMødetid: Story = {
  args: {
    task: mockTask2,
  },
};

export const LangtNavn: Story = {
  args: {
    task: {
      ...mockTask,
      locations: [
        mockTask.locations[0],
        { ...mockTask.locations[1], name: 'Uddannelsescenter Sydsjælland og Lolland-Falster, Nakskov' },
      ],
    },
  },
};
