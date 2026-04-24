/** Procedural one-shot buffers for 16 pads (4×4). */

export type DrumKitPresetId = 'default' | 'trance-giant' | '808-heat' | '909-club' | 'linn-pop';

function noiseBuffer(ctx: AudioContext, length: number): AudioBuffer {
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    d[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function makeKick(ctx: AudioContext, options?: { duration?: number; punch?: number; body?: number }): AudioBuffer {
  const dur = options?.duration ?? 0.35;
  const punch = options?.punch ?? 150;
  const body = options?.body ?? 45;
  const n = (ctx.sampleRate * dur) | 0;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const env = Math.exp(-t * 18);
    const pitch = punch * Math.exp(-t * 35) + body;
    d[i] = Math.sin(2 * Math.PI * pitch * t) * env * 0.95;
  }
  return buf;
}

function makeSnare(ctx: AudioContext, options?: { duration?: number; toneFreq?: number; snap?: number }): AudioBuffer {
  const dur = options?.duration ?? 0.2;
  const toneFreq = options?.toneFreq ?? 200;
  const snap = options?.snap ?? 0.65;
  const n = (ctx.sampleRate * dur) | 0;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const noise = noiseBuffer(ctx, n).getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const tone = Math.sin(2 * Math.PI * toneFreq * t) * Math.exp(-t * 40);
    const env = Math.exp(-t * 22);
    d[i] = (tone * (1 - snap) + noise[i] * snap) * env * 0.85;
  }
  return buf;
}

function makeHiHat(ctx: AudioContext, closed: boolean, options?: { durationScale?: number; brightness?: number }): AudioBuffer {
  const durationScale = options?.durationScale ?? 1;
  const brightness = options?.brightness ?? 1;
  const dur = (closed ? 0.06 : 0.25) * durationScale;
  const n = (ctx.sampleRate * dur) | 0;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const noise = noiseBuffer(ctx, n).getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate;
    const env = closed ? Math.exp(-t * 120) : Math.exp(-t * 18);
    let v = 0;
    for (let h = 1; h <= 8; h++) {
      v += Math.sin(2 * Math.PI * ((200 + h * 300) * brightness) * t) / h;
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

function buildDefaultKit(ctx: AudioContext): AudioBuffer[] {
  return [makeKick(ctx), makeSnare(ctx), makeHiHat(ctx, true), makeHiHat(ctx, false), makeTom(ctx, 110), makeTom(ctx, 90), makeTom(ctx, 70), makeClap(ctx), makeKick(ctx), makeSnare(ctx), makeHiHat(ctx, true), makeHiHat(ctx, false), makeTom(ctx, 130), makeTom(ctx, 100), makeTom(ctx, 80), makeClap(ctx)];
}

function buildTranceGiantKit(ctx: AudioContext): AudioBuffer[] {
  return [makeKick(ctx, { duration: 0.5, punch: 190, body: 38 }), makeSnare(ctx, { duration: 0.24, toneFreq: 220, snap: 0.72 }), makeHiHat(ctx, true, { durationScale: 0.85, brightness: 1.25 }), makeHiHat(ctx, false, { durationScale: 1.2, brightness: 1.18 }), makeTom(ctx, 140), makeTom(ctx, 115), makeTom(ctx, 90), makeClap(ctx), makeKick(ctx, { duration: 0.42, punch: 170, body: 44 }), makeSnare(ctx, { duration: 0.22, toneFreq: 210, snap: 0.68 }), makeHiHat(ctx, true, { durationScale: 0.8, brightness: 1.3 }), makeHiHat(ctx, false, { durationScale: 1.1, brightness: 1.22 }), makeTom(ctx, 160), makeTom(ctx, 132), makeTom(ctx, 100), makeClap(ctx)];
}

function build808HeatKit(ctx: AudioContext): AudioBuffer[] {
  return [makeKick(ctx, { duration: 0.62, punch: 132, body: 33 }), makeSnare(ctx, { duration: 0.22, toneFreq: 180, snap: 0.7 }), makeHiHat(ctx, true, { durationScale: 1.05, brightness: 0.92 }), makeHiHat(ctx, false, { durationScale: 1.22, brightness: 0.94 }), makeTom(ctx, 95), makeTom(ctx, 78), makeTom(ctx, 62), makeClap(ctx), makeKick(ctx, { duration: 0.58, punch: 126, body: 30 }), makeSnare(ctx, { duration: 0.22, toneFreq: 170, snap: 0.73 }), makeHiHat(ctx, true, { durationScale: 1.1, brightness: 0.9 }), makeHiHat(ctx, false, { durationScale: 1.3, brightness: 0.92 }), makeTom(ctx, 118), makeTom(ctx, 88), makeTom(ctx, 70), makeClap(ctx)];
}

function build909ClubKit(ctx: AudioContext): AudioBuffer[] {
  return [makeKick(ctx, { duration: 0.38, punch: 170, body: 52 }), makeSnare(ctx, { duration: 0.18, toneFreq: 240, snap: 0.62 }), makeHiHat(ctx, true, { durationScale: 0.75, brightness: 1.35 }), makeHiHat(ctx, false, { durationScale: 1, brightness: 1.28 }), makeTom(ctx, 126), makeTom(ctx, 102), makeTom(ctx, 84), makeClap(ctx), makeKick(ctx, { duration: 0.35, punch: 165, body: 48 }), makeSnare(ctx, { duration: 0.19, toneFreq: 245, snap: 0.6 }), makeHiHat(ctx, true, { durationScale: 0.72, brightness: 1.4 }), makeHiHat(ctx, false, { durationScale: 1.05, brightness: 1.3 }), makeTom(ctx, 148), makeTom(ctx, 116), makeTom(ctx, 92), makeClap(ctx)];
}

function buildLinnPopKit(ctx: AudioContext): AudioBuffer[] {
  return [makeKick(ctx, { duration: 0.28, punch: 150, body: 55 }), makeSnare(ctx, { duration: 0.16, toneFreq: 260, snap: 0.58 }), makeHiHat(ctx, true, { durationScale: 0.65, brightness: 1.15 }), makeHiHat(ctx, false, { durationScale: 0.92, brightness: 1.1 }), makeTom(ctx, 150), makeTom(ctx, 125), makeTom(ctx, 105), makeClap(ctx), makeKick(ctx, { duration: 0.3, punch: 148, body: 52 }), makeSnare(ctx, { duration: 0.16, toneFreq: 268, snap: 0.55 }), makeHiHat(ctx, true, { durationScale: 0.68, brightness: 1.2 }), makeHiHat(ctx, false, { durationScale: 0.94, brightness: 1.12 }), makeTom(ctx, 170), makeTom(ctx, 138), makeTom(ctx, 112), makeClap(ctx)];
}

export function buildFactoryKit(ctx: AudioContext, presetId: DrumKitPresetId = 'default'): AudioBuffer[] {
  switch (presetId) {
    case 'trance-giant':
      return buildTranceGiantKit(ctx);
    case '808-heat':
      return build808HeatKit(ctx);
    case '909-club':
      return build909ClubKit(ctx);
    case 'linn-pop':
      return buildLinnPopKit(ctx);
    case 'default':
    default:
      return buildDefaultKit(ctx);
  }
}
