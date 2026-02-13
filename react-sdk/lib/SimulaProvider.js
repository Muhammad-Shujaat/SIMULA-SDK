import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { createSession, fetchAdFromApi, trackImpression as track } from './api';
const SimulaContext = createContext(null);
export const SimulaProvider = ({ apiKey, children, }) => {
    const [sessionId, setSessionId] = useState(null);
    const [cache] = useState(() => new Map());
    useEffect(() => {
        createSession(apiKey).then(setSessionId).catch(console.error);
    }, [apiKey]);
    const fetchAd = async (slot, position, signal) => {
        if (!sessionId)
            throw new Error('Session not ready');
        return fetchAdFromApi(sessionId, slot, position, signal);
    };
    const getCachedAd = (slot, position) => { var _a; return (_a = cache.get(`${slot}:${position}`)) !== null && _a !== void 0 ? _a : null; };
    const cacheAd = (slot, position, ad, height) => {
        cache.set(`${slot}:${position}`, { ...ad, height });
    };
    const trackImpression = (aid) => track(aid, apiKey);
    const value = {
        apiKey,
        sessionId,
        fetchAd,
        getCachedAd,
        cacheAd,
        trackImpression,
    };
    return _jsx(SimulaContext.Provider, { value: value, children: children });
};
export const useSimula = () => {
    const ctx = useContext(SimulaContext);
    if (!ctx)
        throw new Error('useSimula must be used inside SimulaProvider');
    return ctx;
};
