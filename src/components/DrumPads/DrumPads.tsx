import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DrumPads.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import type { DrumKitPresetId } from '../../audio/DrumKit';

const PAD_LABELS = [
  'K1',
  'Sn',
  'HHc',
  'HHo',
  'T1',
  'T2',
  'T3',
  'Cl',
  'K2',
  'Sn2',
  'HH',
  'Cym',
  'T4',
  'T5',
  'T6',
  'Cl2',
];

const KEY_MAP: Record<string, number> = {
  q: 0,
  w: 1,
  e: 2,
  r: 3,
  a: 4,
  s: 5,
  d: 6,
  f: 7,
  z: 8,
  x: 9,
  c: 10,
  v: 11,
  u: 12,
  i: 13,
  o: 14,
  p: 15,
};

interface SequencerTrack {
  label: string;
  padIndex: number;
  velocity: number;
}

const DEFAULT_SEQUENCER_TRACKS: SequencerTrack[] = [
  { label: 'Lane 1', padIndex: 0, velocity: 0.9 },
  { label: 'Lane 2', padIndex: 1, velocity: 0.8 },
  { label: 'Lane 3', padIndex: 2, velocity: 0.58 },
  { label: 'Lane 4', padIndex: 3, velocity: 0.72 },
  { label: 'Lane 5', padIndex: 4, velocity: 0.82 },
  { label: 'Lane 6', padIndex: 5, velocity: 0.76 },
  { label: 'Lane 7', padIndex: 6, velocity: 0.8 },
  { label: 'Lane 8', padIndex: 7, velocity: 0.68 },
] as const;

const STEP_COUNT = 16;
const DRUM_KIT_OPTIONS: Array<{ id: DrumKitPresetId; label: string }> = [
  { id: 'default', label: 'Default' },
  { id: 'trance-giant', label: 'Trance Giant' },
  { id: '808-heat', label: '808 Heat' },
  { id: '909-club', label: '909 Club' },
  { id: 'linn-pop', label: 'Linn Pop' },
];

interface DrumPadSessionPreset {
  version: 1;
  kitId: DrumKitPresetId;
  sequencerTracks: SequencerTrack[];
  pattern: boolean[][];
  padKitSnapshot: {
    padBuffers: { sampleRate: number; samples: number[] }[];
  };
}

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function createEmptyPattern(): boolean[][] {
  return DEFAULT_SEQUENCER_TRACKS.map(() => Array.from({ length: STEP_COUNT }, () => false));
}

