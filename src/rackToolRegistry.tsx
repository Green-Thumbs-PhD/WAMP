import type { ComponentType } from 'react';
import type { RackToolFeatureFlag } from './config/features';
import { AmpCabManager } from './components/AmpCabManager/AmpCabManager';
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
    id: 'amp-cab-manager',
    label: 'AMP CHANNEL / CAB IR MANAGER',
    component: AmpCabManager,
    featureFlag: 'ampChannelSelector',
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
    label: 'LOOPER / BACKING TRACK PRACTICE',
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
