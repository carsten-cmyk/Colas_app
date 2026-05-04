import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';

export interface DashboardHeaderProps {}

export function DashboardHeader(_props: DashboardHeaderProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <View style={styles.container}>
      {!logoError && (
        <Image
          source={require('../../../../assets/colas-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Colas"
          onError={() => setLogoError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.dashboardHeader.bottomSpacing,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  logo: {
    height: theme.dashboardHeader.logoHeight,
    width: theme.dashboardHeader.logoWidth,
  },
});
