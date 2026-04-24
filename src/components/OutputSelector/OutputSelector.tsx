import { useEffect, useState } from 'react';
import styles from '../InputSelector/InputSelector.module.css';

const sinkSupported =
  typeof AudioContext !== 'undefined' &&
  typeof (AudioContext.prototype as AudioContext & { setSinkId?: unknown }).setSinkId === 'function';

interface OutputSelectorProps {
  onSelect: (sinkId: string) => void;
  disabled?: boolean;
  refreshToken?: number;
}

export function OutputSelector({ onSelect, disabled = false, refreshToken = 0 }: OutputSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    let active = true;

    async function enumerate() {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      if (!active) return;
      const audioOutputs = allDevices.filter((d) => d.kind === 'audiooutput');
      setDevices(audioOutputs);
      setSelected((current) => current);
    }
    enumerate();
    navigator.mediaDevices.addEventListener('devicechange', enumerate);
    return () => {
      active = false;
      navigator.mediaDevices.removeEventListener('devicechange', enumerate);
    };
  }, [refreshToken]);

  useEffect(() => {
    if (selected && !devices.some((device) => device.deviceId === selected)) return;
    onSelect(selected);
  }, [devices, selected, onSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sinkId = e.target.value;
    setSelected(sinkId);
    onSelect(sinkId);
  };

  return (
    <div className={styles.row}>
      <span className={styles.fieldLabel}>Output</span>
      <select
        className={styles.select}
        value={selected}
        onChange={handleChange}
        disabled={disabled || !sinkSupported}
        title={
          !sinkSupported
            ? 'Audio output device selection is not supported in this browser'
            : undefined
        }
      >
        <option value="">Default</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Output ${d.deviceId.slice(0, 8)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
