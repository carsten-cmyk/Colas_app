import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

export interface ContactCardProps {
  name: string;
  /** Vises under navn. Brug "-" hvis ingen rolle. */
  role: string;
  /** Format: "2399 1448" — åbner telefon-app ved tryk */
  phone: string;
  /** Rundt foto. Viser placeholder hvis undefined eller fejler. */
  imageUrl?: string;
  /** Overskriver default tel: adfærd hvis sat */
  onPress?: () => void;
}

export function ContactCard({
  name,
  role,
  phone,
  imageUrl,
  onPress,
}: ContactCardProps) {
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {});
    }
  };

  const showPlaceholder = !imageUrl || imageError;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Ring til ${name}, ${phone}`}
    >
      {/* Rundt foto */}
      {showPlaceholder ? (
        <View style={styles.avatarPlaceholder}>
          <Ionicons
            name="person"
            size={theme.contactCard.avatarSize * 0.45}
            color={theme.colors.textMuted}
          />
        </View>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={styles.avatar}
          onError={() => setImageError(true)}
        />
      )}

      {/* Navn */}
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1}>
        {name}
      </Text>

      {/* Rolle */}
      <Text style={styles.role} numberOfLines={1} maxFontSizeMultiplier={1}>
        {role}
      </Text>

      {/* Telefon-række */}
      <View style={styles.phoneRow}>
        <View style={styles.phoneIconWrap}>
          <Ionicons
            name="call"
            size={theme.contactCard.phoneIconSize}
            color={theme.colors.darkTeal}
          />
        </View>
        <Text style={styles.phone} numberOfLines={1} maxFontSizeMultiplier={1}>{phone}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: theme.contactCard.width,
    gap: theme.spacing.xxs,
  },
  avatar: {
    width: theme.contactCard.avatarSize,
    height: theme.contactCard.avatarSize,
    borderRadius: theme.contactCard.avatarSize / 2,
  },
  avatarPlaceholder: {
    width: theme.contactCard.avatarSize,
    height: theme.contactCard.avatarSize,
    borderRadius: theme.contactCard.avatarSize / 2,
    backgroundColor: theme.colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.contactCard.nameFontSize,
    color: theme.colors.darkTeal,
    textAlign: 'center',
    lineHeight: theme.contactCard.nameLineHeight,
  },
  role: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.contactCard.nameFontSize,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxxs,
    minHeight: theme.contactCard.phoneRowMinHeight,
  },
  phoneIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.contactCard.nameFontSize,
    color: theme.colors.darkTeal,
  },
});
