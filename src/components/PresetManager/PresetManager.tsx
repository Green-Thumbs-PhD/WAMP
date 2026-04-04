import { useState } from 'react';
import styles from './PresetManager.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import type { Preset } from '../../types/presets';

interface PresetManagerProps {
  presets: Preset[];
  activePresetId: string | null;
  onLoad: (preset: Preset) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
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
  isEngineRunning,
  onIdlePresetPick,
}: PresetManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const { chain } = useAudioEngineContext();

  const factoryPresets = presets.filter((p) => p.isFactory);
  const userPresets = presets.filter((p) => !p.isFactory);

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
    onSave(saveName.trim());
    setSaveName('');
    setShowSaveDialog(false);
  };

  return (
    <div className={styles.container}>
      <select
        className={styles.select}
        value={activePresetId || ''}
        onChange={handleLoad}
      >
        <option value="">-- Presets --</option>
        <optgroup label="Factory">
          {factoryPresets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </optgroup>
        {userPresets.length > 0 && (
          <optgroup label="User">
            {userPresets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        )}
      </select>

      <button
        className={styles.btn}
        onClick={() => setShowSaveDialog(true)}
        disabled={!isEngineRunning || chain.length === 0}
        title={
          !isEngineRunning
            ? 'Start audio to save the current chain'
            : 'Save current chain as preset'
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
          <button className={styles.btn} onClick={handleSave}>OK</button>
          <button className={styles.btn} onClick={() => setShowSaveDialog(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
