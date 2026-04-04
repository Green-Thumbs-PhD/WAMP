import { useCallback, useRef, useState } from 'react';
import styles from './Knob.module.css';
import type { ParamDescriptor } from '../../types/effects';

interface KnobProps {
  descriptor: ParamDescriptor;
  value: number;
  onChange: (value: number) => void;
  color?: string;
  size?: number;
  /** Accessible name; defaults to descriptor.label */
  ariaLabel?: string;
}

const ROTATION_RANGE = 270; // degrees
const START_ANGLE = -135; // 7 o'clock position

export function Knob({
  descriptor,
  value,
  onChange,
  color = '#e0e0e0',
  size = 48,
  ariaLabel,
}: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ y: number; startValue: number } | null>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const { min, max, step, label, unit } = descriptor;

  const normalizedValue = (value - min) / (max - min);
  const rotation = START_ANGLE + normalizedValue * ROTATION_RANGE;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { y: e.clientY, startValue: value };
    setIsDragging(true);
  }, [value]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();

    const dy = dragStartRef.current.y - e.clientY;
    const sensitivity = (max - min) / 200; // 200px for full range
    let newValue = dragStartRef.current.startValue + dy * sensitivity;

    // Snap to step
    newValue = Math.round(newValue / step) * step;
    newValue = Math.max(min, Math.min(max, newValue));

    if (newValue !== value) {
      onChange(newValue);
    }
  }, [max, min, step, value, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    dragStartRef.current = null;
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? step : -step;
    const newValue = Math.max(min, Math.min(max, Math.round((value + delta) / step) * step));
    if (newValue !== value) onChange(newValue);
  }, [value, min, max, step, onChange]);

  const bump = useCallback(
    (dir: 1 | -1) => {
      const newValue = Math.max(min, Math.min(max, Math.round((value + dir * step) / step) * step));
      if (newValue !== value) onChange(newValue);
    },
    [value, min, max, step, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          e.preventDefault();
          bump(1);
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          e.preventDefault();
          bump(-1);
          break;
        case 'Home':
          e.preventDefault();
          onChange(min);
          break;
        case 'End':
          e.preventDefault();
          onChange(max);
          break;
        case 'PageUp':
          e.preventDefault();
          bump(1);
          bump(1);
          break;
        case 'PageDown':
          e.preventDefault();
          bump(-1);
          bump(-1);
          break;
        default:
          break;
      }
    },
    [bump, min, max, onChange]
  );

  const displayValue = step < 1
    ? value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1)
    : Math.round(value).toString();

  return (
    <div className={styles.container} style={{ width: size + 16 }}>
      <div className={styles.valueDisplay}>
        {displayValue}{unit && <span className={styles.unit}>{unit}</span>}
      </div>
      <div
        ref={knobRef}
        className={`${styles.knob} ${isDragging ? styles.dragging : ''}`}
        style={{ width: size, height: size }}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={ariaLabel ?? label}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
      >
        <svg viewBox="0 0 48 48" className={styles.svg}>
          {/* Track arc */}
          <circle cx="24" cy="24" r="20" fill="none" stroke="#333" strokeWidth="3"
            strokeDasharray={`${(ROTATION_RANGE / 360) * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
            strokeDashoffset={0}
            transform={`rotate(${START_ANGLE + 90} 24 24)`}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(normalizedValue * ROTATION_RANGE / 360) * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
            strokeDashoffset={0}
            transform={`rotate(${START_ANGLE + 90} 24 24)`}
            strokeLinecap="round"
            opacity={0.8}
          />
          {/* Knob body */}
          <circle cx="24" cy="24" r="16" className={styles.knobBody} />
          {/* Pointer */}
          <line
            x1="24" y1="24" x2="24" y2="11"
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            transform={`rotate(${rotation} 24 24)`}
          />
        </svg>
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
