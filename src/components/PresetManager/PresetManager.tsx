import { useState } from 'react';
import styles from './PresetManager.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import type { Preset } from '../../types/presets';

const CATEGORY_OPTIONS = ['Clean', 'Crunch', 'Lead', 'Ambient', 'Heavy', 'Live', 'Utility', 'Custom'];

interface PresetManagerProps {
  presets: Preset[];
  activePresetId: string | null;
  onLoad: (preset: Preset) => void;
  onSave: (name: string, details?: { category?: string; tags?: string[] }) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  /** When false, Save is disabled and picking a preset only notifies `onIdlePresetPick`. */
  isEngineRunning: boolean;
  onIdlePresetPick?: (preset: Preset) => void;
}

export function PresetManager({
  presets,
  activePresetId,
  onLoad,
  onSave,
  onDelete,
  onToggleFavorite,
  isEngineRunning,
  onIdlePresetPick,
}: PresetManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState('Custom');
  const [saveTags, setSaveTags] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const { chain } = useAudioEngineContext();

  const categories = ['All', ...new Set(presets.map((preset) => preset.category).filter(Boolean))];
  const filteredPresets = presets.filter((preset) => {
    if (activeFilter === 'favorites' && !preset.favorite) return false;
    if (categoryFilter !== 'All' && preset.category !== categoryFilter) return false;
    return true;
  });
  const factoryPresets = filteredPresets.filter((p) => p.isFactory);
  const userPresets = filteredPresets.filter((p) => !p.isFactory);
  const activePreset = presets.find((preset) => preset.id === activePresetId) ?? null;

  const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    if (!isEngineRunning && onIdlePresetPick) {
      onIdlePresetPick(preset);
      return;
    }
    onLoad(preset);
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSave(saveName.trim(), {
      category: saveCategory,
      tags: saveTags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
    setSaveName('');
    setSaveCategory('Custom');
    setSaveTags('');
    setShowSaveDialog(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterRow}>
        <button
          type="button"
          className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.filterBtnActive : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${activeFilter === 'favorites' ? styles.filterBtnActive : ''}`}
          onClick={() => setActiveFilter('favorites')}
        >
          Favorites
        </button>
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <select
        className={styles.select}
        value={activePresetId || ''}
        onChange={handleLoad}
      >
        <option value="">-- Presets --</option>
        <optgroup label="Factory">
          {factoryPresets.map((p) => (
            <option key={p.id} value={p.id}>{p.favorite ? '★ ' : ''}{p.name}</option>
          ))}
        </optgroup>
        {userPresets.length > 0 && (
          <optgroup label="User">
            {userPresets.map((p) => (
              <option key={p.id} value={p.id}>{p.favorite ? '★ ' : ''}{p.name}</option>
            ))}
          </optgroup>
        )}
      </select>
      {activePreset ? (
        <div className={styles.metaRow}>
          <button
            type="button"
            className={`${styles.favoriteBtn} ${activePreset.favorite ? styles.favoriteBtnActive : ''}`}
            onClick={() => onToggleFavorite(activePreset.id)}
            title={activePreset.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {activePreset.favorite ? '★ Favorite' : '☆ Favorite'}
          </button>
          <span className={styles.categoryBadge}>{activePreset.category}</span>
          {activePreset.tags.map((tag) => (
            <span key={tag} className={styles.tagBadge}>{tag}</span>
          ))}
        </div>
      ) : null}

      <button
        className={styles.btn}
        onClick={() => setShowSaveDialog(true)}
        disabled={!isEngineRunning || chain.length === 0}
        title={
          !isEngineRunning
            ? 'Start audio to save the current rig'
            : 'Save current rig as preset'
        }
      >
        Save
      </button>

      {isEngineRunning &&
        activePresetId &&
        !presets.find((p) => p.id === activePresetId)?.isFactory && (
        <button
          className={`${styles.btn} ${styles.deleteBtn}`}
          onClick={() => onDelete(activePresetId)}
          title="Delete preset"
        >
          Del
        </button>
      )}

      {showSaveDialog && (
        <div className={styles.saveDialog}>
          <input
            className={styles.input}
            type="text"
            placeholder="Preset name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <select
            className={styles.input}
            value={saveCategory}
            onChange={(e) => setSaveCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input
            className={styles.input}
            type="text"
            placeholder="Tags: clean, live, single-coil"
            value={saveTags}
            onChange={(e) => setSaveTags(e.target.value)}
          />
          <button className={styles.btn} onClick={handleSave}>OK</button>
          <button className={styles.btn} onClick={() => setShowSaveDialog(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
