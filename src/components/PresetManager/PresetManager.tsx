import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PresetManager.module.css';
import type { SceneEntry, SpilloverStrategy } from '../../types/performance';
import type { Preset } from '../../types/presets';

const CATEGORY_OPTIONS = ['Clean', 'Crunch', 'Lead', 'Ambient', 'Heavy', 'Live', 'Utility', 'Custom'];

interface PresetManagerProps {
  presets: Preset[];
  activePresetId: string | null;
  recentPresets: Preset[];
  scenes: SceneEntry[];
  activeSceneId: string | null;
  liveMode: boolean;
  muteOnPresetLoad: boolean;
  spilloverStrategy: SpilloverStrategy;
  muted: boolean;
  onLoad: (preset: Preset) => void;
  onSave: (name: string, details?: { category?: string; tags?: string[]; description?: string; notes?: string }) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => boolean;
  onUpdateDetails: (id: string, details: { category?: string; tags?: string[]; description?: string; notes?: string }) => boolean;
  onToggleFavorite: (id: string) => void;
  onExportBundle: (presetId?: string) => string;
  onImportBundle: (raw: string) => number;
  onAddSceneFromPreset: (preset: Preset) => SceneEntry;
  onRecallScene: (scene: SceneEntry) => void;
  onUpdateScene: (id: string, updates: Partial<SceneEntry>) => void;
  onRemoveScene: (id: string) => void;
  onMoveScene: (id: string, direction: -1 | 1) => void;
  onStepScene: (direction: -1 | 1) => void;
  onToggleLiveMode: () => void;
  onToggleMuteOnPresetLoad: () => void;
  onSetSpilloverStrategy: (value: SpilloverStrategy) => void;
  onPanicMute: () => void;
  isEngineRunning: boolean;
  onIdlePresetPick?: (preset: Preset) => void;
}

