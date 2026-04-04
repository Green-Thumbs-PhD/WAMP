import type { EffectNode, EffectType, ParamDescriptor } from '../../types/effects';
import { generateId } from '../../utils/generateId';

export abstract class BaseEffect implements EffectNode {
  readonly id: string;
  abstract readonly type: EffectType;

  protected ctx: AudioContext;
  protected inputNode: GainNode;
  protected outputNode: GainNode;
  protected dryGain: GainNode;
  protected wetGain: GainNode;
  private _bypassed = false;

  constructor(ctx: AudioContext) {
    this.id = generateId();
    this.ctx = ctx;

    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    // Dry path: input -> dryGain -> output
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    // Default: effect active (dry = 0, wet = 1)
    this.dryGain.gain.value = 0;
    this.wetGain.gain.value = 1;

    // Wet path end: wetGain -> output
    this.wetGain.connect(this.outputNode);
  }

  /**
   * Subclasses call this to connect the wet signal chain.
   * They should connect: this.inputNode -> [their nodes] -> this.wetGain
   */
  protected connectWetChain(firstNode: AudioNode, lastNode: AudioNode) {
    this.inputNode.connect(firstNode);
    lastNode.connect(this.wetGain);
  }

  getInputNode(): AudioNode {
    return this.inputNode;
  }

  getOutputNode(): AudioNode {
    return this.outputNode;
  }

  setBypassed(bypassed: boolean): void {
    this._bypassed = bypassed;
    const now = this.ctx.currentTime;
    const rampTime = 0.005;
    if (bypassed) {
      this.dryGain.gain.linearRampToValueAtTime(1, now + rampTime);
      this.wetGain.gain.linearRampToValueAtTime(0, now + rampTime);
    } else {
      this.dryGain.gain.linearRampToValueAtTime(0, now + rampTime);
      this.wetGain.gain.linearRampToValueAtTime(1, now + rampTime);
    }
  }

  isBypassed(): boolean {
    return this._bypassed;
  }

  abstract setParam(name: string, value: number): void;
  abstract getParams(): Record<string, number>;
  abstract getParamDescriptors(): ParamDescriptor[];

  dispose(): void {
    this.inputNode.disconnect();
    this.outputNode.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
  }
}
