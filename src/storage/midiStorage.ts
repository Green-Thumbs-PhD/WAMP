import type { MidiMappingState } from '../types/midi';
import { createDefaultMidiMappingState } from '../types/midi';

const STORAGE_KEY = 'wamp.midi.v1';
const LEGACY_STORAGE_KEY = 'mac2.midi.v1';

interface StoredCollection<T> {
  version: 1;
  data: T;
}

export function loadMidiMappingState(): MidiMappingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createDefaultMidiMappingState();
    const parsed = JSON.parse(raw) as StoredCollection<MidiMappingState>;
    return {
      ...createDefaultMidiMappingState(),
      ...parsed.data,
      bindings: parsed.data?.bindings ?? {},
    };
  } catch {
    return createDefaultMidiMappingState();
  }
}

export function saveMidiMappingState(state: MidiMappingState): void {
  const payload: StoredCollection<MidiMappingState> = {
    version: 1,
    data: state,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
