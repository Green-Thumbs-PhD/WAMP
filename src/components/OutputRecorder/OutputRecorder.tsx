import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './OutputRecorder.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

const VISUALIZER_SAMPLES = 80;
const SAMPLE_INTERVAL_MS = 85;

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  const tenths = Math.floor((safeSeconds % 1) * 10);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

function buildSeedBars(length: number): number[] {
  return Array.from({ length }, () => 0);
}

export function OutputRecorder() {
  const {
    isRunning,
    outputLevel,
    outputPeak,
    outputRecorderActive,
    outputRecorderDuration,
    lastRecordingUrl,
    lastRecordingName,
    lastRecordingDuration,
    startOutputRecording,
    stopOutputRecording,
    clearLastOutputRecording,
  } = useAudioEngineContext();
  const [levelHistory, setLevelHistory] = useState<number[]>(() => buildSeedBars(VISUALIZER_SAMPLES));
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const outputLevelRef = useRef(0);
  const outputPeakRef = useRef(0);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    outputLevelRef.current = outputLevel;
    outputPeakRef.current = outputPeak;
  }, [outputLevel, outputPeak]);

  useEffect(() => {
    if (!isRunning) {
      setLevelHistory(buildSeedBars(VISUALIZER_SAMPLES));
      return;
    }

    const interval = window.setInterval(() => {
      const level = outputLevelRef.current;
      const peak = outputPeakRef.current;
      const sample = Math.max(0.04, Math.min(1, outputRecorderActive ? Math.max(level, peak * 0.92) : level * 0.8));
      setLevelHistory((current) => [...current.slice(-(VISUALIZER_SAMPLES - 1)), sample]);
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isRunning, outputRecorderActive]);

  useEffect(() => {
    const audio = playbackRef.current;
    if (!audio) return;

    const syncTime = () => {
      setPlaybackPosition(audio.currentTime);
      if (Number.isFinite(audio.duration)) setPlaybackDuration(audio.duration);
    };
    const onLoaded = () => {
      setPlaybackDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setPlaybackPosition(audio.currentTime || 0);
    };
    const onPlay = () => setIsPlaybackActive(true);
    const onPause = () => setIsPlaybackActive(false);
    const onEnded = () => {
      setIsPlaybackActive(false);
      setPlaybackPosition(0);
    };

    audio.addEventListener('timeupdate', syncTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    onLoaded();

    return () => {
      audio.removeEventListener('timeupdate', syncTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [lastRecordingUrl]);

  useEffect(() => {
    const audio = playbackRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaybackActive(false);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
  }, [lastRecordingUrl]);

  const displayedDuration = outputRecorderActive ? outputRecorderDuration : lastRecordingDuration;
  const playbackProgress = playbackDuration > 0
    ? Math.max(0, Math.min(1, playbackPosition / playbackDuration))
    : 0;
  const statusLabel = outputRecorderActive
    ? 'Recording live'
    : isPlaybackActive
      ? 'Playback'
    : lastRecordingUrl
      ? 'Take ready'
      : 'Recorder armed';
  const helperCopy = outputRecorderActive
    ? 'Recording the wet output after the rack and pedal chain.'
    : lastRecordingUrl
      ? 'Export, review, or clear the current take before starting again.'
      : 'Hit record to capture the processed output from the full rig.';
  const peakPercent = `${Math.round(outputPeak * 100)}%`;
  const elapsedBars = useMemo(() => levelHistory.some((value) => value > 0.05), [levelHistory]);

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Wet output recorder">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Recorder / export</h2>
          <p className={styles.copy}>{helperCopy}</p>
        </div>
        <div className={`${styles.statusBadge} ${outputRecorderActive ? styles.statusLive : ''}`}>
          <span className={styles.statusDot} aria-hidden="true" />
          {statusLabel}
        </div>
      </div>

      <div className={styles.transport}>
        <div className={styles.timeBlock}>
          <span className={styles.timeLabel}>{outputRecorderActive ? 'Elapsed' : 'Last take'}</span>
          <div className={styles.timeValue}>{formatDuration(displayedDuration)}</div>
        </div>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Peak</span>
            <strong className={styles.statValue}>{peakPercent}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Take</span>
            <strong className={styles.statValue}>{lastRecordingUrl ? 'Loaded' : 'Empty'}</strong>
          </div>
        </div>
      </div>

      <div className={styles.visualizerShell}>
        <div className={styles.visualizerHeader}>
          <span className={styles.visualizerLabel}>Recording timeline</span>
          <span className={styles.visualizerHint}>
            {elapsedBars ? 'Live output activity across the current or last take.' : 'Press record to populate the timeline.'}
          </span>
        </div>
        <div className={styles.visualizer} aria-hidden="true">
          <div className={styles.visualizerGlow} />
          <div
            className={styles.playbackFill}
            style={{ width: `${playbackProgress * 100}%` }}
          />
          {levelHistory.map((level, index) => (
            <span
              key={`${index}-${level.toFixed(3)}`}
              className={`${styles.bar} ${outputRecorderActive ? styles.barLive : ''}`}
              style={{ height: `${Math.max(10, level * 100)}%` }}
            />
          ))}
          <div className={styles.scanline} />
          <div className={styles.cursor} />
        </div>
      </div>

      <div className={styles.transportDeck}>
        <button
          type="button"
          className={`${styles.transportBtn} ${styles.transportRecord} ${outputRecorderActive ? styles.recording : ''}`}
          onClick={() => {
            if (outputRecorderActive) return;
            const started = startOutputRecording();
            if (started) setLevelHistory(buildSeedBars(VISUALIZER_SAMPLES));
          }}
          disabled={outputRecorderActive}
        >
          <span className={styles.transportIcon}>●</span>
          Record
        </button>
        <button
          type="button"
          className={`${styles.transportBtn} ${styles.transportStop}`}
          onClick={() => {
            void stopOutputRecording();
          }}
          disabled={!outputRecorderActive}
        >
          <span className={styles.transportIcon}>■</span>
          Stop
        </button>
        <button
          type="button"
          className={`${styles.transportBtn} ${styles.transportPlay}`}
          onClick={() => {
            const audio = playbackRef.current;
            if (!audio || !lastRecordingUrl) return;
            if (isPlaybackActive) audio.pause();
            else {
              void audio.play();
            }
          }}
          disabled={outputRecorderActive || !lastRecordingUrl}
        >
          <span className={styles.transportIcon}>{isPlaybackActive ? '❚❚' : '▶'}</span>
          {isPlaybackActive ? 'Pause take' : 'Play take'}
        </button>
        {lastRecordingUrl ? (
          <a className={`${styles.transportBtn} ${styles.transportExport}`} href={lastRecordingUrl} download={lastRecordingName || 'wamp-output.webm'}>
            <span className={styles.transportIcon}>↧</span>
            Export
          </a>
        ) : null}
        <button
          type="button"
          className={`${styles.transportBtn} ${styles.transportClear}`}
          onClick={() => {
            const audio = playbackRef.current;
            if (audio) {
              audio.pause();
              audio.currentTime = 0;
            }
            clearLastOutputRecording();
            setLevelHistory(buildSeedBars(VISUALIZER_SAMPLES));
          }}
          disabled={outputRecorderActive || !lastRecordingUrl}
        >
          <span className={styles.transportIcon}>✕</span>
          Clear take
        </button>
      </div>
      <audio ref={playbackRef} src={lastRecordingUrl || undefined} preload="metadata" className={styles.hiddenAudio} />

      <div className={styles.metaRow}>
        <p className={styles.meta}>
          {outputRecorderActive
            ? `Recording in progress. Current take length ${formatDuration(outputRecorderDuration)}.`
            : lastRecordingUrl
              ? `${lastRecordingName || 'Current take'} is ready for export or cleanup.`
              : 'Recorder captures the final wet output, including rack tools and the full pedal chain.'}
        </p>
        <p className={styles.meta}>Tip: Clear the take before a new pass if you want a clean timeline preview.</p>
      </div>
    </section>
  );
}
