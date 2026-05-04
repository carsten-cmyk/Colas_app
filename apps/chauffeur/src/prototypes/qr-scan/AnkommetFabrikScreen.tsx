/**
 * PROTOTYPE — "Du er ankommet ved fabrik" skærm
 * Vises som modal (via TaskSheet) når chauffør ankommer til afhentningsstedet.
 * Må ikke importeres i produktionskode.
 * Når godkendt → byg ordentligt i src/screens/
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskSheet } from '@/components/layout/TaskSheet';
import { BottomTabBar, TabName } from '@/components/layout/BottomTabBar';
import { QRScanScreen } from './QRScanScreen';
import { BekræftLastningScreen } from './BekræftLastningScreen';
import { theme } from '@/config/theme';

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK = {
  orderNumber: '1212343',
  silo: 'Silo 3',
  produkt: '82101H',
  pickup: { name: 'Køge Asfaltfabrik' },
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface AnkommetFabrikScreenProps {
  onClose: () => void;
}


// ─── Komponent ───────────────────────────────────────────────────────────────
export function AnkommetFabrikScreen({ onClose }: AnkommetFabrikScreenProps) {
  const [activeTab, setActiveTab] = useState<TabName>('opgaver');
  const [showQR, setShowQR] = useState(false);
  const [showBekræft, setShowBekræft] = useState(false);

  if (showBekræft) {
    return (
      <BekræftLastningScreen
        onClose={() => setShowBekræft(false)}
        onComplete={onClose}
      />
    );
  }

  if (showQR) {
    return (
      <QRScanScreen
        onClose={() => setShowQR(false)}
        onSuccess={() => { setShowQR(false); setShowBekræft(true); }}
      />
    );
  }

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

        <Text style={styles.ankommetLabel}>Du er ankommet til {MOCK.pickup.name}</Text>
        <Text style={styles.siloHeading}>Kør til {MOCK.silo}</Text>

        <View style={styles.produktBlock}>
          <Text style={styles.produktLabel}>Produkt</Text>
          <Text style={styles.produktValue}>{MOCK.produkt}</Text>
        </View>

        <Text style={styles.scanHeading}>
          Scan QR-kode for{'\n'}at starte lastning
        </Text>

        <Pressable
          style={styles.cameraButton}
          onPress={() => setShowQR(true)}
          accessibilityRole="button"
          accessibilityLabel="Åbn QR-scanner"
        >
          <Ionicons name="camera-outline" size={50} color={theme.colors.deepTeal} />
        </Pressable>

      </View>
    </TaskSheet>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  ankommetLabel: {
    fontFamily: theme.fonts.poppinsMedium,
    fontSize: theme.fontSizes.md,
    color: theme.colors.deepTeal,
    textAlign: 'center',
  },
  siloHeading: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: 36,
    color: theme.colors.deepTeal,
    textAlign: 'center',
  },
  produktBlock: {
    alignItems: 'center',
    gap: 2,
    marginTop: theme.spacing.xs,
  },
  produktLabel: {
    fontFamily: theme.fonts.poppinsMedium,
    fontSize: theme.fontSizes.md,
    color: theme.colors.deepTeal,
  },
  produktValue: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: 36,
    color: theme.colors.deepTeal,
  },
  scanHeading: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.deepTeal,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  cameraButton: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xxxs,
  },
});
