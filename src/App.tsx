import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { usePresets } from './hooks/usePresets';
import { AudioEngineContext } from './context/AudioEngineContext';
import { Header } from './components/Header/Header';
import { Pedalboard } from './components/Pedalboard/Pedalboard';
import { CPUMonitor } from './components/CPUMonitor/CPUMonitor';
import { ResumeAudioBanner } from './components/ResumeAudioBanner/ResumeAudioBanner';
import { PresetManager } from './components/PresetManager/PresetManager';
import { isRackToolEnabled } from './config/features';
import { RACK_TOOL_REGISTRY } from './rackToolRegistry';
import { APP_THEME_REGISTRY } from './themeRegistry';
import { loadAppTheme, saveAppTheme } from './storage/themeStorage';
import { loadPerformanceSettings, savePerformanceSettings } from './storage/appStorage';
import type { PerformanceSettings, SceneEntry } from './types/performance';
import type { Preset, RigSnapshot } from './types/presets';
import './App.css';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeRackToolOrder(savedOrder: string[], enabledToolIds: string[]): string[] {
  const ordered = savedOrder.filter((toolId) => enabledToolIds.includes(toolId));
  const missing = enabledToolIds.filter((toolId) => !ordered.includes(toolId));
  return [...ordered, ...missing];
}

function moveRackTool(toolIds: string[], draggedId: string, targetId: string): string[] {
  if (draggedId === targetId) return toolIds;

  const next = [...toolIds];
  const fromIndex = next.indexOf(draggedId);
  const toIndex = next.indexOf(targetId);

  if (fromIndex === -1 || toIndex === -1) return toolIds;

  const [dragged] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, dragged);
  return next;
}

