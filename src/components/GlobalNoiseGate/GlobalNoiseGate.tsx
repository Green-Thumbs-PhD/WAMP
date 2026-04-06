import styles from './GlobalNoiseGate.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

export function GlobalNoiseGate() {
  const {
    isRunning,
    globalNoiseGateEnabled,
    globalNoiseGateThreshold,
    globalNoiseGateRelease,
    globalNoiseGateReduction,
    setGlobalNoiseGateEnabled,
    setGlobalNoiseGateThreshold,
    setGlobalNoiseGateRelease,
    setGlobalNoiseGateReduction,
  } = useAudioEngineContext();

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Global input noise gate">
      <h2 className={styles.title}>Input gate</h2>
      <p className={styles.meta}>Pre-chain rack gate for noisy pickups before they hit the pedalboard.</p>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.btn} ${globalNoiseGateEnabled ? styles.btnActive : ''}`}
          onClick={() => setGlobalNoiseGateEnabled(!globalNoiseGateEnabled)}
        >
          {globalNoiseGateEnabled ? 'Gate on' : 'Gate off'}
        </button>
        <span className={styles.badge}>{globalNoiseGateEnabled ? 'pre-chain' : 'bypassed'}</span>
      </div>
      <label className={styles.control}>
        <span>Threshold</span>
        <input
          type="range"
          min={-70}
          max={-20}
          step={1}
          value={globalNoiseGateThreshold}
          onChange={(e) => setGlobalNoiseGateThreshold(Number(e.target.value))}
        />
        <strong>{globalNoiseGateThreshold} dB</strong>
      </label>
      <label className={styles.control}>
        <span>Release</span>
        <input
          type="range"
          min={20}
          max={500}
          step={5}
          value={globalNoiseGateRelease}
          onChange={(e) => setGlobalNoiseGateRelease(Number(e.target.value))}
        />
        <strong>{globalNoiseGateRelease} ms</strong>
      </label>
      <label className={styles.control}>
        <span>Reduction</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={globalNoiseGateReduction}
          onChange={(e) => setGlobalNoiseGateReduction(Number(e.target.value))}
        />
        <strong>{globalNoiseGateReduction}%</strong>
      </label>
    </section>
  );
}
