import type { ComponentType } from 'react';
import type { RackToolFeatureFlag } from './config/features';
import { AmpChannelSelector } from './components/AmpChannelSelector/AmpChannelSelector';
import { IRLoader } from './components/IRLoader/IRLoader';
import { GlobalNoiseGate } from './components/GlobalNoiseGate/GlobalNoiseGate';
import { InputOutputMonitor } from './components/InputOutputMonitor/InputOutputMonitor';
import { OutputRecorder } from './components/OutputRecorder/OutputRecorder';
import { LooperPanel } from './components/LooperPanel/LooperPanel';
import { MetronomeBar } from './components/MetronomeBar/MetronomeBar';
import { DrumPads } from './components/DrumPads/DrumPads';

export interface RackToolDefinition {
  id: string;
  label: string;
  component: ComponentType;
  featureFlag?: RackToolFeatureFlag;
}

export const RACK_TOOL_REGISTRY: RackToolDefinition[] = [
  {
    id: 'metronome-bar',
    label: 'METRONOME / TUNER',
    component: MetronomeBar,
    featureFlag: 'metronomeBar',
  },
  {
    id: 'amp-channel-selector',
    label: 'Amp Channel',
    component: AmpChannelSelector,
    featureFlag: 'ampChannelSelector',
  },
  {
    id: 'cab-ir-loader',
    label: 'Cab IR Manager',
    component: IRLoader,
    featureFlag: 'cabIrLoader',
  },
  {
    id: 'global-noise-gate',
    label: 'Noise Gate',
    component: GlobalNoiseGate,
    featureFlag: 'globalNoiseGate',
  },
  {
    id: 'input-output-monitor',
    label: 'INPUT MONITOR / OUTPUT SAFETY',
    component: InputOutputMonitor,
    featureFlag: 'inputMonitor',
  },
  {
    id: 'output-recorder',
    label: 'Output Recorder',
    component: OutputRecorder,
    featureFlag: 'outputRecorder',
  },
  {
    id: 'looper-panel',
    label: 'Looper',
    component: LooperPanel,
    featureFlag: 'looperPanel',
  },
  {
    id: 'drum-pads',
    label: 'DRUM PADS / SEQUENCER',
    component: DrumPads,
    featureFlag: 'drumPads',
  },
];
