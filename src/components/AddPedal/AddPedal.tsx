import { useState } from 'react';
import styles from './AddPedal.module.css';
import { ALL_EFFECT_TYPES, EFFECT_LABELS } from '../../audio/effects';
import { PEDAL_COLORS } from '../Pedal/pedalColors';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import type { EffectType } from '../../types/effects';

export function AddPedal() {
  const [isOpen, setIsOpen] = useState(false);
  const { addEffect } = useAudioEngineContext();

  const handleAdd = (type: EffectType) => {
    addEffect(type);
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      {isOpen ? (
        <div className={styles.menu}>
          <div className={styles.menuTitle}>Add Effect</div>
          {ALL_EFFECT_TYPES.map((type) => (
            <button
              key={type}
              className={styles.menuItem}
              onClick={() => handleAdd(type)}
              style={{ borderLeft: `3px solid ${PEDAL_COLORS[type].accent}` }}
            >
              {EFFECT_LABELS[type]}
            </button>
          ))}
          <button className={styles.cancelBtn} onClick={() => setIsOpen(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className={styles.addButton} onClick={() => setIsOpen(true)} title="Add effect">
          <span className={styles.plus}>+</span>
        </button>
      )}
    </div>
  );
}
