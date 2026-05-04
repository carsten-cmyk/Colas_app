import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

export interface ActionButtonProps {
  label: string;
  variant: 'start' | 'pause' | 'stop';
  onPress: () => void;
  disabled?: boolean;
}

const variantConfig = {
  start: {
    backgroundColor: theme.colors.success,
    color: theme.colors.deepTeal,
  },
  pause: {
    backgroundColor: theme.colors.warning,
    color: theme.colors.deepTeal,
  },
  stop: {
    backgroundColor: theme.colors.error,
    color: theme.colors.white,
  },
} as const;

export function ActionButton({ label, variant, onPress, disabled = false }: ActionButtonProps) {
  const { backgroundColor, color } = variantConfig[variant];

  return (
    <Pressable
      style={[styles.button, { backgroundColor }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <Text style={[styles.label, { color }]} maxFontSizeMultiplier={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: theme.buttonHeight.action,
    borderRadius: theme.borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.fonts.poppinsMedium,
    fontSize: theme.fontSizes.md,
  },
  disabled: {
    opacity: 0.4,
  },
});
