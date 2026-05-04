import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';
import { theme } from '../../config/theme';

export interface ProjectImageProps {
  source: ImageSourcePropType;
  /** Default: 1 (kvadrat). Brug < 1 for portrait, > 1 for landscape */
  aspectRatio?: number;
  /** Override billedets position inden i boksen — fx { right: '-40%' } for venstrestilt indhold */
  imageStyle?: StyleProp<ImageStyle>;
}

export function ProjectImage({ source, aspectRatio = 1, imageStyle }: ProjectImageProps) {
  return (
    <View style={[styles.container, { aspectRatio }]}>
      <Image
        source={source}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
