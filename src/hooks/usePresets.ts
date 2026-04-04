import { useCallback, useState } from 'react';
import type { Preset } from '../types/presets';
import type { EffectSlotState } from '../types/effects';
import { FACTORY_PRESETS, loadUserPresets, saveUserPresets } from '../audio/presets';
import { generateId } from '../utils/generateId';

export function usePresets() {
  const [userPresets, setUserPresets] = useState<Preset[]>(() => loadUserPresets());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const allPresets = [...FACTORY_PRESETS, ...userPresets];

  const savePreset = useCallback((name: string, chain: EffectSlotState[]) => {
    const preset: Preset = {
      id: generateId(),
      name,
      isFactory: false,
      chain: chain.map((s) => ({ type: s.type, bypassed: s.bypassed, params: s.params })),
    };
    const updated = [...loadUserPresets(), preset];
    saveUserPresets(updated);
    setUserPresets(updated);
    setActivePresetId(preset.id);
    return preset;
  }, []);

  const deletePreset = useCallback((id: string) => {
    const updated = loadUserPresets().filter((p) => p.id !== id);
    saveUserPresets(updated);
    setUserPresets(updated);
    if (activePresetId === id) setActivePresetId(null);
  }, [activePresetId]);

  const renamePreset = useCallback((id: string, name: string) => {
    const presets = loadUserPresets();
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    preset.name = name;
    saveUserPresets(presets);
    setUserPresets([...presets]);
  }, []);

  const selectPreset = useCallback((id: string) => {
    setActivePresetId(id);
  }, []);

  const getPreset = useCallback((id: string) => {
    return allPresets.find((p) => p.id === id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPresets]);

  return {
    presets: allPresets,
    activePresetId,
    savePreset,
    deletePreset,
    renamePreset,
    selectPreset,
    getPreset,
  };
}
