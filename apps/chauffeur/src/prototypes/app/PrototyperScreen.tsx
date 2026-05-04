/**
 * PROTOTYPE — Prototyper-hub
 * Viser alle tilgængelige prototype-simuleringer.
 * Må ikke importeres i produktionskode.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBar, TabName } from '@/components/layout/BottomTabBar';
import { AnkommetFabrikScreen } from '../qr-scan/AnkommetFabrikScreen';
import { TimeRegistrationScreen } from '../timereg/TimeRegistrationScreen';
import { TaskListScreen } from '../task-list/TaskListScreen';
import { theme } from '@/config/theme';

interface PrototyperScreenProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

type Simulation = 'ankomst' | 'timereg' | 'opgaver' | null;

const SIMULATIONS: {
  id: Simulation;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'ankomst',
    title: 'Ankomst til fabrik',
    description: 'QR-scanning og lastningsbekræftelse ved siloanlæg.',
    icon: <Ionicons name="location-outline" size={24} color={theme.colors.deepTeal} />,
  },
  {
    id: 'timereg',
    title: 'Timeregistrering',
    description: 'Oversigt over dagsforbrug, redigering og afslutning af dag/opgave.',
    icon: <Ionicons name="time-outline" size={24} color={theme.colors.deepTeal} />,
  },
  {
    id: 'opgaver',
    title: 'Opgaveliste',
    description: 'Dagsoversigt over opgaver grupperet per dag med aktiv/afsluttet visning.',
    icon: <MaterialCommunityIcons name="truck-outline" size={24} color={theme.colors.deepTeal} />,
  },
];

export function PrototyperScreen({ activeTab, onTabPress }: PrototyperScreenProps) {
  const [active, setActive] = useState<Simulation>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Prototyper</Text>
        <Text style={styles.subheading}>Tryk for at starte en simulering</Text>

        {SIMULATIONS.map(sim => (
          <Pressable
            key={sim.id}
            style={styles.card}
            onPress={() => setActive(sim.id)}
            accessibilityRole="button"
            accessibilityLabel={sim.title}
          >
            <View style={styles.cardIcon}>{sim.icon}</View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{sim.title}</Text>
              <Text style={styles.cardDescription}>{sim.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.lightAqua} />
          </Pressable>
        ))}
      </ScrollView>

      <BottomTabBar activeTab={activeTab} onTabPress={onTabPress} />

      {/* Simuleringer */}
      {active === 'ankomst' && (
        <View style={StyleSheet.absoluteFill}>
          <AnkommetFabrikScreen onClose={() => setActive(null)} />
        </View>
      )}

      {active === 'timereg' && (
        <TimeRegistrationScreen onClose={() => setActive(null)} />
      )}

      {active === 'opgaver' && (
        <View style={StyleSheet.absoluteFill}>
          <TaskListScreen onClose={() => setActive(null)} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  heading: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.xxl,
    color: theme.colors.white,
    marginBottom: theme.spacing.xxxs,
  },
  subheading: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.lightAqua,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.softAqua,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  cardIcon: {
    width: 44,
    height: 44,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: theme.spacing.xxxs,
  },
  cardTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.deepTeal,
  },
  cardDescription: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textMuted,
  },
});
