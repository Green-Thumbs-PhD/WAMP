/** Procedural one-shot buffers for 16 pads (4×4). */

function noiseBuffer(ctx: AudioContext, length: number): AudioBuffer {
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    d[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function makeKick(ctx: AudioContext): AudioBuffer {
  const dur = 0.35;
  const n = (ctx.sampleRate * dur) | 0;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const env = Math.exp(-t * 18);
    const pitch = 150 * Math.exp(-t * 35) + 45;
    d[i] = Math.sin(2 * Math.PI * pitch * t) * env * 0.95;
  }
  return buf;
}

function makeSnare(ctx: AudioContext): AudioBuffer {
  const dur = 0.2;
  const n = (ctx.sampleRate * dur) | 0;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const noise = noiseBuffer(ctx, n).getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 40);
    const env = Math.exp(-t * 22);
    d[i] = (tone * 0.35 + noise[i] * 0.65) * env * 0.85;
  }
  return buf;
}

function makeHiHat(ctx: AudioContext, closed: boolean): AudioBuffer {
  const dur = closed ? 0.06 : 0.25;
  const n = (ctx.sampleRate * dur) | 0;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const noise = noiseBuffer(ctx, n).getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const env = closed ? Math.exp(-t * 120) : Math.exp(-t * 18);
    let v = 0;
    for (let h = 1; h <= 8; h++) {
      v += Math.sin(2 * Math.PI * (200 + h * 300) * t) / h;
    }
    d[i] = (v * 0.08 + noise[i] * 0.5) * env * 0.5;
  }
  return buf;
}

function makeTom(ctx: AudioContext, freq: number): AudioBuffer {
  const dur = 0.28;
  const n = (ctx.sampleRate * dur) | 0;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const f = freq * Math.exp(-t * 12);
    const env = Math.exp(-t * 10);
    d[i] = Math.sin(2 * Math.PI * f * t) * env * 0.75;
  }
  return buf;
}

function makeClap(ctx: AudioContext): AudioBuffer {
  const dur = 0.15;
  const n = (ctx.sampleRate * dur) | 0;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const noise = noiseBuffer(ctx, n).getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const env =
      (t < 0.01 ? t / 0.01 : 1) * Math.exp(-t * 35) * (1 + 0.3 * Math.sin(t * 400));
    d[i] = noise[i] * env * 0.55;
  }
  return buf;
}

export function buildFactoryKit(ctx: AudioContext): AudioBuffer[] {
  return [
    makeKick(ctx),
    makeSnare(ctx),
    makeHiHat(ctx, true),
    makeHiHat(ctx, false),
    makeTom(ctx, 110),
    makeTom(ctx, 90),
    makeTom(ctx, 70),
    makeClap(ctx),
    makeKick(ctx),
    makeSnare(ctx),
    makeHiHat(ctx, true),
    makeHiHat(ctx, false),
    makeTom(ctx, 130),
    makeTom(ctx, 100),
    makeTom(ctx, 80),
    makeClap(ctx),
  ];
}
