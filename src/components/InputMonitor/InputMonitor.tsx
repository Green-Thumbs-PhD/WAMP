import { useEffect, useMemo, useState } from 'react';
import styles from './InputMonitor.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

const HISTORY_SAMPLES = 48;
const SAMPLE_INTERVAL_MS = 120;

function toDb(level: number): number {
  return level > 0.0001 ? Math.max(-60, 20 * Math.log10(level)) : -60;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function InputMonitor() {
  const {
    isRunning,
    inputLevel,
    inputTrim,
    inputMuted,
    setInputTrim,
    setInputMuted,
  } = useAudioEngineContext();
  const [history, setHistory] = useState<number[]>(() => Array.from({ length: HISTORY_SAMPLES }, () => 0));

  useEffect(() => {
    if (!isRunning) {
      setHistory(Array.from({ length: HISTORY_SAMPLES }, () => 0));
      return;
    }

    const timer = window.setInterval(() => {
      setHistory((current) => [...current.slice(-(HISTORY_SAMPLES - 1)), inputLevel]);
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [inputLevel, isRunning]);

  const inputDb = toDb(inputLevel);
  const inputPercent = clamp(((inputDb + 60) / 60) * 100, 0, 100);
  const headroom = Math.max(0, -inputDb);

  const status = useMemo(() => {
    if (inputMuted) {
      return {
        tone: 'muted',
        label: 'Mic muted',
        copy: 'Input monitoring is paused until the microphone channel is unmuted.',
      };
    }
    if (inputDb <= -36) {
      return {
        tone: 'low',
        label: 'Too quiet',
        copy: 'Raise input trim or play closer to the source for a healthier signal.',
      };
    }
    if (inputDb <= -18) {
      return {
        tone: 'warming',
        label: 'Getting there',
        copy: 'Signal is usable, but a little more level would improve the chain response.',
      };
    }
    if (inputDb <= -9) {
      return {
        tone: 'ideal',
        label: 'Sweet spot',
        copy: 'Healthy headroom for pedals and rack processing without crowding the top end.',
      };
    }
    if (inputDb <= -3) {
      return {
        tone: 'hot',
        label: 'Running hot',
        copy: 'Back the input trim down slightly to keep more headroom for peaks.',
      };
    }
    return {
      tone: 'clip',
      label: 'Clip risk',
      copy: 'Input is too close to the ceiling and may crunch before the chain can shape it.',
    };
  }, [inputDb, inputMuted]);

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Input monitor and gain staging meter">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Input Monitor</h2>
          <p className={styles.copy}>Watch the front-end signal before it hits the chain and keep it in a safer gain-staging window.</p>
        </div>
        <div className={`${styles.status} ${styles[`status${status.tone[0]!.toUpperCase()}${status.tone.slice(1)}`]}`}>
          {status.label}
        </div>
      </div>

      <div className={styles.readoutRow}>
        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Input level</span>
          <strong className={styles.readoutValue}>{inputDb.toFixed(1)} dB</strong>
        </div>
        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Headroom</span>
          <strong className={styles.readoutValue}>{headroom.toFixed(1)} dB</strong>
        </div>
        <div className={styles.readoutCard}>
          <span className={styles.readoutLabel}>Trim</span>
          <strong className={styles.readoutValue}>{Math.round(inputTrim * 100)}%</strong>
        </div>
      </div>

      <div className={styles.meterBlock}>
        <div className={styles.scaleRow}>
          <span>-60</span>
          <span>-24</span>
          <span>-12</span>
          <span>-6</span>
          <span>0</span>
        </div>
        <div className={styles.meter}>
          <div className={styles.zoneLow} />
          <div className={styles.zoneTarget} />
          <div className={styles.zoneHot} />
          <div className={styles.fill} style={{ width: `${inputPercent}%` }} />
        </div>
        <div className={styles.legend}>
          <span>Quiet</span>
          <span>Target headroom</span>
          <span>Too hot</span>
        </div>
      </div>

      <div className={styles.historyBlock}>
        <div className={styles.historyHeader}>
          <span className={styles.historyLabel}>Recent input activity</span>
          <span className={styles.historyHint}>This gives you a quick feel for picking dynamics and trim behavior.</span>
        </div>
        <div className={styles.history} aria-hidden="true">
          {history.map((sample, index) => (
            <span
              key={`${index}-${sample.toFixed(4)}`}
              className={styles.historyBar}
              style={{ height: `${Math.max(8, clamp(sample * 100, 0, 100))}%` }}
            />
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={() => setInputTrim(clamp(inputTrim - 0.1, 0, 2))}>
          Trim -10%
        </button>
        <button type="button" className={styles.btn} onClick={() => setInputTrim(clamp(inputTrim + 0.1, 0, 2))} disabled={inputMuted}>
          Trim +10%
        </button>
        <button
          type="button"
          className={`${styles.btn} ${inputMuted ? styles.btnActive : ''}`}
          onClick={() => setInputMuted(!inputMuted)}
        >
          {inputMuted ? 'Unmute Input' : 'Mute Input'}
        </button>
      </div>

      <p className={styles.note}>{status.copy}</p>
    </section>
  );
}
