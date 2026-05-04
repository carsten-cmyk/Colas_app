/**
 * PROTOTYPE — Bekræftelse af lastning
 * Vises efter succesfuld QR-scanning.
 * Må ikke importeres i produktionskode.
 * Når godkendt → byg ordentligt i src/screens/
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskSheet } from '@/components/layout/TaskSheet';
import { BottomTabBar, TabName } from '@/components/layout/BottomTabBar';
import { theme } from '@/config/theme';

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK = {
  orderNumber: '1212343',
  ton: 75,
  produkt: '82101H',
  siloLabel: 'Silo 3',
};

interface BekræftLastningScreenProps {
  onClose: () => void;
  onComplete: () => void;
}

export function BekræftLastningScreen({ onClose, onComplete }: BekræftLastningScreenProps) {
  const [activeTab, setActiveTab] = useState<TabName>('opgaver');

  return (
    <TaskSheet
      orderNumber={`Ordrenummer ${MOCK.orderNumber}`}
      onClose={onClose}
      visible
      tabBar={
        <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
      }
    >
      <View style={styles.content}>

        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={72} color={theme.colors.deepTeal} />
        </View>

        <Text style={styles.siloLabel}>{MOCK.siloLabel} bekræftet</Text>

        <View style={styles.detailsBlock}>
          <Text style={styles.tonValue}>{MOCK.ton} tons</Text>
          <Text style={styles.produktValue}>{MOCK.produkt}</Text>
        </View>

        <Text style={styles.subText}>Du kan nu starte læsningen</Text>

        <Pressable
          style={styles.okBtn}
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel="Læsning fuldført"
        >
          <Text style={styles.okBtnText}>Læsning fuldført</Text>
        </Pressable>

      </View>
    </TaskSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.sm,
    paddingTop: 56,
    paddingHorizontal: theme.spacing.sm,
  },
  iconWrap: {
    marginBottom: theme.spacing.xs,
  },
  siloLabel: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.md,
    color: theme.colors.deepTeal,
  },
  detailsBlock: {
    alignItems: 'center',
    gap: theme.spacing.xxxs,
  },
  tonValue: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: 36,
    color: theme.colors.deepTeal,
  },
  produktValue: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: 36,
    color: theme.colors.deepTeal,
  },
  subText: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.md,
    color: theme.colors.deepTeal,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  okBtn: {
    backgroundColor: theme.colors.yellow,
    borderRadius: theme.borderRadius.xxl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },
  okBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
});
