import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatCard } from './StatCard';
import { theme } from '../../config/theme';

export interface OrderMetricsProps {
  ton: number;
  produkt: string;
  runder: number;
  timer: number;
}

export function OrderMetrics({ ton, produkt, runder, timer }: OrderMetricsProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <StatCard label="Ton" value={ton} />
        <View style={styles.dividerVertical} />
        <StatCard label="Produkt" value={produkt} />
      </View>
      <View style={styles.dividerHorizontal} />
      <View style={styles.row}>
        <StatCard label="Runder" value={runder} />
        <View style={styles.dividerVertical} />
        <StatCard label="Timer" value={timer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: theme.spacing.xs,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: theme.colors.dividerStrong,
    marginVertical: theme.orderMetrics.dividerMarginVertical,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: theme.colors.dividerStrong,
    marginHorizontal: theme.spacing.sm,
  },
});
