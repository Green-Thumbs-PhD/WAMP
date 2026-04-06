import { useState } from 'react';
import styles from './CPUMonitor.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

export function CPUMonitor() {
  const [open, setOpen] = useState(false);
  const {
    isRunning,
    performanceSnapshot,
  } = useAudioEngineContext();

  const load = Math.round(performanceSnapshot.estimatedCpuLoad);

  return (
    <div className={`${styles.wrap} ${open ? styles.wrapOpen : ''}`}>
      <button
        type="button"
        className={`${styles.toggle} ${isRunning ? styles.toggleActive : ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'Hide CPU' : 'CPU'}
      </button>
      {open ? (
        <aside className={styles.panel} aria-label="CPU and latency monitor">
          <div className={styles.headerRow}>
            <strong>DSP Monitor</strong>
            <span>{isRunning ? 'live' : 'idle'}</span>
          </div>
          <div className={styles.meter}>
            <span className={styles.meterFill} style={{ width: `${load}%` }} />
          </div>
          <div className={styles.statRow}><span>Estimated load</span><strong>{load}%</strong></div>
          <div className={styles.statRow}><span>Base latency</span><strong>{performanceSnapshot.baseLatencyMs.toFixed(1)} ms</strong></div>
          <div className={styles.statRow}><span>Output latency</span><strong>{performanceSnapshot.outputLatencyMs.toFixed(1)} ms</strong></div>
          <div className={styles.statRow}><span>Frame avg</span><strong>{performanceSnapshot.averageFrameMs.toFixed(1)} ms</strong></div>
          <div className={styles.statRow}><span>Sample rate</span><strong>{performanceSnapshot.sampleRate || 0} Hz</strong></div>
          <div className={styles.statRow}><span>Active nodes</span><strong>{performanceSnapshot.activeNodes}</strong></div>
        </aside>
      ) : null}
    </div>
  );
}
