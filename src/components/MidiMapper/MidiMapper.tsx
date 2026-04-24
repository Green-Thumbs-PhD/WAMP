import { useEffect, useRef, useState } from 'react';
import styles from './MidiMapper.module.css';
import { loadMidiMappingState, saveMidiMappingState } from '../../storage/midiStorage';
import type { MidiBinding, MidiMappingState, MidiTargetId } from '../../types/midi';
import { MIDI_TARGET_LABELS } from '../../types/midi';

interface MidiMapperProps {
  isRunning: boolean;
  muted: boolean;
  masterVolume: number;
  inputTrim: number;
  metronomeRunning: boolean;
  looperStatus: 'idle' | 'recording' | 'ready' | 'playing';
  compareAReady: boolean;
  compareBReady: boolean;
  onStart: () => void | Promise<void>;
  onStop: () => void;
  onToggleMute: () => void;
  onSetMasterVolume: (value: number) => void;
  onSetInputTrim: (value: number) => void;
  onMetronomeToggle: () => void;
  onTapTempo: () => void;
  onLooperRecordToggle: () => void;
  onLooperPlayToggle: () => void;
  onRecallCompare: (slot: 'A' | 'B') => void;
}

type MidiAccessWithInputs = MIDIAccess & {
  inputs: Map<string, MIDIInput>;
};

const TARGET_ORDER: MidiTargetId[] = [
  'transport',
  'mute',
  'masterVolume',
  'inputTrim',
  'metronomeToggle',
  'tapTempo',
  'looperRecord',
  'looperPlayStop',
  'compareA',
  'compareB',
];

const CONTINUOUS_TARGETS = new Set<MidiTargetId>(['masterVolume', 'inputTrim']);

function describeBinding(binding?: MidiBinding): string {
  if (!binding) return 'Unassigned';
  return `${binding.kind === 'cc' ? 'CC' : 'Note'} ${binding.data1 + 1} · Ch ${binding.channel + 1}`;
}

function isMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
}

