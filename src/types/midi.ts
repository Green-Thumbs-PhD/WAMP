export type MidiTargetId =
  | 'transport'
  | 'mute'
  | 'masterVolume'
  | 'inputTrim'
  | 'metronomeToggle'
  | 'tapTempo'
  | 'looperRecord'
  | 'looperPlayStop'
  | 'compareA'
  | 'compareB';

export interface MidiBinding {
  kind: 'note' | 'cc';
  channel: number;
  data1: number;
}

export interface MidiMappingState {
  enabled: boolean;
  inputId: string;
  bindings: Partial<Record<MidiTargetId, MidiBinding>>;
}

export const MIDI_TARGET_LABELS: Record<MidiTargetId, string> = {
  transport: 'Start / Stop',
  mute: 'Mute',
  masterVolume: 'Master',
  inputTrim: 'Input Trim',
  metronomeToggle: 'Metronome',
  tapTempo: 'Tap Tempo',
  looperRecord: 'Looper Rec',
  looperPlayStop: 'Looper Play',
  compareA: 'Recall A',
  compareB: 'Recall B',
};

export function createDefaultMidiMappingState(): MidiMappingState {
  return {
    enabled: false,
    inputId: '',
    bindings: {},
  };
}
