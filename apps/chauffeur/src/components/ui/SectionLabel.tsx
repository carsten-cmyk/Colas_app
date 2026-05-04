import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

export interface SectionLabelProps {
  label: string;
}

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <Text style={styles.label} maxFontSizeMultiplier={1} accessibilityRole="header">
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.white,
    letterSpacing: theme.letterSpacing.label,
  },
});
