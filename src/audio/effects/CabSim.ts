import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class CabSim extends BaseEffect {
  readonly type: EffectType = 'cabSim';

  private highpass: BiquadFilterNode;
  private lowpass: BiquadFilterNode;
  private thumpEq: BiquadFilterNode;
  private biteEq: BiquadFilterNode;
  private wetMix: GainNode;
  private dryMix: GainNode;
  private mixer: GainNode;

  private thump = 4;
  private bite = -3;
  private air = 4300;
  private mix = 65;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.highpass = ctx.createBiquadFilter();
    this.highpass.type = 'highpass';
    this.highpass.frequency.value = 80;

    this.thumpEq = ctx.createBiquadFilter();
    this.thumpEq.type = 'lowshelf';
    this.thumpEq.frequency.value = 180;
    this.thumpEq.gain.value = this.thump;

    this.biteEq = ctx.createBiquadFilter();
    this.biteEq.type = 'peaking';
    this.biteEq.frequency.value = 1800;
    this.biteEq.Q.value = 1;
    this.biteEq.gain.value = this.bite;

    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = this.air;
    this.lowpass.Q.value = 0.7;

    this.wetMix = ctx.createGain();
    this.dryMix = ctx.createGain();
    this.mixer = ctx.createGain();

    this.inputNode.connect(this.dryMix);
    this.dryMix.connect(this.mixer);

    this.inputNode.connect(this.highpass);
    this.highpass.connect(this.thumpEq);
    this.thumpEq.connect(this.biteEq);
    this.biteEq.connect(this.lowpass);
    this.lowpass.connect(this.wetMix);
    this.wetMix.connect(this.mixer);
    this.mixer.connect(this.wetGain);

    this.updateMix();
  }

  private updateMix(): void {
    const wet = this.mix / 100;
    this.wetMix.gain.value = wet;
    this.dryMix.gain.value = 1 - wet;
  }

  setParam(name: string, value: number): void {
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'thump':
        this.thump = value;
        this.thumpEq.gain.linearRampToValueAtTime(value, t);
        break;
      case 'bite':
        this.bite = value;
        this.biteEq.gain.linearRampToValueAtTime(value, t);
        break;
      case 'air':
        this.air = value;
        this.lowpass.frequency.linearRampToValueAtTime(value, t);
        break;
      case 'mix':
        this.mix = value;
        this.updateMix();
        break;
      default:
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      thump: this.thump,
      bite: this.bite,
      air: this.air,
      mix: this.mix,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'thump', label: 'Thump', min: -12, max: 12, default: 4, step: 0.5, unit: 'dB' },
      { name: 'bite', label: 'Bite', min: -12, max: 12, default: -3, step: 0.5, unit: 'dB' },
      { name: 'air', label: 'Air', min: 2200, max: 7000, default: 4300, step: 10, unit: 'Hz' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 65, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.highpass.disconnect();
    this.thumpEq.disconnect();
    this.biteEq.disconnect();
    this.lowpass.disconnect();
    this.wetMix.disconnect();
    this.dryMix.disconnect();
    this.mixer.disconnect();
    super.dispose();
  }
}
