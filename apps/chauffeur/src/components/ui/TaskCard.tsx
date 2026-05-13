import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { theme } from '../../config/theme';
import { Task } from '@/types/task';

export interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

const stateBadge: Record<string, { label: string; bg: string; text: string } | null> = {
  active:    { label: 'Aktiv',  bg: theme.colors.goodBg,  text: theme.colors.good },
  paused:    { label: 'Pause',  bg: theme.colors.warnBg,  text: theme.colors.textPrimary },
  idle:      null,
  completed: null,
};

export function TaskCard({ task, onPress }: TaskCardProps) {
  const delivery = task.locations[1];
  const pickup = task.locations[0];
  const badge = stateBadge[task.state] ?? null;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      accessibilityRole="button"
      accessibilityLabel={`Opgave: ${delivery?.name ?? task.orderNumber}`}
    >
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]} maxFontSizeMultiplier={1}>
            {badge.label}
          </Text>
        </View>
      )}

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
    fontSize: theme.fontSizes.md,
    color: theme.colors.textPrimary,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
  },
  badgeText: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.fontSizes.xs,
  },
});
