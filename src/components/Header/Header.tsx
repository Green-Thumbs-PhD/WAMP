import { useCallback, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import { Knob } from '../Knob/Knob';
import { LevelMeter } from '../LevelMeter/LevelMeter';
import { InputSelector } from '../InputSelector/InputSelector';
import { OutputSelector } from '../OutputSelector/OutputSelector';
import { PresetManager } from '../PresetManager/PresetManager';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import { usePresets } from '../../hooks/usePresets';
import type { ParamDescriptor } from '../../types/effects';
import type { Preset, PresetEffectSlot } from '../../types/presets';

const masterVolumeDescriptor: ParamDescriptor = {
  name: 'master',
  label: 'Master',
  min: 0,
  max: 150,
  default: 100,
  step: 1,
  unit: '%',
};

export function Header() {
  const {
    isRunning,
    start,
    stop,
    masterVolume,
    setMasterVolume,
    inputLevel,
    outputLevel,
    switchInput,
    switchOutput,
    loadPresetChain,
    chain,
  } = useAudioEngineContext();

  const { presets, activePresetId, savePreset, deletePreset, selectPreset } = usePresets();

  const pendingInputIdRef = useRef<string | undefined>(undefined);
  const pendingOutputIdRef = useRef('');
  const pendingPresetChainRef = useRef<PresetEffectSlot[] | undefined>(undefined);

  const handleInputSelect = useCallback(
    (deviceId: string) => {
      if (!deviceId) return;
      pendingInputIdRef.current = deviceId;
      if (isRunning) void switchInput(deviceId);
    },
    [isRunning, switchInput]
  );

  const handleOutputSelect = useCallback(
    (sinkId: string) => {
      pendingOutputIdRef.current = sinkId;
      if (isRunning && sinkId) void switchOutput(sinkId);
    },
    [isRunning, switchOutput]
  );

  const runStart = useCallback(async () => {
    await start(pendingInputIdRef.current, pendingPresetChainRef.current);
    pendingPresetChainRef.current = undefined;
    const out = pendingOutputIdRef.current;
    if (out) await switchOutput(out);
  }, [start, switchOutput]);

  const handleLoadPreset = useCallback(
    (preset: Preset) => {
      selectPreset(preset.id);
      loadPresetChain(preset.chain as Parameters<typeof loadPresetChain>[0]);
    },
    [selectPreset, loadPresetChain]
  );

  const handleIdlePresetPick = useCallback(
    (preset: Preset) => {
      selectPreset(preset.id);
      pendingPresetChainRef.current = preset.chain;
    },
    [selectPreset]
  );

  const handleSavePreset = useCallback(
    (name: string) => {
      savePreset(name, chain);
    },
    [savePreset, chain]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const t = e.target as HTMLElement;
      if (
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT' ||
        t.tagName === 'BUTTON' ||
        t.tagName === 'A' ||
        t.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      if (isRunning) stop();
      else void runStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRunning, stop, runStart]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.logo}>Mac2</h1>
        <div className={styles.powerSection}>
          {isRunning ? (
            <button type="button" className={`${styles.powerBtn} ${styles.on}`} onClick={stop}>
              <span className={styles.powerDot} /> ON
            </button>
          ) : (
            <button type="button" className={`${styles.powerBtn} ${styles.off}`} onClick={() => void runStart()}>
              <span className={styles.powerDot} /> START
            </button>
          )}
        </div>
        <div className={styles.ioStack}>
          <InputSelector onSelect={handleInputSelect} disabled={false} />
          <OutputSelector onSelect={handleOutputSelect} disabled={false} />
        </div>
      </div>

      <div className={styles.center}>
        <PresetManager
          presets={presets}
          activePresetId={activePresetId}
          onLoad={handleLoadPreset}
          onSave={handleSavePreset}
          onDelete={deletePreset}
          isEngineRunning={isRunning}
          onIdlePresetPick={handleIdlePresetPick}
        />
      </div>

      <div className={styles.right}>
        {isRunning && (
          <>
            <LevelMeter level={inputLevel} label="IN" />
            <LevelMeter level={outputLevel} label="OUT" color="#4da6e0" />
            <Knob
              descriptor={masterVolumeDescriptor}
              value={masterVolume * 100}
              onChange={(v) => setMasterVolume(v / 100)}
              color="#e0c44d"
              size={44}
              ariaLabel="Master output level"
            />
          </>
        )}
      </div>
    </header>
  );
}
