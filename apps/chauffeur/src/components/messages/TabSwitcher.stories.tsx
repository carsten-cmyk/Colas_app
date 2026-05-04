import type { Meta, StoryObj } from '@storybook/react-native';
import { TabSwitcher } from './TabSwitcher';

const meta: Meta<typeof TabSwitcher> = {
  title: 'Messages/TabSwitcher',
  component: TabSwitcher,
  argTypes: {
    onTabPress: { action: 'tabPressed' },
  },
};

export default meta;
type Story = StoryObj<typeof TabSwitcher>;

export const IndbakkeAktiv: Story = {
  args: {
    activeTab: 'indbakke',
    unreadCount: 3,
  },
};

export const ArkivAktiv: Story = {
  args: {
    activeTab: 'arkiv',
    unreadCount: 3,
  },
};

export const IngenUlæste: Story = {
  args: {
    activeTab: 'indbakke',
    unreadCount: 0,
  },
};

export const MangeUlæste: Story = {
  args: {
    activeTab: 'indbakke',
    unreadCount: 12,
  },
};
