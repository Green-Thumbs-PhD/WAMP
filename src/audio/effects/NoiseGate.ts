import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class NoiseGate extends BaseEffect {
  readonly type: EffectType = 'noiseGate';

  private detector: ScriptProcessorNode;
  private detectorSink: GainNode;
  private gateGain: GainNode;
  private threshold = -52;
  private release = 140;
  private reduction = 100;
  private gateValue = 1;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.gateGain = ctx.createGain();
    this.gateGain.gain.value = 1;
    this.connectWetChain(this.gateGain, this.gateGain);

    this.detector = ctx.createScriptProcessor(1024, 1, 1);
    this.detectorSink = ctx.createGain();
    this.detectorSink.gain.value = 0;

    this.inputNode.connect(this.detector);
    this.detector.connect(this.detectorSink);
    this.detectorSink.connect(ctx.destination);
    this.detector.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      if (!input.length) return;

      let rms = 0;
      for (let i = 0; i < input.length; i++) rms += input[i]! * input[i]!;
      rms = Math.sqrt(rms / input.length);

      const thresholdLinear = Math.pow(10, this.threshold / 20);
      const minOpen = 1 - this.reduction / 100;
      const target = rms >= thresholdLinear ? 1 : minOpen;
      const bufferDuration = input.length / this.ctx.sampleRate;
      const releaseSeconds = Math.max(0.02, this.release / 1000);
      const coeff = Math.exp(-bufferDuration / releaseSeconds);

      this.gateValue = target > this.gateValue
        ? target
        : target + (this.gateValue - target) * coeff;

      this.gateGain.gain.value = this.gateValue;
    };
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'threshold':
        this.threshold = value;
        break;
      case 'release':
        this.release = value;
        break;
      case 'reduction':
        this.reduction = value;
        break;
      default:
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      threshold: this.threshold,
      release: this.release,
      reduction: this.reduction,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'threshold', label: 'Thresh', min: -70, max: -20, default: -52, step: 1, unit: 'dB' },
      { name: 'release', label: 'Release', min: 20, max: 500, default: 140, step: 5, unit: 'ms' },
      { name: 'reduction', label: 'Gate', min: 0, max: 100, default: 100, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.detector.onaudioprocess = null;
    this.detector.disconnect();
    this.detectorSink.disconnect();
    this.gateGain.disconnect();
    super.dispose();
  }
}
