import type { EffectType } from './effects';
import type { RackState } from './rack';

export interface PresetEffectSlot {
  type: EffectType;
  bypassed: boolean;
  params: Record<string, number>;
}

export interface RigSnapshot {
  chain: PresetEffectSlot[];
  rack: RackState;
}

export interface Preset {
  id: string;
  name: string;
  isFactory: boolean;
  chain: RigSnapshot['chain'];
  rack: RigSnapshot['rack'];
  category: string;
  tags: string[];
  favorite: boolean;
}
