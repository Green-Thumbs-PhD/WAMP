export type LooperStatus = 'idle' | 'recording' | 'ready' | 'playing';

export interface LooperState {
  status: LooperStatus;
  sourceDuration: number;
  trimmedDuration: number;
  trimStart: number;
  trimEnd: number;
  currentTime: number;
  level: number;
  recordLength: number;
  peaks: number[];
}

export class PostChainLooper {
  private ctx: AudioContext;
  private looperGain: GainNode;
  private recordDest: MediaStreamAudioDestinationNode;
  private mediaRecorder: MediaRecorder | null = null;
  private recordChunks: Blob[] = [];
  private loopBuffer: AudioBuffer | null = null;
  private loopSource: AudioBufferSourceNode | null = null;
  private status: LooperStatus = 'idle';
  private level = 0.85;
  private trimStart = 0;
  private trimEnd = 0;
  private playbackStartedAt = 0;
  private playbackOffset = 0;
  private recordLength = 8;
  private recordStartedAt = 0;
  private recordTimeout: ReturnType<typeof setTimeout> | null = null;
  private peaks: number[] = [];

  constructor(ctx: AudioContext, looperGain: GainNode, recordDest: MediaStreamAudioDestinationNode) {
    this.ctx = ctx;
    this.looperGain = looperGain;
    this.recordDest = recordDest;
  }

  getRecordDestination(): MediaStreamAudioDestinationNode {
    return this.recordDest;
  }

  getStatus(): LooperStatus {
    return this.status;
  }

  getLoopDuration(): number {
    return Math.max(0, this.trimEnd - this.trimStart);
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
    return Math.max(0, Math.min(this.loopBuffer?.duration ?? 0, value));
  }

  private getEffectiveLoopEnd(): number {
    return this.trimEnd > this.trimStart ? this.trimEnd : this.loopBuffer?.duration ?? 0;
  }

  private getLoopWindowDuration(): number {
    return Math.max(0.05, this.getEffectiveLoopEnd() - this.trimStart);
  }

  getCurrentTime(): number {
    if (this.status === 'recording') {
      return Math.max(0, this.ctx.currentTime - this.recordStartedAt);
    }

    if (this.status !== 'playing' || !this.loopBuffer) {
      return this.playbackOffset || this.trimStart;
    }

    const elapsed = this.ctx.currentTime - this.playbackStartedAt;
    const loopDuration = this.getLoopWindowDuration();
    const current = this.trimStart + ((this.playbackOffset - this.trimStart + elapsed) % loopDuration + loopDuration) % loopDuration;
    return this.clampTime(current);
  }

  getState(): LooperState {
    return {
      status: this.status,
      sourceDuration: this.loopBuffer?.duration ?? 0,
      trimmedDuration: this.getLoopDuration(),
      trimStart: this.trimStart,
      trimEnd: this.getEffectiveLoopEnd(),
      currentTime: this.getCurrentTime(),
      level: this.level,
      recordLength: this.recordLength,
      peaks: this.peaks,
    };
  }

  setRecordLength(value: number): void {
    this.recordLength = Math.max(1, value);
  }

  private clearRecordTimeout(): void {
    if (this.recordTimeout) {
      clearTimeout(this.recordTimeout);
      this.recordTimeout = null;
    }
  }

