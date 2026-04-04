import { useCallback } from 'react';
import styles from './LooperPanel.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

export function LooperPanel() {
  const {
    isRunning,
    looperStatus,
    looperDuration,
    looperStartRecord,
    looperStopRecord,
    looperPlay,
    looperStop,
    looperClear,
    setLooperLevel,
  } = useAudioEngineContext();

  const onStopRecord = useCallback(async () => {
    await looperStopRecord();
  }, [looperStopRecord]);

  if (!isRunning) return null;

  const isRecording = looperStatus === 'recording';
  const hasLoop = looperStatus === 'ready' || looperStatus === 'playing';
  const isPlaying = looperStatus === 'playing';

  const durLabel =
    looperDuration > 0 ? `${looperDuration.toFixed(2)}s` : '—';

  return (
    <section className={styles.panel} aria-label="Looper">
      <h2 className={styles.title}>Looper (post-FX)</h2>
      <button
        type="button"
        className={`${styles.btn} ${styles.rec} ${isRecording ? styles.recording : ''}`}
        onClick={() => (isRecording ? void onStopRecord() : looperStartRecord())}
        disabled={isPlaying}
      >
        {isRecording ? 'Stop + save loop' : 'Record'}
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={looperPlay}
        disabled={!hasLoop || isRecording || isPlaying}
      >
        Play
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={looperStop}
        disabled={!isPlaying}
      >
        Stop loop
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={looperClear}
        disabled={isRecording}
      >
        Clear
      </button>
      <span className={styles.meta}>
        {isRecording ? 'Recording…' : isPlaying ? 'Playing' : hasLoop ? 'Ready' : 'Idle'} · {durLabel}
      </span>
      <label className={styles.level}>
        Level
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={85}
          disabled={!hasLoop && !isPlaying}
          onChange={(e) => setLooperLevel(Number(e.target.value) / 100)}
          aria-label="Looper playback level"
        />
      </label>
    </section>
  );
}
