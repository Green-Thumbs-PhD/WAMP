export type LooperStatus = 'idle' | 'recording' | 'ready' | 'playing';

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
    return this.loopBuffer?.duration ?? 0;
  }

  startRecording(): void {
    if (this.status === 'recording') return;
    this.stopPlaybackInternal();
    this.loopBuffer = null;
    this.recordChunks = [];

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
  }

  async stopRecording(): Promise<void> {
    if (this.status !== 'recording' || !this.mediaRecorder) {
      this.status = this.loopBuffer ? 'ready' : 'idle';
      return;
    }

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
      this.status = 'ready';
    } catch {
      this.loopBuffer = null;
      this.status = 'idle';
    }
  }

  play(): void {
    if (!this.loopBuffer) return;
    this.stopPlaybackInternal();

    const src = this.ctx.createBufferSource();
    src.buffer = this.loopBuffer;
    src.loop = true;
    src.connect(this.looperGain);
    src.start(0);
    this.loopSource = src;
    this.looperGain.gain.setValueAtTime(this.level, this.ctx.currentTime);
    this.status = 'playing';
  }

  stopPlayback(): void {
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

  clear(): void {
    if (this.status === 'recording' && this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    this.recordChunks = [];
    this.stopPlaybackInternal();
    this.loopBuffer = null;
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
