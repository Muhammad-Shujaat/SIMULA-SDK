import type { AdResponse } from './types';
export declare function createSession(apiKey: string): Promise<string>;
export declare function fetchAdFromApi(sessionId: string, slot: string, position: number, signal?: AbortSignal): Promise<AdResponse>;
export declare function trackImpression(aid: string, apiKey: string): Promise<void>;
