import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Volume extends BaseEffect {
  readonly type: EffectType = 'volume';

  private volumeGain: GainNode;
  private gain = 100;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.volumeGain = ctx.createGain();
    this.volumeGain.gain.value = 1;

    this.connectWetChain(this.volumeGain, this.volumeGain);
  }

  setParam(name: string, value: number): void {
    if (name === 'gain') {
      this.gain = value;
      this.volumeGain.gain.linearRampToValueAtTime(value / 100, this.ctx.currentTime + 0.01);
    }
  }

  getParams(): Record<string, number> {
    return { gain: this.gain };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'gain', label: 'Volume', min: 0, max: 150, default: 100, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.volumeGain.disconnect();
    super.dispose();
  }
}
