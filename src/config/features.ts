export const FEATURE_FLAGS = {
  rackTools: {
    ampChannelSelector: true,
    cabIrLoader: true,
    globalNoiseGate: true,
    outputRecorder: true,
    looperPanel: true,
    metronomeBar: true,
    drumPads: true,
  },
  presets: {
    rackStateSnapshots: true,
  },
  persistence: {
    versionedStorage: true,
    separateRackState: true,
  },
} as const;

export type RackToolFeatureFlag = keyof typeof FEATURE_FLAGS.rackTools;

export function isRackToolEnabled(flag?: RackToolFeatureFlag): boolean {
  return flag ? FEATURE_FLAGS.rackTools[flag] : true;
}
