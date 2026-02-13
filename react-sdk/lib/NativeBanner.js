import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSimula } from './SimulaProvider';
// Default ad height for zero-flicker reservation
const DEFAULT_AD_HEIGHT = 250;
const MIN_AD_HEIGHT = 130;
const MINIMUM_VISIBLE_PERCENTAGE = 0.5;
const MINIMUM_VISIBLE_DURATION_MS = 1000;
const NativeBanner = ({ slot, position, width = '100%', height, onError, onImpression, }) => {
    const { apiKey, sessionId, fetchAd, getCachedAd, cacheAd, trackImpression: trackImpressionFromContext } = useSimula();
    const [adData, setAdData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [measuredHeight, setMeasuredHeight] = useState(height || DEFAULT_AD_HEIGHT);
    const containerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const impressionStateRef = useRef({ startTime: null, tracked: false });
    const impressionTimerRef = useRef(null);
    const hasFetchedRef = useRef(false);
    const iframeRef = useRef(null);
    const cacheKey = useMemo(() => `${slot}:${position}`, [slot, position]);
    // Calculate container width style
    const containerWidthStyle = useMemo(() => {
        if (width === 'fill' || width === '100%') {
            return { width: '100%' };
        }
        if (typeof width === 'number') {
            return { width: `${width}px` };
        }
        return { width };
    }, [width]);
    // Calculate container height style (reserved space for zero-flicker)
    const containerHeightStyle = useMemo(() => {
        const reservedHeight = (adData === null || adData === void 0 ? void 0 : adData.height) || measuredHeight || height || DEFAULT_AD_HEIGHT;
        return {
            height: `${Math.max(reservedHeight, MIN_AD_HEIGHT)}px`,
            minHeight: `${MIN_AD_HEIGHT}px`,
        };
    }, [adData, measuredHeight, height]);
    // Fetch ad from cache or API
    const fetchAdData = useCallback(async () => {
        if (!sessionId || hasFetchedRef.current)
            return;
        hasFetchedRef.current = true;
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
            const newAdData = {
                aid: response.aid,
                html: response.html,
                height: adHeight,
            };
            // Cache the ad for instant return on scroll-back
            cacheAd(slot, position, response, adHeight);
            setAdData(newAdData);
            setLoading(false);
        }
        catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return; // Request was cancelled, do nothing
            }
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            onError === null || onError === void 0 ? void 0 : onError(error);
            setLoading(false);
        }
    }, [sessionId, slot, position, fetchAd, getCachedAd, cacheAd, measuredHeight, height, onError]);
    // Fetch ad when session is ready
    useEffect(() => {
        if (sessionId) {
            fetchAdData();
        }
    }, [sessionId, fetchAdData]);
    // Handle impression tracking with IntersectionObserver
    const handleIntersection = useCallback((entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= MINIMUM_VISIBLE_PERCENTAGE;
        const now = Date.now();
        if (isVisible && (adData === null || adData === void 0 ? void 0 : adData.aid)) {
            // Start impression timer when ad becomes visible
            if (!impressionStateRef.current.startTime) {
                impressionStateRef.current.startTime = now;
            }
            // Check if minimum duration has elapsed
            const elapsed = now - (impressionStateRef.current.startTime || 0);
            if (elapsed >= MINIMUM_VISIBLE_DURATION_MS && !impressionStateRef.current.tracked) {
                impressionStateRef.current.tracked = true;
                trackImpressionFromContext(adData.aid);
                onImpression === null || onImpression === void 0 ? void 0 : onImpression();
            }
            else if (!impressionStateRef.current.tracked) {
                // Schedule impression check
                impressionTimerRef.current = window.setTimeout(() => {
                    if (impressionStateRef.current.startTime &&
                        Date.now() - impressionStateRef.current.startTime >= MINIMUM_VISIBLE_DURATION_MS &&
                        (adData === null || adData === void 0 ? void 0 : adData.aid)) {
                        impressionStateRef.current.tracked = true;
                        trackImpressionFromContext(adData.aid);
                        onImpression === null || onImpression === void 0 ? void 0 : onImpression();
                    }
                }, MINIMUM_VISIBLE_DURATION_MS - elapsed);
            }
        }
        else {
            // Reset impression state when ad scrolls out of view
            if (impressionTimerRef.current) {
                clearTimeout(impressionTimerRef.current);
                impressionTimerRef.current = null;
            }
            impressionStateRef.current = { startTime: null, tracked: false };
        }
    }, [adData, trackImpressionFromContext, onImpression]);
    // Setup IntersectionObserver for impression tracking
    useEffect(() => {
        if (!containerRef.current)
            return;
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
        var _a, _b;
        if ((_b = (_a = iframeRef.current) === null || _a === void 0 ? void 0 : _a.contentDocument) === null || _b === void 0 ? void 0 : _b.documentElement) {
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
    return (_jsxs("div", { ref: containerRef, style: {
            ...containerWidthStyle,
            ...containerHeightStyle,
            position: 'relative',
            overflow: 'hidden',
            contain: 'layout paint',
        }, children: [loading && (_jsx("div", { style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    width: '100%',
                    backgroundColor: '#f5f5f5',
                }, children: _jsx("div", { className: "simula-ad-spinner", style: {
                        width: '24px',
                        height: '24px',
                        border: '2px solid #e0e0e0',
                        borderTopColor: '#2196f3',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    } }) })), adData && (_jsx("iframe", { ref: iframeRef, srcDoc: adData.html, style: {
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                }, title: `Native Ad - ${slot}:${position}`, onLoad: handleIframeLoad }))] }));
};
export default NativeBanner;
