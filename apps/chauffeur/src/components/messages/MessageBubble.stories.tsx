import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';
import { MessageBubble } from './MessageBubble';
import { theme } from '@/config/theme';

const mockMessage = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'me',
  content: 'Hej Henrik, er du klar til i morgen tidligt?',
  timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min siden
  isRead: true,
};

const meta: Meta<typeof MessageBubble> = {
  title: 'Messages/MessageBubble',
  component: MessageBubble,
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: theme.colors.softAqua, padding: theme.spacing.sm }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

export const Sendt: Story = {
  args: {
    message: mockMessage,
    isSent: true,
  },
};

export const Modtaget: Story = {
  args: {
    message: { ...mockMessage, senderId: 'u2' },
    isSent: false,
  },
};

export const LangBesked: Story = {
  args: {
    message: {
      ...mockMessage,
      content: 'Husk at vi starter en time tidligere end normalt i morgen. Mødested er ved fabriksindgangen – ikke ved porten som sædvanligt.',
    },
    isSent: true,
  },
};

export const KortBesked: Story = {
  args: {
    message: { ...mockMessage, content: 'Ok 👍' },
    isSent: false,
  },
};
