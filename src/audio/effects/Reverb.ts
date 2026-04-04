import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

function generateImpulseResponse(
  ctx: AudioContext,
  decay: number,
  brightness: number
): AudioBuffer {
  const duration = Math.max(decay * 1.5, 0.5);
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

  // Brightness controls how quickly high frequencies decay
  const brightnessDecay = 1 + (1 - brightness / 100) * 3;

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * (3 / decay));
      const hfEnvelope = Math.exp(-t * (3 / decay) * brightnessDecay);
      // Mix of broadband noise with HF-attenuated noise
      const noise = Math.random() * 2 - 1;
      data[i] = noise * (envelope * 0.5 + hfEnvelope * 0.5);
    }
  }
  return buffer;
}

export class Reverb extends BaseEffect {
  readonly type: EffectType = 'reverb';

  private convolver: ConvolverNode;
  private dryMix: GainNode;
  private wetMix: GainNode;
  private mixerOut: GainNode;

  private decay = 2.5;
  private mix = 30;
  private brightness = 50;
  private irTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.convolver = ctx.createConvolver();
    this.dryMix = ctx.createGain();
    this.wetMix = ctx.createGain();
    this.mixerOut = ctx.createGain();

    this.convolver.connect(this.wetMix);
    this.dryMix.connect(this.mixerOut);
    this.wetMix.connect(this.mixerOut);

    this.inputNode.connect(this.dryMix);
    this.inputNode.connect(this.convolver);
    this.mixerOut.connect(this.wetGain);

    this.updateMix();
    this.regenerateIR();
  }

  private updateMix() {
    const wet = this.mix / 100;
    this.dryMix.gain.value = 1 - wet;
    this.wetMix.gain.value = wet;
  }

  private regenerateIR() {
    if (this.irTimeout) clearTimeout(this.irTimeout);
    this.irTimeout = setTimeout(() => {
      this.convolver.buffer = generateImpulseResponse(this.ctx, this.decay, this.brightness);
    }, 100);
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'decay':
        this.decay = value;
        this.regenerateIR();
        break;
      case 'mix':
        this.mix = value;
        this.updateMix();
        break;
      case 'brightness':
        this.brightness = value;
        this.regenerateIR();
        break;
    }
  }

  getParams(): Record<string, number> {
    return { decay: this.decay, mix: this.mix, brightness: this.brightness };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'decay', label: 'Decay', min: 0.1, max: 10, default: 2.5, step: 0.1, unit: 's' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 30, step: 1, unit: '%' },
      { name: 'brightness', label: 'Bright', min: 0, max: 100, default: 50, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    if (this.irTimeout) clearTimeout(this.irTimeout);
    this.convolver.disconnect();
    this.dryMix.disconnect();
    this.wetMix.disconnect();
    this.mixerOut.disconnect();
    super.dispose();
  }
}
