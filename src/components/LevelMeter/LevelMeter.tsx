import { useEffect, useRef } from 'react';
import styles from './LevelMeter.module.css';

interface LevelMeterProps {
  level: number;
  label: string;
  color?: string;
}

export function LevelMeter({ level, label, color = '#55cc55' }: LevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Smooth the level
    smoothedRef.current += (level - smoothedRef.current) * 0.3;
    const db = smoothedRef.current > 0.0001
      ? Math.max(-60, 20 * Math.log10(smoothedRef.current))
      : -60;
    const normalized = (db + 60) / 60; // 0 to 1

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Level bar
    const barHeight = normalized * h;
    const gradient = ctx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(0.85, '#ffcc33');
    gradient.addColorStop(1, '#ff3333');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, h - barHeight, w, barHeight);

    // Segment lines
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < h; i += 4) {
      ctx.fillRect(0, i, w, 1);
    }
  });

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        width={8}
        height={80}
        className={styles.canvas}
      />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
