import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

function makeSoftCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const drive = 1 + amount * 6;

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * drive);
  }

  return curve;
}

export class Preamp extends BaseEffect {
  readonly type: EffectType = 'preamp';

  private inputDrive: GainNode;
  private saturator: WaveShaperNode;
  private toneFilter: BiquadFilterNode;
  private levelGain: GainNode;
  private gain = 12;
  private tone = 3200;
  private level = 100;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.inputDrive = ctx.createGain();
    this.saturator = ctx.createWaveShaper();
    this.saturator.oversample = '4x';
    this.toneFilter = ctx.createBiquadFilter();
    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.value = this.tone;
    this.levelGain = ctx.createGain();

    this.inputDrive.connect(this.saturator);
    this.saturator.connect(this.toneFilter);
    this.toneFilter.connect(this.levelGain);
    this.connectWetChain(this.inputDrive, this.levelGain);

    this.updateDrive();
    this.updateLevel();
  }

  private updateDrive() {
    const normalized = this.gain / 24;
    this.inputDrive.gain.value = 1 + normalized * 3;
    this.saturator.curve = makeSoftCurve(normalized);
  }

  private updateLevel() {
    this.levelGain.gain.value = this.level / 100;
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'gain':
        this.gain = value;
        this.updateDrive();
        break;
      case 'tone':
        this.tone = value;
        this.toneFilter.frequency.linearRampToValueAtTime(value, this.ctx.currentTime + 0.01);
        break;
      case 'level':
        this.level = value;
        this.updateLevel();
        break;
      default:
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      gain: this.gain,
      tone: this.tone,
      level: this.level,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'gain', label: 'Gain', min: 0, max: 24, default: 12, step: 1, unit: 'dB' },
      { name: 'tone', label: 'Tone', min: 800, max: 7000, default: 3200, step: 10, unit: 'Hz' },
      { name: 'level', label: 'Level', min: 0, max: 150, default: 100, step: 1, unit: '%' },
    ];
  }

  dispose(): void {
    this.inputDrive.disconnect();
    this.saturator.disconnect();
    this.toneFilter.disconnect();
    this.levelGain.disconnect();
    super.dispose();
  }
}
