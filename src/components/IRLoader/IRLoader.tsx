import { useRef, useState, type ChangeEvent } from 'react';
import styles from './IRLoader.module.css';
import { useAudioEngineContext } from '../../context/AudioEngineContext';

export function IRLoader() {
  const {
    isRunning,
    cabinetIrLibrary,
    cabinetIrLibraryBusy,
    cabinetIrActiveId,
    cabinetIrName,
    cabinetIrEnabled,
    cabinetIrMix,
    loadCabinetIr,
    selectCabinetIr,
    renameCabinetIrEntry,
    deleteCabinetIrEntry,
    clearCabinetIr,
    setCabinetIrEnabled,
    setCabinetIrMix,
  } = useAudioEngineContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState('Import a WAV or other browser-decodable file to build your cab library.');

  const hasIr = Boolean(cabinetIrName);

  const handlePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ok = await loadCabinetIr(file);
    setStatus(ok ? `Imported ${file.name} into the IR library.` : 'Unable to decode that IR file.');
    event.target.value = '';
  };

  return (
    <section className={styles.panel} aria-label="Cabinet impulse response manager">
      <h2 className={styles.title}>Cab IR Manager</h2>
      <p className={styles.meta}>Import, relabel, and reuse cabinet impulse responses across sessions and presets.</p>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => inputRef.current?.click()}
          disabled={cabinetIrLibraryBusy}
        >
          Import IR
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => setCabinetIrEnabled(!cabinetIrEnabled)}
          disabled={!isRunning || !hasIr}
        >
          {cabinetIrEnabled ? 'Bypass IR' : 'Enable IR'}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.clearBtn}`}
          onClick={clearCabinetIr}
          disabled={!hasIr}
        >
          Clear active
        </button>
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          accept=".wav,.mp3,.ogg,.aiff,.aif,.flac,audio/*"
          onChange={(e) => void handlePick(e)}
        />
      </div>
      <div className={styles.library}>
        <div className={styles.libraryHeader}>
          <span>Library</span>
          <span>{cabinetIrLibrary.length} saved</span>
        </div>
        {cabinetIrLibrary.length === 0 ? (
          <div className={styles.emptyState}>No IRs saved yet. Import one to reuse it later.</div>
        ) : (
          <div className={styles.libraryList}>
            {cabinetIrLibrary.map((entry) => {
              const isActive = entry.id === cabinetIrActiveId;
              return (
                <div key={entry.id} className={`${styles.libraryItem} ${isActive ? styles.libraryItemActive : ''}`}>
                  <div className={styles.libraryMeta}>
                    <strong>{entry.name}</strong>
                    <span>{entry.fileName} · {(entry.sizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className={styles.libraryActions}>
                    <button
                      type="button"
                      className={styles.listBtn}
                      onClick={() => void selectCabinetIr(entry.id)}
                      disabled={cabinetIrLibraryBusy}
                    >
                      {isRunning ? (isActive ? 'Loaded' : 'Load') : (isActive ? 'Queued' : 'Queue')}
                    </button>
                    <button
                      type="button"
                      className={styles.listBtn}
                      onClick={() => {
                        const nextName = window.prompt('Rename IR', entry.name);
                        if (nextName && nextName.trim()) void renameCabinetIrEntry(entry.id, nextName);
                      }}
                      disabled={cabinetIrLibraryBusy}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={`${styles.listBtn} ${styles.deleteBtn}`}
                      onClick={() => void deleteCabinetIrEntry(entry.id)}
                      disabled={cabinetIrLibraryBusy}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <label className={styles.mixRow}>
        Cab Blend
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(cabinetIrMix * 100)}
          onChange={(e) => setCabinetIrMix(Number(e.target.value) / 100)}
          disabled={!hasIr}
        />
        <span>{Math.round(cabinetIrMix * 100)}%</span>
      </label>
      <div className={styles.statusRow}>
        <span className={styles.statusLed} data-active={cabinetIrEnabled && hasIr} />
        <span>{hasIr ? `${cabinetIrName}${isRunning ? '' : ' queued for next start'}` : status}</span>
      </div>
    </section>
  );
}
