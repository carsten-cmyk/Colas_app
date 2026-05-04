import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../config/theme';

export type TabName = 'start' | 'opgaver' | 'beskeder' | 'timereg' | 'kontakt' | 'prototyper'

export interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

const TABS: { name: TabName; label: string }[] = [
  { name: 'start',    label: 'Start'    },
  { name: 'opgaver',  label: 'Opgaver'  },
  { name: 'beskeder', label: 'Beskeder' },
  { name: 'timereg',   label: 'Timereg'   },
  { name: 'kontakt',   label: 'Kontakt'   },
  { name: 'prototyper', label: '...'      },
];

function TabIcon({ name, size, color }: { name: TabName; size: number; color: string }) {
  switch (name) {
    case 'start':    return <Ionicons name="home-outline" size={size} color={color} />;
    case 'opgaver':  return <MaterialCommunityIcons name="truck-outline" size={size} color={color} />;
    case 'beskeder': return <Ionicons name="mail-outline" size={size} color={color} />;
    case 'timereg':  return <Ionicons name="time-outline" size={size} color={color} />;
    case 'kontakt':    return <Ionicons name="call-outline" size={size} color={color} />;
    case 'prototyper': return <Ionicons name="construct-outline" size={size} color={color} />;
    default: {
      // Exhaustiveness check — TypeScript fejler her hvis ny TabName tilføjes uden case
      const _exhaustive: never = name;
      return null;
    }
  }
}

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = tab.name === activeTab;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => onTabPress(tab.name)}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.tabContent}>
                <View style={{ opacity: isActive ? 1 : theme.tabBar.inactiveOpacity }}>
                  <TabIcon name={tab.name} size={20} color={theme.colors.white} />
                </View>
                <Text
                  style={[styles.label, { opacity: isActive ? 1 : theme.tabBar.inactiveOpacity }]}
                  maxFontSizeMultiplier={1}
                >
                  {tab.label}
                </Text>
              </View>
              <View style={[styles.indicator, isActive && styles.indicatorActive]} />
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: insets.bottom, backgroundColor: theme.colors.deepTeal }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.deepTeal,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    height: theme.tabBar.height,
    alignItems: 'stretch',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 44,
  },
  tabContent: {
    alignItems: 'center',
    gap: theme.spacing.xxs,
    paddingBottom: theme.spacing.xxs,
  },
  label: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xxs,
    color: theme.colors.white,
  },
  indicator: {
    height: theme.tabBar.indicatorHeight,
    width: theme.tabBar.indicatorWidth,
    borderRadius: theme.borderRadius.sm,
  },
  indicatorActive: {
    backgroundColor: theme.colors.yellow,
  },
});
