import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/config/theme';
import { BottomTabBar, TabName } from '@/components/layout/BottomTabBar';

interface PlaceholderScreenProps {
  tab: TabName;
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

function TabIcon({ name }: { name: TabName }) {
  switch (name) {
    case 'opgaver':  return <MaterialCommunityIcons name="truck-outline" size={48} color={theme.colors.lightAqua} />;
    case 'timereg':  return <Ionicons name="time-outline" size={48} color={theme.colors.lightAqua} />;
    case 'kontakt':  return <Ionicons name="call-outline" size={48} color={theme.colors.lightAqua} />;
    default:         return <Ionicons name="construct-outline" size={48} color={theme.colors.lightAqua} />;
  }
}

const TAB_LABELS: Partial<Record<TabName, string>> = {
  opgaver:  'Opgaver',
  timereg:  'Timereg',
  kontakt:  'Kontakt',
};

export function PlaceholderScreen({ tab, activeTab, onTabPress }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.content}>
        <TabIcon name={tab} />
        <Text style={styles.title}>{TAB_LABELS[tab]}</Text>
        <Text style={styles.subtitle}>Prototype under opbygning</Text>
      </View>
      <BottomTabBar activeTab={activeTab} onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.xl,
    color: theme.colors.white,
  },
  subtitle: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.lightAqua,
  },
});
