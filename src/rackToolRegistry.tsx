import type { ComponentType } from 'react';
import type { RackToolFeatureFlag } from './config/features';
import { AmpChannelSelector } from './components/AmpChannelSelector/AmpChannelSelector';
import { IRLoader } from './components/IRLoader/IRLoader';
import { GlobalNoiseGate } from './components/GlobalNoiseGate/GlobalNoiseGate';
import { OutputRecorder } from './components/OutputRecorder/OutputRecorder';
import { LooperPanel } from './components/LooperPanel/LooperPanel';
import { MetronomeBar } from './components/MetronomeBar/MetronomeBar';
import { DrumPads } from './components/DrumPads/DrumPads';

export interface RackToolDefinition {
  id: string;
  component: ComponentType;
  featureFlag?: RackToolFeatureFlag;
}

export const RACK_TOOL_REGISTRY: RackToolDefinition[] = [
  {
    id: 'amp-channel-selector',
    component: AmpChannelSelector,
    featureFlag: 'ampChannelSelector',
  },
  {
    id: 'cab-ir-loader',
    component: IRLoader,
    featureFlag: 'cabIrLoader',
  },
  {
    id: 'global-noise-gate',
    component: GlobalNoiseGate,
    featureFlag: 'globalNoiseGate',
  },
  {
    id: 'output-recorder',
    component: OutputRecorder,
    featureFlag: 'outputRecorder',
  },
  {
    id: 'looper-panel',
    component: LooperPanel,
    featureFlag: 'looperPanel',
  },
  {
    id: 'metronome-bar',
    component: MetronomeBar,
    featureFlag: 'metronomeBar',
  },
  {
    id: 'drum-pads',
    component: DrumPads,
    featureFlag: 'drumPads',
  },
];
