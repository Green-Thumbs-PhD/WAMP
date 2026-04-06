import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Octaver extends BaseEffect {
  readonly type: EffectType = 'octaver';

  private detector: ScriptProcessorNode;
  private detectorSink: GainNode;
  private wetMix: GainNode;
  private dryMix: GainNode;
  private mixer: GainNode;
  private filter: BiquadFilterNode;

  private sub = 65;
  private direct = 55;
  private tone = 1800;
  private phase = 1;
  private previousSample = 0;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.detector = ctx.createScriptProcessor(1024, 1, 1);
    this.detectorSink = ctx.createGain();
    this.detectorSink.gain.value = 0;

    this.wetMix = ctx.createGain();
    this.dryMix = ctx.createGain();
    this.mixer = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.tone;

    this.inputNode.connect(this.dryMix);
    this.dryMix.connect(this.mixer);

    this.inputNode.connect(this.detector);
    this.detector.connect(this.detectorSink);
    this.detectorSink.connect(ctx.destination);
    this.detector.connect(this.filter);
    this.filter.connect(this.wetMix);
    this.wetMix.connect(this.mixer);
    this.mixer.connect(this.wetGain);

    this.detector.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);

      for (let i = 0; i < input.length; i++) {
        const sample = input[i] ?? 0;
        if (sample >= 0 && this.previousSample < 0) {
          this.phase *= -1;
        }
        output[i] = sample * this.phase;
        this.previousSample = sample;
      }
    };

    this.updateMix();
  }

  private updateMix(): void {
    this.wetMix.gain.value = this.sub / 100;
    this.dryMix.gain.value = this.direct / 100;
  }

  setParam(name: string, value: number): void {
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'sub':
        this.sub = value;
        this.updateMix();
        break;
      case 'direct':
        this.direct = value;
        this.updateMix();
        break;
      case 'tone':
        this.tone = value;
        this.filter.frequency.linearRampToValueAtTime(value, t);
        break;
      default:
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      sub: this.sub,
      direct: this.direct,
      tone: this.tone,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'sub', label: 'Sub', min: 0, max: 100, default: 65, step: 1, unit: '%' },
      { name: 'direct', label: 'Direct', min: 0, max: 100, default: 55, step: 1, unit: '%' },
      { name: 'tone', label: 'Tone', min: 500, max: 4000, default: 1800, step: 10, unit: 'Hz' },
    ];
  }

  dispose(): void {
    this.detector.onaudioprocess = null;
    this.detector.disconnect();
    this.detectorSink.disconnect();
    this.wetMix.disconnect();
    this.dryMix.disconnect();
    this.mixer.disconnect();
    this.filter.disconnect();
    super.dispose();
  }
}
