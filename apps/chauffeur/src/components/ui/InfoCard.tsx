import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

export interface InfoCardProps {
  title: string;
  /** Brødtekst — kan være flere linjer */
  message: string;
  variant: 'danger' | 'info' | 'warning';
}

const variantMap = {
  danger:  { bg: theme.colors.badBg,   text: theme.colors.bad },
  info:    { bg: theme.colors.white,   text: theme.colors.textPrimary },
  warning: { bg: theme.colors.warnBg,  text: theme.colors.textPrimary },
};

export function InfoCard({ title, message, variant }: InfoCardProps) {
  const { bg, text } = variantMap[variant] ?? variantMap.info;

  return (
    <View
      style={[styles.container, { backgroundColor: bg }]}
      accessibilityRole={variant === 'danger' ? 'alert' : undefined}
    >
      <Text style={[styles.title, { color: text }]} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1}>{title}</Text>
      <Text style={[styles.message, { color: text }]} numberOfLines={5} ellipsizeMode="tail" maxFontSizeMultiplier={1}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.boxOutline,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
    height: theme.cardHeight.info,
    width: '100%',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.infoCard.titleFontSize,
    textAlign: 'center',
  },
  message: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.infoCard.messageFontSize,
    textAlign: 'left',
  },
});
