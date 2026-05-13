import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

export interface LocationCardProps {
  name: string;
  /** Format: "Nordhavnsvej 9, 4600 Køge" */
  address: string;
  /** Format: "05.30" — vises kun hvis sat (pickup) */
  meetingTime?: string;
  // TODO: RECOMMENDED — type er reserveret til fremtidig visuel differentiering (ikon, label el. farve)
  type: 'pickup' | 'delivery';
}

export function LocationCard({ name, address, meetingTime }: LocationCardProps) {
  const handleMapPress = () => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`).catch(() => {});
  };

  const lastComma = address.lastIndexOf(',');
  const street = lastComma > -1 ? address.slice(0, lastComma).trim() : address;
  const cityLine = lastComma > -1 ? address.slice(lastComma + 1).trim() : null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mapButton}
        onPress={handleMapPress}
        accessibilityRole="button"
        accessibilityLabel={`Åbn kort for ${address}`}
        accessibilityHint="Åbner Google Maps"
      >
        <Ionicons name="location-sharp" size={20} color={theme.colors.deepTeal} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1}>{name}</Text>
        <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1}>{street}</Text>
        {cityLine && (
          <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1}>{cityLine}</Text>
        )}
      </View>

      {meetingTime && (
        <View style={styles.meetingTime}>
          <Text style={styles.meetingLabel} maxFontSizeMultiplier={1}>Mødetid</Text>
          <Text style={styles.meetingValue} maxFontSizeMultiplier={1}>{meetingTime}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.boxOutline,
    ...theme.shadows.md,
    paddingVertical: theme.locationCard.paddingVertical,
    paddingHorizontal: theme.locationCard.paddingHorizontal,
    gap: theme.spacing.xs,
    width: '100%',
  },
  mapButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  name: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.locationCard.nameFontSize,
    color: theme.colors.textPrimary,
  },
  address: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.locationCard.addressFontSize,
    color: theme.colors.textMuted,
  },
  meetingTime: {
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.boxOutline,
    paddingLeft: theme.spacing.xs,
    minWidth: theme.locationCard.meetingTimeWidth,
  },
  meetingLabel: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.locationCard.addressFontSize,
    color: theme.colors.textMuted,
  },
  meetingValue: {
    fontFamily: theme.fonts.interBold,
    fontSize: theme.locationCard.meetingValueFontSize,
    color: theme.colors.textPrimary,
  },
});
