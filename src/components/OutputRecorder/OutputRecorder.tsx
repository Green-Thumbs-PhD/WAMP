import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './OutputRecorder.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import { getSupportedOutputRecordingMimeType, type OutputRecordingFormat } from '../../audio/AudioEngine';

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

function replaceExtension(filename: string, extension: string): string {
  return `${filename.replace(/\.[^.]+$/, '') || 'wamp-output'}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function decodeBlob(blob: Blob): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    void audioContext.close();
  }
}

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function encodeWav(audioBuffer: AudioBuffer): Blob {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const frameCount = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = 0; frame < frameCount; frame++) {
    for (let channel = 0; channel < channelCount; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[frame] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
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
    lastRecordingBlob,
    lastRecordingDuration,
    startOutputRecording,
    stopOutputRecording,
    clearLastOutputRecording,
  } = useAudioEngineContext();
  const [levelHistory, setLevelHistory] = useState<number[]>(() => buildSeedBars(VISUALIZER_SAMPLES));
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [recordingFormat, setRecordingFormat] = useState<OutputRecordingFormat>('webm');
  const [exportBusy, setExportBusy] = useState(false);
  const outputLevelRef = useRef(0);
  const outputPeakRef = useRef(0);
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const mp3Supported = useMemo(() => Boolean(getSupportedOutputRecordingMimeType('mp3')), []);

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
  const hasMp3Take = Boolean(lastRecordingBlob?.type.includes('mpeg') || lastRecordingBlob?.type.includes('mp3'));
  const sourceExportLabel = hasMp3Take ? 'Export MP3' : 'Export WebM';

  const exportWav = async () => {
    if (!lastRecordingBlob) return;
    setExportBusy(true);
    try {
      const audioBuffer = await decodeBlob(lastRecordingBlob);
      const wavBlob = encodeWav(audioBuffer);
      downloadBlob(wavBlob, replaceExtension(lastRecordingName || 'wamp-output.webm', 'wav'));
    } finally {
      setExportBusy(false);
    }
  };

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
        <label className={styles.formatControl}>
          <span>Format</span>
          <select
            value={recordingFormat}
            onChange={(event) => setRecordingFormat(event.target.value as OutputRecordingFormat)}
            disabled={outputRecorderActive}
          >
            <option value="webm">WebM</option>
            <option value="mp3" disabled={!mp3Supported}>MP3</option>
          </select>
        </label>
        <button
          type="button"
          className={`${styles.transportBtn} ${styles.transportRecord} ${outputRecorderActive ? styles.recording : ''}`}
          onClick={() => {
            if (outputRecorderActive) return;
            const started = startOutputRecording(recordingFormat);
            if (started) setLevelHistory(buildSeedBars(VISUALIZER_SAMPLES));
          }}
          disabled={outputRecorderActive || (recordingFormat === 'mp3' && !mp3Supported)}
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
            {sourceExportLabel}
          </a>
        ) : null}
        <button
          type="button"
          className={`${styles.transportBtn} ${styles.transportExport}`}
          onClick={() => void exportWav()}
          disabled={outputRecorderActive || !lastRecordingBlob || exportBusy}
        >
          <span className={styles.transportIcon}>W</span>
          {exportBusy ? 'Preparing WAV' : 'Export WAV'}
        </button>
        <button
          type="button"
          className={`${styles.transportBtn} ${styles.transportExport}`}
          onClick={() => {
            if (lastRecordingBlob && hasMp3Take) {
              downloadBlob(lastRecordingBlob, replaceExtension(lastRecordingName || 'wamp-output.mp3', 'mp3'));
            }
          }}
          disabled={outputRecorderActive || !lastRecordingBlob || !hasMp3Take}
          title={mp3Supported ? 'Select MP3 before recording to create an MP3 take.' : 'MP3 recording is not supported by this browser.'}
        >
          <span className={styles.transportIcon}>M</span>
          Export MP3
        </button>
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
      <p className={styles.formatNote}>
        WAV exports are converted from the current take. MP3 export requires recording the take as MP3 in a browser that supports audio/mpeg.
      </p>
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
