// Components
export { AdBanner, AdNativeRow, AdNativeListItem, AdPlaceholder } from './components';

// Hooks
export { useInterstitialAd, useAdFrequency } from './hooks';

// Store
export { useAdStore } from './stores/adStore';

// Types
export type { AdPlacement, AdType, BannerSize, FrequencyCapConfig } from './types';

// Constants
export { AD_UNIT_IDS, DEFAULT_FREQUENCY_CONFIG, BANNER_HEIGHTS } from './constants';

// Gate (for checking if ads can run, e.g. Expo Go vs dev build)
export { isNativeAdsAvailable } from './nativeAdsGate';
