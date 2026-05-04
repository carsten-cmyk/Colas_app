import type { Meta, StoryObj } from '@storybook/react-native';
import { BottomTabBar } from './BottomTabBar';

const meta: Meta<typeof BottomTabBar> = {
  title: 'Layout/BottomTabBar',
  component: BottomTabBar,
  argTypes: {
    onTabPress: { action: 'tabPressed' },
  },
};

export default meta;
type Story = StoryObj<typeof BottomTabBar>;

export const StartAktiv: Story = {
  args: { activeTab: 'start' },
};

export const OpgaverAktiv: Story = {
  args: { activeTab: 'opgaver' },
};

export const BeskederAktiv: Story = {
  args: { activeTab: 'beskeder' },
};

export const TimeregAktiv: Story = {
  args: { activeTab: 'timereg' },
};

export const KontaktAktiv: Story = {
  args: { activeTab: 'kontakt' },
};
