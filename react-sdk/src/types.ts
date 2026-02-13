export interface AdResponse {
  aid: string;
  html: string;
}

export interface CachedAd extends AdResponse {
  height: number; // measured in pixels
}

export interface SimulaContextValue {
  apiKey: string;
  sessionId: string | null;
  fetchAd: (slot: string, position: number, signal?: AbortSignal) => Promise<AdResponse>;
  getCachedAd: (slot: string, position: number) => CachedAd | null;
  cacheAd: (slot: string, position: number, ad: AdResponse, height: number) => void;
  trackImpression: (aid: string) => Promise<void>;
}

export interface NativeBannerProps {
  slot: string;
  position: number;
  width?: number | string;
  height?: number;
  onError?: (error: Error) => void;
  onImpression?: () => void;
}

export interface AdData {
  aid: string;
  html: string;
  height: number;
}

export interface CacheEntry {
  adData: AdData;
  timestamp: number;
}
