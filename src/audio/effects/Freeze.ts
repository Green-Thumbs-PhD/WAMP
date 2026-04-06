import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class Freeze extends BaseEffect {
  readonly type: EffectType = 'freeze';

  private processor: ScriptProcessorNode;
  private processorSink: GainNode;
  private wetMix: GainNode;
  private dryMix: GainNode;
  private mixer: GainNode;

  private hold = 0;
  private mix = 60;
  private decay = 92;
  private texture = 45;
  private frozenBuffer: Float32Array | null = null;
  private frozenIndex = 0;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.processor = ctx.createScriptProcessor(2048, 1, 1);
    this.processorSink = ctx.createGain();
    this.processorSink.gain.value = 0;
    this.wetMix = ctx.createGain();
    this.dryMix = ctx.createGain();
    this.mixer = ctx.createGain();

    this.inputNode.connect(this.dryMix);
    this.dryMix.connect(this.mixer);
    this.inputNode.connect(this.processor);
    this.processor.connect(this.processorSink);
    this.processorSink.connect(ctx.destination);
    this.processor.connect(this.wetMix);
    this.wetMix.connect(this.mixer);
    this.mixer.connect(this.wetGain);

    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);

      if (this.hold >= 0.5 && !this.frozenBuffer) {
        this.frozenBuffer = new Float32Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const window = Math.sin((Math.PI * i) / Math.max(1, input.length - 1));
          this.frozenBuffer[i] = (input[i] ?? 0) * window;
        }
        this.frozenIndex = 0;
      }

      if (this.hold < 0.5) {
        this.frozenBuffer = null;
      }

      if (!this.frozenBuffer) {
        for (let i = 0; i < output.length; i++) {
          output[i] = 0;
        }
        return;
      }

      const decay = this.decay / 100;
      const texture = 0.6 + this.texture / 250;
      for (let i = 0; i < output.length; i++) {
        const sample = this.frozenBuffer[this.frozenIndex] ?? 0;
        output[i] = sample * decay;
        this.frozenIndex = (this.frozenIndex + texture) % this.frozenBuffer.length;
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
      case 'hold':
        this.hold = value;
        if (value < 0.5) {
          this.frozenBuffer = null;
          this.frozenIndex = 0;
        }
        break;
      case 'mix':
        this.mix = value;
        this.updateMix();
        break;
      case 'decay':
        this.decay = value;
        break;
      case 'texture':
        this.texture = value;
        break;
      default:
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      hold: this.hold,
      mix: this.mix,
      decay: this.decay,
      texture: this.texture,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'hold', label: 'Hold', min: 0, max: 1, default: 0, step: 1, unit: '' },
      { name: 'mix', label: 'Mix', min: 0, max: 100, default: 60, step: 1, unit: '%' },
      { name: 'decay', label: 'Decay', min: 50, max: 100, default: 92, step: 1, unit: '%' },
      { name: 'texture', label: 'Texture', min: 0, max: 100, default: 45, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.processor.onaudioprocess = null;
    this.processor.disconnect();
    this.processorSink.disconnect();
    this.wetMix.disconnect();
    this.dryMix.disconnect();
    this.mixer.disconnect();
    super.dispose();
  }
}
