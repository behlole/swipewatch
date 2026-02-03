import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SwipeCard } from './SwipeCard';
import { SwipeActions } from './SwipeActions';
import { Skeleton } from '../ui';
import { spacing, borderRadius } from '../../theme';
import { Media } from '../../types';
import { SwipeEngagement, createDefaultEngagement } from '../../types/recommendations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.screenPadding * 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

interface SwipeStackProps {
  items: Media[];
  onSwipe: (item: Media, direction: 'left' | 'right', engagement?: SwipeEngagement) => void;
  onCardPress?: (item: Media) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  isLoading?: boolean;
  onEndReached?: () => void;
}

export function SwipeStack({
  items,
  onSwipe,
  onCardPress,
  onUndo,
  canUndo = false,
  isLoading = false,
  onEndReached,
}: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleCards = items.slice(currentIndex, currentIndex + 3);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right', engagement?: SwipeEngagement) => {
      const currentItem = items[currentIndex];
      if (currentItem) {
        onSwipe(currentItem, direction, engagement);
        setCurrentIndex((prev) => prev + 1);

        // Trigger onEndReached when near end
        if (items.length - currentIndex <= 5 && onEndReached) {
          onEndReached();
        }
      }
    },
    [currentIndex, items, onSwipe, onEndReached]
  );

  const handleCardPress = useCallback(() => {
    const currentItem = items[currentIndex];
    if (currentItem && onCardPress) {
      onCardPress(currentItem);
    }
  }, [currentIndex, items, onCardPress]);

  const handleUndo = useCallback(() => {
    if (currentIndex > 0 && onUndo) {
      setCurrentIndex((prev) => prev - 1);
      onUndo();
    }
  }, [currentIndex, onUndo]);

  if (isLoading && visibleCards.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          <SwipeCardSkeleton />
        </View>
        <SwipeActions
          onSwipeLeft={() => {}}
          onSwipeRight={() => {}}
          disabled
        />
      </View>
    );
  }

  if (visibleCards.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Skeleton width={200} height={24} />
          <Skeleton width={160} height={16} style={{ marginTop: spacing.md }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {visibleCards.map((item, index) => (
          <SwipeCard
            key={`${item.id}-${item.type}`}
            media={item}
            index={index}
            onSwipe={handleSwipe}
            onPress={handleCardPress}
            isTopCard={index === 0}
          />
        )).reverse()}
      </View>
      <SwipeActions
        onSwipeLeft={() => handleSwipe('left', createDefaultEngagement())}
        onSwipeRight={() => handleSwipe('right', createDefaultEngagement())}
        onUndo={handleUndo}
        canUndo={canUndo && currentIndex > 0}
      />
    </View>
  );
}

function SwipeCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        borderRadius={borderRadius.card}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
    width: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonCard: {
    position: 'absolute',
  },
});
