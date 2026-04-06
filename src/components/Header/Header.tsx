import { useEffect, useRef } from 'react';
import styles from './Header.module.css';
import { Knob } from '../Knob/Knob';
import { LevelMeter } from '../LevelMeter/LevelMeter';
import { InputSelector } from '../InputSelector/InputSelector';
import { OutputSelector } from '../OutputSelector/OutputSelector';
import { MidiMapper } from '../MidiMapper/MidiMapper';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import type { RigSnapshot } from '../../types/presets';
import type { ParamDescriptor } from '../../types/effects';

const masterVolumeDescriptor: ParamDescriptor = {
  name: 'master',
  label: 'Master',
  min: 0,
  max: 150,
  default: 100,
  step: 1,
  unit: '%',
};

const inputTrimDescriptor: ParamDescriptor = {
  name: 'inputTrim',
  label: 'Input Trim',
  min: 0,
  max: 200,
  default: 100,
  step: 1,
  unit: '%',
};

interface HeaderProps {
  onStart: () => void | Promise<void>;
  onInputSelect: (deviceId: string) => void;
  onOutputSelect: (sinkId: string) => void;
  compareSlots: { A: RigSnapshot | null; B: RigSnapshot | null; active: 'A' | 'B' | null };
  onCaptureCompare: (slot: 'A' | 'B') => void;
  onRecallCompare: (slot: 'A' | 'B') => void;
}

export function Header({
  onStart,
  onInputSelect,
  onOutputSelect,
  compareSlots,
  onCaptureCompare,
  onRecallCompare,
}: HeaderProps) {
  const {
    isRunning,
    stop,
    masterVolume,
    inputTrim,
    muted,
    setMasterVolume,
    setInputTrim,
    setMuted,
    inputLevel,
    outputLevel,
    metronomeRunning,
    metronomeStart,
    metronomeStop,
    applyTapTempoToEffects,
    looperStatus,
    looperStartRecord,
    looperStopRecord,
    looperPlay,
    looperStop,
  } = useAudioEngineContext();
  const tapTimesRef = useRef<number[]>([]);

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current.filter((time) => now - time < 2000);
    taps.push(now);
    tapTimesRef.current = taps;
    if (taps.length < 2) return;
    const deltas: number[] = [];
    for (let i = 1; i < taps.length; i++) {
      deltas.push(taps[i]! - taps[i - 1]!);
    }
    const avg = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
    if (avg >= 120 && avg <= 3000) {
      applyTapTempoToEffects(Math.round(60000 / avg));
    }
  };

  const handleLooperRecordToggle = () => {
    if (looperStatus === 'recording') {
      void looperStopRecord();
      return;
    }
    if (looperStatus !== 'playing') {
      looperStartRecord();
    }
  };

  const handleLooperPlayToggle = () => {
    if (looperStatus === 'playing') {
      looperStop();
      return;
    }
    if (looperStatus === 'ready') {
      looperPlay();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) stop();
        else void onStart();
        return;
      }

      if (!isRunning) return;

      if (e.code === 'KeyM') {
        e.preventDefault();
        if (metronomeRunning) metronomeStop();
        else metronomeStart();
        return;
      }

      if (e.code === 'KeyT') {
        e.preventDefault();
        handleTapTempo();
        return;
      }

      if (e.code === 'KeyR') {
        e.preventDefault();
        handleLooperRecordToggle();
        return;
      }

      if (e.code === 'KeyP') {
        e.preventDefault();
        handleLooperPlayToggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    handleLooperPlayToggle,
    handleLooperRecordToggle,
    handleTapTempo,
    isRunning,
    metronomeRunning,
    metronomeStart,
    metronomeStop,
    onStart,
    stop,
  ]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.logo}>WAMP</h1>
        <div className={styles.powerSection}>
          {isRunning ? (
            <button type="button" className={`${styles.powerBtn} ${styles.on}`} onClick={stop}>
              <span className={styles.powerDot} /> ON
            </button>
          ) : (
            <button type="button" className={`${styles.powerBtn} ${styles.off}`} onClick={() => void onStart()}>
              <span className={styles.powerDot} /> START
            </button>
          )}
        </div>
        <div className={styles.ioStack}>
          <InputSelector onSelect={onInputSelect} disabled={false} />
          <OutputSelector onSelect={onOutputSelect} disabled={false} />
        </div>
        <div className={styles.midiSection}>
          <MidiMapper
            isRunning={isRunning}
            muted={muted}
            masterVolume={masterVolume}
            inputTrim={inputTrim}
            metronomeRunning={metronomeRunning}
            looperStatus={looperStatus}
            compareAReady={Boolean(compareSlots.A)}
            compareBReady={Boolean(compareSlots.B)}
            onStart={onStart}
            onStop={stop}
            onToggleMute={() => setMuted(!muted)}
            onSetMasterVolume={setMasterVolume}
            onSetInputTrim={setInputTrim}
            onMetronomeToggle={() => {
              if (metronomeRunning) metronomeStop();
              else metronomeStart();
            }}
            onTapTempo={handleTapTempo}
            onLooperRecordToggle={handleLooperRecordToggle}
            onLooperPlayToggle={handleLooperPlayToggle}
            onRecallCompare={onRecallCompare}
          />
        </div>
      </div>

      <div className={styles.right}>
        {isRunning && (
          <>
            <LevelMeter level={inputLevel} label="IN" />
            <LevelMeter level={outputLevel} label="OUT" color="#4da6e0" />
            <Knob
              descriptor={inputTrimDescriptor}
              value={inputTrim * 100}
              onChange={(v) => setInputTrim(v / 100)}
              color="#8fd3ff"
              size={44}
              ariaLabel="Input trim"
            />
            <Knob
              descriptor={masterVolumeDescriptor}
              value={masterVolume * 100}
              onChange={(v) => setMasterVolume(v / 100)}
              color="#e0c44d"
              size={44}
              ariaLabel="Master output level"
            />
            <button
              type="button"
              className={`${styles.utilityBtn} ${muted ? styles.utilityBtnActive : ''}`}
              onClick={() => setMuted(!muted)}
            >
              {muted ? 'Muted' : 'Mute'}
            </button>
            <div className={styles.compareSection}>
              <div className={styles.compareLabel}>Preset A/B</div>
              <div className={styles.compareButtons}>
                <button type="button" className={styles.compareStore} onClick={() => onCaptureCompare('A')}>
                  Store A
                </button>
                <button
                  type="button"
                  className={`${styles.compareToggle} ${compareSlots.active === 'A' ? styles.compareToggleActive : ''}`}
                  onClick={() => onRecallCompare('A')}
                  disabled={!compareSlots.A}
                >
                  A
                </button>
                <button type="button" className={styles.compareStore} onClick={() => onCaptureCompare('B')}>
                  Store B
                </button>
                <button
                  type="button"
                  className={`${styles.compareToggle} ${compareSlots.active === 'B' ? styles.compareToggleActive : ''}`}
                  onClick={() => onRecallCompare('B')}
                  disabled={!compareSlots.B}
                >
                  B
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
