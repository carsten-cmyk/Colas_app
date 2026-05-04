import React from 'react';
import {
  View,
  Image,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { theme } from '@/config/theme';

const { width, height } = Dimensions.get('window');

export interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <View style={styles.container}>
      {/* Venstre — arbejderbillede */}
      <View style={styles.imageSection}>
        <Image
          source={require('../../assets/hero-worker.png')}
          style={styles.workerImage}
          resizeMode="contain"
        />
      </View>

      {/* Højre — gul stribe */}
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
  },

  // Venstre — billede (75% bredde, forskudt 15% til venstre)
  imageSection: {
    width: width * 0.75,
    height: height,
    marginLeft: width * -0.15,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  workerImage: {
    width: width * 0.65,
    height: height,
  },

  // Højre — gul stribe (40% bredde)
  yellowStrip: {
    width: width * 0.4,
    height: height,
    backgroundColor: theme.colors.yellow,
    paddingVertical: theme.spacing.lg,
    paddingLeft: theme.spacing.sm,
    paddingRight: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'visible',
  },

  // Logo — absolut top-højre, naturlig størrelse
  logo: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 99,
    height: 624,
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
