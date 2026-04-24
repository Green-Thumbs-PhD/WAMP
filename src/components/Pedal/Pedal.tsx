import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './Pedal.module.css';
import { PEDAL_COLORS } from './pedalColors';
import { Knob } from '../Knob/Knob';
import { LED } from '../LED/LED';
import { FootSwitch } from '../FootSwitch/FootSwitch';
import { EFFECT_LABELS, getParamDescriptors } from '../../audio/effects';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import type { EffectSlotState } from '../../types/effects';

interface PedalProps {
  slot: EffectSlotState;
}

export function Pedal({ slot }: PedalProps) {
  const {
    setEffectParam,
    toggleBypass,
    removeEffect,
    duplicateEffect,
    copyEffectSettings,
    pasteEffectSettings,
    hasCopiedEffectSettings,
    toggleLockedEffect,
    isEffectLocked,
  } = useAudioEngineContext();
  const colors = PEDAL_COLORS[slot.type];
  const descriptors = getParamDescriptors(slot.type);
  const isActive = !slot.bypassed;
  const canPaste = hasCopiedEffectSettings(slot.type);
  const isLocked = isEffectLocked(slot.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slot.id,
    disabled: isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.wrapper} id={`pedal-${slot.id}`}>
      <div
        className={`${styles.pedal} ${isActive ? styles.active : styles.bypassed} ${isLocked ? styles.locked : ''}`}
        style={{ background: colors.bg }}
      >
        {/* Drag handle + title bar */}
        <div
          className={`${styles.titleBar} ${isLocked ? styles.titleBarLocked : ''}`}
          {...attributes}
          {...listeners}
        >
          <span className={styles.dragHandle} aria-hidden="true">
            {isLocked ? 'LOCK' : 'DRAG'}
          </span>
          <span className={styles.title} style={{ color: colors.text }}>
            {EFFECT_LABELS[slot.type]}
          </span>
          <div className={styles.actionGroup}>
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                toggleLockedEffect(slot.id);
              }}
              title={isLocked ? 'Unlock pedal position' : 'Lock pedal position'}
            >
              {isLocked ? 'U' : 'L'}
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                duplicateEffect(slot.id);
              }}
              title="Duplicate pedal"
            >
              D
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                copyEffectSettings(slot.id);
              }}
              title="Copy pedal settings"
            >
              C
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                void pasteEffectSettings(slot.id);
              }}
              title={canPaste ? 'Paste copied settings' : 'Copy settings from a matching pedal first'}
              disabled={!canPaste}
            >
              P
            </button>
            <button
              className={styles.removeBtn}
              onClick={(e) => {
                e.stopPropagation();
                removeEffect(slot.id);
              }}
              title="Remove"
            >
              x
            </button>
          </div>
        </div>

        {/* LED */}
        <div className={styles.ledContainer}>
          <LED active={isActive} color={colors.led} />
        </div>

        {/* Knobs */}
        <div className={styles.knobs}>
          {descriptors.map((desc) => (
            <Knob
              key={desc.name}
              descriptor={desc}
              value={slot.params[desc.name] ?? desc.default}
              onChange={(v) => setEffectParam(slot.id, desc.name, v)}
              color={colors.knob}
              size={descriptors.length > 4 ? 38 : 44}
              ariaLabel={`${EFFECT_LABELS[slot.type]} ${desc.label}`}
            />
          ))}
        </div>

        {/* Footswitch */}
        <div className={styles.switchContainer}>
          <FootSwitch active={isActive} onClick={() => toggleBypass(slot.id)} />
        </div>
      </div>
    </div>
  );
}