export function MidiMapper(props: MidiMapperProps) {
  const [mappingState, setMappingState] = useState<MidiMappingState>(loadMidiMappingState);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [learningTarget, setLearningTarget] = useState<MidiTargetId | null>(null);
  const [status, setStatus] = useState('Learn MIDI controls for transport, compare, and key rig actions.');
  const midiAccessRef = useRef<MidiAccessWithInputs | null>(null);
  const pressedRef = useRef<Record<string, boolean>>({});
  const latestPropsRef = useRef(props);

  useEffect(() => {
    latestPropsRef.current = props;
  }, [props]);

  useEffect(() => {
    saveMidiMappingState(mappingState);
  }, [mappingState]);

  useEffect(() => {
    if (!isMidiSupported()) return;

    let cancelled = false;

    const attach = async () => {
      try {
        const access = await navigator.requestMIDIAccess();
        if (cancelled) return;
        const midiAccess = access as MidiAccessWithInputs;
        midiAccessRef.current = midiAccess;

        const syncInputs = () => {
          const nextInputs = Array.from(midiAccess.inputs.values());
          setInputs(nextInputs);
          setMappingState((current) => {
            if (current.inputId && nextInputs.some((input) => input.id === current.inputId)) {
              return current;
            }
            return {
              ...current,
              inputId: nextInputs[0]?.id ?? '',
            };
          });
        };

        syncInputs();
        midiAccess.onstatechange = syncInputs;
      } catch {
        setStatus('This browser denied MIDI access or does not expose usable MIDI inputs.');
      }
    };

    void attach();

    return () => {
      cancelled = true;
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!midiAccessRef.current) return;
    const activeInput = midiAccessRef.current.inputs.get(mappingState.inputId);
    if (!activeInput || !mappingState.enabled) {
      return;
    }

    const handleDiscreteTrigger = (target: MidiTargetId) => {
      const latest = latestPropsRef.current;
      switch (target) {
        case 'transport':
          if (latest.isRunning) latest.onStop();
          else void latest.onStart();
          break;
        case 'mute':
          latest.onToggleMute();
          break;
        case 'metronomeToggle':
          latest.onMetronomeToggle();
          break;
        case 'tapTempo':
          latest.onTapTempo();
          break;
        case 'looperRecord':
          latest.onLooperRecordToggle();
          break;
        case 'looperPlayStop':
          latest.onLooperPlayToggle();
          break;
        case 'compareA':
          if (latest.compareAReady) latest.onRecallCompare('A');
          break;
        case 'compareB':
          if (latest.compareBReady) latest.onRecallCompare('B');
          break;
        default:
          break;
      }
    };

    const handleContinuousChange = (target: MidiTargetId, value: number) => {
      const normalized = value / 127;
      switch (target) {
        case 'masterVolume':
          latestPropsRef.current.onSetMasterVolume(normalized * 1.5);
          break;
        case 'inputTrim':
          latestPropsRef.current.onSetInputTrim(normalized * 2);
          break;
        default:
          break;
      }
    };

    activeInput.onmidimessage = (event) => {
      const bytes = event.data;
      if (!bytes) return;
      const statusByte = bytes[0] ?? 0;
      const data1 = bytes[1] ?? 0;
      const data2 = bytes[2] ?? 0;
      const messageType = statusByte & 0xf0;
      const channel = statusByte & 0x0f;
      const kind = messageType === 0xb0 ? 'cc' : messageType === 0x90 ? 'note' : null;

      if (!kind) return;
      if (learningTarget) {
        if (kind === 'note' && data2 === 0) return;
        const binding: MidiBinding = { kind, channel, data1 };
        setMappingState((current) => ({
          ...current,
          bindings: {
            ...current.bindings,
            [learningTarget]: binding,
          },
        }));
        setStatus(`${MIDI_TARGET_LABELS[learningTarget]} mapped to ${describeBinding(binding)}.`);
        setLearningTarget(null);
        return;
      }

      for (const [target, binding] of Object.entries(mappingState.bindings) as [MidiTargetId, MidiBinding][]) {
        if (!binding) continue;
        if (binding.kind !== kind || binding.channel !== channel || binding.data1 !== data1) continue;

        const pressKey = `${target}:${kind}:${channel}:${data1}`;
        if (CONTINUOUS_TARGETS.has(target) && kind === 'cc') {
          handleContinuousChange(target, data2);
          continue;
        }

        const isPressed = kind === 'note' ? data2 > 0 : data2 >= 64;
        if (isPressed && !pressedRef.current[pressKey]) {
          handleDiscreteTrigger(target);
        }
        pressedRef.current[pressKey] = isPressed;
      }
    };

    return () => {
      activeInput.onmidimessage = null;
    };
  }, [learningTarget, mappingState.bindings, mappingState.enabled, mappingState.inputId]);

  const handleToggleEnabled = () => {
    if (!isMidiSupported()) {
      setStatus('This browser does not support the Web MIDI API.');
      return;
    }

    setLearningTarget(null);
    setMappingState((current) => ({ ...current, enabled: !current.enabled }));
  };

  return (
    <section className={styles.panel} aria-label="MIDI controller mapping">
      <div className={styles.head}>
        <span className={styles.kicker}>MIDI</span>
        <button
          type="button"
          className={`${styles.toggle} ${mappingState.enabled ? styles.toggleActive : ''}`}
          onClick={handleToggleEnabled}
        >
          {mappingState.enabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className={styles.inputRow}>
        <label className={styles.inputLabel}>
          In
          <select
            className={styles.select}
            value={mappingState.inputId}
            onChange={(e) => setMappingState((current) => ({ ...current, inputId: e.target.value }))}
            disabled={!inputs.length}
          >
            {inputs.length === 0 ? (
              <option value="">No MIDI inputs</option>
            ) : (
              inputs.map((input) => (
                <option key={input.id} value={input.id}>
                  {input.name ?? `MIDI ${input.id.slice(0, 8)}`}
                </option>
              ))
            )}
          </select>
        </label>
      </div>
      {mappingState.enabled ? (
        <>
          <div className={styles.grid}>
            {TARGET_ORDER.map((target) => (
              <div key={target} className={styles.mappingRow}>
                <span className={styles.target}>{MIDI_TARGET_LABELS[target]}</span>
                <span className={styles.binding}>{describeBinding(mappingState.bindings[target])}</span>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${learningTarget === target ? styles.learnActive : ''}`}
                  onClick={() => {
                    setLearningTarget((current) => (current === target ? null : target));
                  }}
                >
                  {learningTarget === target ? 'Listening' : 'Learn'}
                </button>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setMappingState((current) => {
                      const nextBindings = { ...current.bindings };
                      delete nextBindings[target];
                      return { ...current, bindings: nextBindings };
                    });
                    if (learningTarget === target) setLearningTarget(null);
                  }}
                  disabled={!mappingState.bindings[target]}
                >
                  Clear
                </button>
              </div>
            ))}
          </div>
          <p className={styles.status}>
            {learningTarget ? `Move a MIDI control for ${MIDI_TARGET_LABELS[learningTarget]}.` : status}
          </p>
        </>
      ) : null}
      {!isMidiSupported() ? (
        <p className={styles.note}>Web MIDI is not available in this browser.</p>
      ) : null}
    </section>
  );
}
