import type { EffectNode, EffectType, ParamDescriptor } from '../../types/effects';
import { Distortion } from './Distortion';
import { Delay } from './Delay';
import { Reverb } from './Reverb';
import { Chorus } from './Chorus';
import { Tremolo } from './Tremolo';
import { EQ } from './EQ';
import { Compressor } from './Compressor';
import { Volume } from './Volume';

export function createEffect(ctx: AudioContext, type: EffectType): EffectNode {
  switch (type) {
    case 'distortion': return new Distortion(ctx);
    case 'delay': return new Delay(ctx);
    case 'reverb': return new Reverb(ctx);
    case 'chorus': return new Chorus(ctx);
    case 'tremolo': return new Tremolo(ctx);
    case 'eq': return new EQ(ctx);
    case 'compressor': return new Compressor(ctx);
    case 'volume': return new Volume(ctx);
  }
}

// Static param descriptors without needing an AudioContext
const PARAM_DESCRIPTORS: Record<EffectType, ParamDescriptor[]> = {
  distortion: [
    { name: 'drive', label: 'Drive', min: 0, max: 100, default: 50, step: 1, unit: '%' },
    { name: 'tone', label: 'Tone', min: 200, max: 8000, default: 3000, step: 10, unit: 'Hz' },
    { name: 'level', label: 'Level', min: 0, max: 100, default: 50, step: 1, unit: '%' },
    { name: 'mode', label: 'Mode', min: 0, max: 2, default: 0, step: 1, unit: '' },
  ],
  delay: [
    { name: 'time', label: 'Time', min: 50, max: 2000, default: 400, step: 10, unit: 'ms' },
    { name: 'feedback', label: 'Feedback', min: 0, max: 95, default: 40, step: 1, unit: '%' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 50, step: 1, unit: '%' },
  ],
  reverb: [
    { name: 'decay', label: 'Decay', min: 0.1, max: 10, default: 2.5, step: 0.1, unit: 's' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 30, step: 1, unit: '%' },
    { name: 'brightness', label: 'Bright', min: 0, max: 100, default: 50, step: 1, unit: '%' },
  ],
  chorus: [
    { name: 'rate', label: 'Rate', min: 0.1, max: 10, default: 1.5, step: 0.1, unit: 'Hz' },
    { name: 'depth', label: 'Depth', min: 0, max: 100, default: 50, step: 1, unit: '%' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 50, step: 1, unit: '%' },
  ],
  tremolo: [
    { name: 'rate', label: 'Rate', min: 0.5, max: 15, default: 4, step: 0.1, unit: 'Hz' },
    { name: 'depth', label: 'Depth', min: 0, max: 100, default: 60, step: 1, unit: '%' },
    { name: 'wave', label: 'Wave', min: 0, max: 1, default: 0, step: 1, unit: '' },
  ],
  eq: [
    { name: 'lowGain', label: 'Low', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
    { name: 'midGain', label: 'Mid', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
    { name: 'midFreq', label: 'Mid Hz', min: 200, max: 5000, default: 1000, step: 10, unit: 'Hz' },
    { name: 'highGain', label: 'High', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
  ],
  compressor: [
    { name: 'threshold', label: 'Thresh', min: -60, max: 0, default: -24, step: 1, unit: 'dB' },
    { name: 'ratio', label: 'Ratio', min: 1, max: 20, default: 4, step: 0.5, unit: ':1' },
    { name: 'attack', label: 'Attack', min: 0, max: 1, default: 0.003, step: 0.001, unit: 's' },
    { name: 'release', label: 'Release', min: 0.01, max: 1, default: 0.25, step: 0.01, unit: 's' },
    { name: 'makeup', label: 'Makeup', min: 0, max: 30, default: 0, step: 0.5, unit: 'dB' },
  ],
  volume: [
    { name: 'gain', label: 'Volume', min: 0, max: 150, default: 100, step: 1, unit: '%' },
  ],
};

export function getParamDescriptors(type: EffectType): ParamDescriptor[] {
  return PARAM_DESCRIPTORS[type];
}

export const EFFECT_LABELS: Record<EffectType, string> = {
  distortion: 'Distortion',
  delay: 'Delay',
  reverb: 'Reverb',
  chorus: 'Chorus',
  tremolo: 'Tremolo',
  eq: 'EQ',
  compressor: 'Compressor',
  volume: 'Volume',
};

export const ALL_EFFECT_TYPES: EffectType[] = [
  'distortion', 'delay', 'reverb', 'chorus', 'tremolo', 'eq', 'compressor', 'volume',
];