function App() {
  const engine = useAudioEngine();
  const {
    presets,
    activePresetId,
    recentPresets,
    scenes,
    activeScene,
    savePreset,
    deletePreset,
    renamePreset,
    updatePresetDetails,
    exportPresetBundle,
    importPresetBundle,
    toggleFavorite,
    selectPreset,
    getPreset,
    addSceneFromPreset,
    updateScene,
    removeScene,
    moveScene,
    selectScene,
    getAdjacentScene,
  } = usePresets();
  const [themeId, setThemeId] = useState(loadAppTheme);
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>(loadPerformanceSettings);
  const pendingInputIdRef = useRef<string | undefined>(undefined);
  const pendingOutputIdRef = useRef('');
  const pendingPresetRef = useRef<Preset | undefined>(undefined);
  const [compareSlots, setCompareSlots] = useState<{
    A: RigSnapshot | null;
    B: RigSnapshot | null;
    active: 'A' | 'B' | null;
  }>({ A: null, B: null, active: null });
  const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
  useEffect(() => {
    saveAppTheme(themeId);
  }, [themeId]);

  useEffect(() => {
    savePerformanceSettings(performanceSettings);
  }, [performanceSettings]);

  const enabledRackTools = RACK_TOOL_REGISTRY.filter((tool) => isRackToolEnabled(tool.featureFlag));
  const enabledRackToolIds = enabledRackTools.map((tool) => tool.id);
  const orderedRackToolIds = normalizeRackToolOrder(performanceSettings.rackToolOrder, enabledRackToolIds);
  const orderedRackTools = orderedRackToolIds
    .map((toolId) => enabledRackTools.find((tool) => tool.id === toolId))
    .filter((tool): tool is (typeof enabledRackTools)[number] => Boolean(tool));
  const minimizedRackToolIds = performanceSettings.minimizedRackToolIds.filter((toolId) => enabledRackToolIds.includes(toolId));

  const loadSnapshotWithPerformance = useCallback(async (
    snapshot: RigSnapshot,
    options?: { presetId?: string; sceneId?: string | null }
  ) => {
    const shouldTailWait = performanceSettings.spilloverStrategy === 'tail-safe' && engine.isRunning && !engine.muted;
    if (shouldTailWait) {
      const start = performance.now();
      while (engine.outputLevel > 0.03 && performance.now() - start < 800) {
        // Let delay/reverb tails decay before the swap when requested.
        // eslint-disable-next-line no-await-in-loop
        await delay(45);
      }
    }

    const shouldMute = performanceSettings.muteOnPresetLoad && !engine.muted;
    if (shouldMute) {
      engine.setMuted(true);
      await delay(70);
    }

    await engine.loadRigSnapshot(snapshot);

    if (options?.sceneId !== undefined) {
      selectScene(options.sceneId);
    } else if (options?.presetId) {
      selectPreset(options.presetId);
    }

    if (shouldMute) {
      await delay(90);
      engine.setMuted(false);
    }
  }, [engine, performanceSettings.muteOnPresetLoad, performanceSettings.spilloverStrategy, selectPreset, selectScene]);

  const handleInputSelect = useCallback(
    (deviceId: string) => {
      if (!deviceId) return;
      pendingInputIdRef.current = deviceId;
      if (engine.isRunning) void engine.switchInput(deviceId);
    },
    [engine]
  );

  const handleOutputSelect = useCallback(
    (sinkId: string) => {
      pendingOutputIdRef.current = sinkId;
      if (engine.isRunning && sinkId) void engine.switchOutput(sinkId);
    },
    [engine]
  );

  const runStart = useCallback(async () => {
    await engine.start(pendingInputIdRef.current, pendingPresetRef.current);
    pendingPresetRef.current = undefined;
    const out = pendingOutputIdRef.current;
    if (out) await engine.switchOutput(out);
  }, [engine]);

  const handleLoadPreset = useCallback(
    (preset: Preset) => {
      if (!engine.isRunning) {
        selectPreset(preset.id);
        pendingPresetRef.current = preset;
        return;
      }
      void loadSnapshotWithPerformance(preset, { presetId: preset.id });
    },
    [engine.isRunning, loadSnapshotWithPerformance, selectPreset]
  );

  const handleIdlePresetPick = useCallback(
    (preset: Preset) => {
      selectPreset(preset.id);
      pendingPresetRef.current = preset;
    },
    [selectPreset]
  );

  const handleSavePreset = useCallback(
    (
      name: string,
      details?: { category?: string; tags?: string[]; description?: string; notes?: string }
    ) => {
      savePreset(name, engine.getChainState(), engine.getRackState(), details);
    },
    [engine, savePreset]
  );

  const captureSnapshot = useCallback((): RigSnapshot => ({
    chain: engine.getChainState().map((slot) => ({
      type: slot.type,
      bypassed: slot.bypassed,
      params: slot.params,
    })),
    rack: engine.getRackState(),
  }), [engine]);

  const handleCaptureCompare = useCallback((slot: 'A' | 'B') => {
    setCompareSlots((current) => ({
      ...current,
      [slot]: captureSnapshot(),
      active: current.active ?? slot,
    }));
  }, [captureSnapshot]);

  const handleRecallCompare = useCallback((slot: 'A' | 'B') => {
    setCompareSlots((current) => {
      const snapshot = current[slot];
      if (!snapshot || !engine.isRunning) return current;
      void loadSnapshotWithPerformance(snapshot);
      return { ...current, active: slot };
    });
  }, [engine.isRunning, loadSnapshotWithPerformance]);

  const handleRecallScene = useCallback((scene: SceneEntry) => {
    const preset = getPreset(scene.presetId);
    if (!preset) return;
    if (!engine.isRunning) {
      selectScene(scene.id);
      pendingPresetRef.current = preset;
      return;
    }
    void loadSnapshotWithPerformance(preset, { presetId: preset.id, sceneId: scene.id });
  }, [engine.isRunning, getPreset, loadSnapshotWithPerformance, selectScene]);

  const handleStepScene = useCallback((direction: -1 | 1) => {
    const nextScene = getAdjacentScene(direction);
    if (!nextScene) return;
    handleRecallScene(nextScene);
  }, [getAdjacentScene, handleRecallScene]);

  const updateRackToolOrder = useCallback((nextOrder: string[]) => {
    setPerformanceSettings((current) => ({ ...current, rackToolOrder: nextOrder }));
  }, []);

  const handleRackToolDrop = useCallback((targetToolId: string) => {
    if (!draggedToolId) return;
    updateRackToolOrder(moveRackTool(orderedRackToolIds, draggedToolId, targetToolId));
    setDraggedToolId(null);
  }, [draggedToolId, orderedRackToolIds, updateRackToolOrder]);

  const handleToggleRackToolMinimized = useCallback((toolId: string) => {
    setPerformanceSettings((current) => {
      const isMinimized = current.minimizedRackToolIds.includes(toolId);
      return {
        ...current,
        minimizedRackToolIds: isMinimized
          ? current.minimizedRackToolIds.filter((id) => id !== toolId)
          : [...current.minimizedRackToolIds, toolId],
      };
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!performanceSettings.liveMode) return;
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.code === 'BracketLeft') {
        event.preventDefault();
        handleStepScene(-1);
      }
      if (event.code === 'BracketRight') {
        event.preventDefault();
        handleStepScene(1);
      }
      if (event.code === 'Backslash') {
        event.preventDefault();
        engine.setMuted(!engine.muted);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [engine, handleStepScene, performanceSettings.liveMode]);

  return (
    <AudioEngineContext.Provider value={engine}>
      <div
        className="app"
        data-theme={themeId}
        data-live-mode={performanceSettings.liveMode ? 'true' : 'false'}
      >
        <ResumeAudioBanner />
        <CPUMonitor />
        <main className="studio">
          <section className="theme-strip" aria-label="Theme presets">
            <div className="theme-strip-header">
              <h2 className="theme-strip-title">Choose the room you want to play in</h2>
            </div>
            <div className="theme-grid">
              {APP_THEME_REGISTRY.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-card ${theme.id === themeId ? 'theme-card-active' : ''}`}
                  aria-pressed={theme.id === themeId}
                  onClick={() => setThemeId(theme.id)}
                  style={{
                    '--theme-preview-a': theme.preview[0],
                    '--theme-preview-b': theme.preview[1],
                    '--theme-preview-c': theme.preview[2],
                  } as CSSProperties}
                >
                  <span className="theme-card-swatch" aria-hidden="true" />
                  <span className="theme-card-name">{theme.name}</span>
                  <span className="theme-card-description">{theme.description}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="rack-shell" aria-label="Stereo rack amplifier system">
            <div className="rack-rail rack-rail-left" aria-hidden="true" />
            <div className="rack-body">
              <Header
                onStart={runStart}
                onInputSelect={handleInputSelect}
                onOutputSelect={handleOutputSelect}
                compareSlots={compareSlots}
                onCaptureCompare={handleCaptureCompare}
                onRecallCompare={handleRecallCompare}
              />
              {performanceSettings.liveMode && activeScene ? (
                <section className="live-cue-banner" aria-label="Current live cue">
                  <div>
                    <p className="live-cue-kicker">Current Song</p>
                    <h2 className="live-cue-title">{activeScene.songTitle || getPreset(activeScene.presetId)?.name || 'Untitled scene'}</h2>
                  </div>
                  <p className="live-cue-copy">{activeScene.cue || 'Add a cue to this scene for a performance reminder.'}</p>
                </section>
              ) : null}
              <div className="tool-dock">
                {orderedRackTools.map((tool) => {
                  const ToolComponent = tool.component;
                  const isMinimized = minimizedRackToolIds.includes(tool.id);
                  const isDragging = draggedToolId === tool.id;

                  return (
                    <div
                      key={tool.id}
                      className={`rack-slot ${isMinimized ? 'rack-slot-minimized' : ''} ${isDragging ? 'rack-slot-dragging' : ''}`}
                      data-tool-id={tool.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggedToolId(tool.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', tool.id);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleRackToolDrop(tool.id);
                      }}
                      onDragEnd={() => setDraggedToolId(null)}
                    >
                      <span className="rack-slot-label">{tool.label}</span>
                      <button
                        type="button"
                        className="rack-slot-minimize"
                        onClick={() => handleToggleRackToolMinimized(tool.id)}
                        aria-pressed={isMinimized}
                      >
                        minimize
                      </button>
                      {!isMinimized ? (
                        <div className="rack-slot-content">
                          <ToolComponent />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rack-rail rack-rail-right" aria-hidden="true" />
          </section>
          <div className="pedal-area">
            <Pedalboard
              controlPanel={(
                <PresetManager
                  presets={presets}
                  activePresetId={activePresetId}
                  recentPresets={recentPresets}
                  scenes={scenes}
                  activeSceneId={activeScene?.id ?? null}
                  liveMode={performanceSettings.liveMode}
                  muteOnPresetLoad={performanceSettings.muteOnPresetLoad}
                  spilloverStrategy={performanceSettings.spilloverStrategy}
                  muted={engine.muted}
                  onLoad={handleLoadPreset}
                  onSave={handleSavePreset}
                  onDelete={deletePreset}
                  onRename={renamePreset}
                  onUpdateDetails={updatePresetDetails}
                  onToggleFavorite={toggleFavorite}
                  onExportBundle={exportPresetBundle}
                  onImportBundle={importPresetBundle}
                  onAddSceneFromPreset={addSceneFromPreset}
                  onRecallScene={handleRecallScene}
                  onUpdateScene={updateScene}
                  onRemoveScene={removeScene}
                  onMoveScene={moveScene}
                  onStepScene={handleStepScene}
                  onToggleLiveMode={() => setPerformanceSettings((current) => ({ ...current, liveMode: !current.liveMode }))}
                  onToggleMuteOnPresetLoad={() => setPerformanceSettings((current) => ({ ...current, muteOnPresetLoad: !current.muteOnPresetLoad }))}
                  onSetSpilloverStrategy={(spilloverStrategy) => setPerformanceSettings((current) => ({ ...current, spilloverStrategy }))}
                  onPanicMute={() => engine.setMuted(!engine.muted)}
                  isEngineRunning={engine.isRunning}
                  onIdlePresetPick={handleIdlePresetPick}
                />
              )}
            />
          </div>
        </main>
      </div>
    </AudioEngineContext.Provider>
  );
}

export default App;
