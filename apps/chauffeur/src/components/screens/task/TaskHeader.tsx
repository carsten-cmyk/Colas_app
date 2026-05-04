import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../config/theme';

export interface TaskHeaderProps {
  orderNumber: string;
  onClose: () => void;
}

export function TaskHeader({ orderNumber, onClose }: TaskHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.orderNumber}>{orderNumber}</Text>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Luk opgave"
      >
        <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  orderNumber: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.xl,
    color: theme.colors.deepTeal,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
