import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { theme } from '@/config/theme';

export interface ProjectTagProps {
  orderNumber: string;
  name?: string;
  size?: 'sm' | 'md';
}

export function ProjectTag({ orderNumber, name, size = 'md' }: ProjectTagProps) {
  const label = name ? `#${orderNumber} · ${name}` : `#${orderNumber}`;
  return (
    <View style={[styles.container, size === 'sm' && styles.containerSm]}>
      <Text style={[styles.text, size === 'sm' && styles.textSm]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.softAqua,
    borderRadius: 6,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.lightAqua,
  },
  containerSm: {
    paddingHorizontal: theme.spacing.xxxs,
    paddingVertical: 2,
  },
  text: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.darkTeal,
  },
  textSm: {
    fontSize: 10,
  },
});
