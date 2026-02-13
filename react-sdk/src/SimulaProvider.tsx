import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSession, fetchAdFromApi, trackImpression as track } from './api';
import type { SimulaContextValue, AdResponse, CachedAd } from './types';

const SimulaContext = createContext<SimulaContextValue | null>(null);

export const SimulaProvider: React.FC<{ apiKey: string; children: React.ReactNode }> = ({
  apiKey,
  children,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cache] = useState(() => new Map<string, CachedAd>());

  useEffect(() => {
    createSession(apiKey).then(setSessionId).catch(console.error);
  }, [apiKey]);

  const fetchAd = async (slot: string, position: number, signal?: AbortSignal) => {
    if (!sessionId) throw new Error('Session not ready');
    return fetchAdFromApi(sessionId, slot, position, signal);
  };

  const getCachedAd = (slot: string, position: number) =>
    cache.get(`${slot}:${position}`) ?? null;

  const cacheAd = (slot: string, position: number, ad: AdResponse, height: number) => {
    cache.set(`${slot}:${position}`, { ...ad, height });
  };

  const trackImpression = (aid: string) => track(aid, apiKey);

  const value: SimulaContextValue = {
    apiKey,
    sessionId,
    fetchAd,
    getCachedAd,
    cacheAd,
    trackImpression,
  };

  return <SimulaContext.Provider value={value}>{children}</SimulaContext.Provider>;
};

export const useSimula = () => {
  const ctx = useContext(SimulaContext);
  if (!ctx) throw new Error('useSimula must be used inside SimulaProvider');
  return ctx;
};