export function DrumPads() {
  const {
    isRunning,
    playDrumPad,
    padsThroughChain,
    setPadsThroughChain,
    captureMicToPad,
    loadFactoryDrumKit,
    exportDrumPadKitSnapshot,
    importDrumPadKitSnapshot,
    metronomeBpm,
    setMetronomeBpm,
  } = useAudioEngineContext();

  const [selectedPad, setSelectedPad] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [pattern, setPattern] = useState<boolean[][]>(() => createEmptyPattern());
  const [sequencerTracks, setSequencerTracks] = useState(() => [...DEFAULT_SEQUENCER_TRACKS]);
  const [sequencerPlaying, setSequencerPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [bpmInput, setBpmInput] = useState(String(metronomeBpm));
  const [selectedKitId, setSelectedKitId] = useState<DrumKitPresetId>('default');
  const stepRef = useRef(0);
  const patternRef = useRef(pattern);
  const importSessionRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    setBpmInput(String(metronomeBpm));
  }, [metronomeBpm]);

  const trigger = useCallback(
    (index: number, velocity = 1) => {
      if (!isRunning) return;
      playDrumPad(index, velocity);
    },
    [isRunning, playDrumPad]
  );

  useEffect(() => {
    if (!isRunning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      const idx = KEY_MAP[e.key.toLowerCase()];
      if (idx !== undefined) {
        e.preventDefault();
        trigger(idx, 0.9);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRunning, trigger]);

  const onCapture = useCallback(async () => {
    if (!isRunning || capturing) return;
    setCapturing(true);
    try {
      await captureMicToPad(selectedPad);
    } finally {
      setCapturing(false);
    }
  }, [isRunning, capturing, captureMicToPad, selectedPad]);

  const toggleStep = useCallback((trackIndex: number, stepIndex: number) => {
    setPattern((current) =>
      current.map((track, currentTrackIndex) =>
        currentTrackIndex === trackIndex
          ? track.map((enabled, currentStepIndex) => (currentStepIndex === stepIndex ? !enabled : enabled))
          : track
      )
    );
  }, []);

  const clearPattern = useCallback(() => {
    setPattern(createEmptyPattern());
    stepRef.current = 0;
    setActiveStep(0);
  }, []);

  const setTrackPadIndex = useCallback((trackIndex: number, padIndex: number) => {
    setSequencerTracks((current) =>
      current.map((track, currentTrackIndex) =>
        currentTrackIndex === trackIndex
          ? { ...track, padIndex }
          : track
      )
    );
  }, []);

  const commitTempo = useCallback(() => {
    const next = Math.round(Number(bpmInput));
    if (!Number.isFinite(next)) {
      setBpmInput(String(metronomeBpm));
      return;
    }
    const clamped = Math.max(60, Math.min(220, next));
    setMetronomeBpm(clamped);
    setBpmInput(String(clamped));
  }, [bpmInput, metronomeBpm, setMetronomeBpm]);

  const applyKitPreset = useCallback((kitId: DrumKitPresetId) => {
    const loaded = loadFactoryDrumKit(kitId);
    if (!loaded) return;
    setSelectedKitId(kitId);
  }, [loadFactoryDrumKit]);

  const exportDrumSession = useCallback(() => {
    const payload: DrumPadSessionPreset = {
      version: 1,
      kitId: selectedKitId,
      sequencerTracks,
      pattern,
      padKitSnapshot: exportDrumPadKitSnapshot(),
    };
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJson(`wamp-drum-pad-session-${stamp}.json`, payload);
  }, [exportDrumPadKitSnapshot, pattern, selectedKitId, sequencerTracks]);

  const importDrumSession = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as Partial<DrumPadSessionPreset>;
      if (parsed.version !== 1 || !parsed.padKitSnapshot || !Array.isArray(parsed.pattern) || !Array.isArray(parsed.sequencerTracks)) {
        return;
      }
      const importedPattern = parsed.pattern
        .slice(0, DEFAULT_SEQUENCER_TRACKS.length)
        .map((track) => Array.from({ length: STEP_COUNT }, (_, stepIndex) => Boolean(track?.[stepIndex])));
      while (importedPattern.length < DEFAULT_SEQUENCER_TRACKS.length) {
        importedPattern.push(Array.from({ length: STEP_COUNT }, () => false));
      }

      const importedTracks = DEFAULT_SEQUENCER_TRACKS.map((fallback, trackIndex) => {
        const incoming = parsed.sequencerTracks?.[trackIndex];
        const nextPadIndex = Number(incoming?.padIndex);
        const nextVelocity = Number(incoming?.velocity);
        return {
          label: fallback.label,
          padIndex: Number.isFinite(nextPadIndex) ? Math.max(0, Math.min(15, Math.round(nextPadIndex))) : fallback.padIndex,
          velocity: Number.isFinite(nextVelocity) ? Math.max(0, Math.min(1, nextVelocity)) : fallback.velocity,
        };
      });

      const importedKit = importDrumPadKitSnapshot(parsed.padKitSnapshot);
      if (!importedKit) return;

      const nextKitId = DRUM_KIT_OPTIONS.some((option) => option.id === parsed.kitId) ? parsed.kitId as DrumKitPresetId : 'default';
      setSelectedKitId(nextKitId);
      setPattern(importedPattern);
      setSequencerTracks(importedTracks);
      stepRef.current = 0;
      setActiveStep(0);
    } finally {
      event.currentTarget.value = '';
    }
  }, [importDrumPadKitSnapshot]);

  useEffect(() => {
    if (!isRunning || !sequencerPlaying) return;

    const intervalMs = Math.max(45, 60000 / metronomeBpm / 4);
    const runStep = () => {
      const currentStep = stepRef.current;
      setActiveStep(currentStep);

      sequencerTracks.forEach((track, trackIndex) => {
        if (patternRef.current[trackIndex]?.[currentStep]) {
          trigger(track.padIndex, track.velocity);
        }
      });

      stepRef.current = (currentStep + 1) % STEP_COUNT;
    };

    runStep();
    const intervalId = window.setInterval(runStep, intervalMs);
    return () => window.clearInterval(intervalId);
  }, [isRunning, metronomeBpm, sequencerPlaying, sequencerTracks, trigger]);

  useEffect(() => {
    if (isRunning) return;
    setSequencerPlaying(false);
    stepRef.current = 0;
    setActiveStep(0);
  }, [isRunning]);

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Drum pads">
      <h2 className={styles.title}>DRUM PADS / SEQUENCER</h2>
      <div className={styles.layout}>
        <div className={styles.padSection}>
          <div className={styles.toolbar}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={padsThroughChain}
                onChange={(e) => setPadsThroughChain(e.target.checked)}
              />
              Through pedal chain
            </label>
          </div>
          <div className={styles.captureRow}>
            <span>Pad {selectedPad + 1}</span>
            <button
              type="button"
              className={styles.btn}
              onClick={onCapture}
              disabled={capturing}
              title="Records 1s from the current input into the selected pad"
            >
              {capturing ? 'Recording...' : 'Capture 1s from mic'}
            </button>
          </div>
          <div className={styles.grid}>
            {PAD_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.pad} ${selectedPad === i ? styles.padSelected : ''}`}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  if (e.shiftKey) {
                    e.preventDefault();
                    setSelectedPad(i);
                    return;
                  }
                  trigger(i, 0.85);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>
            Click = play. Shift+click = select pad for mic capture (gold). Keys: QWER ASDF ZXCV UIOP.
          </p>
          <div className={styles.kitRow}>
            <label className={styles.kitLabel}>
              Kit
              <select
                className={styles.kitSelect}
                value={selectedKitId}
                onChange={(e) => applyKitPreset(e.target.value as DrumKitPresetId)}
              >
                {DRUM_KIT_OPTIONS.map((kit) => (
                  <option key={kit.id} value={kit.id}>{kit.label}</option>
                ))}
              </select>
            </label>
            <button type="button" className={styles.btn} onClick={exportDrumSession}>
              Export Drum Session
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={() => importSessionRef.current?.click()}
            >
              Import Drum Session
            </button>
            <input
              ref={importSessionRef}
              type="file"
              accept=".json,application/json"
              className={styles.hiddenInput}
              onChange={importDrumSession}
            />
          </div>
        </div>

        <div className={styles.sequencerSection}>
          <div className={styles.sequencerHeader}>
            <div>
              <h3 className={styles.sequencerTitle}>SEQUENCER</h3>
              <p className={styles.sequencerCopy}>16-step sequencer with 8 lanes assignable to any of the 16 pads.</p>
            </div>
            <div className={styles.sequencerControls}>
              <button
                type="button"
                className={`${styles.btn} ${sequencerPlaying ? styles.btnActive : ''}`}
                onClick={() => {
                  setSequencerPlaying((current) => {
                    const next = !current;
                    if (!next) {
                      stepRef.current = 0;
                      setActiveStep(0);
                    }
                    return next;
                  });
                }}
              >
                {sequencerPlaying ? 'Stop Seq' : 'Play Seq'}
              </button>
              <button type="button" className={styles.btn} onClick={clearPattern}>
                Clear
              </button>
              <label className={styles.bpmControl}>
                BPM
                <input
                  className={styles.bpmInput}
                  type="number"
                  min={60}
                  max={220}
                  value={bpmInput}
                  onChange={(e) => setBpmInput(e.target.value)}
                  onBlur={commitTempo}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTempo();
                  }}
                />
              </label>
            </div>
          </div>

          <div className={styles.stepLabels} aria-hidden="true">
            <span />
            {Array.from({ length: STEP_COUNT }, (_, index) => (
              <span
                key={index}
                className={`${styles.stepLabel} ${activeStep === index ? styles.stepLabelActive : ''}`}
              >
                {index + 1}
              </span>
            ))}
          </div>

          <div className={styles.sequencerGrid}>
            {sequencerTracks.map((track, trackIndex) => (
              <div key={track.label} className={styles.sequenceRow}>
                <div className={styles.trackControl}>
                  <select
                    className={styles.trackSelect}
                    value={track.padIndex}
                    onChange={(e) => setTrackPadIndex(trackIndex, Number(e.target.value))}
                    aria-label={`${track.label} pad assignment`}
                  >
                    {PAD_LABELS.map((label, padIndex) => (
                      <option key={`${track.label}-${padIndex}`} value={padIndex}>
                        Pad {padIndex + 1} · {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.trackLabel}
                    onClick={() => trigger(track.padIndex, track.velocity)}
                    title="Preview assigned instrument"
                  >
                    {track.label}
                  </button>
                </div>
                {Array.from({ length: STEP_COUNT }, (_, stepIndex) => {
                  const enabled = pattern[trackIndex]?.[stepIndex];
                  return (
                    <button
                      key={`${track.label}-${track.padIndex}-${stepIndex}`}
                      type="button"
                      className={`${styles.stepBtn} ${enabled ? styles.stepBtnActive : ''} ${activeStep === stepIndex ? styles.stepBtnCurrent : ''}`}
                      onClick={() => toggleStep(trackIndex, stepIndex)}
                      aria-pressed={enabled}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
