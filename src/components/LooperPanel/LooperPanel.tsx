import { useCallback, useRef } from 'react';
import styles from './LooperPanel.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

const LOOP_LENGTH_OPTIONS = [2, 4, 8, 16, 30];

function Waveform({
  peaks,
  duration,
  currentTime,
  rangeStart,
  rangeEnd,
  emptyLabel,
}: {
  peaks: number[];
  duration: number;
  currentTime: number;
  rangeStart: number;
  rangeEnd: number;
  emptyLabel: string;
}) {
  const startPct = duration > 0 ? (rangeStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (rangeEnd / duration) * 100 : 0;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!peaks.length || duration <= 0) {
    return <div className={styles.waveformEmpty}>{emptyLabel}</div>;
  }

  return (
    <div className={styles.waveform}>
      <div className={styles.waveformRange} style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }} />
      <div className={styles.waveformPlayhead} style={{ left: `${playheadPct}%` }} />
      {peaks.map((peak, index) => (
        <span
          key={index}
          className={styles.waveBar}
          style={{ height: `${Math.max(8, peak * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function LooperPanel() {
  const {
    isRunning,
    looperStatus,
    looperDuration,
    looperState,
    looperStartRecord,
    looperStopRecord,
    looperPlay,
    looperStop,
    looperClear,
    setLooperLevel,
    setLooperRecordLength,
    setLooperTrimRange,
    resetLooperTrim,
    applyLooperTrim,
    backingTrackState,
    loadBackingTrack,
    playBackingTrack,
    pauseBackingTrack,
    stopBackingTrack,
    clearBackingTrack,
    setBackingTrackVolume,
    seekBackingTrack,
    setBackingTrackSection,
    setBackingTrackSectionLoopEnabled,
    setBackingTrackPlaybackRate,
  } = useAudioEngineContext();
  const backingTrackInputRef = useRef<HTMLInputElement | null>(null);

  const onStopRecord = useCallback(async () => {
    await looperStopRecord();
  }, [looperStopRecord]);

  const isRecording = looperStatus === 'recording';
  const hasLoop = looperStatus === 'ready' || looperStatus === 'playing';
  const isPlaying = looperStatus === 'playing';
  const hasBackingTrack = backingTrackState.duration > 0;
  const loopTrimEnd = looperState.trimEnd || looperState.sourceDuration;
  const backingSectionEnd = backingTrackState.sectionEnd || backingTrackState.duration;
  const looperTrimMax = Math.max(0.01, looperState.sourceDuration);
  const backingTrimMax = Math.max(0.01, backingTrackState.duration);

  const durLabel = looperDuration > 0 ? `${looperDuration.toFixed(2)}s` : '--';
  const loopEditLabel = !looperState.sourceDuration
    ? 'No loop captured'
    : `Trim ${looperState.trimStart.toFixed(2)}s - ${loopTrimEnd.toFixed(2)}s`;

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Looper and backing tracks">
      <h2 className={styles.title}>Practice Looper + Backing Tracks</h2>

      <div className={styles.workspace}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Looper</h3>
              <p className={styles.cardCopy}>Capture post-FX phrases, trim them visually, and loop them for focused reps.</p>
            </div>
            <span className={styles.meta}>
              {isRecording ? 'Recording...' : isPlaying ? 'Playing' : hasLoop ? 'Ready' : 'Idle'} · {durLabel}
            </span>
          </div>

          <div className={styles.controlRow}>
            <button
              type="button"
              className={`${styles.btn} ${styles.rec} ${isRecording ? styles.recording : ''}`}
              onClick={() => (isRecording ? void onStopRecord() : looperStartRecord())}
              disabled={isPlaying}
            >
              {isRecording ? 'Stop + save loop' : 'Record'}
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={looperPlay}
              disabled={!hasLoop || isRecording || isPlaying}
            >
              Play
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={looperStop}
              disabled={!isPlaying}
            >
              Stop
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={looperClear}
              disabled={isRecording}
            >
              Clear
            </button>
            <label className={styles.inlineField}>
              Loop Length
              <select
                className={styles.select}
                value={looperState.recordLength}
                onChange={(e) => setLooperRecordLength(Number(e.target.value))}
                disabled={isRecording}
              >
                {LOOP_LENGTH_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}s
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.inlineField}>
              Level
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(looperState.level * 100)}
                disabled={!hasLoop && !isPlaying}
                onChange={(e) => setLooperLevel(Number(e.target.value) / 100)}
                aria-label="Looper playback level"
              />
            </label>
          </div>

          <div className={styles.trimEditor}>
            <Waveform
              peaks={looperState.peaks}
              duration={looperState.sourceDuration}
              currentTime={looperState.currentTime}
              rangeStart={looperState.trimStart}
              rangeEnd={loopTrimEnd}
              emptyLabel="Record a loop to edit it visually."
            />
            <div className={styles.overlayTrimControls}>
              <label className={styles.overlaySliderLabel}>
                <span>Loop Start</span>
                <input
                  className={`${styles.overlaySlider} ${styles.overlaySliderStart}`}
                  type="range"
                  min={0}
                  max={looperTrimMax}
                  step={0.01}
                  value={looperState.trimStart}
                  disabled={!hasLoop}
                  onChange={(e) => setLooperTrimRange(Number(e.target.value), loopTrimEnd)}
                />
              </label>
              <label className={styles.overlaySliderLabel}>
                <span>Loop End</span>
                <input
                  className={`${styles.overlaySlider} ${styles.overlaySliderEnd}`}
                  type="range"
                  min={0}
                  max={looperTrimMax}
                  step={0.01}
                  value={Math.max(loopTrimEnd, looperTrimMax)}
                  disabled={!hasLoop}
                  onChange={(e) => setLooperTrimRange(looperState.trimStart, Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className={styles.controlRow}>
            <span className={styles.meta}>{loopEditLabel}</span>
            <button type="button" className={styles.btn} onClick={resetLooperTrim} disabled={!hasLoop}>
              Reset Trim
            </button>
            <button type="button" className={styles.btn} onClick={applyLooperTrim} disabled={!hasLoop}>
              Apply Trim
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Backing Track Player</h3>
              <p className={styles.cardCopy}>Load songs or loops into the same rig session and repeat hard passages without another app.</p>
            </div>
            <span className={styles.meta}>
              {hasBackingTrack ? `${backingTrackState.currentTime.toFixed(2)}s / ${backingTrackState.duration.toFixed(2)}s` : 'No track loaded'}
            </span>
          </div>

          <div className={styles.controlRow}>
            <button type="button" className={styles.btn} onClick={() => backingTrackInputRef.current?.click()}>
              Load Track
            </button>
            <button type="button" className={styles.btn} onClick={playBackingTrack} disabled={!hasBackingTrack || backingTrackState.isPlaying}>
              Play
            </button>
            <button type="button" className={styles.btn} onClick={pauseBackingTrack} disabled={!backingTrackState.isPlaying}>
              Pause
            </button>
            <button type="button" className={styles.btn} onClick={stopBackingTrack} disabled={!hasBackingTrack}>
              Stop
            </button>
            <button type="button" className={styles.btn} onClick={clearBackingTrack} disabled={!hasBackingTrack}>
              Clear
            </button>
            <label className={styles.inlineField}>
              Track Vol
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(backingTrackState.volume * 100)}
                disabled={!hasBackingTrack}
                onChange={(e) => setBackingTrackVolume(Number(e.target.value) / 100)}
              />
            </label>
            <label className={styles.inlineField}>
              Speed
              <input
                type="range"
                min={0.25}
                max={2.5}
                step={0.01}
                value={backingTrackState.playbackRate}
                disabled={!hasBackingTrack}
                onChange={(e) => setBackingTrackPlaybackRate(Number(e.target.value))}
              />
              <span className={styles.meta}>{backingTrackState.playbackRate.toFixed(2)}x</span>
            </label>
            <input
              ref={backingTrackInputRef}
              className={styles.hiddenInput}
              type="file"
              accept=".wav,.mp3,.ogg,.aiff,.aif,.flac,audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void loadBackingTrack(file);
                e.currentTarget.value = '';
              }}
            />
          </div>

          <div className={styles.trackName}>{backingTrackState.name || 'No backing track selected'}</div>

          <Waveform
            peaks={backingTrackState.peaks}
            duration={backingTrackState.duration}
            currentTime={backingTrackState.currentTime}
            rangeStart={backingTrackState.sectionStart}
            rangeEnd={backingSectionEnd}
            emptyLabel="Load a song, jam track, or loop to start practicing."
          />

          <label className={styles.sliderLabel}>
            Track Position
            <input
              type="range"
              min={0}
              max={Math.max(0, backingTrackState.duration)}
              step={0.01}
              value={backingTrackState.currentTime}
              disabled={!hasBackingTrack}
              onChange={(e) => seekBackingTrack(Number(e.target.value))}
            />
          </label>

          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
              <div>
                <h4 className={styles.sectionTitle}>Section Looper / Practice Markers</h4>
                <p className={styles.cardCopy}>Mark a song passage and keep it repeating while you practice through the same rig.</p>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={backingTrackState.sectionLoopEnabled}
                  disabled={!hasBackingTrack}
                  onChange={(e) => setBackingTrackSectionLoopEnabled(e.target.checked)}
                />
                Repeat Section
              </label>
            </div>

            <div className={styles.trimEditor}>
              <Waveform
                peaks={backingTrackState.peaks}
                duration={backingTrackState.duration}
                currentTime={backingTrackState.currentTime}
                rangeStart={backingTrackState.sectionStart}
                rangeEnd={backingSectionEnd}
                emptyLabel="Load a backing track to trim a practice section."
              />
              <div className={styles.overlayTrimControls}>
                <label className={styles.overlaySliderLabel}>
                  <span>Section Start</span>
                  <input
                    className={`${styles.overlaySlider} ${styles.overlaySliderStart}`}
                    type="range"
                    min={0}
                    max={backingTrimMax}
                    step={0.01}
                    value={backingTrackState.sectionStart}
                    disabled={!hasBackingTrack}
                    onChange={(e) => setBackingTrackSection(Number(e.target.value), backingSectionEnd)}
                  />
                </label>
                <label className={styles.overlaySliderLabel}>
                  <span>Section End</span>
                  <input
                    className={`${styles.overlaySlider} ${styles.overlaySliderEnd}`}
                    type="range"
                    min={0}
                    max={backingTrimMax}
                    step={0.01}
                    value={Math.max(backingSectionEnd, backingTrimMax)}
                    disabled={!hasBackingTrack}
                    onChange={(e) => setBackingTrackSection(backingTrackState.sectionStart, Number(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className={styles.meta}>
              Markers: {backingTrackState.sectionStart.toFixed(2)}s - {backingSectionEnd.toFixed(2)}s
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
