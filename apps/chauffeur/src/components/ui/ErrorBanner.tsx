import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../../config/theme'

export interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message} maxFontSizeMultiplier={1}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Prøv igen"
        >
          <Text style={styles.retryLabel} maxFontSizeMultiplier={1}>Prøv igen</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.badBg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  message: {
    flex: 1,
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.bad,
  },
  retryButton: {
    marginLeft: theme.spacing.sm,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.bad,
    textDecorationLine: 'underline',
  },
})
