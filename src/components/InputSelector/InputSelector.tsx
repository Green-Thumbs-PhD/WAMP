import { useEffect, useState } from 'react';
import styles from './InputSelector.module.css';

interface InputSelectorProps {
  onSelect: (deviceId: string) => void;
  disabled?: boolean;
  refreshToken?: number;
}

export function InputSelector({ onSelect, disabled = false, refreshToken = 0 }: InputSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    let active = true;

    async function enumerate() {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      if (!active) return;
      const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');
      setDevices(audioInputs);
      setSelected((current) => {
        if (current) return current;
        return audioInputs[0]?.deviceId ?? '';
      });
    }
    enumerate();
    navigator.mediaDevices.addEventListener('devicechange', enumerate);
    return () => {
      active = false;
      navigator.mediaDevices.removeEventListener('devicechange', enumerate);
    };
  }, [refreshToken]);

  useEffect(() => {
    if (!selected || !devices.some((device) => device.deviceId === selected)) return;
    onSelect(selected);
  }, [devices, selected, onSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelected(deviceId);
    onSelect(deviceId);
  };

  const labelsHidden = devices.length > 0 && devices.every((d) => !d.label);

  return (
    <div className={styles.row}>
      <span className={styles.fieldLabel}>Input</span>
      <select
        className={styles.select}
        value={selected}
        onChange={handleChange}
        disabled={disabled}
        title={
          labelsHidden
            ? 'Start audio to grant mic access and show full device names'
            : undefined
        }
      >
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Input ${d.deviceId.slice(0, 8)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
