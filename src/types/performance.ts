export type SpilloverStrategy = 'cut' | 'tail-safe';

export interface SceneEntry {
  id: string;
  presetId: string;
  songTitle: string;
  cue: string;
}

export interface PerformanceSettings {
  liveMode: boolean;
  muteOnPresetLoad: boolean;
  spilloverStrategy: SpilloverStrategy;
  rackToolOrder: string[];
  minimizedRackToolIds: string[];
}
