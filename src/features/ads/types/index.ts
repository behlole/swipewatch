export type AdType = 'banner' | 'native' | 'interstitial' | 'rewarded';

export type AdPlacement =
  | 'home_between_rows'
  | 'swipe_interstitial'
  | 'watchlist_inline'
  | 'profile_section'
  | 'media_detail'
  | 'analytics_section';

export type BannerSize = 'banner' | 'largeBanner' | 'mediumRectangle';

export interface AdConfig {
  unitId: string;
  placement: AdPlacement;
  type: AdType;
  refreshInterval?: number;
}

export interface FrequencyCapConfig {
  maxImpressionsPerSession: number;
  maxImpressionsPerPlacement: number;
  minTimeBetweenAds: number;
  swipesBetweenInterstitials: number;
}

export interface AdImpressionEvent {
  placement: AdPlacement;
  type: AdType;
  timestamp: number;
  revenue?: number;
}
