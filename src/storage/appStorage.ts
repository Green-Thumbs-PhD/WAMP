import type { Preset, PresetEffectSlot, RigSnapshot } from '../types/presets';
import type { PerformanceSettings, SceneEntry } from '../types/performance';
import { createDefaultRackState, normalizeRackState } from '../types/rack';

const STORAGE_KEY_PRESETS = 'wamp.presets.v2';
const STORAGE_KEY_SESSION = 'wamp.session.v2';
const STORAGE_KEY_PRESET_PREFERENCES = 'wamp.preset-prefs.v2';
const STORAGE_KEY_SCENES = 'wamp.scenes.v1';
const STORAGE_KEY_PERFORMANCE_SETTINGS = 'wamp.performance.v1';
const LEGACY_STORAGE_KEYS_PRESETS = ['mac2.presets.v2', 'mac2-presets'] as const;
const LEGACY_STORAGE_KEYS_SESSION = ['mac2.session.v2', 'mac2-last-state'] as const;
const LEGACY_STORAGE_KEY_PRESET_PREFERENCES = 'mac2.preset-prefs.v1';

interface LegacyPreset {
  id: string;
  name: string;
  isFactory: boolean;
  chain: PresetEffectSlot[];
}

interface LegacyPresetV2 extends LegacyPreset {
  rack?: RigSnapshot['rack'];
  category?: string;
  tags?: string[];
  description?: string;
  notes?: string;
  favorite?: boolean;
}

interface StoredCollection<T> {
  version: 2;
  data: T;
}

function parseStoredCollection<T>(raw: string | null): StoredCollection<T> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCollection<T>;
  } catch {
    return null;
  }
}

function normalizePreset(preset: LegacyPreset | LegacyPresetV2 | Preset): Preset {
  const next = preset as LegacyPresetV2 | Preset;

  return {
    id: next.id,
    name: next.name,
    isFactory: next.isFactory,
    chain: next.chain ?? [],
    rack: normalizeRackState(next.rack),
    category: next.category?.trim() || 'Custom',
    tags: Array.isArray(next.tags) ? next.tags.filter(Boolean) : [],
    description: next.description?.trim() || '',
    notes: next.notes?.trim() || '',
    favorite: Boolean(next.favorite),
  };
}

interface PresetPreferences {
  favoriteIds: string[];
  recentPresetIds: string[];
}

const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  liveMode: false,
  muteOnPresetLoad: false,
  spilloverStrategy: 'cut',
  rackToolOrder: [],
  minimizedRackToolIds: [],
};

export function loadUserPresets(): Preset[] {
  const stored = parseStoredCollection<Preset[]>(localStorage.getItem(STORAGE_KEY_PRESETS));
  if (stored?.data) {
    return stored.data.map(normalizePreset);
  }

  try {
    for (const legacyKey of LEGACY_STORAGE_KEYS_PRESETS) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (!legacyRaw) continue;

      const parsed = legacyKey === 'mac2.presets.v2'
        ? parseStoredCollection<Preset[]>(legacyRaw)?.data ?? []
        : (JSON.parse(legacyRaw) as LegacyPreset[]);
      const migrated = parsed.map(normalizePreset);
      saveUserPresets(migrated);
      return migrated;
    }

    return [];
  } catch {
    return [];
  }
}

export function saveUserPresets(presets: Preset[]): void {
  const payload: StoredCollection<Preset[]> = {
    version: 2,
    data: presets.map(normalizePreset),
  };
  localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(payload));
}

export function loadPresetPreferences(): PresetPreferences {
  const stored = parseStoredCollection<PresetPreferences>(localStorage.getItem(STORAGE_KEY_PRESET_PREFERENCES));
  if (stored?.data) {
    return {
      favoriteIds: Array.isArray(stored.data.favoriteIds) ? stored.data.favoriteIds : [],
      recentPresetIds: Array.isArray(stored.data.recentPresetIds) ? stored.data.recentPresetIds : [],
    };
  }

  const legacy = parseStoredCollection<PresetPreferences>(localStorage.getItem(LEGACY_STORAGE_KEY_PRESET_PREFERENCES));
  if (legacy?.data) {
    return {
      favoriteIds: Array.isArray(legacy.data.favoriteIds) ? legacy.data.favoriteIds : [],
      recentPresetIds: Array.isArray(legacy.data.recentPresetIds) ? legacy.data.recentPresetIds : [],
    };
  }

  return { favoriteIds: [], recentPresetIds: [] };
}

