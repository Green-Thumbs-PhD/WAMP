import type { Preset, PresetEffectSlot, RigSnapshot } from '../types/presets';
import { createDefaultRackState, normalizeRackState } from '../types/rack';

const STORAGE_KEY_PRESETS = 'wamp.presets.v2';
const STORAGE_KEY_SESSION = 'wamp.session.v2';
const LEGACY_STORAGE_KEYS_PRESETS = ['mac2.presets.v2', 'mac2-presets'] as const;
const LEGACY_STORAGE_KEYS_SESSION = ['mac2.session.v2', 'mac2-last-state'] as const;

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
    favorite: Boolean(next.favorite),
  };
}

const STORAGE_KEY_PRESET_PREFERENCES = 'mac2.preset-prefs.v1';

interface PresetPreferences {
  favoriteIds: string[];
}

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
    };
  }

  return { favoriteIds: [] };
}

export function savePresetPreferences(preferences: PresetPreferences): void {
  const payload: StoredCollection<PresetPreferences> = {
    version: 2,
    data: {
      favoriteIds: preferences.favoriteIds,
    },
  };
  localStorage.setItem(STORAGE_KEY_PRESET_PREFERENCES, JSON.stringify(payload));
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
