import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { TrailerFeed } from '../../src/components/trailers';

export default function TrailersScreen() {
  // Lock to landscape when viewing trailers
  useFocusEffect(
    React.useCallback(() => {
      const lockLandscape = async () => {
        try {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE
          );
        } catch (err) {
          console.warn('Failed to lock orientation:', err);
        }
      };

      lockLandscape();

      // Unlock when leaving the screen
      return () => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        ).catch(() => {});
      };
    }, [])
  );

  return <TrailerFeed />;
}
