import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';
import { TaskSheet } from './TaskSheet';
import { OrderMetrics } from '../ui/OrderMetrics';
import { theme } from '../../config/theme';

const meta: Meta<typeof TaskSheet> = {
  title: 'Layout/TaskSheet',
  component: TaskSheet,
};

export default meta;

function SheetWrapper({ children }: { children: (props: { visible: boolean; onClose: () => void }) => React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  return (
    <View style={{ flex: 1 }}>
      {!visible && (
        <TouchableOpacity style={styles.reopenButton} onPress={() => setVisible(true)}>
          <Text style={styles.reopenLabel}>Åbn sheet</Text>
        </TouchableOpacity>
      )}
      {children({ visible, onClose: () => setVisible(false) })}
    </View>
  );
}

export const Default: StoryObj = {
  render: () => (
    <SheetWrapper>
      {({ visible, onClose }) => (
        <TaskSheet orderNumber="Ordrenummer 1212343" visible={visible} onClose={onClose}>
          <Text style={styles.placeholder}>Indhold vises her</Text>
        </TaskSheet>
      )}
    </SheetWrapper>
  ),
};

export const MedIndhold: StoryObj = {
  render: () => (
    <SheetWrapper>
      {({ visible, onClose }) => (
        <TaskSheet orderNumber="Ordrenummer 1212343" visible={visible} onClose={onClose}>
          <OrderMetrics ton={75} produkt="82101H" runder={3} timer={4} />
        </TaskSheet>
      )}
    </SheetWrapper>
  ),
};

export const Tom: StoryObj = {
  render: () => (
    <SheetWrapper>
      {({ visible, onClose }) => (
        <TaskSheet orderNumber="Ordrenummer 1212343" visible={visible} onClose={onClose}>
          {null}
        </TaskSheet>
      )}
    </SheetWrapper>
  ),
};

const styles = StyleSheet.create({
  placeholder: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  reopenButton: {
    margin: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.deepTeal,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  reopenLabel: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.white,
  },
});