  startRecording(): void {
    if (this.status === 'recording') return;
    this.stopPlaybackInternal();
    this.loopBuffer = null;
    this.recordChunks = [];
    this.peaks = [];
    this.trimStart = 0;
    this.trimEnd = 0;
    this.playbackOffset = 0;
    this.recordStartedAt = this.ctx.currentTime;
    this.clearRecordTimeout();

    const stream = this.recordDest.stream;
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    let mime = '';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        mime = m;
        break;
      }
    }

    try {
      this.mediaRecorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
    } catch {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordChunks.push(e.data);
    };

    this.mediaRecorder.start(100);
    this.status = 'recording';
    this.recordTimeout = setTimeout(() => {
      void this.stopRecording();
    }, this.recordLength * 1000);
  }

  async stopRecording(): Promise<void> {
    if (this.status !== 'recording' || !this.mediaRecorder) {
      this.status = this.loopBuffer ? 'ready' : 'idle';
      return;
    }
    this.clearRecordTimeout();

    const recorder = this.mediaRecorder;
    this.mediaRecorder = null;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    if (this.recordChunks.length === 0) {
      this.status = 'idle';
      return;
    }

    const blob = new Blob(this.recordChunks, { type: recorder.mimeType || 'audio/webm' });
    this.recordChunks = [];

    try {
      const ab = await blob.arrayBuffer();
      const copy = ab.slice(0);
      this.loopBuffer = await this.ctx.decodeAudioData(copy);
      this.trimStart = 0;
      this.trimEnd = this.loopBuffer.duration;
      this.playbackOffset = 0;
      this.peaks = this.computePeaks(this.loopBuffer, 96);
      this.status = 'ready';
    } catch {
      this.loopBuffer = null;
      this.trimStart = 0;
      this.trimEnd = 0;
      this.playbackOffset = 0;
      this.peaks = [];
      this.status = 'idle';
    }
  }

  play(): void {
    if (!this.loopBuffer) return;
    this.stopPlaybackInternal();

    const src = this.ctx.createBufferSource();
    src.buffer = this.loopBuffer;
    src.loop = true;
    src.loopStart = this.trimStart;
    src.loopEnd = this.getEffectiveLoopEnd();
    src.connect(this.looperGain);
    const startTime = Math.max(this.trimStart, Math.min(this.getEffectiveLoopEnd() - 0.01, this.playbackOffset || this.trimStart));
    src.start(0, startTime);
    this.loopSource = src;
    this.playbackStartedAt = this.ctx.currentTime;
    this.playbackOffset = startTime;
    this.looperGain.gain.setValueAtTime(this.level, this.ctx.currentTime);
    this.status = 'playing';
  }

  stopPlayback(): void {
    this.playbackOffset = this.getCurrentTime();
    this.stopPlaybackInternal();
    if (this.loopBuffer) this.status = 'ready';
    else this.status = 'idle';
  }

  private stopPlaybackInternal(): void {
    if (this.loopSource) {
      try {
        this.loopSource.stop();
      } catch {
        /* already stopped */
      }
      this.loopSource.disconnect();
      this.loopSource = null;
    }
    this.looperGain.gain.setValueAtTime(0, this.ctx.currentTime);
  }

  setTrimRange(start: number, end: number): void {
    if (!this.loopBuffer) return;
    const nextStart = this.clampTime(Math.min(start, end));
    const nextEnd = Math.max(nextStart + 0.05, this.clampTime(Math.max(start, end)));
    this.trimStart = nextStart;
    this.trimEnd = Math.min(this.loopBuffer.duration, nextEnd);
    this.playbackOffset = Math.max(this.trimStart, Math.min(this.trimEnd, this.playbackOffset || this.trimStart));

    if (this.status === 'playing') {
      this.play();
    }
  }

  resetTrim(): void {
    if (!this.loopBuffer) return;
    this.trimStart = 0;
    this.trimEnd = this.loopBuffer.duration;
    this.playbackOffset = 0;
    if (this.status === 'playing') {
      this.play();
    }
  }

  applyTrim(): void {
    if (!this.loopBuffer) return;
    const start = Math.floor(this.trimStart * this.loopBuffer.sampleRate);
    const end = Math.floor(this.getEffectiveLoopEnd() * this.loopBuffer.sampleRate);
    const frameCount = Math.max(1, end - start);
    const trimmed = this.ctx.createBuffer(
      this.loopBuffer.numberOfChannels,
      frameCount,
      this.loopBuffer.sampleRate
    );

    for (let channel = 0; channel < this.loopBuffer.numberOfChannels; channel++) {
      const source = this.loopBuffer.getChannelData(channel);
      trimmed.copyToChannel(source.slice(start, end), channel);
    }

    this.stopPlaybackInternal();
    this.loopBuffer = trimmed;
    this.trimStart = 0;
    this.trimEnd = trimmed.duration;
    this.playbackOffset = 0;
    this.peaks = this.computePeaks(trimmed, 96);
    this.status = 'ready';
  }

  clear(): void {
    if (this.status === 'recording' && this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    this.clearRecordTimeout();
    this.recordChunks = [];
    this.stopPlaybackInternal();
    this.loopBuffer = null;
    this.trimStart = 0;
    this.trimEnd = 0;
    this.playbackOffset = 0;
    this.peaks = [];
    this.status = 'idle';
  }

  setLevel(value: number): void {
    this.level = Math.max(0, Math.min(1, value));
    if (this.status === 'playing') {
      this.looperGain.gain.setValueAtTime(this.level, this.ctx.currentTime);
    }
  }

  dispose(): void {
    this.clear();
  }
}
