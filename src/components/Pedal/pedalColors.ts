import type { EffectType } from '../../types/effects';

interface PedalColor {
  bg: string;
  accent: string;
  knob: string;
  led: string;
  text: string;
}

export const PEDAL_COLORS: Record<EffectType, PedalColor> = {
  distortion: {
    bg: 'linear-gradient(145deg, #c4501a, #8b3210)',
    accent: '#ff6b35',
    knob: '#ff6b35',
    led: '#ff3333',
    text: '#ffe0cc',
  },
  delay: {
    bg: 'linear-gradient(145deg, #1a5c8c, #0d3a5c)',
    accent: '#4da6e0',
    knob: '#4da6e0',
    led: '#33ccff',
    text: '#cce5ff',
  },
  reverb: {
    bg: 'linear-gradient(145deg, #1a7a6c, #0d4a42)',
    accent: '#40c4aa',
    knob: '#40c4aa',
    led: '#33ffcc',
    text: '#ccffe5',
  },
  chorus: {
    bg: 'linear-gradient(145deg, #6a3a8c, #3d1f5c)',
    accent: '#b06de0',
    knob: '#b06de0',
    led: '#cc66ff',
    text: '#e5ccff',
  },
  tremolo: {
    bg: 'linear-gradient(145deg, #2d7a2d, #1a4a1a)',
    accent: '#55cc55',
    knob: '#55cc55',
    led: '#33ff33',
    text: '#ccffcc',
  },
  eq: {
    bg: 'linear-gradient(145deg, #8c7a1a, #5c4e0d)',
    accent: '#e0c44d',
    knob: '#e0c44d',
    led: '#ffcc33',
    text: '#fff5cc',
  },
  compressor: {
    bg: 'linear-gradient(145deg, #555555, #333333)',
    accent: '#aaaaaa',
    knob: '#aaaaaa',
    led: '#ff6666',
    text: '#dddddd',
  },
  volume: {
    bg: 'linear-gradient(145deg, #8c8070, #5c5040)',
    accent: '#d4c4a8',
    knob: '#d4c4a8',
    led: '#66ff66',
    text: '#f0e8d8',
  },
};
