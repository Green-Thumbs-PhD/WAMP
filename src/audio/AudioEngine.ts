import type { EffectNode, EffectType, EffectSlotState } from '../types/effects';
import { createEffect } from './effects';
import { PostChainLooper, type LooperStatus } from './PostChainLooper';
import { MetronomeEngine } from './MetronomeEngine';
import { buildFactoryKit } from './DrumKit';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private mixBus: GainNode | null = null;
  private padBus: GainNode | null = null;
  private padsThroughChain = false;
  private inputGain: GainNode | null = null;
  private outputGain: GainNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private effects: EffectNode[] = [];
  private masterVolume = 1;

  private looperGain: GainNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private looper: PostChainLooper | null = null;

  private metronomeGain: GainNode | null = null;
  private metronome: MetronomeEngine | null = null;

  private padBuffers: AudioBuffer[] = [];
  private onContextState?: (state: AudioContextState) => void;

  setOnContextState(cb: ((state: AudioContextState) => void) | undefined): void {
    this.onContextState = cb;
  }

  async start(deviceId?: string): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);

    this.ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
    this.attachContextStateListener();

    this.sourceNode = this.ctx.createMediaStreamSource(this.stream);

    this.mixBus = this.ctx.createGain();
    this.mixBus.gain.value = 1;
    this.padBus = this.ctx.createGain();
    this.padBus.gain.value = 1;

    this.inputGain = this.ctx.createGain();
    this.outputGain = this.ctx.createGain();
    this.outputGain.gain.value = this.masterVolume;

    this.inputAnalyser = this.ctx.createAnalyser();
    this.inputAnalyser.fftSize = 256;
    this.outputAnalyser = this.ctx.createAnalyser();
    this.outputAnalyser.fftSize = 256;

    this.looperGain = this.ctx.createGain();
    this.looperGain.gain.value = 0;
    this.recordDest = this.ctx.createMediaStreamDestination();
    this.looper = new PostChainLooper(this.ctx, this.looperGain, this.recordDest);

    this.metronomeGain = this.ctx.createGain();
    this.metronomeGain.gain.value = 0.9;
    this.metronome = new MetronomeEngine(this.ctx, this.metronomeGain);

    this.sourceNode.connect(this.mixBus);
    this.mixBus.connect(this.inputGain);
    this.inputGain.connect(this.inputAnalyser);

    this.padBuffers = buildFactoryKit(this.ctx);
    this.applyPadRouting();

    this.rebuildChain();
  }

  private attachContextStateListener(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.onstatechange = () => {
      this.onContextState?.(ctx.state);
    };
    this.onContextState?.(ctx.state);
  }

  async resumeContext(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  getContextState(): AudioContextState | null {
    return this.ctx?.state ?? null;
  }

  stop(): void {
    this.looper?.dispose();
    this.looper = null;
    this.metronome?.dispose();
    this.metronome = null;

    this.effects.forEach((e) => e.dispose());
    this.effects = [];
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
    this.ctx = null;
    this.stream = null;
    this.sourceNode = null;
    this.mixBus = null;
    this.padBus = null;
    this.inputGain = null;
    this.outputGain = null;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.looperGain = null;
    this.recordDest = null;
    this.metronomeGain = null;
    this.padBuffers = [];
  }

  isRunning(): boolean {
    return this.ctx !== null && this.ctx.state !== 'closed';
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  private applyPadRouting(): void {
    if (!this.padBus || !this.mixBus || !this.outputGain) return;
    try {
      this.padBus.disconnect();
    } catch {
      /* ignore */
    }
    if (this.padsThroughChain) {
      this.padBus.connect(this.mixBus);
    } else {
      this.padBus.connect(this.outputGain);
    }
  }

  setPadsThroughChain(through: boolean): void {
    this.padsThroughChain = through;
    if (this.isRunning()) this.applyPadRouting();
  }

  getPadsThroughChain(): boolean {
    return this.padsThroughChain;
  }

  playDrumPad(index: number, velocity = 1): void {
    if (!this.ctx || !this.padBus) return;
    const buf = this.padBuffers[index];
    if (!buf) return;
    const v = Math.max(0, Math.min(1, velocity));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = 0.85 * v;
    src.connect(g);
    g.connect(this.padBus);
    src.start(0);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
    };
  }

  async captureMicToPad(padIndex: number, durationMs = 1000): Promise<boolean> {
    if (!this.ctx || !this.stream || padIndex < 0 || padIndex >= 16) return false;

    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    let mime = '';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        mime = m;
        break;
      }
    }

    const recStream = new MediaStream(this.stream.getAudioTracks());
    const recorder = mime
      ? new MediaRecorder(recStream, { mimeType: mime })
      : new MediaRecorder(recStream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        try {
          if (chunks.length === 0) {
            resolve(false);
            return;
          }
          const blob = new Blob(chunks, { type: recorder.mimeType });
          const ab = await blob.arrayBuffer();
          const decoded = await this.ctx!.decodeAudioData(ab.slice(0));
          this.padBuffers[padIndex] = decoded;
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      recorder.start(100);
      setTimeout(() => recorder.stop(), durationMs);
    });
  }

  // --- Looper ---
  startLooperRecord(): void {
    this.looper?.startRecording();
  }

  async stopLooperRecord(): Promise<void> {
    await this.looper?.stopRecording();
  }

  looperPlay(): void {
    this.looper?.play();
  }

  looperStop(): void {
    this.looper?.stopPlayback();
  }

  looperClear(): void {
    this.looper?.clear();
  }

  setLooperLevel(level: number): void {
    this.looper?.setLevel(level);
  }

  getLooperStatus(): LooperStatus {
    return this.looper?.getStatus() ?? 'idle';
  }

  getLooperDuration(): number {
    return this.looper?.getLoopDuration() ?? 0;
  }

  // --- Metronome ---
  metronomeStart(): void {
    this.metronome?.start();
  }

  metronomeStop(): void {
    this.metronome?.stop();
  }

  setMetronomeBpm(bpm: number): void {
    this.metronome?.setBpm(bpm);
  }

  getMetronomeBpm(): number {
    return this.metronome?.getBpm() ?? 120;
  }

  isMetronomeRunning(): boolean {
    return this.metronome?.isRunning() ?? false;
  }

  /** Delay time ms = quarter note at BPM; tremolo rate Hz = BPM/60. */
  applyBpmToTimeEffects(bpm: number): void {
    const delayMs = Math.round(60000 / bpm);
    const tremHz = Math.round((bpm / 60) * 10) / 10;
    for (const e of this.effects) {
      if (e.type === 'delay') {
        e.setParam('time', Math.min(2000, Math.max(50, delayMs)));
      }
      if (e.type === 'tremolo') {
        e.setParam('rate', Math.min(15, Math.max(0.5, tremHz)));
      }
    }
  }

  private rebuildChain(): void {
    if (!this.ctx || !this.inputGain || !this.outputGain || !this.outputAnalyser) return;

    this.inputGain.disconnect(this.inputAnalyser!);
    this.inputGain.connect(this.inputAnalyser!);

    try {
      this.inputGain.disconnect();
    } catch {
      /* ignore */
    }
    this.inputGain.connect(this.inputAnalyser!);

    for (const effect of this.effects) {
      try {
        effect.getOutputNode().disconnect();
      } catch {
        /* ignore */
      }
    }
    try {
      this.outputGain.disconnect();
    } catch {
      /* ignore */
    }

    let prevOutput: AudioNode = this.inputGain;

    for (const effect of this.effects) {
      prevOutput.connect(effect.getInputNode());
      prevOutput = effect.getOutputNode();
    }

    prevOutput.connect(this.outputGain);

    if (this.recordDest) {
      try {
        prevOutput.disconnect(this.recordDest);
      } catch {
        /* ignore */
      }
      prevOutput.connect(this.recordDest);
    }

    if (this.looperGain) {
      try {
        this.looperGain.disconnect();
      } catch {
        /* ignore */
      }
      this.looperGain.connect(this.outputGain);
    }

    if (this.metronomeGain) {
      try {
        this.metronomeGain.disconnect();
      } catch {
        /* ignore */
      }
      this.metronomeGain.connect(this.outputGain);
    }

    this.applyPadRouting();

    this.outputGain.connect(this.outputAnalyser);
    this.outputAnalyser.connect(this.ctx.destination);
  }

  addEffect(type: EffectType, params?: Record<string, number>): EffectNode {
    if (!this.ctx) throw new Error('Engine not started');
    const effect = createEffect(this.ctx, type);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        effect.setParam(k, v);
      }
    }
    this.effects.push(effect);
    this.rebuildChain();
    return effect;
  }

  removeEffect(id: string): void {
    const idx = this.effects.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const effect = this.effects[idx];
    this.effects.splice(idx, 1);
    effect.dispose();
    this.rebuildChain();
  }

  reorderEffects(fromIndex: number, toIndex: number): void {
    const [removed] = this.effects.splice(fromIndex, 1);
    this.effects.splice(toIndex, 0, removed);
    this.rebuildChain();
  }

  getEffects(): EffectNode[] {
    return [...this.effects];
  }

  getEffectById(id: string): EffectNode | undefined {
    return this.effects.find((e) => e.id === id);
  }

  setMasterVolume(value: number): void {
    this.masterVolume = value;
    if (this.outputGain) {
      this.outputGain.gain.linearRampToValueAtTime(value, (this.ctx?.currentTime ?? 0) + 0.01);
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getInputLevel(): number {
    return this.getLevel(this.inputAnalyser);
  }

  getOutputLevel(): number {
    return this.getLevel(this.outputAnalyser);
  }

  private getLevel(analyser: AnalyserNode | null): number {
    if (!analyser) return 0;
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  getChainState(): EffectSlotState[] {
    return this.effects.map((e) => ({
      id: e.id,
      type: e.type,
      bypassed: e.isBypassed(),
      params: e.getParams(),
    }));
  }

  async setOutputDevice(sinkId: string): Promise<void> {
    if (!this.ctx) return;
    const ctx = this.ctx as AudioContext & { setSinkId?: (id: string) => Promise<void> };
    if (typeof ctx.setSinkId !== 'function') return;
    try {
      await ctx.setSinkId(sinkId);
    } catch {
      /* unsupported id or policy */
    }
  }

  async switchInput(deviceId: string): Promise<void> {
    if (!this.ctx || !this.sourceNode || !this.mixBus) return;

    this.stream?.getTracks().forEach((t) => t.stop());
    this.sourceNode.disconnect();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.sourceNode = this.ctx.createMediaStreamSource(this.stream);
    this.sourceNode.connect(this.mixBus);
  }

  clearChain(): void {
    this.effects.forEach((e) => e.dispose());
    this.effects = [];
    this.rebuildChain();
  }
}
