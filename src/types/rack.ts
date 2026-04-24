export interface RackState {
  masterVolume: number;
  inputTrim: number;
  inputMuted: boolean;
  muted: boolean;
  ampChannel: 'clean' | 'crunch' | 'lead';
  ampPresence: number;
  ampLevel: number;
  metronomeBpm: number;
  metronomeRunning: boolean;
  padsThroughChain: boolean;
  globalNoiseGateEnabled: boolean;
  globalNoiseGateThreshold: number;
  globalNoiseGateRelease: number;
  globalNoiseGateReduction: number;
  cabinetIrId: string;
  cabinetIrEnabled: boolean;
  cabinetIrMix: number;
  cabinetIrName: string;
}

export function createDefaultRackState(): RackState {
  return {
    masterVolume: 1,
    inputTrim: 1,
    inputMuted: false,
    muted: false,
    ampChannel: 'clean',
    ampPresence: 55,
    ampLevel: 1,
    metronomeBpm: 120,
    metronomeRunning: false,
    padsThroughChain: false,
    globalNoiseGateEnabled: false,
    globalNoiseGateThreshold: -56,
    globalNoiseGateRelease: 160,
    globalNoiseGateReduction: 100,
    cabinetIrId: '',
    cabinetIrEnabled: false,
    cabinetIrMix: 1,
    cabinetIrName: '',
  };
}

export function normalizeRackState(rack?: Partial<RackState> | null): RackState {
  const defaults = createDefaultRackState();

  return {
    masterVolume: rack?.masterVolume ?? defaults.masterVolume,
    inputTrim: rack?.inputTrim ?? defaults.inputTrim,
    inputMuted: rack?.inputMuted ?? defaults.inputMuted,
    muted: rack?.muted ?? defaults.muted,
    ampChannel: rack?.ampChannel ?? defaults.ampChannel,
    ampPresence: rack?.ampPresence ?? defaults.ampPresence,
    ampLevel: rack?.ampLevel ?? defaults.ampLevel,
    metronomeBpm: rack?.metronomeBpm ?? defaults.metronomeBpm,
    metronomeRunning: rack?.metronomeRunning ?? defaults.metronomeRunning,
    padsThroughChain: rack?.padsThroughChain ?? defaults.padsThroughChain,
    globalNoiseGateEnabled: rack?.globalNoiseGateEnabled ?? defaults.globalNoiseGateEnabled,
    globalNoiseGateThreshold: rack?.globalNoiseGateThreshold ?? defaults.globalNoiseGateThreshold,
    globalNoiseGateRelease: rack?.globalNoiseGateRelease ?? defaults.globalNoiseGateRelease,
    globalNoiseGateReduction: rack?.globalNoiseGateReduction ?? defaults.globalNoiseGateReduction,
    cabinetIrId: rack?.cabinetIrId ?? defaults.cabinetIrId,
    cabinetIrEnabled: rack?.cabinetIrEnabled ?? defaults.cabinetIrEnabled,
    cabinetIrMix: rack?.cabinetIrMix ?? defaults.cabinetIrMix,
    cabinetIrName: rack?.cabinetIrName ?? defaults.cabinetIrName,
  };
}
