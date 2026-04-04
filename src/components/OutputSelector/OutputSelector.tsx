import { useEffect, useState } from 'react';
import styles from '../InputSelector/InputSelector.module.css';

const sinkSupported =
  typeof AudioContext !== 'undefined' &&
  typeof (AudioContext.prototype as AudioContext & { setSinkId?: unknown }).setSinkId === 'function';

interface OutputSelectorProps {
  onSelect: (sinkId: string) => void;
  disabled?: boolean;
}

export function OutputSelector({ onSelect, disabled = false }: OutputSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    async function enumerate() {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = allDevices.filter((d) => d.kind === 'audiooutput');
      setDevices(audioOutputs);
    }
    enumerate();
    navigator.mediaDevices.addEventListener('devicechange', enumerate);
    return () => navigator.mediaDevices.removeEventListener('devicechange', enumerate);
  }, []);

  useEffect(() => {
    onSelect(selected);
  }, [selected, onSelect]);

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
