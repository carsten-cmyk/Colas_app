import React, { useEffect, useRef } from 'react'
import { Animated, View, StyleSheet } from 'react-native'
import { theme } from '../../config/theme'

function SkeletonBlock({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [opacity])

  return <Animated.View style={[styles.block, style, { opacity }]} />
}

export function TaskSkeleton() {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel="Indlæser opgave"
    >
      {/* OrderMetrics placeholder — 2x2 grid */}
      <View style={styles.metricsGrid}>
        <SkeletonBlock style={styles.metricsCell} />
        <SkeletonBlock style={styles.metricsCell} />
        <SkeletonBlock style={styles.metricsCell} />
        <SkeletonBlock style={styles.metricsCell} />
      </View>

      {/* LocationCard placeholders */}
      <SkeletonBlock style={styles.locationCard} />
      <SkeletonBlock style={styles.locationCard} />

      {/* CardSwiper placeholder */}
      <SkeletonBlock style={styles.swiper} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  block: {
    backgroundColor: theme.colors.boxOutline,
    borderRadius: theme.borderRadius.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  metricsCell: {
    width: '48%',
    height: theme.skeleton.metricsCellHeight,
  },
  locationCard: {
    height: theme.skeleton.locationCardHeight,
  },
  swiper: {
    height: theme.cardHeight.info,
  },
})
