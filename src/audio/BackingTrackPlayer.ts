export interface BackingTrackState {
  name: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  sectionStart: number;
  sectionEnd: number;
  sectionLoopEnabled: boolean;
  playbackRate: number;
  peaks: number[];
}

export class BackingTrackPlayer {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private name = '';
  private volume = 0.8;
  private isPlaying = false;
  private playbackStartedAt = 0;
  private playbackOffset = 0;
  private sectionStart = 0;
  private sectionEnd = 0;
  private sectionLoopEnabled = false;
  private playbackRate = 1;
  private peaks: number[] = [];

  constructor(ctx: AudioContext, outputNode: GainNode) {
    this.ctx = ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(outputNode);
  }

  async loadFromArrayBuffer(arrayBuffer: ArrayBuffer, name: string): Promise<boolean> {
    this.stop();

    try {
      this.buffer = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
      this.name = name;
      this.playbackOffset = 0;
      this.sectionStart = 0;
      this.sectionEnd = this.buffer.duration;
      this.peaks = this.computePeaks(this.buffer, 96);
      return true;
    } catch {
      this.buffer = null;
      this.name = '';
      this.peaks = [];
      this.sectionStart = 0;
      this.sectionEnd = 0;
      return false;
    }
  }

  private computePeaks(buffer: AudioBuffer, count: number): number[] {
    const channel = buffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channel.length / count));
    const peaks: number[] = [];

    for (let i = 0; i < count; i++) {
      const start = i * blockSize;
      const end = Math.min(channel.length, start + blockSize);
      let peak = 0;
      for (let j = start; j < end; j++) {
        peak = Math.max(peak, Math.abs(channel[j] ?? 0));
      }
      peaks.push(peak);
    }

    return peaks;
  }

  private clampTime(value: number): number {
    return Math.max(0, Math.min(this.buffer?.duration ?? 0, value));
  }

  private createSource(startTime: number): void {
    if (!this.buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.gainNode);

    if (this.sectionLoopEnabled && this.sectionEnd > this.sectionStart) {
      source.loop = true;
      source.loopStart = this.sectionStart;
      source.loopEnd = this.sectionEnd;
    }
    source.playbackRate.value = this.playbackRate;

    source.onended = () => {
      if (this.source !== source) return;
      if (!source.loop) {
        this.isPlaying = false;
        this.playbackOffset = 0;
      }
      this.source = null;
    };

    source.start(0, startTime);
    this.source = source;
    this.playbackStartedAt = this.ctx.currentTime;
    this.playbackOffset = startTime;
    this.isPlaying = true;
  }

  private stopSource(): void {
    if (!this.source) return;
    try {
      this.source.stop();
    } catch {
      /* ignore */
    }
    this.source.disconnect();
    this.source = null;
  }

  private getLoopWindowDuration(): number {
    const duration = this.sectionEnd - this.sectionStart;
    return duration > 0 ? duration : this.buffer?.duration ?? 0;
  }

  getCurrentTime(): number {
    if (!this.buffer) return 0;
    if (!this.isPlaying) return this.playbackOffset;

    const elapsed = (this.ctx.currentTime - this.playbackStartedAt) * this.playbackRate;
    let current = this.playbackOffset + elapsed;

    if (this.sectionLoopEnabled && this.sectionEnd > this.sectionStart) {
      const loopDuration = this.getLoopWindowDuration();
      current = this.sectionStart + ((current - this.sectionStart) % loopDuration + loopDuration) % loopDuration;
    }

    return this.clampTime(current);
  }

  play(): void {
    if (!this.buffer) return;
    this.stopSource();

    let startTime = this.playbackOffset;
    if (this.sectionLoopEnabled && this.sectionEnd > this.sectionStart) {
      startTime = Math.max(this.sectionStart, Math.min(this.sectionEnd - 0.01, startTime || this.sectionStart));
    }

    this.createSource(startTime);
  }

  pause(): void {
    if (!this.buffer) return;
    this.playbackOffset = this.getCurrentTime();
    this.isPlaying = false;
    this.stopSource();
  }

  stop(): void {
    this.isPlaying = false;
    this.playbackOffset = this.sectionLoopEnabled ? this.sectionStart : 0;
    this.stopSource();
  }

  clear(): void {
    this.stop();
    this.buffer = null;
    this.name = '';
    this.peaks = [];
    this.sectionStart = 0;
    this.sectionEnd = 0;
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
  }

  setCurrentTime(value: number): void {
    if (!this.buffer) return;
    this.playbackOffset = this.clampTime(value);
    if (this.isPlaying) {
      this.play();
    }
  }

  setPlaybackRate(value: number): void {
    const nextRate = Math.max(0.25, Math.min(2.5, value));
    this.playbackRate = nextRate;
    if (this.source) {
      this.source.playbackRate.setValueAtTime(nextRate, this.ctx.currentTime);
    }
  }

  setSection(start: number, end: number): void {
    if (!this.buffer) return;

    const nextStart = this.clampTime(Math.min(start, end));
    const nextEnd = this.clampTime(Math.max(start, end));
    const safeEnd = Math.max(nextStart + 0.05, nextEnd);

    this.sectionStart = nextStart;
    this.sectionEnd = Math.min(this.buffer.duration, safeEnd);

    if (this.playbackOffset < this.sectionStart || this.playbackOffset > this.sectionEnd) {
      this.playbackOffset = this.sectionStart;
    }

    if (this.isPlaying) {
      this.play();
    }
  }

  setSectionLoopEnabled(enabled: boolean): void {
    this.sectionLoopEnabled = enabled;
    if (this.isPlaying) {
      this.play();
    }
  }

  getState(): BackingTrackState {
    return {
      name: this.name,
      duration: this.buffer?.duration ?? 0,
      currentTime: this.getCurrentTime(),
      isPlaying: this.isPlaying,
      volume: this.volume,
      sectionStart: this.sectionStart,
      sectionEnd: this.sectionEnd || this.buffer?.duration || 0,
      sectionLoopEnabled: this.sectionLoopEnabled,
      playbackRate: this.playbackRate,
      peaks: this.peaks,
    };
  }

  dispose(): void {
    this.clear();
    this.gainNode.disconnect();
  }
}
