import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

export interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`${label}: ${String(value ?? '—')}`}
    >
      <Text style={styles.label} maxFontSizeMultiplier={1}>{label}</Text>
      <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail" maxFontSizeMultiplier={1}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.statCard.paddingHorizontal,
    paddingVertical: theme.statCard.paddingVertical,
  },
  label: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.statCard.labelFontSize,
    color: theme.colors.deepTeal,
    marginBottom: theme.spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: theme.letterSpacing.label,
    textAlign: 'center',
  },
  value: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.statCard.valueFontSize,
    lineHeight: theme.statCard.valueLineHeight,
    color: theme.colors.deepTeal,
    textAlign: 'center',
  },
});
