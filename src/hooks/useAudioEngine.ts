import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import type { EffectType, EffectSlotState } from '../types/effects';
import type { PresetEffectSlot } from '../types/presets';
import { loadLastState, saveLastState } from '../audio/presets';
import type { LooperStatus } from '../audio/PostChainLooper';

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine>(new AudioEngine());
  const [isRunning, setIsRunning] = useState(false);
  const [chain, setChain] = useState<EffectSlotState[]>([]);
  const [masterVolume, setMasterVolumeState] = useState(1);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [contextState, setContextState] = useState<AudioContextState | null>(null);
  const [looperStatus, setLooperStatus] = useState<LooperStatus>('idle');
  const [looperDuration, setLooperDuration] = useState(0);
  const [metronomeBpm, setMetronomeBpmState] = useState(120);
  const [metronomeRunning, setMetronomeRunning] = useState(false);
  const [padsThroughChain, setPadsThroughChainState] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const syncChain = useCallback(() => {
    const state = engineRef.current.getChainState();
    setChain(state);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveLastState(
        state.map((s) => ({ type: s.type, bypassed: s.bypassed, params: s.params }))
      );
    }, 500);
  }, []);

  const syncLooper = useCallback(() => {
    setLooperStatus(engineRef.current.getLooperStatus());
    setLooperDuration(engineRef.current.getLooperDuration());
  }, []);

  useEffect(() => {
    const eng = engineRef.current;
    eng.setOnContextState((s) => setContextState(s));
    return () => eng.setOnContextState(undefined);
  }, []);

  const start = useCallback(
    async (deviceId?: string, presetChainOverride?: PresetEffectSlot[]) => {
      await engineRef.current.start(deviceId);
      setIsRunning(true);
      setContextState(engineRef.current.getContextState());

      if (presetChainOverride && presetChainOverride.length > 0) {
        engineRef.current.clearChain();
        for (const slot of presetChainOverride) {
          const effect = engineRef.current.addEffect(slot.type, slot.params);
          if (slot.bypassed) effect.setBypassed(true);
        }
        syncChain();
      } else {
        const lastState = loadLastState();
        if (lastState && lastState.length > 0) {
          for (const slot of lastState) {
            const effect = engineRef.current.addEffect(slot.type, slot.params);
            if (slot.bypassed) effect.setBypassed(true);
          }
          syncChain();
        }
      }

      engineRef.current.setPadsThroughChain(padsThroughChain);
      syncLooper();
      setMetronomeBpmState(engineRef.current.getMetronomeBpm());
      setMetronomeRunning(engineRef.current.isMetronomeRunning());
    },
    [syncChain, syncLooper, padsThroughChain]
  );

  const stop = useCallback(() => {
    engineRef.current.stop();
    setIsRunning(false);
    setChain([]);
    setContextState(null);
    setLooperStatus('idle');
    setLooperDuration(0);
    setMetronomeRunning(false);
  }, []);

  const resumeAudioContext = useCallback(async () => {
    await engineRef.current.resumeContext();
    setContextState(engineRef.current.getContextState());
  }, []);

  const addEffect = useCallback(
    (type: EffectType) => {
      engineRef.current.addEffect(type);
      syncChain();
    },
    [syncChain]
  );

  const removeEffect = useCallback(
    (id: string) => {
      engineRef.current.removeEffect(id);
      syncChain();
    },
    [syncChain]
  );

  const reorderEffects = useCallback(
    (fromIndex: number, toIndex: number) => {
      engineRef.current.reorderEffects(fromIndex, toIndex);
      syncChain();
    },
    [syncChain]
  );

  const setEffectParam = useCallback(
    (id: string, param: string, value: number) => {
      const effect = engineRef.current.getEffectById(id);
      if (effect) {
        effect.setParam(param, value);
        syncChain();
      }
    },
    [syncChain]
  );

  const toggleBypass = useCallback(
    (id: string) => {
      const effect = engineRef.current.getEffectById(id);
      if (effect) {
        effect.setBypassed(!effect.isBypassed());
        syncChain();
      }
    },
    [syncChain]
  );

  const setMasterVolume = useCallback((value: number) => {
    engineRef.current.setMasterVolume(value);
    setMasterVolumeState(value);
  }, []);

  const loadPresetChain = useCallback(
    (slots: PresetEffectSlot[]) => {
      engineRef.current.clearChain();
      for (const slot of slots) {
        const effect = engineRef.current.addEffect(slot.type, slot.params);
        if (slot.bypassed) effect.setBypassed(true);
      }
      syncChain();
    },
    [syncChain]
  );

  const switchInput = useCallback(async (deviceId: string) => {
    await engineRef.current.switchInput(deviceId);
  }, []);

  const switchOutput = useCallback(async (sinkId: string) => {
    await engineRef.current.setOutputDevice(sinkId);
  }, []);

  const looperStartRecord = useCallback(() => {
    engineRef.current.startLooperRecord();
    syncLooper();
  }, [syncLooper]);

  const looperStopRecord = useCallback(async () => {
    await engineRef.current.stopLooperRecord();
    syncLooper();
  }, [syncLooper]);

  const looperPlay = useCallback(() => {
    engineRef.current.looperPlay();
    syncLooper();
  }, [syncLooper]);

  const looperStop = useCallback(() => {
    engineRef.current.looperStop();
    syncLooper();
  }, [syncLooper]);

  const looperClear = useCallback(() => {
    engineRef.current.looperClear();
    syncLooper();
  }, [syncLooper]);

  const setLooperLevel = useCallback(
    (v: number) => {
      engineRef.current.setLooperLevel(v);
    },
    []
  );

  const metronomeStart = useCallback(() => {
    engineRef.current.metronomeStart();
    setMetronomeRunning(engineRef.current.isMetronomeRunning());
  }, []);

  const metronomeStop = useCallback(() => {
    engineRef.current.metronomeStop();
    setMetronomeRunning(false);
  }, []);

  const setMetronomeBpm = useCallback((bpm: number) => {
    engineRef.current.setMetronomeBpm(bpm);
    setMetronomeBpmState(engineRef.current.getMetronomeBpm());
  }, []);

  const applyTapTempoToEffects = useCallback(
    (bpm: number) => {
      engineRef.current.setMetronomeBpm(bpm);
      engineRef.current.applyBpmToTimeEffects(bpm);
      setMetronomeBpmState(engineRef.current.getMetronomeBpm());
      syncChain();
    },
    [syncChain]
  );

  const playDrumPad = useCallback((index: number, velocity?: number) => {
    engineRef.current.playDrumPad(index, velocity);
  }, []);

  const setPadsThroughChain = useCallback((through: boolean) => {
    engineRef.current.setPadsThroughChain(through);
    setPadsThroughChainState(through);
  }, []);

  const captureMicToPad = useCallback(async (padIndex: number) => {
    return engineRef.current.captureMicToPad(padIndex, 1000);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    let raf: number;
    const tick = () => {
      setInputLevel(engineRef.current.getInputLevel());
      setOutputLevel(engineRef.current.getOutputLevel());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isRunning]);

  return {
    isRunning,
    chain,
    masterVolume,
    inputLevel,
    outputLevel,
    contextState,
    looperStatus,
    looperDuration,
    metronomeBpm,
    metronomeRunning,
    padsThroughChain,
    start,
    stop,
    resumeAudioContext,
    addEffect,
    removeEffect,
    reorderEffects,
    setEffectParam,
    toggleBypass,
    setMasterVolume,
    loadPresetChain,
    switchInput,
    switchOutput,
    getChainState: () => engineRef.current.getChainState(),
    looperStartRecord,
    looperStopRecord,
    looperPlay,
    looperStop,
    looperClear,
    setLooperLevel,
    metronomeStart,
    metronomeStop,
    setMetronomeBpm,
    applyTapTempoToEffects,
    playDrumPad,
    setPadsThroughChain,
    captureMicToPad,
  };
}

export type AudioEngineAPI = ReturnType<typeof useAudioEngine>;
