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
  flanger: {
    bg: 'linear-gradient(145deg, #284f8e, #132745)',
    accent: '#69b5ff',
    knob: '#69b5ff',
    led: '#66ccff',
    text: '#d8efff',
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
  graphicEq: {
    bg: 'linear-gradient(145deg, #7d6f18, #43390a)',
    accent: '#f3d45a',
    knob: '#f3d45a',
    led: '#ffd54f',
    text: '#fff8d7',
  },
  compressor: {
    bg: 'linear-gradient(145deg, #555555, #333333)',
    accent: '#aaaaaa',
    knob: '#aaaaaa',
    led: '#ff6666',
    text: '#dddddd',
  },
  limiter: {
    bg: 'linear-gradient(145deg, #4f545b, #23262b)',
    accent: '#d7dde6',
    knob: '#d7dde6',
    led: '#ff9e7a',
    text: '#f0f3f8',
  },
  volume: {
    bg: 'linear-gradient(145deg, #8c8070, #5c5040)',
    accent: '#d4c4a8',
    knob: '#d4c4a8',
    led: '#66ff66',
    text: '#f0e8d8',
  },
  noiseGate: {
    bg: 'linear-gradient(145deg, #2d2f3f, #161826)',
    accent: '#8aa3ff',
    knob: '#8aa3ff',
    led: '#7ea2ff',
    text: '#dce3ff',
  },
  preamp: {
    bg: 'linear-gradient(145deg, #8d3f2d, #552114)',
    accent: '#ffb36b',
    knob: '#ffb36b',
    led: '#ffc266',
    text: '#ffe8d1',
  },
  phaser: {
    bg: 'linear-gradient(145deg, #355a88, #1d3150)',
    accent: '#8fd3ff',
    knob: '#8fd3ff',
    led: '#70d6ff',
    text: '#def4ff',
  },
  octaver: {
    bg: 'linear-gradient(145deg, #335032, #172914)',
    accent: '#a8e66a',
    knob: '#a8e66a',
    led: '#9ef55c',
    text: '#ecffd6',
  },
  autoWah: {
    bg: 'linear-gradient(145deg, #8c5a1a, #55330d)',
    accent: '#ffcf6b',
    knob: '#ffcf6b',
    led: '#ffd35e',
    text: '#fff0cc',
  },
  cabSim: {
    bg: 'linear-gradient(145deg, #6b4b32, #392413)',
    accent: '#f1b37b',
    knob: '#f1b37b',
    led: '#ffb077',
    text: '#ffe5d2',
  },
  pitchShifter: {
    bg: 'linear-gradient(145deg, #5b2e74, #2d143a)',
    accent: '#d68dff',
    knob: '#d68dff',
    led: '#dc91ff',
    text: '#f0d8ff',
  },
  harmonizer: {
    bg: 'linear-gradient(145deg, #2f6b79, #15363d)',
    accent: '#7be3f3',
    knob: '#7be3f3',
    led: '#79eeff',
    text: '#dafaff',
  },
  freeze: {
    bg: 'linear-gradient(145deg, #7ea3b8, #3d5967)',
    accent: '#e0f6ff',
    knob: '#e0f6ff',
    led: '#bff3ff',
    text: '#f4fdff',
  },
};