function downloadJson(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function PresetManager({
  presets,
  activePresetId,
  recentPresets,
  scenes,
  activeSceneId,
  liveMode,
  muteOnPresetLoad,
  spilloverStrategy,
  muted,
  onLoad,
  onSave,
  onDelete,
  onRename,
  onUpdateDetails,
  onToggleFavorite,
  onExportBundle,
  onImportBundle,
  onAddSceneFromPreset,
  onRecallScene,
  onUpdateScene,
  onRemoveScene,
  onMoveScene,
  onStepScene,
  onToggleLiveMode,
  onToggleMuteOnPresetLoad,
  onSetSpilloverStrategy,
  onPanicMute,
  isEngineRunning,
  onIdlePresetPick,
}: PresetManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState('Custom');
  const [saveTags, setSaveTags] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [renameDraft, setRenameDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [tagsDraft, setTagsDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('Custom');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const categories = ['All', ...new Set(presets.map((preset) => preset.category).filter(Boolean))];
  const filteredPresets = presets.filter((preset) => {
    if (activeFilter === 'favorites' && !preset.favorite) return false;
    if (categoryFilter !== 'All' && preset.category !== categoryFilter) return false;
    return true;
  });
  const factoryPresets = filteredPresets.filter((p) => p.isFactory);
  const userPresets = filteredPresets.filter((p) => !p.isFactory);
  const activePreset = presets.find((preset) => preset.id === activePresetId) ?? null;
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? null;

  const footswitchHints = useMemo(() => [
    '[ ] Scene Prev/Next',
    '\\ Panic Mute',
    'Space Start/Stop Audio',
    'M Toggle Metronome',
    'R Loop Record',
    'P Loop Play',
  ], []);

  const syncDrafts = (preset: Preset | null) => {
    setRenameDraft(preset?.name ?? '');
    setDescriptionDraft(preset?.description ?? '');
    setNotesDraft(preset?.notes ?? '');
    setTagsDraft(preset?.tags.join(', ') ?? '');
    setCategoryDraft(preset?.category ?? 'Custom');
  };

  useEffect(() => {
    syncDrafts(activePreset);
  }, [activePreset]);

  const handleLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    syncDrafts(preset);
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
      description: saveDescription,
      notes: saveNotes,
    });
    setSaveName('');
    setSaveCategory('Custom');
    setSaveTags('');
    setSaveDescription('');
    setSaveNotes('');
    setShowSaveDialog(false);
  };

  const handleMetadataSave = () => {
    if (!activePreset || activePreset.isFactory) return;
    const renameChanged = renameDraft.trim() && renameDraft.trim() !== activePreset.name;
    if (renameChanged) onRename(activePreset.id, renameDraft.trim());
    onUpdateDetails(activePreset.id, {
      category: categoryDraft,
      tags: tagsDraft.split(',').map((tag) => tag.trim()).filter(Boolean),
      description: descriptionDraft,
      notes: notesDraft,
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    onImportBundle(raw);
    event.currentTarget.value = '';
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

      <div className={styles.recentRow}>
        {recentPresets.length > 0 ? recentPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={styles.recentBtn}
            onClick={() => {
              syncDrafts(preset);
              if (!isEngineRunning && onIdlePresetPick) onIdlePresetPick(preset);
              else onLoad(preset);
            }}
          >
            {preset.name}
          </button>
        )) : (
          <span className={styles.recentEmpty}>Recent presets appear here for quick recall.</span>
        )}
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
        <>
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

          <div className={styles.editorCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Preset Details</h3>
                <p className={styles.sectionCopy}>Rename presets, add context, and keep your library easier to scan later.</p>
              </div>
            </div>
            <div className={styles.editorGrid}>
              <input
                className={styles.input}
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                placeholder="Preset name"
                disabled={activePreset.isFactory}
              />
              <select
                className={styles.input}
                value={categoryDraft}
                onChange={(e) => setCategoryDraft(e.target.value)}
                disabled={activePreset.isFactory}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <input
                className={`${styles.input} ${styles.inputWide}`}
                value={tagsDraft}
                onChange={(e) => setTagsDraft(e.target.value)}
                placeholder="Tags: clean, live, single-coil"
                disabled={activePreset.isFactory}
              />
              <input
                className={`${styles.input} ${styles.inputWide}`}
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                placeholder="Short description"
                disabled={activePreset.isFactory}
              />
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Preset notes"
                disabled={activePreset.isFactory}
              />
            </div>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.btn}
                onClick={handleMetadataSave}
                disabled={activePreset.isFactory}
              >
                Save Details
              </button>
              <button
                type="button"
                className={styles.btn}
                onClick={() => downloadJson(`${activePreset.name.replace(/\s+/g, '-').toLowerCase()}.json`, onExportBundle(activePreset.id))}
              >
                Export Preset
              </button>
              {!activePreset.isFactory ? (
                <button
                  className={`${styles.btn} ${styles.deleteBtn}`}
                  onClick={() => onDelete(activePreset.id)}
                  title="Delete preset"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <div className={styles.actionRow}>
        <button
          className={styles.btn}
          onClick={() => setShowSaveDialog(true)}
          disabled={!isEngineRunning}
        >
          Save New
        </button>
        <button
          className={styles.btn}
          onClick={() => downloadJson('wamp-presets.json', onExportBundle())}
        >
          Export Library
        </button>
        <button
          className={styles.btn}
          onClick={() => importInputRef.current?.click()}
        >
          Import Presets
        </button>
        <input
          ref={importInputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
        />
      </div>

      {showSaveDialog ? (
        <div className={styles.saveDialog}>
          <input
            className={styles.input}
            type="text"
            placeholder="Preset name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
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
            className={`${styles.input} ${styles.inputWide}`}
            type="text"
            placeholder="Tags: clean, live, single-coil"
            value={saveTags}
            onChange={(e) => setSaveTags(e.target.value)}
          />
          <input
            className={`${styles.input} ${styles.inputWide}`}
            type="text"
            placeholder="Short description"
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
          />
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Preset notes"
            value={saveNotes}
            onChange={(e) => setSaveNotes(e.target.value)}
          />
          <button className={styles.btn} onClick={handleSave}>Save</button>
          <button className={styles.btn} onClick={() => setShowSaveDialog(false)}>Cancel</button>
        </div>
      ) : null}

      <div className={styles.editorCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Scene / Song Mode</h3>
            <p className={styles.sectionCopy}>Build a quick setlist, move through it in order, and keep cue text visible in live mode.</p>
          </div>
          <button
            type="button"
            className={styles.btn}
            onClick={() => activePreset && onAddSceneFromPreset(activePreset)}
            disabled={!activePreset}
          >
            Add Current To Set
          </button>
        </div>

        {activeScene ? (
          <div className={styles.cueCard}>
            <strong>{activeScene.songTitle || 'Untitled scene'}</strong>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={activeScene.cue}
              onChange={(e) => onUpdateScene(activeScene.id, { cue: e.target.value })}
              placeholder="Cue / per-song notes"
            />
          </div>
        ) : null}

        <div className={styles.sceneList}>
          {scenes.map((scene) => (
            <div key={scene.id} className={`${styles.sceneItem} ${activeSceneId === scene.id ? styles.sceneItemActive : ''}`}>
              <button
                type="button"
                className={styles.sceneRecall}
                onClick={() => onRecallScene(scene)}
              >
                {scene.songTitle || presets.find((preset) => preset.id === scene.presetId)?.name || 'Untitled scene'}
              </button>
              <input
                className={styles.input}
                value={scene.songTitle}
                onChange={(e) => onUpdateScene(scene.id, { songTitle: e.target.value })}
                placeholder="Song title"
              />
              <select
                className={styles.input}
                value={scene.presetId}
                onChange={(e) => onUpdateScene(scene.id, { presetId: e.target.value })}
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
              </select>
              <div className={styles.sceneButtons}>
                <button type="button" className={styles.btn} onClick={() => onMoveScene(scene.id, -1)}>Up</button>
                <button type="button" className={styles.btn} onClick={() => onMoveScene(scene.id, 1)}>Down</button>
                <button type="button" className={`${styles.btn} ${styles.deleteBtn}`} onClick={() => onRemoveScene(scene.id)}>Remove</button>
              </div>
            </div>
          ))}
          {scenes.length === 0 ? <p className={styles.emptyState}>Add presets to the setlist to start scene mode.</p> : null}
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.btn} onClick={() => onStepScene(-1)}>Prev Scene</button>
          <button type="button" className={styles.btn} onClick={() => onStepScene(1)}>Next Scene</button>
        </div>
      </div>

      <div className={styles.editorCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Live Mode</h3>
            <p className={styles.sectionCopy}>Larger controls, safer preset recall, and fast stage-oriented actions.</p>
          </div>
        </div>
        <div className={styles.toggleRow}>
          <label className={styles.toggleOption}>
            <input type="checkbox" checked={liveMode} onChange={onToggleLiveMode} />
            Live mode
          </label>
          <label className={styles.toggleOption}>
            <input type="checkbox" checked={muteOnPresetLoad} onChange={onToggleMuteOnPresetLoad} />
            Mute on preset load
          </label>
          <label className={styles.toggleOption}>
            Spillover
            <select
              className={styles.input}
              value={spilloverStrategy}
              onChange={(e) => onSetSpilloverStrategy(e.target.value as SpilloverStrategy)}
            >
              <option value="cut">Cut immediately</option>
              <option value="tail-safe">Tail-safe wait</option>
            </select>
          </label>
          <button
            type="button"
            className={`${styles.btn} ${styles.livePanicMuteBtn} ${muted ? styles.favoriteBtnActive : ''}`}
            onClick={onPanicMute}
          >
            {muted ? 'Unmute Output' : 'PANIC MUTE'}
          </button>
        </div>
        <div className={styles.footswitchRow}>
          {footswitchHints.map((hint) => (
            <span key={hint} className={styles.tagBadge}>{hint}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
