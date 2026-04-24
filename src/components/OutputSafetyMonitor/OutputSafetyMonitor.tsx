import { useEffect, useMemo, useState } from 'react';
import styles from './OutputSafetyMonitor.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

const HISTORY_SAMPLES = 48;
const SAMPLE_INTERVAL_MS = 120;

function toDb(level: number): number {
  return level > 0.0001 ? Math.max(-60, 20 * Math.log10(level)) : -60;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function OutputSafetyMonitor() {
  const {
    isRunning,
    muted,
    outputLevel,
    outputPeak,
    masterVolume,
    setMasterVolume,
    setMuted,
  } = useAudioEngineContext();
  const [history, setHistory] = useState<number[]>(() => Array.from({ length: HISTORY_SAMPLES }, () => 0));
  const [peakHold, setPeakHold] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setHistory(Array.from({ length: HISTORY_SAMPLES }, () => 0));
      setPeakHold(0);
      return;
    }

    const timer = window.setInterval(() => {
      const sample = Math.max(outputPeak, outputLevel);
      setHistory((current) => [...current.slice(-(HISTORY_SAMPLES - 1)), sample]);
      setPeakHold((current) => Math.max(sample, current - 0.015));
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isRunning, outputLevel, outputPeak]);

  const currentDb = toDb(outputLevel);
  const peakPercent = clamp(outputPeak * 100, 0, 100);
  const holdPercent = clamp(peakHold * 100, 0, 100);

  const status = useMemo(() => {
    if (muted) {
      return {
        tone: 'muted',
        label: 'Output muted',
        copy: 'The output stage is muted, so the monitor is safe but not currently audible.',
      };
    }
    if (outputPeak >= 0.98) {
      return {
        tone: 'danger',
        label: 'Near clipping',
        copy: 'Immediate action recommended. Pull the master back or mute before the next peak hits.',
      };
    }
    if (outputPeak >= 0.9) {
      return {
        tone: 'warning',
        label: 'Safety margin low',
        copy: 'Peaks are crowding the ceiling. Trim the master slightly for safer playback headroom.',
      };
    }
    return {
      tone: 'stable',
      label: 'Within range',
      copy: 'Output still has enough space for accents and transient spikes.',
    };
  }, [muted, outputPeak]);

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Output safety and limiter monitor">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Output Safety</h2>
          <p className={styles.copy}>Keep the final stage clear of nasty peaks and use fast safety actions when the rig starts to run too hot.</p>
        </div>
        <div className={`${styles.status} ${styles[`status${status.tone[0]!.toUpperCase()}${status.tone.slice(1)}`]}`}>
          {status.label}
        </div>
      </div>

      <div className={styles.readoutRow}>
        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Current</span>
          <strong className={styles.readoutValue}>{currentDb.toFixed(1)} dB</strong>
        </div>
        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Peak hold</span>
          <strong className={styles.readoutValue}>{toDb(peakHold).toFixed(1)} dB</strong>
        </div>
        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Master</span>
          <strong className={styles.readoutValue}>{Math.round(masterVolume * 100)}%</strong>
        </div>
      </div>

      <div className={styles.meterBlock}>
        <div className={styles.scaleRow}>
          <span>-60</span>
          <span>-18</span>
          <span>-9</span>
          <span>-3</span>
          <span>0</span>
        </div>
        <div className={styles.meter}>
          <div className={styles.safeZone} />
          <div className={styles.warningZone} />
          <div className={styles.dangerZone} />
          <div className={styles.fill} style={{ width: `${peakPercent}%` }} />
          <span className={styles.holdMarker} style={{ left: `${holdPercent}%` }} />
        </div>
        <div className={styles.legend}>
          <span>Comfortable</span>
          <span>Watch peaks</span>
          <span>Clip edge</span>
        </div>
      </div>

      <div className={styles.history}>
        {history.map((sample, index) => (
          <span
            key={`${index}-${sample.toFixed(4)}`}
            className={styles.historyBar}
            style={{ height: `${Math.max(8, clamp(sample * 100, 0, 100))}%` }}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={() => setMasterVolume(clamp(masterVolume * 0.707, 0, 1.5))}>
          Trim -3 dB
        </button>
        <button type="button" className={styles.btn} onClick={() => setMasterVolume(clamp(masterVolume * 0.5, 0, 1.5))}>
          Trim -6 dB
        </button>
        <button
          type="button"
          className={`${styles.btn} ${muted ? styles.btnActive : ''}`}
          onClick={() => setMuted(!muted)}
        >
          {muted ? 'Unmute output' : 'Panic mute'}
        </button>
        <button type="button" className={styles.btn} onClick={() => setPeakHold(outputPeak)}>
          Reset hold
        </button>
      </div>

      <p className={styles.note}>{status.copy}</p>
    </section>
  );
}
