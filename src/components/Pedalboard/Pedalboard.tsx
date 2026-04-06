import { useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import styles from './Pedalboard.module.css';
import { Pedal } from '../Pedal/Pedal';
import { AddPedal } from '../AddPedal/AddPedal';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

interface PedalboardProps {
  controlPanel?: ReactNode;
}

export function Pedalboard({ controlPanel }: PedalboardProps) {
  const { chain, reorderEffects, lockedPedalIds } = useAudioEngineContext();
  const lockedSet = useMemo(() => new Set(lockedPedalIds), [lockedPedalIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = chain.findIndex((s) => s.id === active.id);
    const toIndex = chain.findIndex((s) => s.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderEffects(fromIndex, toIndex);
    }
  };

  return (
    <div className={styles.board}>
      <div className={styles.caseHeader}>
        <div className={styles.caseBadge} aria-hidden="true">Pedalboard Flight Case</div>
        {controlPanel && <div className={styles.controlPanel}>{controlPanel}</div>}
      </div>
      {chain.length > 0 ? (
        <div className={styles.miniMap}>
          <div className={styles.miniMapHeader}>
            <span className={styles.miniMapTitle}>Signal overview</span>
            <span className={styles.miniMapHint}>Click any block to jump to that pedal.</span>
          </div>
          <div className={styles.miniMapRow}>
            {chain.map((slot, index) => (
              <button
                key={slot.id}
                type="button"
                className={`${styles.miniMapItem} ${lockedSet.has(slot.id) ? styles.miniMapItemLocked : ''} ${slot.bypassed ? styles.miniMapItemBypassed : ''}`}
                onClick={() => document.getElementById(`pedal-${slot.id}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })}
                title={`${index + 1}. ${slot.type}${lockedSet.has(slot.id) ? ' (locked)' : ''}`}
              >
                <span className={styles.miniMapIndex}>{index + 1}</span>
                <span className={styles.miniMapLabel}>{slot.type}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className={styles.tipBar}>
        {chain.length === 0 ? (
          <>
            <span className={styles.tipChip}>Start with `Noise Gate` or `Boost / Pre` for fast tone building.</span>
            <span className={styles.tipChip}>Use the `+` pedal to build a chain, then drag pedals left to right.</span>
            <span className={styles.tipChip}>Space starts audio. `M` toggles the metronome. `T` taps tempo.</span>
          </>
        ) : (
          <>
            <span className={styles.tipChip}>Drag from the pedal handle label to reorder unlocked pedals.</span>
            <span className={styles.tipChip}>Use `L` to lock a pedal, `D` to duplicate, `C` to copy, and `P` to paste.</span>
            <span className={styles.tipChip}>Locked pedals keep their position while other pedals move around them.</span>
          </>
        )}
      </div>
      <div className={styles.deck}>
        <div className={styles.chain}>
          {chain.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyCard}>
                <h3 className={styles.emptyTitle}>Build your first signal chain</h3>
                <p className={styles.emptyCopy}>
                  Start with a front-end shape pedal, add modulation or space, then finish with level control.
                </p>
                <div className={styles.emptyActions}>
                  <span className={styles.emptyAction}>Noise Gate for cleanup</span>
                  <span className={styles.emptyAction}>Boost / Pre for gain staging</span>
                  <span className={styles.emptyAction}>Delay or Reverb for depth</span>
                </div>
              </div>
            </div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={chain.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
              {chain.map((slot) => (
                <Pedal key={slot.id} slot={slot} />
              ))}
            </SortableContext>
          </DndContext>
          <AddPedal />
        </div>
      </div>
    </div>
  );
}
