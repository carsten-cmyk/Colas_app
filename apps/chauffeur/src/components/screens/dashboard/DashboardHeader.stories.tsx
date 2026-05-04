import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';
import { DashboardHeader } from './DashboardHeader';
import { theme } from '../../../config/theme';

const meta: Meta<typeof DashboardHeader> = {
  title: 'Screens/Dashboard/DashboardHeader',
  component: DashboardHeader,
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: theme.colors.deepTeal, flex: 1 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardHeader>;

export const Default: Story = {};
