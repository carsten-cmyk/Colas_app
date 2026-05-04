import React from 'react';
import { Pressable, StyleProp, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

export interface MessageWidgetProps {
  count: number;
  onPress: () => void;
  /** Valgfri style til at override container — bruges fx i ImageGrid til flex: 1 */
  style?: StyleProp<ViewStyle>;
}

const ICON_SIZE = 24;

export function MessageWidget({ count, onPress, style }: MessageWidgetProps) {
  const label = count === 1 ? '1 Besked' : `${count} Beskeder`;

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="mail-outline" size={ICON_SIZE} color={theme.colors.textPrimary} />
      <Text style={styles.label} maxFontSizeMultiplier={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 44,
    backgroundColor: theme.colors.warning,
    borderRadius: theme.borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxxs,
  },
  label: {
    fontFamily: theme.fonts.poppinsMedium,
    fontSize: theme.fontSizes.md,
    color: theme.colors.textPrimary,
  },
});
