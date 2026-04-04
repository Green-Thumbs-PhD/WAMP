import { createContext, useContext } from 'react';
import type { AudioEngineAPI } from '../hooks/useAudioEngine';

export const AudioEngineContext = createContext<AudioEngineAPI | null>(null);

export function useAudioEngineContext(): AudioEngineAPI {
  const ctx = useContext(AudioEngineContext);
  if (!ctx) throw new Error('useAudioEngineContext must be used within AudioEngineContext.Provider');
  return ctx;
}
