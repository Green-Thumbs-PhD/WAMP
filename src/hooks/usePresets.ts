import { useCallback, useMemo, useState } from 'react';
import type { SceneEntry } from '../types/performance';
import type { Preset, PresetEffectSlot } from '../types/presets';
import type { RackState } from '../types/rack';
import { FACTORY_PRESETS } from '../audio/presets';
import {
  loadPresetPreferences,
  loadScenes,
  loadUserPresets,
  savePresetPreferences,
  saveScenes,
  saveUserPresets,
} from '../storage/appStorage';
import { normalizeRackState } from '../types/rack';
import { generateId } from '../utils/generateId';

type PresetDetails = {
  category?: string;
  tags?: string[];
  description?: string;
  notes?: string;
};

function normalizePresetImport(candidate: Partial<Preset>): Preset | null {
  if (!candidate.name || !Array.isArray(candidate.chain)) return null;

  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : generateId(),
    name: candidate.name.trim(),
    isFactory: false,
    chain: candidate.chain,
    rack: normalizeRackState(candidate.rack as RackState | undefined),
    category: candidate.category?.trim() || 'Custom',
    tags: Array.isArray(candidate.tags) ? candidate.tags.filter(Boolean) : [],
    description: candidate.description?.trim() || '',
    notes: candidate.notes?.trim() || '',
    favorite: false,
  };
}

