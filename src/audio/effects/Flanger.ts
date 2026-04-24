import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Flanger extends BaseEffect {
  readonly type: EffectType = 'flanger';

  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private wetMix: GainNode;
  private dryMix: GainNode;
  private mixer: GainNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;

  private rate = 0.35;
  private depth = 55;
  private feedback = 30;
  private mix = 50;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.delayNode = ctx.createDelay(0.03);
    this.delayNode.delayTime.value = 0.004;

    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.value = this.feedback / 100 * 0.85;

    this.dryMix = ctx.createGain();
    this.wetMix = ctx.createGain();
    this.mixer = ctx.createGain();

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'triangle';
    this.lfo.frequency.value = this.rate;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.0025 * (this.depth / 100);

    this.inputNode.connect(this.dryMix);
    this.dryMix.connect(this.mixer);

    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.wetMix);
    this.wetMix.connect(this.mixer);
    this.mixer.connect(this.wetGain);

    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);
    this.lfo.start();

    this.updateMix();
  }

  private updateMix(): void {
    const wet = this.mix / 100;
    this.wetMix.gain.value = wet;
    this.dryMix.gain.value = 1 - wet * 0.55;
  }

  setParam(name: string, value: number): void {
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'rate':
        this.rate = value;
        this.lfo.frequency.linearRampToValueAtTime(value, t);
        break;
      case 'depth':
        this.depth = value;
        this.lfoGain.gain.linearRampToValueAtTime(0.0025 * (value / 100), t);
        break;
      case 'feedback':
        this.feedback = value;
        this.feedbackGain.gain.linearRampToValueAtTime(value / 100 * 0.85, t);
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
      rate: this.rate,
      depth: this.depth,
      feedback: this.feedback,
      mix: this.mix,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'rate', label: 'Rate', min: 0.1, max: 4, default: 0.35, step: 0.05, unit: 'Hz' },
      { name: 'depth', label: 'Depth', min: 0, max: 100, default: 55, step: 1, unit: '%' },
      { name: 'feedback', label: 'Fdbk', min: 0, max: 95, default: 30, step: 1, unit: '%' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 50, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.delayNode.disconnect();
    this.feedbackGain.disconnect();
    this.dryMix.disconnect();
    this.wetMix.disconnect();
    this.mixer.disconnect();
    super.dispose();
  }
}
