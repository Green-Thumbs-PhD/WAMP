import styles from './AmpChannelSelector.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

const CHANNELS = [
  { id: 'clean', label: 'Clean', copy: 'Open headroom and a softer front edge.' },
  { id: 'crunch', label: 'Crunch', copy: 'Mid-gain breakup with extra bite.' },
  { id: 'lead', label: 'Lead', copy: 'Hotter front end with tighter trim.' },
] as const;

export function AmpChannelSelector() {
  const {
    isRunning,
    ampChannel,
    ampPresence,
    ampLevel,
    setAmpChannel,
    setAmpPresence,
    setAmpLevel,
  } = useAudioEngineContext();

  if (!isRunning) return null;

  return (
    <section className={styles.panel} aria-label="Amp channel selector">
      <h2 className={styles.title}>Amp channel</h2>
      <p className={styles.meta}>Choose the rack voicing before the pedalboard and trim the amp character.</p>
      <div className={styles.channelRow}>
        {CHANNELS.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className={`${styles.channelBtn} ${ampChannel === channel.id ? styles.channelBtnActive : ''}`}
            onClick={() => setAmpChannel(channel.id)}
          >
            <strong>{channel.label}</strong>
            <span>{channel.copy}</span>
          </button>
        ))}
      </div>
      <label className={styles.control}>
        <span>Presence</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={ampPresence}
          onChange={(e) => setAmpPresence(Number(e.target.value))}
        />
        <strong>{ampPresence}%</strong>
      </label>
      <label className={styles.control}>
        <span>Amp level</span>
        <input
          type="range"
          min={50}
          max={150}
          step={1}
          value={Math.round(ampLevel * 100)}
          onChange={(e) => setAmpLevel(Number(e.target.value) / 100)}
        />
        <strong>{Math.round(ampLevel * 100)}%</strong>
      </label>
    </section>
  );
}
