/**
 * Single point of require for react-native-google-mobile-ads.
 * In Expo Go / web the native module isn't present, so requiring the package throws.
 * This gate catches that and lets the app run without ads (components render null).
 */
let nativeAdsModule: typeof import('react-native-google-mobile-ads') | null = null;
let isNativeAdsAvailable = false;

try {
  nativeAdsModule = require('react-native-google-mobile-ads');
  isNativeAdsAvailable = true;
  if (__DEV__) {
    console.log('[Ad] Native ads module loaded (use dev/production build; ads will not show in Expo Go)');
  }
} catch (e) {
  if (__DEV__) {
    console.warn('[Ad] Native ads not available (Expo Go or web). Run a development build to test ads:', (e as Error)?.message);
  }
}

export { nativeAdsModule, isNativeAdsAvailable };
