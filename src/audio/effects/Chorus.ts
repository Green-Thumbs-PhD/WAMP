import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Chorus extends BaseEffect {
  readonly type: EffectType = 'chorus';

  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private chorusDelay: DelayNode;
  private dryMix: GainNode;
  private wetMix: GainNode;
  private mixerOut: GainNode;

  private rate = 1.5;
  private depth = 50;
  private mix = 50;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.chorusDelay = ctx.createDelay(0.1);
    this.chorusDelay.delayTime.value = 0.007; // 7ms base delay

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.rate;

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.002 * (this.depth / 100); // ±2ms modulation at full depth

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.chorusDelay.delayTime);
    this.lfo.start();

    this.dryMix = ctx.createGain();
    this.wetMix = ctx.createGain();
    this.mixerOut = ctx.createGain();

    this.inputNode.connect(this.chorusDelay);
    this.chorusDelay.connect(this.wetMix);
    this.inputNode.connect(this.dryMix);
    this.dryMix.connect(this.mixerOut);
    this.wetMix.connect(this.mixerOut);
    this.mixerOut.connect(this.wetGain);

    this.updateMix();
  }

  private updateMix() {
    const wet = this.mix / 100;
    this.dryMix.gain.value = 1 - wet * 0.5;
    this.wetMix.gain.value = wet;
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'rate':
        this.rate = value;
        this.lfo.frequency.linearRampToValueAtTime(value, this.ctx.currentTime + 0.01);
        break;
      case 'depth':
        this.depth = value;
        this.lfoGain.gain.linearRampToValueAtTime(0.002 * (value / 100), this.ctx.currentTime + 0.01);
        break;
      case 'mix':
        this.mix = value;
        this.updateMix();
        break;
    }
  }

  getParams(): Record<string, number> {
    return { rate: this.rate, depth: this.depth, mix: this.mix };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'rate', label: 'Rate', min: 0.1, max: 10, default: 1.5, step: 0.1, unit: 'Hz' },
      { name: 'depth', label: 'Depth', min: 0, max: 100, default: 50, step: 1, unit: '%' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 50, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.chorusDelay.disconnect();
    this.dryMix.disconnect();
    this.wetMix.disconnect();
    this.mixerOut.disconnect();
    super.dispose();
  }
}
