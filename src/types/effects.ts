export type EffectType =
  | 'distortion'
  | 'delay'
  | 'reverb'
  | 'chorus'
  | 'tremolo'
  | 'eq'
  | 'compressor'
  | 'volume';

export interface ParamDescriptor {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit: string;
}

export interface EffectNode {
  readonly id: string;
  readonly type: EffectType;

  getInputNode(): AudioNode;
  getOutputNode(): AudioNode;

  setParam(name: string, value: number): void;
  getParams(): Record<string, number>;
  getParamDescriptors(): ParamDescriptor[];

  setBypassed(bypassed: boolean): void;
  isBypassed(): boolean;

  dispose(): void;
}

export interface EffectSlotState {
  id: string;
  type: EffectType;
  bypassed: boolean;
  params: Record<string, number>;
}
