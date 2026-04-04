export class MetronomeEngine {
  private ctx: AudioContext;
  private gain: GainNode;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private bpm = 120;
  private beat = 0;
  private volume = 0.35;

  constructor(ctx: AudioContext, gain: GainNode) {
    this.ctx = ctx;
    this.gain = gain;
  }

  getBpm(): number {
    return this.bpm;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(40, Math.min(280, Math.round(bpm)));
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  start(): void {
    if (this.intervalId) return;
    const ms = (60_000 / this.bpm) | 0;
    this.beat = 0;
    this.scheduleClick(true);
    this.intervalId = setInterval(() => {
      this.beat += 1;
      this.scheduleClick(this.beat % 4 === 0);
    }, ms);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private scheduleClick(accent: boolean): void {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(accent ? 1200 : 880, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(accent ? this.volume : this.volume * 0.65, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(g);
    g.connect(this.gain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  dispose(): void {
    this.stop();
  }
}
