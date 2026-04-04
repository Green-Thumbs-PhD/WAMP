import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Compressor extends BaseEffect {
  readonly type: EffectType = 'compressor';

  private compressor: DynamicsCompressorNode;
  private makeupGain: GainNode;

  private threshold = -24;
  private ratio = 4;
  private attack = 0.003;
  private release = 0.25;
  private makeup = 0;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = this.threshold;
    this.compressor.ratio.value = this.ratio;
    this.compressor.attack.value = this.attack;
    this.compressor.release.value = this.release;
    this.compressor.knee.value = 6;

    this.makeupGain = ctx.createGain();
    this.makeupGain.gain.value = Math.pow(10, this.makeup / 20);

    this.compressor.connect(this.makeupGain);
    this.connectWetChain(this.compressor, this.makeupGain);
  }

  getReduction(): number {
    return this.compressor.reduction;
  }

  setParam(name: string, value: number): void {
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'threshold':
        this.threshold = value;
        this.compressor.threshold.linearRampToValueAtTime(value, t);
        break;
      case 'ratio':
        this.ratio = value;
        this.compressor.ratio.linearRampToValueAtTime(value, t);
        break;
      case 'attack':
        this.attack = value;
        this.compressor.attack.linearRampToValueAtTime(value, t);
        break;
      case 'release':
        this.release = value;
        this.compressor.release.linearRampToValueAtTime(value, t);
        break;
      case 'makeup':
        this.makeup = value;
        this.makeupGain.gain.linearRampToValueAtTime(Math.pow(10, value / 20), t);
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      threshold: this.threshold,
      ratio: this.ratio,
      attack: this.attack,
      release: this.release,
      makeup: this.makeup,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'threshold', label: 'Thresh', min: -60, max: 0, default: -24, step: 1, unit: 'dB' },
      { name: 'ratio', label: 'Ratio', min: 1, max: 20, default: 4, step: 0.5, unit: ':1' },
      { name: 'attack', label: 'Attack', min: 0, max: 1, default: 0.003, step: 0.001, unit: 's' },
      { name: 'release', label: 'Release', min: 0.01, max: 1, default: 0.25, step: 0.01, unit: 's' },
      { name: 'makeup', label: 'Makeup', min: 0, max: 30, default: 0, step: 0.5, unit: 'dB' },
    ];
  }

  dispose(): void {
    this.compressor.disconnect();
    this.makeupGain.disconnect();
    super.dispose();
  }
}
