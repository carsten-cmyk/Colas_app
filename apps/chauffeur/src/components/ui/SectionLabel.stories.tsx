import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';
import { SectionLabel } from './SectionLabel';
import { theme } from '@/config/theme';

const meta: Meta<typeof SectionLabel> = {
  title: 'UI/SectionLabel',
  component: SectionLabel,
  // Hvid tekst — kræver mørk baggrund for at være synlig
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: theme.colors.darkTeal, padding: theme.spacing.sm }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SectionLabel>;

export const DagensOpgaver: Story = {
  args: { label: 'Dagens opgaver' },
};

export const Kontakter: Story = {
  args: { label: 'Kontakter' },
};

export const LangtLabel: Story = {
  args: { label: 'Advarsler og bemærkninger' },
};
