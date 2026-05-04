import type { Meta, StoryObj } from '@storybook/react-native';
import { MessageCard } from './MessageCard';
import { mockConversations } from '@/mocks/messages';

const meta: Meta<typeof MessageCard> = {
  title: 'Messages/MessageCard',
  component: MessageCard,
  argTypes: {
    onPress: { action: 'pressed' },
  },
};

export default meta;
type Story = StoryObj<typeof MessageCard>;

export const Ulæst: Story = {
  args: {
    conversation: mockConversations[0],
  },
};

export const Læst: Story = {
  args: {
    conversation: mockConversations[1],
  },
};

export const MedProjekt: Story = {
  args: {
    conversation: mockConversations[2],
  },
};

export const SentAfMig: Story = {
  args: {
    conversation: mockConversations[3],
  },
};
