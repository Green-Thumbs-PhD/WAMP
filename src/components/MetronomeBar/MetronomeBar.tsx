import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './MetronomeBar.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

const TAP_WINDOW_MS = 2000;
const MIN_TAPS = 2;

export function MetronomeBar() {
  const {
    isRunning,
    metronomeBpm,
    metronomeRunning,
    metronomeStart,
    metronomeStop,
    setMetronomeBpm,
    applyTapTempoToEffects,
  } = useAudioEngineContext();

  const [bpmInput, setBpmInput] = useState(String(metronomeBpm));
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    setBpmInput(String(metronomeBpm));
  }, [metronomeBpm]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapsRef.current.filter((t) => now - t < TAP_WINDOW_MS);
    taps.push(now);
    tapsRef.current = taps;
    if (taps.length < MIN_TAPS) return;
    const deltas: number[] = [];
    for (let i = 1; i < taps.length; i++) {
      deltas.push(taps[i]! - taps[i - 1]!);
    }
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    if (avg < 120 || avg > 3000) return;
    const bpm = Math.round(60000 / avg);
    applyTapTempoToEffects(bpm);
  }, [applyTapTempoToEffects]);

  const commitBpm = useCallback(() => {
    const n = Math.round(Number(bpmInput));
    if (!Number.isFinite(n)) {
      setBpmInput(String(metronomeBpm));
      return;
    }
    const clamped = Math.max(40, Math.min(280, n));
    setMetronomeBpm(clamped);
    setBpmInput(String(clamped));
  }, [bpmInput, metronomeBpm, setMetronomeBpm]);

  if (!isRunning) return null;

  return (
    <section className={styles.bar} aria-label="Metronome and tap tempo">
      <h2 className={styles.title}>Metronome / tap tempo</h2>
      <button
        type="button"
        className={styles.btn}
        onClick={() => (metronomeRunning ? metronomeStop() : metronomeStart())}
      >
        {metronomeRunning ? 'Metro off' : 'Metro on'}
      </button>
      <label>
        <span className={styles.visuallyHidden}>BPM</span>
        <input
          className={styles.bpm}
          type="number"
          min={40}
          max={280}
          value={bpmInput}
          onChange={(e) => setBpmInput(e.target.value)}
          onBlur={commitBpm}
          onKeyDown={(e) => e.key === 'Enter' && commitBpm()}
          aria-label="Beats per minute"
        />
      </label>
      <button type="button" className={styles.btn} onClick={handleTap}>
        Tap tempo
      </button>
      <button
        type="button"
        className={styles.btn}
        onClick={() => {
          const n = Number(bpmInput);
          if (Number.isFinite(n)) applyTapTempoToEffects(Math.round(n));
        }}
        title="Apply current BPM to delay time and tremolo rate"
      >
        Apply BPM to FX
      </button>
      <span className={styles.tapHint}>
        Tap at least twice. Sets BPM, delay (quarter note ms), and tremolo rate.
      </span>
    </section>
  );
}
