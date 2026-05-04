import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';

export type MessageTab = 'indbakke' | 'arkiv';

export interface TabSwitcherProps {
  activeTab: MessageTab;
  onTabPress: (tab: MessageTab) => void;
  unreadCount?: number;
}

export function TabSwitcher({ activeTab, onTabPress, unreadCount = 0 }: TabSwitcherProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, activeTab === 'indbakke' && styles.tabActive]}
        onPress={() => onTabPress('indbakke')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'indbakke' }}
      >
        <Text style={[styles.label, activeTab === 'indbakke' && styles.labelActive]}>
          Indbakke
        </Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </Pressable>

      <Pressable
        style={[styles.tab, activeTab === 'arkiv' && styles.tabActive]}
        onPress={() => onTabPress('arkiv')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'arkiv' }}
      >
        <Text style={[styles.label, activeTab === 'arkiv' && styles.labelActive]}>
          Arkiv
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.deepTeal,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxxs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
  },
  tabActive: {
    backgroundColor: theme.colors.yellow,
  },
  label: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.lightAqua,
  },
  labelActive: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.interSemiBold,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: theme.fonts.interBold,
    fontSize: 10,
    color: theme.colors.white,
  },
});
