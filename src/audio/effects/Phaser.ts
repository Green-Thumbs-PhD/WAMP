import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Phaser extends BaseEffect {
  readonly type: EffectType = 'phaser';

  private stages: BiquadFilterNode[];
  private feedbackGain: GainNode;
  private wetMix: GainNode;
  private dryMix: GainNode;
  private mixer: GainNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private rate = 0.9;
  private depth = 65;
  private feedback = 35;
  private mix = 55;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.stages = Array.from({ length: 4 }, () => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'allpass';
      filter.frequency.value = 500;
      return filter;
    });

    this.feedbackGain = ctx.createGain();
    this.feedbackGain.gain.value = this.feedback / 100 * 0.85;

    this.dryMix = ctx.createGain();
    this.wetMix = ctx.createGain();
    this.mixer = ctx.createGain();

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.rate;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 450 * (this.depth / 100);

    this.inputNode.connect(this.dryMix);
    this.dryMix.connect(this.mixer);

    this.inputNode.connect(this.stages[0]!);
    for (let i = 0; i < this.stages.length - 1; i++) {
      this.stages[i]!.connect(this.stages[i + 1]!);
    }
    this.stages[this.stages.length - 1]!.connect(this.wetMix);
    this.wetMix.connect(this.mixer);
    this.mixer.connect(this.wetGain);

    this.stages[this.stages.length - 1]!.connect(this.feedbackGain);
    this.feedbackGain.connect(this.stages[0]!);

    this.lfo.connect(this.lfoGain);
    for (const stage of this.stages) {
      this.lfoGain.connect(stage.frequency);
    }
    this.lfo.start();

    this.updateMix();
  }

  private updateMix() {
    const wet = this.mix / 100;
    this.wetMix.gain.value = wet;
    this.dryMix.gain.value = 1 - wet * 0.65;
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'rate':
        this.rate = value;
        this.lfo.frequency.linearRampToValueAtTime(value, this.ctx.currentTime + 0.01);
        break;
      case 'depth':
        this.depth = value;
        this.lfoGain.gain.linearRampToValueAtTime(450 * (value / 100), this.ctx.currentTime + 0.01);
        break;
      case 'feedback':
        this.feedback = value;
        this.feedbackGain.gain.linearRampToValueAtTime(value / 100 * 0.85, this.ctx.currentTime + 0.01);
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
      { name: 'rate', label: 'Rate', min: 0.1, max: 8, default: 0.9, step: 0.1, unit: 'Hz' },
      { name: 'depth', label: 'Depth', min: 0, max: 100, default: 65, step: 1, unit: '%' },
      { name: 'feedback', label: 'Fdbk', min: 0, max: 90, default: 35, step: 1, unit: '%' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 55, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.feedbackGain.disconnect();
    this.wetMix.disconnect();
    this.dryMix.disconnect();
    this.mixer.disconnect();
    this.stages.forEach((stage) => stage.disconnect());
    super.dispose();
  }
}
