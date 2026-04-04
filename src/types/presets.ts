import type { EffectType } from './effects';

export interface PresetEffectSlot {
  type: EffectType;
  bypassed: boolean;
  params: Record<string, number>;
}

export interface Preset {
  id: string;
  name: string;
  isFactory: boolean;
  chain: PresetEffectSlot[];
}
