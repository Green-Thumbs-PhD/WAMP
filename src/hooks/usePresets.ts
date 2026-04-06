import { useCallback, useState } from 'react';
import type { Preset } from '../types/presets';
import type { PresetEffectSlot } from '../types/presets';
import type { RackState } from '../types/rack';
import { FACTORY_PRESETS } from '../audio/presets';
import {
  loadPresetPreferences,
  loadUserPresets,
  savePresetPreferences,
  saveUserPresets,
} from '../storage/appStorage';
import { generateId } from '../utils/generateId';

export function usePresets() {
  const [userPresets, setUserPresets] = useState<Preset[]>(() => loadUserPresets());
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadPresetPreferences().favoriteIds);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const allPresets = [...FACTORY_PRESETS, ...userPresets]
    .map((preset) => ({
      ...preset,
      favorite: favoriteIds.includes(preset.id),
    }))
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (a.isFactory !== b.isFactory) return a.isFactory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const savePreset = useCallback((
    name: string,
    chain: PresetEffectSlot[],
    rack: RackState,
    details?: { category?: string; tags?: string[] }
  ) => {
    const preset: Preset = {
      id: generateId(),
      name,
      isFactory: false,
      chain: chain.map((s) => ({ type: s.type, bypassed: s.bypassed, params: s.params })),
      rack,
      category: details?.category?.trim() || 'Custom',
      tags: details?.tags?.filter(Boolean) ?? [],
      favorite: false,
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
    if (favoriteIds.includes(id)) {
      const nextFavorites = favoriteIds.filter((entry) => entry !== id);
      savePresetPreferences({ favoriteIds: nextFavorites });
      setFavoriteIds(nextFavorites);
    }
    if (activePresetId === id) setActivePresetId(null);
  }, [activePresetId, favoriteIds]);

  const renamePreset = useCallback((id: string, name: string) => {
    const presets = loadUserPresets();
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    preset.name = name;
    saveUserPresets(presets);
    setUserPresets([...presets]);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const current = loadPresetPreferences().favoriteIds;
    const next = current.includes(id)
      ? current.filter((entry) => entry !== id)
      : [...current, id];
    savePresetPreferences({ favoriteIds: next });
    setFavoriteIds(next);
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
    toggleFavorite,
    selectPreset,
    getPreset,
  };
}
