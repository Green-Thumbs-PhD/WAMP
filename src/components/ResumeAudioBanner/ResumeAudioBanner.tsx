import styles from './ResumeAudioBanner.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

export function ResumeAudioBanner() {
  const { isRunning, contextState, resumeAudioContext } = useAudioEngineContext();

  if (!isRunning || contextState !== 'suspended') return null;

  return (
    <div className={styles.banner} role="status">
      <span>Audio context is suspended (browser policy). Sound may be muted.</span>
      <button type="button" className={styles.btn} onClick={() => void resumeAudioContext()}>
        Resume audio
      </button>
    </div>
  );
}
