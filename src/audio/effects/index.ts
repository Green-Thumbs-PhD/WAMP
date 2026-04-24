import type { EffectNode, EffectType, ParamDescriptor } from '../../types/effects';
import { Distortion } from './Distortion';
import { Delay } from './Delay';
import { Reverb } from './Reverb';
import { Chorus } from './Chorus';
import { Flanger } from './Flanger';
import { Tremolo } from './Tremolo';
import { EQ } from './EQ';
import { GraphicEQ } from './GraphicEQ';
import { Compressor } from './Compressor';
import { Limiter } from './Limiter';
import { Volume } from './Volume';
import { NoiseGate } from './NoiseGate';
import { Preamp } from './Preamp';
import { Phaser } from './Phaser';
import { Octaver } from './Octaver';
import { AutoWah } from './AutoWah';
import { CabSim } from './CabSim';
import { PitchShifter } from './PitchShifter';
import { Harmonizer } from './Harmonizer';
import { Freeze } from './Freeze';

export function createEffect(ctx: AudioContext, type: EffectType): EffectNode {
  switch (type) {
    case 'distortion': return new Distortion(ctx);
    case 'delay': return new Delay(ctx);
    case 'reverb': return new Reverb(ctx);
    case 'chorus': return new Chorus(ctx);
    case 'flanger': return new Flanger(ctx);
    case 'tremolo': return new Tremolo(ctx);
    case 'eq': return new EQ(ctx);
    case 'graphicEq': return new GraphicEQ(ctx);
    case 'compressor': return new Compressor(ctx);
    case 'limiter': return new Limiter(ctx);
    case 'volume': return new Volume(ctx);
    case 'noiseGate': return new NoiseGate(ctx);
    case 'preamp': return new Preamp(ctx);
    case 'phaser': return new Phaser(ctx);
    case 'octaver': return new Octaver(ctx);
    case 'autoWah': return new AutoWah(ctx);
    case 'cabSim': return new CabSim(ctx);
    case 'pitchShifter': return new PitchShifter(ctx);
    case 'harmonizer': return new Harmonizer(ctx);
    case 'freeze': return new Freeze(ctx);
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
  flanger: [
    { name: 'rate', label: 'Rate', min: 0.1, max: 4, default: 0.35, step: 0.05, unit: 'Hz' },
    { name: 'depth', label: 'Depth', min: 0, max: 100, default: 55, step: 1, unit: '%' },
    { name: 'feedback', label: 'Fdbk', min: 0, max: 95, default: 30, step: 1, unit: '%' },
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
  graphicEq: [
    { name: 'band100', label: '100', min: -15, max: 15, default: 0, step: 0.5, unit: 'dB' },
    { name: 'band250', label: '250', min: -15, max: 15, default: 0, step: 0.5, unit: 'dB' },
    { name: 'band800', label: '800', min: -15, max: 15, default: 0, step: 0.5, unit: 'dB' },
    { name: 'band2200', label: '2.2k', min: -15, max: 15, default: 0, step: 0.5, unit: 'dB' },
    { name: 'band6400', label: '6.4k', min: -15, max: 15, default: 0, step: 0.5, unit: 'dB' },
  ],
  compressor: [
    { name: 'threshold', label: 'Thresh', min: -60, max: 0, default: -24, step: 1, unit: 'dB' },
    { name: 'ratio', label: 'Ratio', min: 1, max: 20, default: 4, step: 0.5, unit: ':1' },
    { name: 'attack', label: 'Attack', min: 0, max: 1, default: 0.003, step: 0.001, unit: 's' },
    { name: 'release', label: 'Release', min: 0.01, max: 1, default: 0.25, step: 0.01, unit: 's' },
    { name: 'makeup', label: 'Makeup', min: 0, max: 30, default: 0, step: 0.5, unit: 'dB' },
  ],
  limiter: [
    { name: 'threshold', label: 'Thresh', min: -24, max: 0, default: -8, step: 0.5, unit: 'dB' },
    { name: 'release', label: 'Release', min: 0.02, max: 0.4, default: 0.08, step: 0.01, unit: 's' },
    { name: 'ceiling', label: 'Ceiling', min: -6, max: 0, default: -0.5, step: 0.1, unit: 'dB' },
  ],
  volume: [
    { name: 'gain', label: 'Volume', min: 0, max: 150, default: 100, step: 1, unit: '%' },
  ],
  noiseGate: [
    { name: 'threshold', label: 'Thresh', min: -70, max: -20, default: -52, step: 1, unit: 'dB' },
    { name: 'release', label: 'Release', min: 20, max: 500, default: 140, step: 5, unit: 'ms' },
    { name: 'reduction', label: 'Gate', min: 0, max: 100, default: 100, step: 1, unit: '%' },
  ],
  preamp: [
    { name: 'gain', label: 'Gain', min: 0, max: 24, default: 12, step: 1, unit: 'dB' },
    { name: 'tone', label: 'Tone', min: 800, max: 7000, default: 3200, step: 10, unit: 'Hz' },
    { name: 'level', label: 'Level', min: 0, max: 150, default: 100, step: 1, unit: '%' },
  ],
  phaser: [
    { name: 'rate', label: 'Rate', min: 0.1, max: 8, default: 0.9, step: 0.1, unit: 'Hz' },
    { name: 'depth', label: 'Depth', min: 0, max: 100, default: 65, step: 1, unit: '%' },
    { name: 'feedback', label: 'Fdbk', min: 0, max: 90, default: 35, step: 1, unit: '%' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 55, step: 1, unit: '%' },
  ],
  octaver: [
    { name: 'sub', label: 'Sub', min: 0, max: 100, default: 65, step: 1, unit: '%' },
    { name: 'direct', label: 'Direct', min: 0, max: 100, default: 55, step: 1, unit: '%' },
    { name: 'tone', label: 'Tone', min: 500, max: 4000, default: 1800, step: 10, unit: 'Hz' },
  ],
  autoWah: [
    { name: 'sensitivity', label: 'Sense', min: 0, max: 100, default: 55, step: 1, unit: '%' },
    { name: 'peak', label: 'Peak', min: 2, max: 18, default: 10, step: 0.5, unit: 'Q' },
    { name: 'range', label: 'Range', min: 10, max: 100, default: 65, step: 1, unit: '%' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 70, step: 1, unit: '%' },
  ],
  cabSim: [
    { name: 'thump', label: 'Thump', min: -12, max: 12, default: 4, step: 0.5, unit: 'dB' },
    { name: 'bite', label: 'Bite', min: -12, max: 12, default: -3, step: 0.5, unit: 'dB' },
    { name: 'air', label: 'Air', min: 2200, max: 7000, default: 4300, step: 10, unit: 'Hz' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 65, step: 1, unit: '%' },
  ],
  pitchShifter: [
    { name: 'semitones', label: 'Shift', min: -12, max: 12, default: 7, step: 1, unit: 'st' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 55, step: 1, unit: '%' },
    { name: 'tone', label: 'Tone', min: 1800, max: 8000, default: 5200, step: 10, unit: 'Hz' },
  ],
  harmonizer: [
    { name: 'voiceA', label: 'Voice A', min: -12, max: 12, default: 4, step: 1, unit: 'st' },
    { name: 'voiceB', label: 'Voice B', min: -12, max: 12, default: 7, step: 1, unit: 'st' },
    { name: 'spread', label: 'Spread', min: 0, max: 100, default: 65, step: 1, unit: '%' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 55, step: 1, unit: '%' },
  ],
  freeze: [
    { name: 'hold', label: 'Hold', min: 0, max: 1, default: 0, step: 1, unit: '' },
    { name: 'mix', label: 'Mix', min: 0, max: 100, default: 60, step: 1, unit: '%' },
    { name: 'decay', label: 'Decay', min: 50, max: 100, default: 92, step: 1, unit: '%' },
    { name: 'texture', label: 'Texture', min: 0, max: 100, default: 45, step: 1, unit: '%' },
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
  flanger: 'Flanger',
  tremolo: 'Tremolo',
  eq: 'EQ',
  graphicEq: 'Graphic EQ',
  compressor: 'Compressor',
  limiter: 'Limiter',
  volume: 'Volume',
  noiseGate: 'Noise Gate',
  preamp: 'Boost / Pre',
  phaser: 'Phaser',
  octaver: 'Octaver',
  autoWah: 'Auto-Wah',
  cabSim: 'Cab Sim',
  pitchShifter: 'Pitch Shifter',
  harmonizer: 'Harmonizer',
  freeze: 'Freeze',
};

export const ALL_EFFECT_TYPES: EffectType[] = [
  'noiseGate', 'compressor', 'preamp', 'distortion', 'phaser', 'flanger', 'chorus', 'octaver', 'autoWah', 'pitchShifter', 'harmonizer', 'delay', 'reverb', 'freeze', 'tremolo', 'eq', 'graphicEq', 'cabSim', 'limiter', 'volume',
];
