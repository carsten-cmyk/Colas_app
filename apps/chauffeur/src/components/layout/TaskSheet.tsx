import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../config/theme';

// TODO: Tilføj slide-up + fade-in animation via react-native-reanimated
// når projektet skifter til development build (expo run:ios).
// Se PRD.md afsnit 7.

export interface TaskSheetProps {
  orderNumber: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Renderes udenfor ScrollView — fast i bunden af sheet */
  footer?: React.ReactNode;
  /** Renderes i fuld bredde under sheet (fx BottomTabBar) */
  tabBar?: React.ReactNode;
  visible: boolean;
}

export function TaskSheet({ orderNumber, onClose, children, footer, tabBar, visible }: TaskSheetProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  // On web, Modal renders into document.body — outside the 393×852 iPhone frame container.
  // We use an absoluteFill View instead so the overlay stays inside #root on all platforms.
  return (
    <View style={[styles.overlay, { paddingTop: insets.top + theme.spacing.xs }]}>
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.orderNumber}>{orderNumber}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Luk opgave"
            accessibilityHint="Lukker opgavevisningen og returnerer til listen"
          >
            <Ionicons name="close" size={20} color={theme.colors.deepTeal} />
          </TouchableOpacity>
        </View>

        {/* Scrollbart indhold */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {/* Fast footer — udenfor scroll, arver softAqua fra sheet */}
        {footer}
      </View>

      {/* Tab bar — fuld bredde under sheet */}
      {tabBar}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.darkTeal,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    flex: 1,
    backgroundColor: theme.colors.softAqua,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    marginHorizontal: theme.sheet.horizontalMargin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  orderNumber: {
    fontFamily: theme.fonts.poppinsMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.deepTeal,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.md + theme.spacing.xxs, // 26px
    paddingBottom: theme.spacing.sm,
  },
});
