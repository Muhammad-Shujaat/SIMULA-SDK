import React from 'react';
import type { SimulaContextValue } from './types';
export declare const SimulaProvider: React.FC<{
    apiKey: string;
    children: React.ReactNode;
}>;
export declare const useSimula: () => SimulaContextValue;
