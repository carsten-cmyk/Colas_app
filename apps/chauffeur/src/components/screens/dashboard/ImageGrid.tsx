import React from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import { theme } from '../../../config/theme';
import { ProjectImage } from '../../ui/ProjectImage';
import { MessageWidget } from '../../ui/MessageWidget';

export interface ImageGridProps {
  /** To billeder — index 0: venstre (stor), index 1: højre øverst */
  images: ImageSourcePropType[];
  messageCount: number;
  onMessagePress: () => void;
}

// Figma node 90:706 — 168×326px
const LEFT_ASPECT_RATIO = 168 / 326;
// Figma node 90:707 — 165×183px
const RIGHT_TOP_ASPECT_RATIO = 165 / 183;

export function ImageGrid({ images, messageCount, onMessagePress }: ImageGridProps) {
  const leftImage = images[0];
  const rightImage = images[1];

  return (
    <View style={styles.grid}>
      <View style={styles.leftColumn}>
        {leftImage && <ProjectImage source={leftImage} aspectRatio={LEFT_ASPECT_RATIO} imageStyle={styles.leftImage} />}
      </View>

      <View style={styles.rightColumn}>
        {rightImage && <ProjectImage source={rightImage} aspectRatio={RIGHT_TOP_ASPECT_RATIO} />}
        <MessageWidget
          count={messageCount}
          onPress={onMessagePress}
          style={styles.messageWidget}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  messageWidget: {
    flex: 1,
  },
  leftImage: {
    left: -70,
  },
});
