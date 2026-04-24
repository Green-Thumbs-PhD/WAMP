import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Limiter extends BaseEffect {
  readonly type: EffectType = 'limiter';

  private limiter: DynamicsCompressorNode;
  private outputGain: GainNode;

  private threshold = -8;
  private release = 0.08;
  private ceiling = -0.5;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = this.threshold;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = this.release;

    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = Math.pow(10, this.ceiling / 20);

    this.limiter.connect(this.outputGain);
    this.connectWetChain(this.limiter, this.outputGain);
  }

  setParam(name: string, value: number): void {
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'threshold':
        this.threshold = value;
        this.limiter.threshold.linearRampToValueAtTime(value, t);
        break;
      case 'release':
        this.release = value;
        this.limiter.release.linearRampToValueAtTime(value, t);
        break;
      case 'ceiling':
        this.ceiling = value;
        this.outputGain.gain.linearRampToValueAtTime(Math.pow(10, value / 20), t);
        break;
      default:
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      threshold: this.threshold,
      release: this.release,
      ceiling: this.ceiling,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'threshold', label: 'Thresh', min: -24, max: 0, default: -8, step: 0.5, unit: 'dB' },
      { name: 'release', label: 'Release', min: 0.02, max: 0.4, default: 0.08, step: 0.01, unit: 's' },
      { name: 'ceiling', label: 'Ceiling', min: -6, max: 0, default: -0.5, step: 0.1, unit: 'dB' },
    ];
  }

  dispose(): void {
    this.limiter.disconnect();
    this.outputGain.disconnect();
    super.dispose();
  }
}
