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
import { APP_THEME_REGISTRY, getAppThemeDefinition } from './themeRegistry';
import { loadAppTheme, saveAppTheme } from './storage/themeStorage';
import type { Preset, RigSnapshot } from './types/presets';
import './App.css';

function App() {
  const engine = useAudioEngine();
  const { presets, activePresetId, savePreset, deletePreset, toggleFavorite, selectPreset } = usePresets();
  const [themeId, setThemeId] = useState(loadAppTheme);
  const pendingInputIdRef = useRef<string | undefined>(undefined);
  const pendingOutputIdRef = useRef('');
  const pendingPresetRef = useRef<Preset | undefined>(undefined);
  const [compareSlots, setCompareSlots] = useState<{
    A: RigSnapshot | null;
    B: RigSnapshot | null;
    active: 'A' | 'B' | null;
  }>({ A: null, B: null, active: null });
  const activeTheme = getAppThemeDefinition(themeId);

  useEffect(() => {
    saveAppTheme(themeId);
  }, [themeId]);

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
      selectPreset(preset.id);
      void engine.loadRigSnapshot(preset);
    },
    [engine, selectPreset]
  );

  const handleIdlePresetPick = useCallback(
    (preset: Preset) => {
      selectPreset(preset.id);
      pendingPresetRef.current = preset;
    },
    [selectPreset]
  );

  const handleSavePreset = useCallback(
    (name: string, details?: { category?: string; tags?: string[] }) => {
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
      void engine.loadRigSnapshot(snapshot);
      return { ...current, active: slot };
    });
  }, [engine]);

  return (
    <AudioEngineContext.Provider value={engine}>
      <div className="app" data-theme={themeId}>
        <ResumeAudioBanner />
        <CPUMonitor />
        <main className="studio">
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
              <p className="app-hint">
                <span className="app-hint-theme">{activeTheme.name}</span>
                Effects run left to right. Presets save the whole chain. Space starts or stops audio when you are not typing in a field.
              </p>
              <div className="rack-badge-row" aria-hidden="true">
                {activeTheme.badges.map((badge) => (
                  <span key={badge} className="rack-badge">{badge}</span>
                ))}
              </div>
              <section className="theme-strip" aria-label="Theme presets">
                <div className="theme-strip-header">
                  <div>
                    <p className="theme-strip-kicker">Theme Presets</p>
                    <h2 className="theme-strip-title">Choose the room you want to play in</h2>
                  </div>
                  <p className="theme-strip-copy">
                    Four distinct studio looks are ready to swap live, including the original default now labeled The Stack.
                  </p>
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
              <div className="tool-dock">
                {RACK_TOOL_REGISTRY.filter((tool) => isRackToolEnabled(tool.featureFlag)).map((tool) => {
                  const ToolComponent = tool.component;

                  return (
                    <div key={tool.id} className="rack-slot" data-tool-id={tool.id}>
                      <ToolComponent />
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
                  onLoad={handleLoadPreset}
                onSave={handleSavePreset}
                onDelete={deletePreset}
                onToggleFavorite={toggleFavorite}
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
