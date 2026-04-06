import styles from './OutputRecorder.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

export function OutputRecorder() {
  const {
    isRunning,
    outputRecorderActive,
    outputRecorderDuration,
    lastRecordingUrl,
    lastRecordingName,
    startOutputRecording,
    stopOutputRecording,
  } = useAudioEngineContext();

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Wet output recorder">
      <h2 className={styles.title}>Recorder / export</h2>
      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.btn} ${styles.rec} ${outputRecorderActive ? styles.recording : ''}`}
          onClick={() => {
            if (outputRecorderActive) {
              void stopOutputRecording();
            } else {
              startOutputRecording();
            }
          }}
        >
          {outputRecorderActive ? 'Stop capture' : 'Record output'}
        </button>
        {lastRecordingUrl ? (
          <a className={styles.btn} href={lastRecordingUrl} download={lastRecordingName || 'wamp-output.webm'}>
            Export last take
          </a>
        ) : null}
      </div>
      <p className={styles.meta}>
        {outputRecorderActive
          ? `Recording wet output · ${outputRecorderDuration.toFixed(1)}s`
          : lastRecordingUrl
            ? 'Last take is ready to export.'
            : 'Capture the processed rack and pedalboard output after the chain.'}
      </p>
    </section>
  );
}
