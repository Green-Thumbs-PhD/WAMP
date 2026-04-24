import { useEffect, useMemo, useState } from 'react';
import styles from './InputOutputMonitor.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

const HISTORY_SAMPLES = 48;
const SAMPLE_INTERVAL_MS = 120;

function toDb(level: number): number {
  return level > 0.0001 ? Math.max(-60, 20 * Math.log10(level)) : -60;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function InputOutputMonitor() {
  const {
    isRunning,
    inputLevel,
    inputTrim,
    inputMuted,
    setInputTrim,
    setInputMuted,
    muted,
    outputLevel,
    outputPeak,
    masterVolume,
    setMasterVolume,
    setMuted,
  } = useAudioEngineContext();

  const [inputHistory, setInputHistory] = useState<number[]>(() => Array.from({ length: HISTORY_SAMPLES }, () => 0));
  const [outputHistory, setOutputHistory] = useState<number[]>(() => Array.from({ length: HISTORY_SAMPLES }, () => 0));
  const [peakHold, setPeakHold] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setInputHistory(Array.from({ length: HISTORY_SAMPLES }, () => 0));
      setOutputHistory(Array.from({ length: HISTORY_SAMPLES }, () => 0));
      setPeakHold(0);
      return;
    }

    const timer = window.setInterval(() => {
      setInputHistory((current) => [...current.slice(-(HISTORY_SAMPLES - 1)), inputLevel]);
      const sample = Math.max(outputPeak, outputLevel);
      setOutputHistory((current) => [...current.slice(-(HISTORY_SAMPLES - 1)), sample]);
      setPeakHold((current) => Math.max(sample, current - 0.015));
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [inputLevel, isRunning, outputLevel, outputPeak]);

  const inputDb = toDb(inputLevel);
  const outputDb = toDb(outputLevel);
  const inputPercent = clamp(((inputDb + 60) / 60) * 100, 0, 100);
  const outputPeakPercent = clamp(outputPeak * 100, 0, 100);
  const holdPercent = clamp(peakHold * 100, 0, 100);
  const headroom = Math.max(0, -inputDb);

  const inputStatus = useMemo(() => {
    if (inputMuted) return { tone: 'muted', label: 'Mic muted', copy: 'Input monitoring is paused until the microphone channel is unmuted.' };
    if (inputDb <= -36) return { tone: 'low', label: 'Too quiet', copy: 'Raise input trim or play closer to the source for a healthier signal.' };
    if (inputDb <= -18) return { tone: 'warming', label: 'Getting there', copy: 'Signal is usable, but a little more level would improve the chain response.' };
    if (inputDb <= -9) return { tone: 'ideal', label: 'Sweet spot', copy: 'Healthy headroom for pedals and rack processing without crowding the top end.' };
    if (inputDb <= -3) return { tone: 'hot', label: 'Running hot', copy: 'Back the input trim down slightly to keep more headroom for peaks.' };
    return { tone: 'clip', label: 'Clip risk', copy: 'Input is too close to the ceiling and may crunch before the chain can shape it.' };
  }, [inputDb, inputMuted]);

  const outputStatus = useMemo(() => {
    if (muted) return { tone: 'muted', label: 'Output muted', copy: 'The output stage is muted, so the monitor is safe but not currently audible.' };
    if (outputPeak >= 0.98) return { tone: 'danger', label: 'Near clipping', copy: 'Immediate action recommended. Pull the master back or mute before the next peak hits.' };
    if (outputPeak >= 0.9) return { tone: 'warning', label: 'Safety margin low', copy: 'Peaks are crowding the ceiling. Trim the master slightly for safer playback headroom.' };
    return { tone: 'stable', label: 'Within range', copy: 'Output still has enough space for accents and transient spikes.' };
  }, [muted, outputPeak]);

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Input monitor and output safety">
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>Input Monitor</h3>
              <p className={styles.copy}>Watch the front-end signal before it hits the chain.</p>
            </div>
            <div className={`${styles.status} ${styles[`status${inputStatus.tone[0]!.toUpperCase()}${inputStatus.tone.slice(1)}`]}`}>{inputStatus.label}</div>
          </div>
          <div className={styles.readoutRow}>
            <div className={styles.readoutCard}><span className={styles.readoutLabel}>Input</span><strong className={styles.readoutValue}>{inputDb.toFixed(1)} dB</strong></div>
            <div className={styles.readoutCard}><span className={styles.readoutLabel}>Headroom</span><strong className={styles.readoutValue}>{headroom.toFixed(1)} dB</strong></div>
            <div className={styles.readoutCard}><span className={styles.readoutLabel}>Trim</span><strong className={styles.readoutValue}>{Math.round(inputTrim * 100)}%</strong></div>
          </div>
          <div className={styles.meter}>
            <div className={styles.zoneLow} />
            <div className={styles.zoneTarget} />
            <div className={styles.zoneHot} />
            <div className={styles.fill} style={{ width: `${inputPercent}%` }} />
          </div>
          <div className={styles.history}>
            {inputHistory.map((sample, index) => (
              <span key={`${index}-${sample.toFixed(4)}`} className={styles.historyBarInput} style={{ height: `${Math.max(8, clamp(sample * 100, 0, 100))}%` }} />
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => setInputTrim(clamp(inputTrim - 0.1, 0, 2))}>Trim -10%</button>
            <button type="button" className={styles.btn} onClick={() => setInputTrim(clamp(inputTrim + 0.1, 0, 2))} disabled={inputMuted}>Trim +10%</button>
            <button type="button" className={`${styles.btn} ${inputMuted ? styles.btnActive : ''}`} onClick={() => setInputMuted(!inputMuted)}>{inputMuted ? 'Unmute Input' : 'Mute Input'}</button>
          </div>
          <p className={styles.note}>{inputStatus.copy}</p>
        </div>

        <div className={styles.column}>
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>Output Safety</h3>
              <p className={styles.copy}>Keep the final stage clear of harsh peaks.</p>
            </div>
            <div className={`${styles.status} ${styles[`status${outputStatus.tone[0]!.toUpperCase()}${outputStatus.tone.slice(1)}`]}`}>{outputStatus.label}</div>
          </div>
          <div className={styles.readoutRow}>
            <div className={styles.readoutCard}><span className={styles.readoutLabel}>Current</span><strong className={styles.readoutValue}>{outputDb.toFixed(1)} dB</strong></div>
            <div className={styles.readoutCard}><span className={styles.readoutLabel}>Peak hold</span><strong className={styles.readoutValue}>{toDb(peakHold).toFixed(1)} dB</strong></div>
            <div className={styles.readoutCard}><span className={styles.readoutLabel}>Master</span><strong className={styles.readoutValue}>{Math.round(masterVolume * 100)}%</strong></div>
          </div>
          <div className={styles.meter}>
            <div className={styles.safeZone} />
            <div className={styles.warningZone} />
            <div className={styles.dangerZone} />
            <div className={styles.fill} style={{ width: `${outputPeakPercent}%` }} />
            <span className={styles.holdMarker} style={{ left: `${holdPercent}%` }} />
          </div>
          <div className={styles.history}>
            {outputHistory.map((sample, index) => (
              <span key={`${index}-${sample.toFixed(4)}`} className={styles.historyBarOutput} style={{ height: `${Math.max(8, clamp(sample * 100, 0, 100))}%` }} />
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => setMasterVolume(clamp(masterVolume * 0.707, 0, 1.5))}>Trim -3 dB</button>
            <button type="button" className={styles.btn} onClick={() => setMasterVolume(clamp(masterVolume * 0.5, 0, 1.5))}>Trim -6 dB</button>
            <button type="button" className={`${styles.btn} ${muted ? styles.btnActive : ''}`} onClick={() => setMuted(!muted)}>{muted ? 'Unmute output' : 'Panic mute'}</button>
            <button type="button" className={styles.btn} onClick={() => setPeakHold(outputPeak)}>Reset hold</button>
          </div>
          <p className={styles.note}>{outputStatus.copy}</p>
        </div>
      </div>
    </section>
  );
}