export function usePresets() {
  const [userPresets, setUserPresets] = useState<Preset[]>(() => loadUserPresets());
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadPresetPreferences().favoriteIds);
  const [recentPresetIds, setRecentPresetIds] = useState<string[]>(() => loadPresetPreferences().recentPresetIds);
  const [scenes, setScenes] = useState<SceneEntry[]>(() => loadScenes());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  const allPresets = useMemo(() => [...FACTORY_PRESETS, ...userPresets]
    .map((preset) => ({
      ...preset,
      favorite: favoriteIds.includes(preset.id),
    }))
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (a.isFactory !== b.isFactory) return a.isFactory ? -1 : 1;
      return a.name.localeCompare(b.name);
    }), [favoriteIds, userPresets]);

  const persistPreferences = useCallback((next: { favoriteIds?: string[]; recentPresetIds?: string[] }) => {
    const payload = {
      favoriteIds: next.favoriteIds ?? favoriteIds,
      recentPresetIds: next.recentPresetIds ?? recentPresetIds,
    };
    savePresetPreferences(payload);
  }, [favoriteIds, recentPresetIds]);

  const touchRecentPreset = useCallback((id: string) => {
    setRecentPresetIds((current) => {
      const next = [id, ...current.filter((entry) => entry !== id)].slice(0, 6);
      savePresetPreferences({
        favoriteIds,
        recentPresetIds: next,
      });
      return next;
    });
  }, [favoriteIds]);

  const savePreset = useCallback((
    name: string,
    chain: PresetEffectSlot[],
    rack: RackState,
    details?: PresetDetails
  ) => {
    const preset: Preset = {
      id: generateId(),
      name,
      isFactory: false,
      chain: chain.map((s) => ({ type: s.type, bypassed: s.bypassed, params: s.params })),
      rack,
      category: details?.category?.trim() || 'Custom',
      tags: details?.tags?.filter(Boolean) ?? [],
      description: details?.description?.trim() || '',
      notes: details?.notes?.trim() || '',
      favorite: false,
    };
    const updated = [...loadUserPresets(), preset];
    saveUserPresets(updated);
    setUserPresets(updated);
    setActivePresetId(preset.id);
    touchRecentPreset(preset.id);
    return preset;
  }, [touchRecentPreset]);

  const deletePreset = useCallback((id: string) => {
    const updated = loadUserPresets().filter((p) => p.id !== id);
    saveUserPresets(updated);
    setUserPresets(updated);

    const nextFavorites = favoriteIds.filter((entry) => entry !== id);
    const nextRecents = recentPresetIds.filter((entry) => entry !== id);
    setFavoriteIds(nextFavorites);
    setRecentPresetIds(nextRecents);
    persistPreferences({ favoriteIds: nextFavorites, recentPresetIds: nextRecents });

    const nextScenes = scenes.filter((scene) => scene.presetId !== id);
    setScenes(nextScenes);
    saveScenes(nextScenes);

    if (activePresetId === id) setActivePresetId(null);
    if (activeSceneId && !nextScenes.some((scene) => scene.id === activeSceneId)) {
      setActiveSceneId(nextScenes[0]?.id ?? null);
    }
  }, [activePresetId, activeSceneId, favoriteIds, persistPreferences, recentPresetIds, scenes]);

  const renamePreset = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const presets = loadUserPresets();
    const preset = presets.find((p) => p.id === id);
    if (!preset) return false;
    preset.name = trimmed;
    saveUserPresets(presets);
    setUserPresets([...presets]);
    return true;
  }, []);

  const updatePresetDetails = useCallback((id: string, details: PresetDetails) => {
    const presets = loadUserPresets();
    const preset = presets.find((entry) => entry.id === id);
    if (!preset) return false;
    if (details.category !== undefined) preset.category = details.category.trim() || 'Custom';
    if (details.tags !== undefined) preset.tags = details.tags.filter(Boolean);
    if (details.description !== undefined) preset.description = details.description.trim();
    if (details.notes !== undefined) preset.notes = details.notes.trim();
    saveUserPresets(presets);
    setUserPresets([...presets]);
    return true;
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const next = favoriteIds.includes(id)
      ? favoriteIds.filter((entry) => entry !== id)
      : [...favoriteIds, id];
    setFavoriteIds(next);
    persistPreferences({ favoriteIds: next });
  }, [favoriteIds, persistPreferences]);

  const selectPreset = useCallback((id: string) => {
    setActivePresetId(id);
    setActiveSceneId((current) => scenes.find((scene) => scene.presetId === id)?.id ?? current);
    touchRecentPreset(id);
  }, [scenes, touchRecentPreset]);

  const getPreset = useCallback((id: string) => {
    return allPresets.find((p) => p.id === id) ?? null;
  }, [allPresets]);

  const recentPresets = useMemo(() => recentPresetIds
    .map((id) => allPresets.find((preset) => preset.id === id))
    .filter((preset): preset is Preset => Boolean(preset)), [allPresets, recentPresetIds]);

  const exportPresetBundle = useCallback((presetId?: string) => {
    const selected = presetId ? allPresets.filter((preset) => preset.id === presetId) : userPresets;
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      presets: selected,
    }, null, 2);
  }, [allPresets, userPresets]);

  const importPresetBundle = useCallback((raw: string) => {
    const parsed = JSON.parse(raw) as { presets?: Partial<Preset>[] } | Partial<Preset>[];
    const incoming = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.presets)
        ? parsed.presets
        : [];

    const existingIds = new Set(loadUserPresets().map((preset) => preset.id));
    const normalized = incoming
      .map(normalizePresetImport)
      .filter((preset): preset is Preset => Boolean(preset))
      .map((preset) => existingIds.has(preset.id) ? { ...preset, id: generateId() } : preset);

    if (!normalized.length) return 0;
    const updated = [...loadUserPresets(), ...normalized];
    saveUserPresets(updated);
    setUserPresets(updated);
    return normalized.length;
  }, []);

  const addSceneFromPreset = useCallback((preset: Preset) => {
    const scene: SceneEntry = {
      id: generateId(),
      presetId: preset.id,
      songTitle: preset.name,
      cue: preset.description || preset.notes || '',
    };
    const next = [...scenes, scene];
    setScenes(next);
    setActiveSceneId(scene.id);
    saveScenes(next);
    return scene;
  }, [scenes]);

  const updateScene = useCallback((id: string, updates: Partial<SceneEntry>) => {
    const next = scenes.map((scene) => scene.id === id ? {
      ...scene,
      songTitle: updates.songTitle !== undefined ? updates.songTitle : scene.songTitle,
      cue: updates.cue !== undefined ? updates.cue : scene.cue,
      presetId: updates.presetId !== undefined ? updates.presetId : scene.presetId,
    } : scene);
    setScenes(next);
    saveScenes(next);
  }, [scenes]);

  const removeScene = useCallback((id: string) => {
    const next = scenes.filter((scene) => scene.id !== id);
    setScenes(next);
    saveScenes(next);
    if (activeSceneId === id) {
      setActiveSceneId(next[0]?.id ?? null);
    }
  }, [activeSceneId, scenes]);

  const moveScene = useCallback((id: string, direction: -1 | 1) => {
    const next = [...scenes];
    const index = next.findIndex((scene) => scene.id === id);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= next.length) return;
    const [moved] = next.splice(index, 1);
    next.splice(swapIndex, 0, moved);
    setScenes(next);
    saveScenes(next);
  }, [scenes]);

  const selectScene = useCallback((id: string | null) => {
    setActiveSceneId(id);
    if (!id) return null;
    const scene = scenes.find((entry) => entry.id === id) ?? null;
    if (scene) {
      setActivePresetId(scene.presetId);
      touchRecentPreset(scene.presetId);
    }
    return scene;
  }, [scenes, touchRecentPreset]);

  const activeScene = useMemo(() => scenes.find((scene) => scene.id === activeSceneId) ?? null, [activeSceneId, scenes]);

  const getAdjacentScene = useCallback((direction: -1 | 1) => {
    if (!scenes.length) return null;
    const currentIndex = activeSceneId ? scenes.findIndex((scene) => scene.id === activeSceneId) : -1;
    const nextIndex = currentIndex === -1
      ? direction === 1 ? 0 : scenes.length - 1
      : currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= scenes.length) return null;
    return scenes[nextIndex] ?? null;
  }, [activeSceneId, scenes]);

  return {
    presets: allPresets,
    activePresetId,
    recentPresets,
    scenes,
    activeScene,
    activeSceneId,
    savePreset,
    deletePreset,
    renamePreset,
    updatePresetDetails,
    exportPresetBundle,
    importPresetBundle,
    toggleFavorite,
    selectPreset,
    getPreset,
    addSceneFromPreset,
    updateScene,
    removeScene,
    moveScene,
    selectScene,
    getAdjacentScene,
  };
}
