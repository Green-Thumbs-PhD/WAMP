import { useAudioEngine } from './hooks/useAudioEngine';
import { AudioEngineContext } from './context/AudioEngineContext';
import { Header } from './components/Header/Header';
import { Pedalboard } from './components/Pedalboard/Pedalboard';
import { ResumeAudioBanner } from './components/ResumeAudioBanner/ResumeAudioBanner';
import { LooperPanel } from './components/LooperPanel/LooperPanel';
import { MetronomeBar } from './components/MetronomeBar/MetronomeBar';
import { DrumPads } from './components/DrumPads/DrumPads';
import './App.css';

function App() {
  const engine = useAudioEngine();

  return (
    <AudioEngineContext.Provider value={engine}>
      <div className="app">
        <ResumeAudioBanner />
        <p className="app-hint">
          Effects run left to right. Presets save the whole chain. Space starts or stops audio (when not typing in a field).
        </p>
        <Header />
        <div className="tool-dock">
          <LooperPanel />
          <MetronomeBar />
          <DrumPads />
        </div>
        <div className="pedal-area">
          <Pedalboard />
        </div>
      </div>
    </AudioEngineContext.Provider>
  );
}

export default App;
