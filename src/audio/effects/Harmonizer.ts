import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

function interpolate(buffer: Float32Array, index: number): number {
  const base = Math.floor(index);
  const next = (base + 1) % buffer.length;
  const frac = index - base;
  const a = buffer[base] ?? 0;
  const b = buffer[next] ?? 0;
  return a + (b - a) * frac;
}

export class Harmonizer extends BaseEffect {
  readonly type: EffectType = 'harmonizer';

  private processor: ScriptProcessorNode;
  private processorSink: GainNode;
  private wetMix: GainNode;
  private dryMix: GainNode;
  private mixer: GainNode;
  private lowpass: BiquadFilterNode;

  private voiceA = 4;
  private voiceB = 7;
  private spread = 65;
  private mix = 55;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.processor = ctx.createScriptProcessor(2048, 1, 1);
    this.processorSink = ctx.createGain();
    this.processorSink.gain.value = 0;
    this.wetMix = ctx.createGain();
    this.dryMix = ctx.createGain();
    this.mixer = ctx.createGain();
    this.lowpass = ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = 5600;

    this.inputNode.connect(this.dryMix);
    this.dryMix.connect(this.mixer);
    this.inputNode.connect(this.processor);
    this.processor.connect(this.processorSink);
    this.processorSink.connect(ctx.destination);
    this.processor.connect(this.lowpass);
    this.lowpass.connect(this.wetMix);
    this.wetMix.connect(this.mixer);
    this.mixer.connect(this.wetGain);

    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);
      const ratioA = Math.pow(2, this.voiceA / 12);
      const ratioB = Math.pow(2, this.voiceB / 12);
      const spread = this.spread / 100;

      for (let i = 0; i < output.length; i++) {
        const voice1 = interpolate(input, (i * ratioA) % input.length);
        const voice2 = interpolate(input, (i * ratioB) % input.length);
        output[i] = voice1 * (1 - spread * 0.35) * 0.5 + voice2 * (0.35 + spread * 0.65) * 0.5;
      }
    };

    this.updateMix();
  }

  private updateMix(): void {
    const wet = this.mix / 100;
    this.wetMix.gain.value = wet;
    this.dryMix.gain.value = 1 - wet;
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'voiceA':
        this.voiceA = value;
        break;
      case 'voiceB':
        this.voiceB = value;
        break;
      case 'spread':
        this.spread = value;
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
      voiceA: this.voiceA,
      voiceB: this.voiceB,
      spread: this.spread,
      mix: this.mix,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'voiceA', label: 'Voice A', min: -12, max: 12, default: 4, step: 1, unit: 'st' },
      { name: 'voiceB', label: 'Voice B', min: -12, max: 12, default: 7, step: 1, unit: 'st' },
      { name: 'spread', label: 'Spread', min: 0, max: 100, default: 65, step: 1, unit: '%' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 55, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.processor.onaudioprocess = null;
    this.processor.disconnect();
    this.processorSink.disconnect();
    this.lowpass.disconnect();
    this.wetMix.disconnect();
    this.dryMix.disconnect();
    this.mixer.disconnect();
    super.dispose();
  }
}
