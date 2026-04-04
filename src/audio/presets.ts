import type { Preset, PresetEffectSlot } from '../types/presets';

const STORAGE_KEY_PRESETS = 'mac2-presets';
const STORAGE_KEY_STATE = 'mac2-last-state';

export const FACTORY_PRESETS: Preset[] = [
  {
    id: 'factory-clean',
    name: 'Clean',
    isFactory: true,
    chain: [
      { type: 'compressor', bypassed: false, params: { threshold: -20, ratio: 2, attack: 0.01, release: 0.25, makeup: 3 } },
      { type: 'eq', bypassed: false, params: { lowGain: 0, midGain: -2, midFreq: 1000, highGain: 2 } },
      { type: 'volume', bypassed: false, params: { gain: 100 } },
    ],
  },
  {
    id: 'factory-crunch',
    name: 'Crunch',
    isFactory: true,
    chain: [
      { type: 'compressor', bypassed: false, params: { threshold: -18, ratio: 3, attack: 0.005, release: 0.2, makeup: 4 } },
      { type: 'distortion', bypassed: false, params: { drive: 35, tone: 3500, level: 55, mode: 0 } },
      { type: 'eq', bypassed: false, params: { lowGain: 1, midGain: 2, midFreq: 800, highGain: -1 } },
      { type: 'delay', bypassed: false, params: { time: 120, feedback: 15, mix: 20 } },
      { type: 'volume', bypassed: false, params: { gain: 100 } },
    ],
  },
  {
    id: 'factory-lead',
    name: 'Lead',
    isFactory: true,
    chain: [
      { type: 'compressor', bypassed: false, params: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, makeup: 6 } },
      { type: 'distortion', bypassed: false, params: { drive: 70, tone: 4000, level: 50, mode: 2 } },
      { type: 'eq', bypassed: false, params: { lowGain: -2, midGain: 4, midFreq: 1200, highGain: 1 } },
      { type: 'delay', bypassed: false, params: { time: 400, feedback: 35, mix: 30 } },
      { type: 'reverb', bypassed: false, params: { decay: 1.5, mix: 20, brightness: 60 } },
      { type: 'volume', bypassed: false, params: { gain: 100 } },
    ],
  },
  {
    id: 'factory-ambient',
    name: 'Ambient',
    isFactory: true,
    chain: [
      { type: 'compressor', bypassed: false, params: { threshold: -20, ratio: 2, attack: 0.02, release: 0.3, makeup: 4 } },
      { type: 'chorus', bypassed: false, params: { rate: 0.8, depth: 60, mix: 50 } },
      { type: 'delay', bypassed: false, params: { time: 600, feedback: 55, mix: 45 } },
      { type: 'reverb', bypassed: false, params: { decay: 5, mix: 55, brightness: 40 } },
      { type: 'tremolo', bypassed: false, params: { rate: 1.5, depth: 25, wave: 0 } },
      { type: 'volume', bypassed: false, params: { gain: 100 } },
    ],
  },
  {
    id: 'factory-heavy',
    name: 'Heavy',
    isFactory: true,
    chain: [
      { type: 'compressor', bypassed: false, params: { threshold: -30, ratio: 8, attack: 0.001, release: 0.15, makeup: 8 } },
      { type: 'distortion', bypassed: false, params: { drive: 90, tone: 3000, level: 60, mode: 1 } },
      { type: 'eq', bypassed: false, params: { lowGain: 3, midGain: -4, midFreq: 600, highGain: 2 } },
      { type: 'volume', bypassed: false, params: { gain: 100 } },
    ],
  },
  {
    id: 'factory-surf',
    name: 'Surf',
    isFactory: true,
    chain: [
      { type: 'tremolo', bypassed: false, params: { rate: 6, depth: 70, wave: 0 } },
      { type: 'reverb', bypassed: false, params: { decay: 1.8, mix: 45, brightness: 70 } },
      { type: 'volume', bypassed: false, params: { gain: 100 } },
    ],
  },
];

export function loadUserPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (!raw) return [];
    return JSON.parse(raw) as Preset[];
  } catch {
    return [];
  }
}

export function saveUserPresets(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
}

export function loadLastState(): PresetEffectSlot[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATE);
    if (!raw) return null;
    return JSON.parse(raw) as PresetEffectSlot[];
  } catch {
    return null;
  }
}

export function saveLastState(chain: PresetEffectSlot[]): void {
  localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(chain));
}
