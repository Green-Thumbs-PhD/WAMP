import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Delay extends BaseEffect {
  readonly type: EffectType = 'delay';

  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private dryMix: GainNode;
  private wetMix: GainNode;
  private mixerOut: GainNode;

  private time = 400;
  private feedback = 40;
  private mix = 50;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.delayNode = ctx.createDelay(5);
    this.delayNode.delayTime.value = this.time / 1000;
    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.value = this.feedback / 100;

    this.dryMix = ctx.createGain();
    this.wetMix = ctx.createGain();
    this.mixerOut = ctx.createGain();

    // Delay + feedback loop
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    // Dry/wet mixing internal to this effect
    this.delayNode.connect(this.wetMix);
    this.dryMix.connect(this.mixerOut);
    this.wetMix.connect(this.mixerOut);

    // Connect: input -> delayNode (wet path) and input -> dryMix (dry path)
    this.inputNode.connect(this.dryMix);
    this.inputNode.connect(this.delayNode);
    this.mixerOut.connect(this.wetGain);

    // Override default wet chain: we handle our own dry/wet mixing
    this.updateMix();
  }

  private updateMix() {
    const wet = this.mix / 100;
    const dry = 1 - wet;
    this.dryMix.gain.value = dry;
    this.wetMix.gain.value = wet;
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'time':
        this.time = value;
        this.delayNode.delayTime.linearRampToValueAtTime(value / 1000, this.ctx.currentTime + 0.01);
        break;
      case 'feedback':
        this.feedback = Math.min(value, 95);
        this.feedbackGain.gain.linearRampToValueAtTime(this.feedback / 100, this.ctx.currentTime + 0.01);
        break;
      case 'mix':
        this.mix = value;
        this.updateMix();
        break;
    }
  }

  getParams(): Record<string, number> {
    return { time: this.time, feedback: this.feedback, mix: this.mix };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'time', label: 'Time', min: 50, max: 2000, default: 400, step: 10, unit: 'ms' },
      { name: 'feedback', label: 'Feedback', min: 0, max: 95, default: 40, step: 1, unit: '%' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 50, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.delayNode.disconnect();
    this.feedbackGain.disconnect();
    this.dryMix.disconnect();
    this.wetMix.disconnect();
    this.mixerOut.disconnect();
    super.dispose();
  }
}
