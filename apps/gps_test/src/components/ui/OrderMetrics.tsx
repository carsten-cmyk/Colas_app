import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatCard } from './StatCard';
import { theme } from '../../config/theme';

export interface OrderMetricsProps {
  /** Antal ton */
  ton: number;
  /** Produktkode — fx "82101H" */
  produkt: string;
  /** Antal runder */
  runder: number;
  /** Antal timer */
  timer: number;
}

export const OrderMetrics: React.FC<OrderMetricsProps> = ({
  ton,
  produkt,
  runder,
  timer,
}) => {
  return (
    <View style={styles.card}>
      {/* Øverste række */}
      <View style={styles.row}>
        <StatCard label="Ton" value={ton} />
        <View style={styles.dividerVertical} />
        <StatCard label="Produkt" value={produkt} />
      </View>

      {/* Vandret skillelinje */}
      <View style={styles.dividerHorizontal} />

      {/* Nederste række */}
      <View style={styles.row}>
        <StatCard label="Runder" value={runder} />
        <View style={styles.dividerVertical} />
        <StatCard label="Timer" value={timer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: theme.colors.boxOutline,
    marginVertical: theme.spacing.xs,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: theme.colors.boxOutline,
    marginHorizontal: theme.spacing.sm,
  },
});
