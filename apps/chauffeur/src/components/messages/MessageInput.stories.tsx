import type { Meta, StoryObj } from '@storybook/react-native';
import { MessageInput } from './MessageInput';

const meta: Meta<typeof MessageInput> = {
  title: 'Messages/MessageInput',
  component: MessageInput,
  argTypes: {
    onSend: { action: 'sent' },
  },
};

export default meta;
type Story = StoryObj<typeof MessageInput>;

export const Default: Story = {};
