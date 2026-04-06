import type { EffectType, ParamDescriptor } from '../../types/effects';
import { BaseEffect } from './BaseEffect';

const BAND_SETTINGS = [
  { name: 'band100', label: '100', frequency: 100, q: 0.9 },
  { name: 'band250', label: '250', frequency: 250, q: 1.1 },
  { name: 'band800', label: '800', frequency: 800, q: 1.25 },
  { name: 'band2200', label: '2.2k', frequency: 2200, q: 1.15 },
  { name: 'band6400', label: '6.4k', frequency: 6400, q: 0.95 },
] as const;

type GraphicEqParam = (typeof BAND_SETTINGS)[number]['name'];

export class GraphicEQ extends BaseEffect {
  readonly type: EffectType = 'graphicEq';

  private filters: Record<GraphicEqParam, BiquadFilterNode>;
  private gains: Record<GraphicEqParam, number>;

  constructor(ctx: AudioContext) {
    super(ctx);

    this.filters = {} as Record<GraphicEqParam, BiquadFilterNode>;
    this.gains = {} as Record<GraphicEqParam, number>;

    let firstNode: AudioNode | null = null;
    let previousNode: AudioNode | null = null;

    for (const band of BAND_SETTINGS) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = band.frequency;
      filter.Q.value = band.q;
      filter.gain.value = 0;

      this.filters[band.name] = filter;
      this.gains[band.name] = 0;

      if (!firstNode) firstNode = filter;
      if (previousNode) previousNode.connect(filter);
      previousNode = filter;
    }

    this.connectWetChain(firstNode!, previousNode!);
  }

  setParam(name: string, value: number): void {
    if (!(name in this.filters)) return;
    const key = name as GraphicEqParam;
    this.gains[key] = value;
    this.filters[key].gain.linearRampToValueAtTime(value, this.ctx.currentTime + 0.01);
  }

  getParams(): Record<string, number> {
    return { ...this.gains };
  }

  getParamDescriptors(): ParamDescriptor[] {
    return BAND_SETTINGS.map((band) => ({
      name: band.name,
      label: band.label,
      min: -15,
      max: 15,
      default: 0,
      step: 0.5,
      unit: 'dB',
    }));
  }

  dispose(): void {
    Object.values(this.filters).forEach((filter) => filter.disconnect());
    super.dispose();
  }
}