export function savePresetPreferences(preferences: PresetPreferences): void {
  const payload: StoredCollection<PresetPreferences> = {
    version: 2,
    data: {
      favoriteIds: preferences.favoriteIds,
      recentPresetIds: preferences.recentPresetIds,
    },
  };
  localStorage.setItem(STORAGE_KEY_PRESET_PREFERENCES, JSON.stringify(payload));
}

export function loadScenes(): SceneEntry[] {
  const stored = parseStoredCollection<SceneEntry[]>(localStorage.getItem(STORAGE_KEY_SCENES));
  if (!stored?.data) return [];
  return stored.data.filter((scene) => typeof scene?.presetId === 'string' && typeof scene?.id === 'string').map((scene) => ({
    id: scene.id,
    presetId: scene.presetId,
    songTitle: scene.songTitle?.trim() || '',
    cue: scene.cue?.trim() || '',
  }));
}

export function saveScenes(scenes: SceneEntry[]): void {
  const payload: StoredCollection<SceneEntry[]> = {
    version: 2,
    data: scenes,
  };
  localStorage.setItem(STORAGE_KEY_SCENES, JSON.stringify(payload));
}

export function loadPerformanceSettings(): PerformanceSettings {
  const stored = parseStoredCollection<PerformanceSettings>(localStorage.getItem(STORAGE_KEY_PERFORMANCE_SETTINGS));
  if (!stored?.data) return DEFAULT_PERFORMANCE_SETTINGS;

  return {
    liveMode: Boolean(stored.data.liveMode),
    muteOnPresetLoad: Boolean(stored.data.muteOnPresetLoad),
    spilloverStrategy: stored.data.spilloverStrategy === 'tail-safe' ? 'tail-safe' : 'cut',
    rackToolOrder: Array.isArray(stored.data.rackToolOrder) ? stored.data.rackToolOrder.filter((id) => typeof id === 'string') : [],
    minimizedRackToolIds: Array.isArray(stored.data.minimizedRackToolIds)
      ? stored.data.minimizedRackToolIds.filter((id) => typeof id === 'string')
      : [],
  };
}

export function savePerformanceSettings(settings: PerformanceSettings): void {
  const payload: StoredCollection<PerformanceSettings> = {
    version: 2,
    data: settings,
  };
  localStorage.setItem(STORAGE_KEY_PERFORMANCE_SETTINGS, JSON.stringify(payload));
}

export function loadLastSession(): RigSnapshot | null {
  const stored = parseStoredCollection<RigSnapshot>(localStorage.getItem(STORAGE_KEY_SESSION));
  if (stored?.data) {
    return {
      chain: stored.data.chain ?? [],
      rack: normalizeRackState(stored.data.rack),
    };
  }

  try {
    for (const legacyKey of LEGACY_STORAGE_KEYS_SESSION) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (!legacyRaw) continue;

      const migrated = legacyKey === 'mac2.session.v2'
        ? (() => {
            const parsed = parseStoredCollection<RigSnapshot>(legacyRaw)?.data;
            if (!parsed) return null;
            return {
              chain: parsed.chain ?? [],
              rack: normalizeRackState(parsed.rack),
            } satisfies RigSnapshot;
          })()
        : {
            chain: JSON.parse(legacyRaw) as PresetEffectSlot[],
            rack: createDefaultRackState(),
          };

      if (!migrated) continue;

      saveLastSession(migrated);
      return migrated;
    }

    return null;
  } catch {
    return null;
  }
}

export function saveLastSession(snapshot: RigSnapshot): void {
  const payload: StoredCollection<RigSnapshot> = {
    version: 2,
    data: {
      chain: snapshot.chain,
      rack: normalizeRackState(snapshot.rack),
    },
  };
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(payload));
}
