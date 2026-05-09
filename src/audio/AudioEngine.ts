import type { EffectNode, EffectType, EffectSlotState } from '../types/effects';
import type { PitchAnalysis } from '../types/tuner';
import { createEffect } from './effects';
import { BackingTrackPlayer, type BackingTrackState } from './BackingTrackPlayer';
import { PostChainLooper, type LooperState, type LooperStatus } from './PostChainLooper';
import { MetronomeEngine } from './MetronomeEngine';
import { buildFactoryKit, type DrumKitPresetId } from './DrumKit';

export type OutputRecordingFormat = 'webm' | 'mp3';

const OUTPUT_RECORDING_MIME_TYPES: Record<OutputRecordingFormat, string[]> = {
  webm: ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'],
  mp3: ['audio/mpeg', 'audio/mp3'],
};

export function getSupportedOutputRecordingMimeType(format: OutputRecordingFormat): string {
  const candidates = OUTPUT_RECORDING_MIME_TYPES[format];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return format === 'webm' ? '' : '';
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private mixBus: GainNode | null = null;
  private inputModeNode: GainNode | null = null;
  private monoSumNode: GainNode | null = null;
  private monoMergerNode: ChannelMergerNode | null = null;
  private padBus: GainNode | null = null;
  private padsThroughChain = false;
  private globalNoiseGateGain: GainNode | null = null;
  private globalNoiseGateDetector: ScriptProcessorNode | null = null;
  private globalNoiseGateDetectorSink: GainNode | null = null;
  private inputGain: GainNode | null = null;
  private ampInput: GainNode | null = null;
  private ampDriveGain: GainNode | null = null;
  private ampShaper: WaveShaperNode | null = null;
  private ampPresenceFilter: BiquadFilterNode | null = null;
  private ampLevelGain: GainNode | null = null;
  private outputGain: GainNode | null = null;
  private cabinetInput: GainNode | null = null;
  private cabinetDryGain: GainNode | null = null;
  private cabinetWetGain: GainNode | null = null;
  private cabinetConvolver: ConvolverNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private effects: EffectNode[] = [];
  private masterVolume = 1;
  private inputTrim = 1;
  private monoInputToStereo = false;
  private inputMuted = false;
  private muted = false;
  private ampChannel: 'clean' | 'crunch' | 'lead' = 'clean';
  private ampPresence = 55;
  private ampLevel = 1;
  private globalNoiseGateEnabled = false;
  private globalNoiseGateThreshold = -56;
  private globalNoiseGateRelease = 160;
  private globalNoiseGateReduction = 100;
  private globalNoiseGateValue = 1;
  private cabinetIrEnabled = false;
  private cabinetIrMix = 1;
  private cabinetIrName = '';

  private looperGain: GainNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private looper: PostChainLooper | null = null;
  private backingTrack: BackingTrackPlayer | null = null;
  private outputRecorder: MediaRecorder | null = null;
  private outputRecorderChunks: Blob[] = [];

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
    this.inputModeNode = this.ctx.createGain();
    this.inputModeNode.gain.value = 1;
    this.monoSumNode = this.ctx.createGain();
    this.monoSumNode.channelCount = 1;
    this.monoSumNode.channelCountMode = 'explicit';
    this.monoSumNode.channelInterpretation = 'speakers';
    this.monoMergerNode = this.ctx.createChannelMerger(2);
    this.padBus = this.ctx.createGain();
    this.padBus.gain.value = 1;

    this.inputGain = this.ctx.createGain();
    this.inputGain.gain.value = this.inputMuted ? 0 : this.inputTrim;
    this.ampInput = this.ctx.createGain();
    this.ampDriveGain = this.ctx.createGain();
    this.ampShaper = this.ctx.createWaveShaper();
    this.ampPresenceFilter = this.ctx.createBiquadFilter();
    this.ampPresenceFilter.type = 'highshelf';
    this.ampPresenceFilter.frequency.value = 2300;
    this.ampLevelGain = this.ctx.createGain();
    this.outputGain = this.ctx.createGain();
    this.outputGain.gain.value = this.muted ? 0 : this.masterVolume;
    this.cabinetInput = this.ctx.createGain();
    this.cabinetDryGain = this.ctx.createGain();
    this.cabinetWetGain = this.ctx.createGain();
    this.cabinetConvolver = this.ctx.createConvolver();
    this.globalNoiseGateGain = this.ctx.createGain();
    this.globalNoiseGateGain.gain.value = 1;
    this.globalNoiseGateDetector = this.ctx.createScriptProcessor(1024, 1, 1);
    this.globalNoiseGateDetectorSink = this.ctx.createGain();
    this.globalNoiseGateDetectorSink.gain.value = 0;

    this.inputAnalyser = this.ctx.createAnalyser();
    this.inputAnalyser.fftSize = 256;
    this.outputAnalyser = this.ctx.createAnalyser();
    this.outputAnalyser.fftSize = 256;

    this.looperGain = this.ctx.createGain();
    this.looperGain.gain.value = 0;
    this.recordDest = this.ctx.createMediaStreamDestination();
    this.looper = new PostChainLooper(this.ctx, this.looperGain, this.recordDest);
    this.backingTrack = new BackingTrackPlayer(this.ctx, this.outputGain);

    this.metronomeGain = this.ctx.createGain();
    this.metronomeGain.gain.value = 0.9;
    this.metronome = new MetronomeEngine(this.ctx, this.metronomeGain);

    this.globalNoiseGateDetector.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      if (!input.length || !this.globalNoiseGateGain) return;

      if (!this.globalNoiseGateEnabled) {
        this.globalNoiseGateValue = 1;
        this.globalNoiseGateGain.gain.value = 1;
        return;
      }

      let rms = 0;
      for (let i = 0; i < input.length; i++) {
        rms += input[i]! * input[i]!;
      }
      rms = Math.sqrt(rms / input.length);

      const thresholdLinear = Math.pow(10, this.globalNoiseGateThreshold / 20);
      const minOpen = 1 - this.globalNoiseGateReduction / 100;
      const target = rms >= thresholdLinear ? 1 : minOpen;
      const bufferDuration = input.length / this.ctx!.sampleRate;
      const releaseSeconds = Math.max(0.02, this.globalNoiseGateRelease / 1000);
      const coeff = Math.exp(-bufferDuration / releaseSeconds);

      this.globalNoiseGateValue = target > this.globalNoiseGateValue
        ? target
        : target + (this.globalNoiseGateValue - target) * coeff;

      this.globalNoiseGateGain.gain.value = this.globalNoiseGateValue;
    };

    this.sourceNode.connect(this.globalNoiseGateGain);
    this.globalNoiseGateGain.connect(this.inputModeNode);
    this.sourceNode.connect(this.globalNoiseGateDetector);
    this.globalNoiseGateDetector.connect(this.globalNoiseGateDetectorSink);
    this.globalNoiseGateDetectorSink.connect(this.ctx.destination);
    this.applyInputChannelMode();
    this.mixBus.connect(this.inputGain);
    this.inputGain.connect(this.inputAnalyser);
    this.configureAmpVoicing();

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
    if (this.outputRecorder?.state === 'recording') {
      this.outputRecorder.stop();
    }
    this.outputRecorder = null;
    this.outputRecorderChunks = [];
    this.looper?.dispose();
    this.looper = null;
    this.backingTrack?.dispose();
    this.backingTrack = null;
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
    this.inputModeNode = null;
    this.monoSumNode = null;
    this.monoMergerNode = null;
    this.padBus = null;
    this.globalNoiseGateGain = null;
    this.globalNoiseGateDetector = null;
    this.globalNoiseGateDetectorSink = null;
    this.inputGain = null;
    this.ampInput = null;
    this.ampDriveGain = null;
    this.ampShaper = null;
    this.ampPresenceFilter = null;
    this.ampLevelGain = null;
    this.outputGain = null;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.looperGain = null;
    this.recordDest = null;
    this.metronomeGain = null;
    this.padBuffers = [];
    this.cabinetInput = null;
    this.cabinetDryGain = null;
    this.cabinetWetGain = null;
    this.cabinetConvolver = null;
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

  setMonoInputToStereo(enabled: boolean): void {
    this.monoInputToStereo = enabled;
    if (this.isRunning()) this.applyInputChannelMode();
  }

  isMonoInputToStereo(): boolean {
    return this.monoInputToStereo;
  }

  private applyInputChannelMode(): void {
    if (!this.inputModeNode || !this.mixBus || !this.monoSumNode || !this.monoMergerNode) return;
    try {
      this.inputModeNode.disconnect();
      this.monoSumNode.disconnect();
      this.monoMergerNode.disconnect();
    } catch {
      /* ignore */
    }

    if (this.monoInputToStereo) {
      this.inputModeNode.connect(this.monoSumNode);
      this.monoSumNode.connect(this.monoMergerNode, 0, 0);
      this.monoSumNode.connect(this.monoMergerNode, 0, 1);
      this.monoMergerNode.connect(this.mixBus);
      return;
    }

    this.inputModeNode.connect(this.mixBus);
  }

  setGlobalNoiseGateEnabled(enabled: boolean): void {
    this.globalNoiseGateEnabled = enabled;
    if (!enabled && this.globalNoiseGateGain) {
      this.globalNoiseGateValue = 1;
      this.globalNoiseGateGain.gain.value = 1;
    }
  }

  isGlobalNoiseGateEnabled(): boolean {
    return this.globalNoiseGateEnabled;
  }

  setGlobalNoiseGateThreshold(value: number): void {
    this.globalNoiseGateThreshold = value;
  }

  getGlobalNoiseGateThreshold(): number {
    return this.globalNoiseGateThreshold;
  }

  setGlobalNoiseGateRelease(value: number): void {
    this.globalNoiseGateRelease = value;
  }

  getGlobalNoiseGateRelease(): number {
    return this.globalNoiseGateRelease;
  }

  setGlobalNoiseGateReduction(value: number): void {
    this.globalNoiseGateReduction = value;
  }

  getGlobalNoiseGateReduction(): number {
    return this.globalNoiseGateReduction;
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

  loadFactoryDrumKit(presetId: DrumKitPresetId): boolean {
    if (!this.ctx) return false;
    this.padBuffers = buildFactoryKit(this.ctx, presetId);
    return true;
  }

  exportDrumPadKitSnapshot(): { padBuffers: { sampleRate: number; samples: number[] }[] } {
    const padBuffers = this.padBuffers.map((buffer) => ({
      sampleRate: buffer.sampleRate,
      samples: Array.from(buffer.getChannelData(0)),
    }));
    return { padBuffers };
  }

  importDrumPadKitSnapshot(snapshot: { padBuffers: { sampleRate: number; samples: number[] }[] }): boolean {
    if (!this.ctx || !Array.isArray(snapshot.padBuffers) || snapshot.padBuffers.length !== 16) return false;
    const nextBuffers: AudioBuffer[] = [];
    for (const entry of snapshot.padBuffers) {
      if (!entry || !Array.isArray(entry.samples) || !Number.isFinite(entry.sampleRate) || entry.sampleRate <= 0) {
        return false;
      }
      const length = entry.samples.length;
      if (length < 1) return false;
      const audioBuffer = this.ctx.createBuffer(1, length, entry.sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        channelData[i] = Math.max(-1, Math.min(1, Number(entry.samples[i] ?? 0)));
      }
      nextBuffers.push(audioBuffer);
    }
    this.padBuffers = nextBuffers;
    return true;
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

  setLooperRecordLength(length: number): void {
    this.looper?.setRecordLength(length);
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

  setLooperTrimRange(start: number, end: number): void {
    this.looper?.setTrimRange(start, end);
  }

  resetLooperTrim(): void {
    this.looper?.resetTrim();
  }

  applyLooperTrim(): void {
    this.looper?.applyTrim();
  }

  getLooperStatus(): LooperStatus {
    return this.looper?.getStatus() ?? 'idle';
  }

  getLooperDuration(): number {
    return this.looper?.getLoopDuration() ?? 0;
  }

  getLooperState(): LooperState {
    return this.looper?.getState() ?? {
      status: 'idle',
      sourceDuration: 0,
      trimmedDuration: 0,
      trimStart: 0,
      trimEnd: 0,
      currentTime: 0,
      level: 0.85,
      recordLength: 8,
      peaks: [],
    };
  }

  async loadBackingTrack(file: File): Promise<boolean> {
    const arrayBuffer = await file.arrayBuffer();
    return this.backingTrack?.loadFromArrayBuffer(arrayBuffer, file.name) ?? false;
  }

  playBackingTrack(): void {
    this.backingTrack?.play();
  }

  pauseBackingTrack(): void {
    this.backingTrack?.pause();
  }

  stopBackingTrack(): void {
    this.backingTrack?.stop();
  }

  clearBackingTrack(): void {
    this.backingTrack?.clear();
  }

  setBackingTrackVolume(value: number): void {
    this.backingTrack?.setVolume(value);
  }

  seekBackingTrack(value: number): void {
    this.backingTrack?.setCurrentTime(value);
  }

  setBackingTrackSection(start: number, end: number): void {
    this.backingTrack?.setSection(start, end);
  }

  setBackingTrackSectionLoopEnabled(enabled: boolean): void {
    this.backingTrack?.setSectionLoopEnabled(enabled);
  }

  setBackingTrackPlaybackRate(rate: number): void {
    this.backingTrack?.setPlaybackRate(rate);
  }

  getBackingTrackState(): BackingTrackState {
    return this.backingTrack?.getState() ?? {
      name: '',
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      volume: 0.8,
      sectionStart: 0,
      sectionEnd: 0,
      sectionLoopEnabled: false,
      playbackRate: 1,
      peaks: [],
    };
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
    if (
      !this.ctx ||
      !this.inputGain ||
      !this.ampInput ||
      !this.ampDriveGain ||
      !this.ampShaper ||
      !this.ampPresenceFilter ||
      !this.ampLevelGain ||
      !this.outputGain ||
      !this.outputAnalyser ||
      !this.cabinetInput ||
      !this.cabinetDryGain ||
      !this.cabinetWetGain ||
      !this.cabinetConvolver
    ) return;

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
      this.ampInput.disconnect();
      this.ampDriveGain.disconnect();
      this.ampShaper.disconnect();
      this.ampPresenceFilter.disconnect();
      this.ampLevelGain.disconnect();
      this.outputGain.disconnect();
    } catch {
      /* ignore */
    }
    try {
      this.cabinetInput.disconnect();
      this.cabinetDryGain.disconnect();
      this.cabinetWetGain.disconnect();
      this.cabinetConvolver.disconnect();
    } catch {
      /* ignore */
    }

    this.inputGain.connect(this.ampInput);
    this.ampInput.connect(this.ampDriveGain);
    this.ampDriveGain.connect(this.ampShaper);
    this.ampShaper.connect(this.ampPresenceFilter);
    this.ampPresenceFilter.connect(this.ampLevelGain);

    let prevOutput: AudioNode = this.ampLevelGain;

    for (const effect of this.effects) {
      prevOutput.connect(effect.getInputNode());
      prevOutput = effect.getOutputNode();
    }

    prevOutput.connect(this.cabinetInput);
    this.cabinetInput.connect(this.cabinetDryGain);
    this.cabinetInput.connect(this.cabinetConvolver);
    this.cabinetConvolver.connect(this.cabinetWetGain);
    this.cabinetDryGain.connect(this.outputGain);
    this.cabinetWetGain.connect(this.outputGain);
    this.updateCabinetMix();

    if (this.recordDest) {
      try {
        this.outputGain.disconnect(this.recordDest);
      } catch {
        /* ignore */
      }
      this.outputGain.connect(this.recordDest);
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

  private createDriveCurve(amount: number) {
    const samples = 2048;
    const curve = new Float32Array(new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT));
    const drive = Math.max(1, amount);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / (samples - 1) - 1;
      curve[i] = Math.tanh(x * drive);
    }
    return curve;
  }

  private configureAmpVoicing(): void {
    if (!this.ampDriveGain || !this.ampShaper || !this.ampPresenceFilter || !this.ampLevelGain) return;
    const channelSettings = {
      clean: { drive: 1.4, presenceOffset: -1.5, levelTrim: 1.02 },
      crunch: { drive: 2.8, presenceOffset: 1.5, levelTrim: 0.96 },
      lead: { drive: 4.2, presenceOffset: 3.5, levelTrim: 0.9 },
    } as const;
    const channel = channelSettings[this.ampChannel];
    this.ampDriveGain.gain.value = channel.drive;
    const shaper = this.ampShaper as WaveShaperNode & { curve: Float32Array<ArrayBufferLike> | null };
    shaper.curve = this.createDriveCurve(channel.drive * 1.35);
    this.ampShaper.oversample = '4x';
    this.ampPresenceFilter.gain.value = channel.presenceOffset + (this.ampPresence - 50) * 0.18;
    this.ampLevelGain.gain.value = this.ampLevel * channel.levelTrim;
  }

  setAmpChannel(channel: 'clean' | 'crunch' | 'lead'): void {
    this.ampChannel = channel;
    this.configureAmpVoicing();
  }

  getAmpChannel(): 'clean' | 'crunch' | 'lead' {
    return this.ampChannel;
  }

  setAmpPresence(value: number): void {
    this.ampPresence = value;
    this.configureAmpVoicing();
  }

  getAmpPresence(): number {
    return this.ampPresence;
  }

  setAmpLevel(value: number): void {
    this.ampLevel = value;
    this.configureAmpVoicing();
  }

  getAmpLevel(): number {
    return this.ampLevel;
  }

  private updateCabinetMix(): void {
    if (!this.cabinetDryGain || !this.cabinetWetGain) return;
    const hasIr = Boolean(this.cabinetConvolver?.buffer);
    const wet = this.cabinetIrEnabled && hasIr ? this.cabinetIrMix : 0;
    const dry = this.cabinetIrEnabled && hasIr ? 1 - wet : 1;
    this.cabinetDryGain.gain.value = dry;
    this.cabinetWetGain.gain.value = wet;
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

  setEffectOrder(ids: string[]): void {
    const byId = new Map(this.effects.map((effect) => [effect.id, effect]));
    const reordered = ids
      .map((id) => byId.get(id))
      .filter((effect): effect is EffectNode => Boolean(effect));
    if (reordered.length !== this.effects.length) return;
    this.effects = reordered;
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
    this.updateOutputGain();
  }

  private updateOutputGain(): void {
    if (this.outputGain) {
      const target = this.muted ? 0 : this.masterVolume;
      this.outputGain.gain.linearRampToValueAtTime(target, (this.ctx?.currentTime ?? 0) + 0.01);
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setInputTrim(value: number): void {
    this.inputTrim = value;
    this.updateInputGain();
  }

  getInputTrim(): number {
    return this.inputTrim;
  }

  private updateInputGain(): void {
    if (this.inputGain) {
      const target = this.inputMuted ? 0 : this.inputTrim;
      this.inputGain.gain.linearRampToValueAtTime(target, (this.ctx?.currentTime ?? 0) + 0.01);
    }
  }

  setInputMuted(muted: boolean): void {
    this.inputMuted = muted;
    this.updateInputGain();
  }

  isInputMuted(): boolean {
    return this.inputMuted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateOutputGain();
  }

  isMuted(): boolean {
    return this.muted;
  }

  async loadCabinetIr(file: File): Promise<boolean> {
    const arrayBuffer = await file.arrayBuffer();
    return this.loadCabinetIrBuffer(arrayBuffer, file.name);
  }

  async loadCabinetIrBuffer(arrayBuffer: ArrayBuffer, name: string): Promise<boolean> {
    if (!this.ctx || !this.cabinetConvolver) return false;
    try {
      const decoded = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
      this.cabinetConvolver.buffer = decoded;
      this.cabinetIrName = name;
      this.cabinetIrEnabled = true;
      this.updateCabinetMix();
      return true;
    } catch {
      return false;
    }
  }

  clearCabinetIr(): void {
    if (this.cabinetConvolver) {
      this.cabinetConvolver.buffer = null;
    }
    this.cabinetIrName = '';
    this.cabinetIrEnabled = false;
    this.updateCabinetMix();
  }

  setCabinetIrEnabled(enabled: boolean): void {
    this.cabinetIrEnabled = enabled;
    this.updateCabinetMix();
  }

  isCabinetIrEnabled(): boolean {
    return this.cabinetIrEnabled;
  }

  getCabinetIrName(): string {
    return this.cabinetIrName;
  }

  hasCabinetIr(): boolean {
    return Boolean(this.cabinetConvolver?.buffer);
  }

  setCabinetIrMix(mix: number): void {
    this.cabinetIrMix = Math.max(0, Math.min(1, mix));
    this.updateCabinetMix();
  }

  getCabinetIrMix(): number {
    return this.cabinetIrMix;
  }

  getInputLevel(): number {
    return this.getLevel(this.inputAnalyser);
  }

  getOutputLevel(): number {
    return this.getLevel(this.outputAnalyser);
  }

  getOutputPeak(): number {
    if (!this.outputAnalyser) return 0;
    const data = new Float32Array(this.outputAnalyser.fftSize);
    this.outputAnalyser.getFloatTimeDomainData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      peak = Math.max(peak, Math.abs(data[i] ?? 0));
    }
    return peak;
  }

  getBaseLatencyMs(): number {
    return (this.ctx?.baseLatency ?? 0) * 1000;
  }

  getOutputLatencyMs(): number {
    const ctxWithOutput = this.ctx as (AudioContext & { outputLatency?: number }) | null;
    return ((ctxWithOutput?.outputLatency ?? 0) * 1000);
  }

  getSampleRate(): number {
    return this.ctx?.sampleRate ?? 0;
  }

  getActiveNodeEstimate(): number {
    return this.effects.length + 10;
  }

  isOutputRecording(): boolean {
    return this.outputRecorder?.state === 'recording';
  }

  startOutputRecording(format: OutputRecordingFormat = 'webm'): boolean {
    if (!this.recordDest || this.outputRecorder?.state === 'recording') return false;
    const mimeType = getSupportedOutputRecordingMimeType(format);
    if (format === 'mp3' && !mimeType) return false;
    try {
      this.outputRecorderChunks = [];
      this.outputRecorder = mimeType
        ? new MediaRecorder(this.recordDest.stream, { mimeType })
        : new MediaRecorder(this.recordDest.stream);
      this.outputRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.outputRecorderChunks.push(event.data);
      };
      this.outputRecorder.start(200);
      return true;
    } catch {
      this.outputRecorder = null;
      this.outputRecorderChunks = [];
      return false;
    }
  }

  async stopOutputRecording(): Promise<Blob | null> {
    const recorder = this.outputRecorder;
    if (!recorder || recorder.state !== 'recording') return null;

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = this.outputRecorderChunks.length > 0
          ? new Blob(this.outputRecorderChunks, { type: recorder.mimeType || 'audio/webm' })
          : null;
        this.outputRecorderChunks = [];
        this.outputRecorder = null;
        resolve(blob);
      };
      recorder.stop();
    });
  }

  getInputPitchAnalysis(): PitchAnalysis {
    if (!this.inputAnalyser || !this.ctx) {
      return { frequency: null, clarity: 0, signal: 0 };
    }

    const analyser = this.inputAnalyser;
    const bufferLength = 2048;
    analyser.fftSize = bufferLength;
    const data = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(data);

    let rms = 0;
    for (let i = 0; i < data.length; i++) {
      rms += data[i] * data[i];
    }
    rms = Math.sqrt(rms / data.length);
    if (rms < 0.01) {
      return { frequency: null, clarity: 0, signal: rms };
    }

    const sampleRate = this.ctx.sampleRate;
    const minLag = Math.floor(sampleRate / 1000);
    const maxLag = Math.floor(sampleRate / 65);
    let bestLag = -1;
    let bestCorrelation = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let correlation = 0;
      for (let i = 0; i < data.length - lag; i++) {
        correlation += data[i]! * data[i + lag]!;
      }
      correlation /= data.length - lag;

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    const clarity = Math.max(0, Math.min(1, (bestCorrelation - 0.65) / 0.35));
    if (bestLag === -1 || bestCorrelation < 0.78) {
      return { frequency: null, clarity, signal: rms };
    }

    return {
      frequency: sampleRate / bestLag,
      clarity,
      signal: rms,
    };
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
    const nextStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    const nextSourceNode = this.ctx.createMediaStreamSource(nextStream);
    if (this.globalNoiseGateGain && this.globalNoiseGateDetector && this.globalNoiseGateDetectorSink) {
      nextSourceNode.connect(this.globalNoiseGateGain);
      nextSourceNode.connect(this.globalNoiseGateDetector);
      this.globalNoiseGateDetector.connect(this.globalNoiseGateDetectorSink);
    } else {
      nextSourceNode.connect(this.mixBus);
    }

    this.sourceNode.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = nextStream;
    this.sourceNode = nextSourceNode;
  }

  clearChain(): void {
    this.effects.forEach((e) => e.dispose());
    this.effects = [];
    this.rebuildChain();
  }
}
