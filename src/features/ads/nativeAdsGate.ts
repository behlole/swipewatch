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
} catch {
  // Expo Go or web - native module not available (use development build for ads)
}

export { nativeAdsModule, isNativeAdsAvailable };
