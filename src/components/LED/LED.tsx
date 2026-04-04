import styles from './LED.module.css';

interface LEDProps {
  active: boolean;
  color?: string;
}

export function LED({ active, color = '#ff3333' }: LEDProps) {
  return (
    <div
      className={`${styles.led} ${active ? styles.active : ''}`}
      style={{
        backgroundColor: active ? color : '#330000',
        boxShadow: active
          ? `0 0 6px ${color}, 0 0 12px ${color}40`
          : 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}
    />
  );
}
