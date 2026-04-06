import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './MetronomeBar.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

const TAP_WINDOW_MS = 2000;
const MIN_TAPS = 2;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getTunerDisplay(frequency: number | null) {
  if (!frequency || !Number.isFinite(frequency) || frequency <= 0) {
    return {
      note: '--',
      frequencyText: 'No pitch',
      cents: null as number | null,
      status: 'idle' as 'idle' | 'flat' | 'sharp' | 'inTune',
    };
  }

  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const reference = 440 * 2 ** ((midi - 69) / 12);
  const cents = Math.round(1200 * Math.log2(frequency / reference));
  const noteIndex = ((midi % 12) + 12) % 12;
  const status =
    Math.abs(cents) <= 5 ? 'inTune' : cents < 0 ? 'flat' : 'sharp';

  return {
    note: NOTE_NAMES[noteIndex] ?? '--',
    frequencyText: `${frequency.toFixed(1)} Hz`,
    cents,
    status,
  };
}

export function MetronomeBar() {
  const {
    isRunning,
    metronomeBpm,
    metronomeRunning,
    metronomeStart,
    metronomeStop,
    setMetronomeBpm,
    applyTapTempoToEffects,
    tuner,
  } = useAudioEngineContext();

  const [bpmInput, setBpmInput] = useState(String(metronomeBpm));
  const tapsRef = useRef<number[]>([]);
  const tunerDisplay = getTunerDisplay(tuner.stabilizedFrequency ?? tuner.frequency);
  const confidence = Math.round(tuner.clarity * 100);
  const signal = Math.round(Math.min(1, tuner.signal * 12) * 100);

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
      <h2 className={styles.title}>Metronome / tuner</h2>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>Tempo</div>
        <div className={styles.controlRow}>
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
        </div>
        <span className={styles.tapHint}>
          Tap at least twice. Sets BPM, delay quarter-note time, and tremolo rate.
        </span>
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>Tuner</div>
        <div className={styles.tunerPanel}>
          <div className={styles.tunerNote}>{tunerDisplay.note}</div>
          <div className={styles.tunerMeta}>
            <span className={styles.tunerFreq}>{tunerDisplay.frequencyText}</span>
            <span
              className={styles.tunerCents}
              data-status={tunerDisplay.status}
            >
              {tunerDisplay.cents === null ? 'Play a single note' : `${tunerDisplay.cents > 0 ? '+' : ''}${tunerDisplay.cents} cents`}
            </span>
            <div className={styles.trackingRow}>
              <span>Confidence {confidence}%</span>
              <span>Signal {signal}%</span>
            </div>
            <div className={styles.meterTrack}>
              <span className={styles.meterFill} style={{ width: `${confidence}%` }} />
            </div>
            {tuner.recentNotes.length > 0 ? (
              <div className={styles.noteTrail}>
                {tuner.recentNotes.map((note) => (
                  <span key={note} className={styles.noteChip}>{note}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
