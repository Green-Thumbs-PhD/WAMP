import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class AutoWah extends BaseEffect {
  readonly type: EffectType = 'autoWah';

  private detector: ScriptProcessorNode;
  private detectorSink: GainNode;
  private bandpass: BiquadFilterNode;
  private wetMix: GainNode;
  private dryMix: GainNode;
  private mixer: GainNode;

  private sensitivity = 55;
  private peak = 10;
  private range = 65;
  private mix = 70;
  private envelope = 0;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.detector = ctx.createScriptProcessor(1024, 1, 1);
    this.detectorSink = ctx.createGain();
    this.detectorSink.gain.value = 0;

    this.bandpass = ctx.createBiquadFilter();
    this.bandpass.type = 'bandpass';
    this.bandpass.frequency.value = 550;
    this.bandpass.Q.value = this.peak;

    this.wetMix = ctx.createGain();
    this.dryMix = ctx.createGain();
    this.mixer = ctx.createGain();

    this.inputNode.connect(this.dryMix);
    this.dryMix.connect(this.mixer);
    this.inputNode.connect(this.bandpass);
    this.bandpass.connect(this.wetMix);
    this.wetMix.connect(this.mixer);
    this.mixer.connect(this.wetGain);

    this.inputNode.connect(this.detector);
    this.detector.connect(this.detectorSink);
    this.detectorSink.connect(ctx.destination);
    this.detector.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      if (!input.length) return;
      let rms = 0;
      for (let i = 0; i < input.length; i++) rms += input[i]! * input[i]!;
      rms = Math.sqrt(rms / input.length);
      const target = Math.min(1, rms * (2.2 + this.sensitivity / 28));
      this.envelope += (target - this.envelope) * 0.18;
      const minFreq = 320;
      const maxFreq = 320 + this.range * 30;
      const nextFreq = minFreq + (maxFreq - minFreq) * this.envelope;
      this.bandpass.frequency.linearRampToValueAtTime(nextFreq, this.ctx.currentTime + 0.01);
    };

    this.updateMix();
  }

  private updateMix(): void {
    const wet = this.mix / 100;
    this.wetMix.gain.value = wet;
    this.dryMix.gain.value = 1 - wet * 0.75;
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'sensitivity':
        this.sensitivity = value;
        break;
      case 'peak':
        this.peak = value;
        this.bandpass.Q.linearRampToValueAtTime(value, this.ctx.currentTime + 0.01);
        break;
      case 'range':
        this.range = value;
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
      sensitivity: this.sensitivity,
      peak: this.peak,
      range: this.range,
      mix: this.mix,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'sensitivity', label: 'Sense', min: 0, max: 100, default: 55, step: 1, unit: '%' },
      { name: 'peak', label: 'Peak', min: 2, max: 18, default: 10, step: 0.5, unit: 'Q' },
      { name: 'range', label: 'Range', min: 10, max: 100, default: 65, step: 1, unit: '%' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 70, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.detector.onaudioprocess = null;
    this.detector.disconnect();
    this.detectorSink.disconnect();
    this.bandpass.disconnect();
    this.wetMix.disconnect();
    this.dryMix.disconnect();
    this.mixer.disconnect();
    super.dispose();
  }
}
