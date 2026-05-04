import React, { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';

export interface TaskSwiperProps {
  children: React.ReactNode;
  /** Hvilket kort der vises først (default: 0) */
  initialIndex?: number;
  /** Korthøjde — default: theme.cardHeight.info */
  cardHeight?: number;
}

const SIDE_PEEK = theme.taskSwiper.sidePeek;  // 22px reserveret på hver side
const GAP = theme.taskSwiper.gap;             // 7px mellemrum mellem kort
// Synlig peek af næste kort = SIDE_PEEK - GAP = 15px

export function TaskSwiper({ children, initialIndex = 0, cardHeight = theme.cardHeight.info }: TaskSwiperProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const items = React.Children.toArray(children);
  const safeIndex = Math.min(initialIndex, Math.max(0, items.length - 1));
  const cardWidth = containerWidth > 0 ? containerWidth - SIDE_PEEK * 2 : 0;
  const snapInterval = cardWidth + GAP;

  return (
    <View
      style={[styles.container, { height: cardHeight }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <FlatList
          data={items}
          horizontal
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={[styles.card, { width: cardWidth, height: cardHeight, marginRight: GAP }]}>
              {item}
            </View>
          )}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={safeIndex}
          contentContainerStyle={{ paddingHorizontal: SIDE_PEEK }}
          getItemLayout={(_, index) => ({
            length: snapInterval,
            offset: SIDE_PEEK + snapInterval * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  card: {},
});
