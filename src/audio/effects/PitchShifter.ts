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

export class PitchShifter extends BaseEffect {
  readonly type: EffectType = 'pitchShifter';

  protected processor: ScriptProcessorNode;
  protected processorSink: GainNode;
  protected wetMix: GainNode;
  protected dryMix: GainNode;
  protected mixer: GainNode;

  protected semitones = 7;
  protected mix = 55;
  protected tone = 5200;
  protected lowpass: BiquadFilterNode;

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
    this.lowpass.frequency.value = this.tone;

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
      this.renderShiftedBuffer(event.inputBuffer.getChannelData(0), event.outputBuffer.getChannelData(0), this.semitones);
    };

    this.updateMix();
  }

  protected renderShiftedBuffer(input: Float32Array, output: Float32Array, semitones: number): void {
    const ratio = Math.pow(2, semitones / 12);
    const step = Math.max(0.25, Math.min(4, ratio));
    for (let i = 0; i < output.length; i++) {
      const readIndex = (i * step) % input.length;
      output[i] = interpolate(input, readIndex);
    }
  }

  protected updateMix(): void {
    const wet = this.mix / 100;
    this.wetMix.gain.value = wet;
    this.dryMix.gain.value = 1 - wet;
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'semitones':
        this.semitones = value;
        break;
      case 'mix':
        this.mix = value;
        this.updateMix();
        break;
      case 'tone':
        this.tone = value;
        this.lowpass.frequency.linearRampToValueAtTime(value, this.ctx.currentTime + 0.01);
        break;
      default:
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      semitones: this.semitones,
      mix: this.mix,
      tone: this.tone,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'semitones', label: 'Shift', min: -12, max: 12, default: 7, step: 1, unit: 'st' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 55, step: 1, unit: '%' },
      { name: 'tone', label: 'Tone', min: 1800, max: 8000, default: 5200, step: 10, unit: 'Hz' },
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
