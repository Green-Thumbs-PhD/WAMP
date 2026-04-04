import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

type DistortionMode = 0 | 1 | 2; // soft, hard, tube

function makeDistortionCurve(amount: number, mode: DistortionMode): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const k = amount * 50 + 1;

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    switch (mode) {
      case 0: // soft clip
        curve[i] = Math.tanh(k * x);
        break;
      case 1: // hard clip
        curve[i] = Math.max(-1, Math.min(1, k * x));
        break;
      case 2: // tube-like (asymmetric)
        curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
        break;
    }
  }
  return curve;
}

export class Distortion extends BaseEffect {
  readonly type: EffectType = 'distortion';

  private driveGain: GainNode;
  private waveshaper: WaveShaperNode;
  private toneFilter: BiquadFilterNode;
  private levelGain: GainNode;

  private drive = 50;
  private tone = 3000;
  private level = 50;
  private mode: DistortionMode = 0;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.driveGain = ctx.createGain();
    this.waveshaper = ctx.createWaveShaper();
    this.waveshaper.oversample = '4x';
    this.toneFilter = ctx.createBiquadFilter();
    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.value = this.tone;
    this.levelGain = ctx.createGain();

    // Internal chain: driveGain -> waveshaper -> toneFilter -> levelGain
    this.driveGain.connect(this.waveshaper);
    this.waveshaper.connect(this.toneFilter);
    this.toneFilter.connect(this.levelGain);

    this.connectWetChain(this.driveGain, this.levelGain);
    this.updateCurve();
    this.updateLevel();
  }

  private updateCurve() {
    this.waveshaper.curve = makeDistortionCurve(this.drive / 100, this.mode);
    this.driveGain.gain.value = 1 + (this.drive / 100) * 3;
  }

  private updateLevel() {
    this.levelGain.gain.value = this.level / 100;
  }

  setParam(name: string, value: number): void {
    switch (name) {
      case 'drive':
        this.drive = value;
        this.updateCurve();
        break;
      case 'tone':
        this.tone = value;
        this.toneFilter.frequency.linearRampToValueAtTime(value, this.ctx.currentTime + 0.01);
        break;
      case 'level':
        this.level = value;
        this.updateLevel();
        break;
      case 'mode':
        this.mode = value as DistortionMode;
        this.updateCurve();
        break;
    }
  }

  getParams(): Record<string, number> {
    return { drive: this.drive, tone: this.tone, level: this.level, mode: this.mode };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'drive', label: 'Drive', min: 0, max: 100, default: 50, step: 1, unit: '%' },
      { name: 'tone', label: 'Tone', min: 200, max: 8000, default: 3000, step: 10, unit: 'Hz' },
      { name: 'level', label: 'Level', min: 0, max: 100, default: 50, step: 1, unit: '%' },
      { name: 'mode', label: 'Mode', min: 0, max: 2, default: 0, step: 1, unit: '' },
    ];
  }

  dispose(): void {
    this.driveGain.disconnect();
    this.waveshaper.disconnect();
    this.toneFilter.disconnect();
    this.levelGain.disconnect();
    super.dispose();
  }
}
