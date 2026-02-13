import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSimula } from './SimulaProvider';
import type { NativeBannerProps, AdData } from './types';

// Default ad height for zero-flicker reservation
const DEFAULT_AD_HEIGHT = 250;
const MIN_AD_HEIGHT = 130;
const MINIMUM_VISIBLE_PERCENTAGE = 0.5;
const MINIMUM_VISIBLE_DURATION_MS = 1000;

interface ImpressionState {
  startTime: number | null;
  tracked: boolean;
}

const NativeBanner: React.FC<NativeBannerProps> = ({
  slot,
  position,
  width = '100%',
  height,
  onError,
  onImpression,
}) => {
  const { apiKey, sessionId, fetchAd, getCachedAd, cacheAd, trackImpression: trackImpressionFromContext } = useSimula();
  const [adData, setAdData] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState(height || DEFAULT_AD_HEIGHT);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchingRef = useRef(false);
  const impressionStateRef = useRef<ImpressionState>({ startTime: null, tracked: false });
  const impressionTimerRef = useRef<number | null>(null);
  const hasFetchedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const cacheKey = useMemo(() => `${slot}:${position}`, [slot, position]);

  // Calculate container width style
  const containerWidthStyle = useMemo((): React.CSSProperties => {
    if (width === 'fill' || width === '100%') {
      return { width: '100%' };
    }
    if (typeof width === 'number') {
      return { width: `${width}px` };
    }
    return { width };
  }, [width]);

  // Calculate container height style (reserved space for zero-flicker)
  const containerHeightStyle = useMemo((): React.CSSProperties => {
    const reservedHeight = adData?.height || measuredHeight || height || DEFAULT_AD_HEIGHT;
    return {
      height: `${Math.max(reservedHeight, MIN_AD_HEIGHT)}px`,
      minHeight: `${MIN_AD_HEIGHT}px`,
    };
  }, [adData, measuredHeight, height]);

  // Fetch ad from cache or API
  const fetchAdData = useCallback(async () => {
    if (!sessionId || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchingRef.current = true;

    // Check cache first - return instantly if cached
    const cached = getCachedAd(slot, position);
    if (cached) {
      setAdData({
        aid: cached.aid,
        html: cached.html,
        height: cached.height,
      });
      setLoading(false);
      return;
    }

    // Create new request with cancellation support
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetchAd(slot, position, abortControllerRef.current.signal);
      
      const adHeight = measuredHeight || height || DEFAULT_AD_HEIGHT;
      const newAdData: AdData = {
        aid: response.aid,
        html: response.html,
        height: adHeight,
      };

      // Cache the ad for instant return on scroll-back
      cacheAd(slot, position, response, adHeight);

      setAdData(newAdData);
      setLoading(false);
      fetchingRef.current = false;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled because ad scrolled out of view — allow retry
        fetchingRef.current = false;
        hasFetchedRef.current = false;
        return;
      }
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [sessionId, slot, position, fetchAd, getCachedAd, cacheAd, measuredHeight, height, onError]);

  // Fetch ad when session is ready
  useEffect(() => {
    if (sessionId) {
      fetchAdData();
    }
  }, [sessionId, fetchAdData]);

  // Handle impression tracking with IntersectionObserver
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    const isVisible = entry.isIntersecting && entry.intersectionRatio >= MINIMUM_VISIBLE_PERCENTAGE;
    const now = Date.now();

    if (isVisible && adData?.aid) {
      // Start impression timer when ad becomes visible
      if (!impressionStateRef.current.startTime) {
        impressionStateRef.current.startTime = now;
      }

      // Check if minimum duration has elapsed
      const elapsed = now - (impressionStateRef.current.startTime || 0);
      if (elapsed >= MINIMUM_VISIBLE_DURATION_MS && !impressionStateRef.current.tracked) {
        impressionStateRef.current.tracked = true;
        (async () => {
          try {
            await trackImpressionFromContext(adData.aid);
            onImpression?.();
          } catch (err) {
            const e = err instanceof Error ? err : new Error('Impression tracking failed');
            setError(e);
            onError?.(e);
            setAdData(null);
          }
        })();
      } else if (!impressionStateRef.current.tracked) {
        // Schedule impression check
        impressionTimerRef.current = window.setTimeout(() => {
          if (impressionStateRef.current.startTime && 
              Date.now() - impressionStateRef.current.startTime >= MINIMUM_VISIBLE_DURATION_MS &&
              adData?.aid) {
            impressionStateRef.current.tracked = true;
            (async () => {
              try {
                await trackImpressionFromContext(adData.aid);
                onImpression?.();
              } catch (err) {
                const e = err instanceof Error ? err : new Error('Impression tracking failed');
                setError(e);
                onError?.(e);
                setAdData(null);
              }
            })();
          }
        }, MINIMUM_VISIBLE_DURATION_MS - elapsed);
      }
    } else {
      // Reset impression state when ad scrolls out of view
      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
        impressionTimerRef.current = null;
      }
      impressionStateRef.current = { startTime: null, tracked: false };
      // Cancel any active ad fetch when scrolled out of view
      if (fetchingRef.current && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [adData, trackImpressionFromContext, onImpression]);

  // Setup IntersectionObserver for impression tracking
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: [MINIMUM_VISIBLE_PERCENTAGE],
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
      }
    };
  }, [handleIntersection]);

  // Clear timers and abort on page unload to avoid leaks
  useEffect(() => {
    const handleUnload = () => {
      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
        impressionTimerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Cleanup: cancel all active network requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (impressionTimerRef.current) {
        clearTimeout(impressionTimerRef.current);
      }
    };
  }, []);

  // Handle iframe load to measure content height
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current?.contentDocument?.documentElement) {
      const doc = iframeRef.current.contentDocument.documentElement;
      const scrollHeight = doc.scrollHeight;
      if (scrollHeight > 0 && scrollHeight !== measuredHeight) {
        setMeasuredHeight(scrollHeight);
        // Update cache with measured height
        if (adData) {
          cacheAd(slot, position, { aid: adData.aid, html: adData.html }, scrollHeight);
        }
      }
    }
  }, [adData, cacheAd, slot, position, measuredHeight]);

  // Error state: collapse ad container gracefully
  if (error) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      style={{
        ...containerWidthStyle,
        ...containerHeightStyle,
        position: 'relative',
        overflow: 'hidden',
        contain: 'layout paint',
      }}
    >
      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          backgroundColor: '#f5f5f5',
        }}>
          <div className="simula-ad-spinner" style={{
            width: '24px',
            height: '24px',
            border: '2px solid #e0e0e0',
            borderTopColor: '#2196f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      )}

      {/* Ad Content */}
      {adData && (
        <iframe
          ref={iframeRef}
          srcDoc={adData.html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          title={`Native Ad - ${slot}:${position}`}
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
};

export default NativeBanner;

