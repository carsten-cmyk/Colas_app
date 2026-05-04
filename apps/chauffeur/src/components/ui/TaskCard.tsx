import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { theme } from '../../config/theme';
import { Task } from '@/types/task';

export interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

export function TaskCard({ task, onPress }: TaskCardProps) {
  const delivery = task.locations[1];
  const pickup = task.locations[0];

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      accessibilityRole="button"
      accessibilityLabel={`Opgave: ${delivery?.name ?? task.orderNumber}`}
    >
      <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail" maxFontSizeMultiplier={1}>
        {delivery?.name ?? '—'}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaBold} maxFontSizeMultiplier={1}>{task.ton} Tons</Text>

        {pickup?.meetingTime && (
          <View>
            <Text style={styles.metaLabel} maxFontSizeMultiplier={1}>Start</Text>
            <Text style={styles.metaBold} maxFontSizeMultiplier={1}>{pickup.meetingTime}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 44,
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.lg,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxxs,
    gap: theme.spacing.sm,
  },
  name: {
    fontFamily: theme.fonts.poppinsMedium,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.textPrimary,
  },
  meta: {
    gap: theme.spacing.sm,
  },
  metaLabel: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  metaBold: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
  },
});
