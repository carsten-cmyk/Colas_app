import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

export function TransportIcon() {
  return (
    <View
      style={styles.container}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name="arrow-up" size={theme.transportIcon.arrowSize} color={theme.colors.deepTeal} />
      <MaterialCommunityIcons name="truck-outline" size={theme.transportIcon.size} color={theme.colors.deepTeal} />
      <Ionicons name="arrow-down" size={theme.transportIcon.arrowSize} color={theme.colors.deepTeal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.transportIcon.gap,
  },
});
