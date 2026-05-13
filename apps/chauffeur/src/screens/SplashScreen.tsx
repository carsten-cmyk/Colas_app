import React from 'react';
import {
  View,
  Image,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { theme } from '@/config/theme';

export interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <View style={styles.container}>
      {/* Venstre — arbejderbillede (flex: 3, ~60%) */}
      <View style={styles.imageSection}>
        <Image
          source={require('../../assets/hero-worker.png')}
          style={styles.workerImage}
          resizeMode="cover"
        />
      </View>

      {/* Højre — gul stribe (flex: 2, ~40%) */}
      <View style={styles.yellowStrip}>
        {/* Logo — absolut top-højre */}
        <Image
          source={require('../../assets/logo_splash.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Colas"
        />

        {/* Vejr + tekst + knap — absolut 50px fra bunden */}
        <View style={styles.bottomContent}>
          <View style={styles.weatherContainer}>
            <Image
              source={require('../../assets/icon-sun.png')}
              style={styles.weatherIcon}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.temperatureText}>14 Grader</Text>
          </View>

          <View style={styles.textContent}>
            <Text style={styles.greetingText}>Godmorgen.</Text>
            <Text style={styles.subtitleText}>Idag bliver en god dag.</Text>
          </View>

          <Pressable
            style={styles.startButton}
            onPress={onStart}
            android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
            accessibilityRole="button"
            accessibilityLabel="Start"
          >
            <Text style={styles.startButtonText}>→</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  // Venstre — billede (flex: 3, ~60%, overlap ind i højre side via negative margin)
  imageSection: {
    flex: 3,
    marginLeft: '-15%' as any,
    overflow: 'visible',
  },
  workerImage: {
    width: '100%',
    height: '100%',
  },

  // Højre — gul stribe (flex: 2, ~40%)
  yellowStrip: {
    flex: 2,
    backgroundColor: theme.colors.yellow,
    paddingLeft: theme.spacing.sm,
    paddingRight: 0,
    overflow: 'hidden',
  },

  // Logo — absolut top-højre, skalerer med containerens højde
  logo: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 99,
    height: '73%',
  },

  // Vejr + tekst + knap — absolut 50px fra bunden
  bottomContent: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingLeft: theme.spacing.md,
    gap: theme.spacing.xs,
  },

  // Vejr
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  temperatureText: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textPrimary,
  },

  // Tekst
  textContent: {
    gap: 4,
  },
  greetingText: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  subtitleText: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },

  // Start-knap
  startButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF589',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  startButtonText: {
    fontFamily: theme.fonts.interSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 3,
  },
});
