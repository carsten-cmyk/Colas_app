import type { Meta, StoryObj } from '@storybook/react-native';
import { MessageWidget } from './MessageWidget';

const meta: Meta<typeof MessageWidget> = {
  title: 'UI/MessageWidget',
  component: MessageWidget,
  argTypes: {
    onPress: { action: 'pressed' },
  },
};

export default meta;
type Story = StoryObj<typeof MessageWidget>;

export const EnBesked: Story = {
  args: { count: 1 },
};

export const FlereBeskeder: Story = {
  args: { count: 5 },
};

export const IngenBeskeder: Story = {
  args: { count: 0 },
};
