import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

export class EQ extends BaseEffect {
  readonly type: EffectType = 'eq';

  private lowShelf: BiquadFilterNode;
  private mid: BiquadFilterNode;
  private highShelf: BiquadFilterNode;

  private lowGain = 0;
  private lowFreq = 200;
  private midGain = 0;
  private midFreq = 1000;
  private midQ = 1.5;
  private highGain = 0;
  private highFreq = 5000;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.lowShelf = ctx.createBiquadFilter();
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.value = this.lowFreq;
    this.lowShelf.gain.value = this.lowGain;

    this.mid = ctx.createBiquadFilter();
    this.mid.type = 'peaking';
    this.mid.frequency.value = this.midFreq;
    this.mid.Q.value = this.midQ;
    this.mid.gain.value = this.midGain;

    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = this.highFreq;
    this.highShelf.gain.value = this.highGain;

    // Chain: lowShelf -> mid -> highShelf
    this.lowShelf.connect(this.mid);
    this.mid.connect(this.highShelf);

    this.connectWetChain(this.lowShelf, this.highShelf);
  }

  setParam(name: string, value: number): void {
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'lowGain':
        this.lowGain = value;
        this.lowShelf.gain.linearRampToValueAtTime(value, t);
        break;
      case 'lowFreq':
        this.lowFreq = value;
        this.lowShelf.frequency.linearRampToValueAtTime(value, t);
        break;
      case 'midGain':
        this.midGain = value;
        this.mid.gain.linearRampToValueAtTime(value, t);
        break;
      case 'midFreq':
        this.midFreq = value;
        this.mid.frequency.linearRampToValueAtTime(value, t);
        break;
      case 'midQ':
        this.midQ = value;
        this.mid.Q.linearRampToValueAtTime(value, t);
        break;
      case 'highGain':
        this.highGain = value;
        this.highShelf.gain.linearRampToValueAtTime(value, t);
        break;
      case 'highFreq':
        this.highFreq = value;
        this.highShelf.frequency.linearRampToValueAtTime(value, t);
        break;
    }
  }

  getParams(): Record<string, number> {
    return {
      lowGain: this.lowGain,
      lowFreq: this.lowFreq,
      midGain: this.midGain,
      midFreq: this.midFreq,
      midQ: this.midQ,
      highGain: this.highGain,
      highFreq: this.highFreq,
    };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return [
      { name: 'lowGain', label: 'Low', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
      { name: 'midGain', label: 'Mid', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
      { name: 'midFreq', label: 'Mid Hz', min: 200, max: 5000, default: 1000, step: 10, unit: 'Hz' },
      { name: 'highGain', label: 'High', min: -12, max: 12, default: 0, step: 0.5, unit: 'dB' },
    ];
  }

  dispose(): void {
    this.lowShelf.disconnect();
    this.mid.disconnect();
    this.highShelf.disconnect();
    super.dispose();
  }
}
