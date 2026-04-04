import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Tremolo extends BaseEffect {
  readonly type: EffectType = 'tremolo';

  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private tremoloGain: GainNode;

  private rate = 4;
  private depth = 60;
  private wave: 0 | 1 = 0; // 0 = sine, 1 = square

  constructor(ctx: AudioContext) {
    super(ctx);

    this.tremoloGain = ctx.createGain();

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.rate;

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = this.depth / 200; // Scale: depth 100 = modulate between 0.5 and 1

    // The LFO modulates the gain. We need to offset so it oscillates around 1.
    // LFO output is [-1, 1], scaled by lfoGain, then added to tremoloGain.gain
    // So tremoloGain.gain = 1 + lfo * depth
    // At depth 100%, gain oscillates between ~0.5 and ~1.5
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.tremoloGain.gain);
    this.lfo.start();

    this.connectWetChain(this.tremoloGain, this.tremoloGain);
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'rate':
        this.rate = value;
        this.lfo.frequency.linearRampToValueAtTime(value, this.ctx.currentTime + 0.01);
        break;
      case 'depth':
        this.depth = value;
        this.lfoGain.gain.linearRampToValueAtTime(value / 200, this.ctx.currentTime + 0.01);
        break;
      case 'wave':
        this.wave = value as 0 | 1;
        this.lfo.type = value === 1 ? 'square' : 'sine';
        break;
    }
  }

  getParams(): Record<string, number> {
    return { rate: this.rate, depth: this.depth, wave: this.wave };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'rate', label: 'Rate', min: 0.5, max: 15, default: 4, step: 0.1, unit: 'Hz' },
      { name: 'depth', label: 'Depth', min: 0, max: 100, default: 60, step: 1, unit: '%' },
      { name: 'wave', label: 'Wave', min: 0, max: 1, default: 0, step: 1, unit: '' },
    ];
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.tremoloGain.disconnect();
    super.dispose();
  }
}
