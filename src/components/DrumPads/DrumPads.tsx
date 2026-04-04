import { useCallback, useEffect, useState } from 'react';
import styles from './DrumPads.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

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

export function DrumPads() {
  const {
    isRunning,
    playDrumPad,
    padsThroughChain,
    setPadsThroughChain,
    captureMicToPad,
  } = useAudioEngineContext();

  const [selectedPad, setSelectedPad] = useState(0);
  const [capturing, setCapturing] = useState(false);

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

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Drum pads">
      <h2 className={styles.title}>Drum pads</h2>
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
          {capturing ? 'Recording…' : 'Capture 1s from mic'}
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
    </section>
  );
}
