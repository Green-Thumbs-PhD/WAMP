import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine, type OutputRecordingFormat } from '../audio/AudioEngine';
import type { EffectType, EffectSlotState } from '../types/effects';
import type { PresetEffectSlot, RigSnapshot } from '../types/presets';
import type { RackState } from '../types/rack';
import { normalizeRackState } from '../types/rack';
import { loadLastSession, saveLastSession } from '../storage/appStorage';
import type { BackingTrackState } from '../audio/BackingTrackPlayer';
import type { LooperState, LooperStatus } from '../audio/PostChainLooper';
import type { CabinetIrSummary } from '../types/cabinetIr';
import type { TunerSnapshot } from '../types/tuner';
import type { DrumKitPresetId } from '../audio/DrumKit';
import {
  deleteCabinetIr,
  getCabinetIr,
  listCabinetIrs,
  renameCabinetIr,
  saveCabinetIr,
} from '../storage/cabinetIrStorage';

function toPresetSlots(chain: EffectSlotState[]): PresetEffectSlot[] {
  return chain.map((slot) => ({
    type: slot.type,
    bypassed: slot.bypassed,
    params: slot.params,
  }));
}

export function useAudioEngine() {
  const initialSessionRef = useRef<RigSnapshot | null>(loadLastSession());
  const engineRef = useRef<AudioEngine>(new AudioEngine());
  const sessionChainRef = useRef<PresetEffectSlot[]>(initialSessionRef.current?.chain ?? []);
  const sessionRackRef = useRef<RackState>(normalizeRackState(initialSessionRef.current?.rack));
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const copiedPedalRef = useRef<PresetEffectSlot | null>(null);
  const stabilizedFrequencyRef = useRef<number | null>(null);
  const recentNotesRef = useRef<string[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [chain, setChain] = useState<EffectSlotState[]>([]);
  const [lockedPedalIds, setLockedPedalIds] = useState<string[]>([]);
  const [masterVolume, setMasterVolumeState] = useState(sessionRackRef.current.masterVolume);
  const [inputTrim, setInputTrimState] = useState(sessionRackRef.current.inputTrim);
  const [monoInputToStereo, setMonoInputToStereoState] = useState(sessionRackRef.current.monoInputToStereo);
  const [inputMuted, setInputMutedState] = useState(sessionRackRef.current.inputMuted);
  const [muted, setMutedState] = useState(sessionRackRef.current.muted);
  const [ampChannel, setAmpChannelState] = useState(sessionRackRef.current.ampChannel);
  const [ampPresence, setAmpPresenceState] = useState(sessionRackRef.current.ampPresence);
  const [ampLevel, setAmpLevelState] = useState(sessionRackRef.current.ampLevel);
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [outputPeak, setOutputPeak] = useState(0);
  const [tuner, setTuner] = useState<TunerSnapshot>({
    frequency: null,
    stabilizedFrequency: null,
    clarity: 0,
    signal: 0,
    recentNotes: [],
  });
  const [contextState, setContextState] = useState<AudioContextState | null>(null);
  const [looperStatus, setLooperStatus] = useState<LooperStatus>('idle');
  const [looperDuration, setLooperDuration] = useState(0);
  const [looperState, setLooperState] = useState<LooperState>({
    status: 'idle',
    sourceDuration: 0,
    trimmedDuration: 0,
    trimStart: 0,
    trimEnd: 0,
    currentTime: 0,
    level: 0.85,
    recordLength: 8,
    peaks: [],
  });
  const [backingTrackState, setBackingTrackState] = useState<BackingTrackState>({
    name: '',
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    volume: 0.8,
    sectionStart: 0,
    sectionEnd: 0,
    sectionLoopEnabled: false,
    playbackRate: 1,
    peaks: [],
  });
  const [metronomeBpm, setMetronomeBpmState] = useState(sessionRackRef.current.metronomeBpm);
  const [metronomeRunning, setMetronomeRunning] = useState(sessionRackRef.current.metronomeRunning);
  const [padsThroughChain, setPadsThroughChainState] = useState(sessionRackRef.current.padsThroughChain);
  const [globalNoiseGateEnabled, setGlobalNoiseGateEnabledState] = useState(sessionRackRef.current.globalNoiseGateEnabled);
  const [globalNoiseGateThreshold, setGlobalNoiseGateThresholdState] = useState(sessionRackRef.current.globalNoiseGateThreshold);
  const [globalNoiseGateRelease, setGlobalNoiseGateReleaseState] = useState(sessionRackRef.current.globalNoiseGateRelease);
  const [globalNoiseGateReduction, setGlobalNoiseGateReductionState] = useState(sessionRackRef.current.globalNoiseGateReduction);
  const [cabinetIrLibrary, setCabinetIrLibrary] = useState<CabinetIrSummary[]>([]);
  const [cabinetIrLibraryBusy, setCabinetIrLibraryBusy] = useState(false);
  const [cabinetIrActiveId, setCabinetIrActiveId] = useState(sessionRackRef.current.cabinetIrId);
  const [cabinetIrName, setCabinetIrName] = useState(sessionRackRef.current.cabinetIrName);
  const [cabinetIrEnabled, setCabinetIrEnabledState] = useState(sessionRackRef.current.cabinetIrEnabled);
  const [cabinetIrMix, setCabinetIrMixState] = useState(sessionRackRef.current.cabinetIrMix);
  const [outputRecorderActive, setOutputRecorderActive] = useState(false);
  const [outputRecorderDuration, setOutputRecorderDuration] = useState(0);
  const [lastRecordingUrl, setLastRecordingUrl] = useState('');
  const [lastRecordingName, setLastRecordingName] = useState('');
  const [lastRecordingBlob, setLastRecordingBlob] = useState<Blob | null>(null);
  const [lastRecordingDuration, setLastRecordingDuration] = useState(0);
  const [performanceSnapshot, setPerformanceSnapshot] = useState({
    baseLatencyMs: 0,
    outputLatencyMs: 0,
    sampleRate: 0,
    activeNodes: 0,
    averageFrameMs: 0,
    estimatedCpuLoad: 0,
  });
  const outputRecordingStartedAtRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const averageFrameMsRef = useRef(0);

  const updateTunerSnapshot = useCallback((frequency: number | null, clarity: number, signal: number) => {
    const previous = stabilizedFrequencyRef.current;
    let stabilized = previous;

    if (!frequency) {
      stabilized = previous && clarity > 0.12 ? previous : null;
    } else if (!previous) {
      stabilized = frequency;
    } else {
      const blend = Math.abs(frequency - previous) < previous * 0.06 ? 0.2 : 0.5;
      stabilized = previous + (frequency - previous) * blend;
    }

    stabilizedFrequencyRef.current = stabilized;

    if (stabilized && clarity > 0.5) {
      const midi = Math.round(69 + 12 * Math.log2(stabilized / 440));
      const note = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][((midi % 12) + 12) % 12] ?? '--';
      recentNotesRef.current = [note, ...recentNotesRef.current.filter((entry) => entry !== note)].slice(0, 4);
    }

    setTuner({
      frequency,
      stabilizedFrequency: stabilized,
      clarity,
      signal,
      recentNotes: recentNotesRef.current,
    });
  }, []);

  const queueSessionSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveLastSession({
        chain: sessionChainRef.current,
        rack: sessionRackRef.current,
      });
    }, 300);
  }, []);

  const updateSessionRack = useCallback((partial: Partial<RackState>) => {
    sessionRackRef.current = {
      ...sessionRackRef.current,
      ...partial,
    };
    queueSessionSave();
  }, [queueSessionSave]);

  const syncChain = useCallback(() => {
    const state = engineRef.current.getChainState();
    setChain(state);
    setLockedPedalIds((current) => current.filter((id) => state.some((slot) => slot.id === id)));
    sessionChainRef.current = toPresetSlots(state);
    queueSessionSave();
  }, [queueSessionSave]);

  const syncLooper = useCallback(() => {
    const nextLooperState = engineRef.current.getLooperState();
    setLooperState(nextLooperState);
    setLooperStatus(nextLooperState.status);
    setLooperDuration(nextLooperState.trimmedDuration);
  }, []);

  const syncBackingTrack = useCallback(() => {
    setBackingTrackState(engineRef.current.getBackingTrackState());
  }, []);

  const getRackState = useCallback((): RackState => {
    return normalizeRackState(sessionRackRef.current);
  }, []);

  const refreshCabinetIrLibrary = useCallback(async () => {
    setCabinetIrLibrary(await listCabinetIrs());
  }, []);

  const clearCabinetIrSelection = useCallback((enabled = false) => {
    engineRef.current.clearCabinetIr();
    setCabinetIrActiveId('');
    setCabinetIrName('');
    setCabinetIrEnabledState(enabled ? engineRef.current.isCabinetIrEnabled() : false);
    updateSessionRack({
      cabinetIrId: '',
      cabinetIrName: '',
      cabinetIrEnabled: enabled ? engineRef.current.isCabinetIrEnabled() : false,
    });
  }, [updateSessionRack]);

  const restoreCabinetIrSelection = useCallback(async (id: string, enabled = true) => {
    const record = await getCabinetIr(id);
    if (!record) {
      clearCabinetIrSelection(false);
      await refreshCabinetIrLibrary();
      return null;
    }

    if (engineRef.current.isRunning()) {
      const loaded = await engineRef.current.loadCabinetIrBuffer(record.data, record.name);
      if (!loaded) return null;
      engineRef.current.setCabinetIrEnabled(enabled);
    }

    setCabinetIrActiveId(record.id);
    setCabinetIrName(record.name);
    setCabinetIrEnabledState(engineRef.current.isRunning() ? engineRef.current.isCabinetIrEnabled() : enabled);
    updateSessionRack({
      cabinetIrId: record.id,
      cabinetIrName: record.name,
      cabinetIrEnabled: engineRef.current.isRunning() ? engineRef.current.isCabinetIrEnabled() : enabled,
    });

    return record;
  }, [clearCabinetIrSelection, refreshCabinetIrLibrary, updateSessionRack]);

  const applyRackState = useCallback((rack?: Partial<RackState>) => {
    const nextRack = normalizeRackState(rack);

    engineRef.current.setMasterVolume(nextRack.masterVolume);
    engineRef.current.setInputTrim(nextRack.inputTrim);
    engineRef.current.setMonoInputToStereo(nextRack.monoInputToStereo);
    engineRef.current.setInputMuted(nextRack.inputMuted);
    engineRef.current.setMuted(nextRack.muted);
    engineRef.current.setAmpChannel(nextRack.ampChannel);
    engineRef.current.setAmpPresence(nextRack.ampPresence);
    engineRef.current.setAmpLevel(nextRack.ampLevel);
    engineRef.current.setMetronomeBpm(nextRack.metronomeBpm);
    engineRef.current.setPadsThroughChain(nextRack.padsThroughChain);
    engineRef.current.setGlobalNoiseGateEnabled(nextRack.globalNoiseGateEnabled);
    engineRef.current.setGlobalNoiseGateThreshold(nextRack.globalNoiseGateThreshold);
    engineRef.current.setGlobalNoiseGateRelease(nextRack.globalNoiseGateRelease);
    engineRef.current.setGlobalNoiseGateReduction(nextRack.globalNoiseGateReduction);
    engineRef.current.setCabinetIrMix(nextRack.cabinetIrMix);
    engineRef.current.setCabinetIrEnabled(nextRack.cabinetIrEnabled && engineRef.current.hasCabinetIr());

    if (nextRack.metronomeRunning) engineRef.current.metronomeStart();
    else engineRef.current.metronomeStop();

    setMasterVolumeState(nextRack.masterVolume);
    setInputTrimState(nextRack.inputTrim);
    setMonoInputToStereoState(engineRef.current.isMonoInputToStereo());
    setInputMutedState(engineRef.current.isInputMuted());
    setMutedState(nextRack.muted);
    setAmpChannelState(engineRef.current.getAmpChannel());
    setAmpPresenceState(engineRef.current.getAmpPresence());
    setAmpLevelState(engineRef.current.getAmpLevel());
    setMetronomeBpmState(engineRef.current.getMetronomeBpm());
    setMetronomeRunning(engineRef.current.isMetronomeRunning());
    setPadsThroughChainState(nextRack.padsThroughChain);
    setGlobalNoiseGateEnabledState(engineRef.current.isGlobalNoiseGateEnabled());
    setGlobalNoiseGateThresholdState(engineRef.current.getGlobalNoiseGateThreshold());
    setGlobalNoiseGateReleaseState(engineRef.current.getGlobalNoiseGateRelease());
    setGlobalNoiseGateReductionState(engineRef.current.getGlobalNoiseGateReduction());
    setCabinetIrActiveId(nextRack.cabinetIrId);
    setCabinetIrMixState(engineRef.current.getCabinetIrMix());
    setCabinetIrEnabledState(engineRef.current.isCabinetIrEnabled());
    setCabinetIrName(engineRef.current.getCabinetIrName() || nextRack.cabinetIrName);

    updateSessionRack({
      ...nextRack,
      cabinetIrId: nextRack.cabinetIrId,
      cabinetIrEnabled: engineRef.current.isCabinetIrEnabled(),
      cabinetIrName: engineRef.current.getCabinetIrName() || nextRack.cabinetIrName,
    });
  }, [updateSessionRack]);

  const applyRigSnapshot = useCallback(async (snapshot: RigSnapshot) => {
    const nextRack = normalizeRackState(snapshot.rack);
    if (nextRack.cabinetIrId) {
      await restoreCabinetIrSelection(nextRack.cabinetIrId, nextRack.cabinetIrEnabled);
    } else {
      clearCabinetIrSelection(false);
    }
    engineRef.current.clearChain();
    for (const slot of snapshot.chain) {
      const effect = engineRef.current.addEffect(slot.type, slot.params);
      if (slot.bypassed) effect.setBypassed(true);
    }
    syncChain();
    applyRackState(nextRack);
  }, [applyRackState, clearCabinetIrSelection, restoreCabinetIrSelection, syncChain]);

  useEffect(() => {
    void refreshCabinetIrLibrary();
  }, [refreshCabinetIrLibrary]);

  useEffect(() => {
    const eng = engineRef.current;
    eng.setOnContextState((s) => setContextState(s));
    return () => eng.setOnContextState(undefined);
  }, []);

  const start = useCallback(
    async (deviceId?: string, presetOverride?: RigSnapshot) => {
      engineRef.current.setMasterVolume(sessionRackRef.current.masterVolume);
      await engineRef.current.start(deviceId);
      setIsRunning(true);
      setContextState(engineRef.current.getContextState());

      const snapshotToApply = presetOverride ?? initialSessionRef.current;
      const targetRack = normalizeRackState(snapshotToApply?.rack ?? sessionRackRef.current);
      if (snapshotToApply) {
        await applyRigSnapshot(snapshotToApply);
      } else {
        if (targetRack.cabinetIrId) {
          await restoreCabinetIrSelection(targetRack.cabinetIrId, targetRack.cabinetIrEnabled);
        } else {
          clearCabinetIrSelection(false);
        }
        applyRackState(targetRack);
      }

      syncLooper();
      syncBackingTrack();
      setCabinetIrName(engineRef.current.getCabinetIrName());
      setCabinetIrEnabledState(engineRef.current.isCabinetIrEnabled());
      setCabinetIrMixState(engineRef.current.getCabinetIrMix());
    },
    [applyRackState, applyRigSnapshot, clearCabinetIrSelection, restoreCabinetIrSelection, syncBackingTrack, syncLooper]
  );

  const stop = useCallback(() => {
    engineRef.current.stop();
    setIsRunning(false);
    setChain([]);
    setContextState(null);
    setLooperStatus('idle');
    setLooperDuration(0);
    setLooperState({
      status: 'idle',
      sourceDuration: 0,
      trimmedDuration: 0,
      trimStart: 0,
      trimEnd: 0,
      currentTime: 0,
      level: 0.85,
      recordLength: 8,
      peaks: [],
    });
    setBackingTrackState({
      name: '',
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      volume: 0.8,
      sectionStart: 0,
      sectionEnd: 0,
      sectionLoopEnabled: false,
      playbackRate: 1,
      peaks: [],
    });
    setMetronomeRunning(false);
    setCabinetIrEnabledState(sessionRackRef.current.cabinetIrEnabled);
    setCabinetIrName(sessionRackRef.current.cabinetIrName);
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
      const currentChain = engineRef.current.getChainState();
      const ids = currentChain.map((slot) => slot.id);
      const activeId = ids[fromIndex];
      const overId = ids[toIndex];
      if (!activeId || !overId) return;
      const lockedSet = new Set(lockedPedalIds);
      if (lockedSet.has(activeId) || lockedSet.has(overId)) return;

      const unlockedIds = ids.filter((id) => !lockedSet.has(id));
      const unlockedFrom = unlockedIds.indexOf(activeId);
      const unlockedTo = unlockedIds.indexOf(overId);
      if (unlockedFrom === -1 || unlockedTo === -1) return;

      const [moved] = unlockedIds.splice(unlockedFrom, 1);
      unlockedIds.splice(unlockedTo, 0, moved);

      let unlockedCursor = 0;
      const nextOrder = ids.map((id) =>
        lockedSet.has(id) ? id : unlockedIds[unlockedCursor++]!
      );

      engineRef.current.setEffectOrder(nextOrder);
      syncChain();
    },
    [lockedPedalIds, syncChain]
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
    updateSessionRack({ masterVolume: value });
  }, [updateSessionRack]);

  const setInputTrim = useCallback((value: number) => {
    engineRef.current.setInputTrim(value);
    setInputTrimState(value);
    updateSessionRack({ inputTrim: value });
  }, [updateSessionRack]);

  const setMonoInputToStereo = useCallback((value: boolean) => {
    engineRef.current.setMonoInputToStereo(value);
    const nextValue = engineRef.current.isMonoInputToStereo();
    setMonoInputToStereoState(nextValue);
    updateSessionRack({ monoInputToStereo: nextValue });
  }, [updateSessionRack]);

  const setInputMuted = useCallback((value: boolean) => {
    engineRef.current.setInputMuted(value);
    const nextMuted = engineRef.current.isInputMuted();
    setInputMutedState(nextMuted);
    updateSessionRack({ inputMuted: nextMuted });
  }, [updateSessionRack]);

  const setMuted = useCallback((value: boolean) => {
    engineRef.current.setMuted(value);
    const nextMuted = engineRef.current.isMuted();
    setMutedState(nextMuted);
    updateSessionRack({ muted: nextMuted });
  }, [updateSessionRack]);

  const setAmpChannel = useCallback((value: RackState['ampChannel']) => {
    engineRef.current.setAmpChannel(value);
    const nextValue = engineRef.current.getAmpChannel();
    setAmpChannelState(nextValue);
    updateSessionRack({ ampChannel: nextValue });
  }, [updateSessionRack]);

  const setAmpPresence = useCallback((value: number) => {
    engineRef.current.setAmpPresence(value);
    const nextValue = engineRef.current.getAmpPresence();
    setAmpPresenceState(nextValue);
    updateSessionRack({ ampPresence: nextValue });
  }, [updateSessionRack]);

  const setAmpLevel = useCallback((value: number) => {
    engineRef.current.setAmpLevel(value);
    const nextValue = engineRef.current.getAmpLevel();
    setAmpLevelState(nextValue);
    updateSessionRack({ ampLevel: nextValue });
  }, [updateSessionRack]);

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

  const loadRigSnapshot = useCallback((snapshot: RigSnapshot) => {
    return applyRigSnapshot(snapshot);
  }, [applyRigSnapshot]);

  const switchInput = useCallback(async (deviceId: string) => {
    await engineRef.current.switchInput(deviceId);
  }, []);

  const switchOutput = useCallback(async (sinkId: string) => {
    await engineRef.current.setOutputDevice(sinkId);
  }, []);

  const duplicateEffect = useCallback((id: string) => {
    const effect = engineRef.current.getEffectById(id);
    if (!effect) return;
    const duplicate = engineRef.current.addEffect(effect.type, effect.getParams());
    duplicate.setBypassed(effect.isBypassed());
    syncChain();
  }, [syncChain]);

  const copyEffectSettings = useCallback((id: string) => {
    const effect = engineRef.current.getEffectById(id);
    if (!effect) return;
    copiedPedalRef.current = {
      type: effect.type,
      bypassed: effect.isBypassed(),
      params: effect.getParams(),
    };
  }, []);

  const pasteEffectSettings = useCallback((id: string) => {
    const copied = copiedPedalRef.current;
    if (!copied) return false;
    const effect = engineRef.current.getEffectById(id);
    if (!effect || effect.type !== copied.type) return false;
    for (const [param, value] of Object.entries(copied.params)) {
      effect.setParam(param, value);
    }
    effect.setBypassed(copied.bypassed);
    syncChain();
    return true;
  }, [syncChain]);

  const hasCopiedEffectSettings = useCallback((type?: EffectType) => {
    if (!copiedPedalRef.current) return false;
    return type ? copiedPedalRef.current.type === type : true;
  }, []);

  const toggleLockedEffect = useCallback((id: string) => {
    setLockedPedalIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  }, []);

  const isEffectLocked = useCallback((id: string) => {
    return lockedPedalIds.includes(id);
  }, [lockedPedalIds]);

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

  const setLooperLevel = useCallback((v: number) => {
    engineRef.current.setLooperLevel(v);
    syncLooper();
  }, [syncLooper]);

  const setLooperRecordLength = useCallback((value: number) => {
    engineRef.current.setLooperRecordLength(value);
    syncLooper();
  }, [syncLooper]);

  const setLooperTrimRange = useCallback((start: number, end: number) => {
    engineRef.current.setLooperTrimRange(start, end);
    syncLooper();
  }, [syncLooper]);

  const resetLooperTrim = useCallback(() => {
    engineRef.current.resetLooperTrim();
    syncLooper();
  }, [syncLooper]);

  const applyLooperTrim = useCallback(() => {
    engineRef.current.applyLooperTrim();
    syncLooper();
  }, [syncLooper]);

  const metronomeStart = useCallback(() => {
    engineRef.current.metronomeStart();
    const running = engineRef.current.isMetronomeRunning();
    setMetronomeRunning(running);
    updateSessionRack({ metronomeRunning: running });
  }, [updateSessionRack]);

  const metronomeStop = useCallback(() => {
    engineRef.current.metronomeStop();
    setMetronomeRunning(false);
    updateSessionRack({ metronomeRunning: false });
  }, [updateSessionRack]);

  const setMetronomeBpm = useCallback((bpm: number) => {
    engineRef.current.setMetronomeBpm(bpm);
    const nextBpm = engineRef.current.getMetronomeBpm();
    setMetronomeBpmState(nextBpm);
    updateSessionRack({ metronomeBpm: nextBpm });
  }, [updateSessionRack]);

  const applyTapTempoToEffects = useCallback(
    (bpm: number) => {
      engineRef.current.setMetronomeBpm(bpm);
      engineRef.current.applyBpmToTimeEffects(bpm);
      const nextBpm = engineRef.current.getMetronomeBpm();
      setMetronomeBpmState(nextBpm);
      updateSessionRack({ metronomeBpm: nextBpm });
      syncChain();
    },
    [syncChain, updateSessionRack]
  );

  const playDrumPad = useCallback((index: number, velocity?: number) => {
    engineRef.current.playDrumPad(index, velocity);
  }, []);

  const setPadsThroughChain = useCallback((through: boolean) => {
    engineRef.current.setPadsThroughChain(through);
    setPadsThroughChainState(through);
    updateSessionRack({ padsThroughChain: through });
  }, [updateSessionRack]);

  const setGlobalNoiseGateEnabled = useCallback((enabled: boolean) => {
    engineRef.current.setGlobalNoiseGateEnabled(enabled);
    const nextEnabled = engineRef.current.isGlobalNoiseGateEnabled();
    setGlobalNoiseGateEnabledState(nextEnabled);
    updateSessionRack({ globalNoiseGateEnabled: nextEnabled });
  }, [updateSessionRack]);

  const setGlobalNoiseGateThreshold = useCallback((value: number) => {
    engineRef.current.setGlobalNoiseGateThreshold(value);
    const nextValue = engineRef.current.getGlobalNoiseGateThreshold();
    setGlobalNoiseGateThresholdState(nextValue);
    updateSessionRack({ globalNoiseGateThreshold: nextValue });
  }, [updateSessionRack]);

  const setGlobalNoiseGateRelease = useCallback((value: number) => {
    engineRef.current.setGlobalNoiseGateRelease(value);
    const nextValue = engineRef.current.getGlobalNoiseGateRelease();
    setGlobalNoiseGateReleaseState(nextValue);
    updateSessionRack({ globalNoiseGateRelease: nextValue });
  }, [updateSessionRack]);

  const setGlobalNoiseGateReduction = useCallback((value: number) => {
    engineRef.current.setGlobalNoiseGateReduction(value);
    const nextValue = engineRef.current.getGlobalNoiseGateReduction();
    setGlobalNoiseGateReductionState(nextValue);
    updateSessionRack({ globalNoiseGateReduction: nextValue });
  }, [updateSessionRack]);

  const captureMicToPad = useCallback(async (padIndex: number) => {
    return engineRef.current.captureMicToPad(padIndex, 1000);
  }, []);

  const loadFactoryDrumKit = useCallback((presetId: DrumKitPresetId) => {
    return engineRef.current.loadFactoryDrumKit(presetId);
  }, []);

  const exportDrumPadKitSnapshot = useCallback(() => {
    return engineRef.current.exportDrumPadKitSnapshot();
  }, []);

  const importDrumPadKitSnapshot = useCallback((snapshot: { padBuffers: { sampleRate: number; samples: number[] }[] }) => {
    return engineRef.current.importDrumPadKitSnapshot(snapshot);
  }, []);

  const loadBackingTrack = useCallback(async (file: File) => {
    const loaded = await engineRef.current.loadBackingTrack(file);
    syncBackingTrack();
    return loaded;
  }, [syncBackingTrack]);

  const playBackingTrack = useCallback(() => {
    engineRef.current.playBackingTrack();
    syncBackingTrack();
  }, [syncBackingTrack]);

  const pauseBackingTrack = useCallback(() => {
    engineRef.current.pauseBackingTrack();
    syncBackingTrack();
  }, [syncBackingTrack]);

  const stopBackingTrack = useCallback(() => {
    engineRef.current.stopBackingTrack();
    syncBackingTrack();
  }, [syncBackingTrack]);

  const clearBackingTrack = useCallback(() => {
    engineRef.current.clearBackingTrack();
    syncBackingTrack();
  }, [syncBackingTrack]);

  const setBackingTrackVolume = useCallback((value: number) => {
    engineRef.current.setBackingTrackVolume(value);
    syncBackingTrack();
  }, [syncBackingTrack]);

  const seekBackingTrack = useCallback((value: number) => {
    engineRef.current.seekBackingTrack(value);
    syncBackingTrack();
  }, [syncBackingTrack]);

  const setBackingTrackSection = useCallback((start: number, end: number) => {
    engineRef.current.setBackingTrackSection(start, end);
    syncBackingTrack();
  }, [syncBackingTrack]);

  const setBackingTrackSectionLoopEnabled = useCallback((enabled: boolean) => {
    engineRef.current.setBackingTrackSectionLoopEnabled(enabled);
    syncBackingTrack();
  }, [syncBackingTrack]);

  const setBackingTrackPlaybackRate = useCallback((rate: number) => {
    engineRef.current.setBackingTrackPlaybackRate(rate);
    syncBackingTrack();
  }, [syncBackingTrack]);

  const loadCabinetIr = useCallback(async (file: File) => {
    setCabinetIrLibraryBusy(true);
    try {
      const data = await file.arrayBuffer();
      const stored = await saveCabinetIr({
        name: file.name.replace(/\.[^.]+$/, '') || file.name,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        data,
      });
      await refreshCabinetIrLibrary();
      if (engineRef.current.isRunning()) {
        const loaded = await engineRef.current.loadCabinetIrBuffer(data, stored.name);
        if (!loaded) return false;
      }

      setCabinetIrActiveId(stored.id);
      setCabinetIrName(stored.name);
      setCabinetIrEnabledState(engineRef.current.isRunning() ? engineRef.current.isCabinetIrEnabled() : true);
      setCabinetIrMixState(engineRef.current.getCabinetIrMix());
      updateSessionRack({
        cabinetIrId: stored.id,
        cabinetIrName: stored.name,
        cabinetIrEnabled: engineRef.current.isRunning() ? engineRef.current.isCabinetIrEnabled() : true,
        cabinetIrMix: engineRef.current.getCabinetIrMix(),
      });
      return true;
    } finally {
      setCabinetIrLibraryBusy(false);
    }
  }, [refreshCabinetIrLibrary, updateSessionRack]);

  const selectCabinetIr = useCallback(async (id: string) => {
    setCabinetIrLibraryBusy(true);
    try {
      const restored = await restoreCabinetIrSelection(id, true);
      return Boolean(restored);
    } finally {
      setCabinetIrLibraryBusy(false);
    }
  }, [restoreCabinetIrSelection]);

  const clearCabinetIr = useCallback(() => {
    clearCabinetIrSelection(false);
  }, [clearCabinetIrSelection]);

  const setCabinetIrEnabled = useCallback((enabled: boolean) => {
    engineRef.current.setCabinetIrEnabled(enabled);
    const nextEnabled = engineRef.current.isCabinetIrEnabled();
    setCabinetIrEnabledState(nextEnabled);
    updateSessionRack({ cabinetIrEnabled: nextEnabled });
  }, [updateSessionRack]);

  const setCabinetIrMix = useCallback((mix: number) => {
    engineRef.current.setCabinetIrMix(mix);
    const nextMix = engineRef.current.getCabinetIrMix();
    setCabinetIrMixState(nextMix);
    updateSessionRack({ cabinetIrMix: nextMix });
  }, [updateSessionRack]);

  const startOutputRecording = useCallback((format: OutputRecordingFormat = 'webm') => {
    const started = engineRef.current.startOutputRecording(format);
    if (started) {
      outputRecordingStartedAtRef.current = performance.now();
      setOutputRecorderActive(true);
      setOutputRecorderDuration(0);
      setLastRecordingDuration(0);
    }
    return started;
  }, []);

  const stopOutputRecording = useCallback(async () => {
    const blob = await engineRef.current.stopOutputRecording();
    const startedAt = outputRecordingStartedAtRef.current;
    const duration = startedAt === null ? 0 : Math.max(0, (performance.now() - startedAt) / 1000);
    outputRecordingStartedAtRef.current = null;
    setOutputRecorderActive(false);
    setOutputRecorderDuration(0);
    setLastRecordingDuration(duration);
    if (!blob) return null;
    if (lastRecordingUrl) URL.revokeObjectURL(lastRecordingUrl);
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = blob.type.includes('mpeg') || blob.type.includes('mp3') ? 'mp3' : 'webm';
    setLastRecordingUrl(url);
    setLastRecordingBlob(blob);
    setLastRecordingName(`wamp-output-${stamp}.${extension}`);
    return { url, blob };
  }, [lastRecordingUrl]);

  const clearLastOutputRecording = useCallback(() => {
    outputRecordingStartedAtRef.current = null;
    setOutputRecorderActive(false);
    setOutputRecorderDuration(0);
    setLastRecordingDuration(0);
    setLastRecordingName('');
    setLastRecordingBlob(null);
    setLastRecordingUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
  }, []);

  const renameCabinetIrEntry = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setCabinetIrLibraryBusy(true);
    try {
      const updated = await renameCabinetIr(id, trimmed);
      await refreshCabinetIrLibrary();
      if (!updated) return false;
      if (cabinetIrActiveId === id) {
        setCabinetIrName(updated.name);
        updateSessionRack({ cabinetIrName: updated.name });
      }
      return true;
    } finally {
      setCabinetIrLibraryBusy(false);
    }
  }, [cabinetIrActiveId, refreshCabinetIrLibrary, updateSessionRack]);

  const deleteCabinetIrEntry = useCallback(async (id: string) => {
    setCabinetIrLibraryBusy(true);
    try {
      await deleteCabinetIr(id);
      if (cabinetIrActiveId === id) {
        clearCabinetIrSelection(false);
      }
      await refreshCabinetIrLibrary();
    } finally {
      setCabinetIrLibraryBusy(false);
    }
  }, [cabinetIrActiveId, clearCabinetIrSelection, refreshCabinetIrLibrary]);

  useEffect(() => {
    if (!isRunning) return;
    let raf: number;
    const tick = () => {
      const now = performance.now();
      if (lastFrameTimeRef.current !== null) {
        const frameMs = now - lastFrameTimeRef.current;
        averageFrameMsRef.current = averageFrameMsRef.current === 0
          ? frameMs
          : averageFrameMsRef.current * 0.9 + frameMs * 0.1;
      }
      lastFrameTimeRef.current = now;
      setInputLevel(engineRef.current.getInputLevel());
      setOutputLevel(engineRef.current.getOutputLevel());
      setOutputPeak(engineRef.current.getOutputPeak());
      const nextLooperState = engineRef.current.getLooperState();
      setLooperState(nextLooperState);
      setLooperStatus(nextLooperState.status);
      setLooperDuration(nextLooperState.trimmedDuration);
      setBackingTrackState(engineRef.current.getBackingTrackState());
      const pitch = engineRef.current.getInputPitchAnalysis();
      updateTunerSnapshot(pitch.frequency, pitch.clarity, pitch.signal);
      if (outputRecordingStartedAtRef.current !== null) {
        setOutputRecorderDuration((now - outputRecordingStartedAtRef.current) / 1000);
      }
      const baseLatencyMs = engineRef.current.getBaseLatencyMs();
      const outputLatencyMs = engineRef.current.getOutputLatencyMs();
      const activeNodes = engineRef.current.getActiveNodeEstimate();
      const averageFrameMs = averageFrameMsRef.current;
      const estimatedCpuLoad = Math.min(
        99,
        Math.max(
          0,
          activeNodes * 3
            + (baseLatencyMs + outputLatencyMs) * 0.35
            + averageFrameMs * 1.8
            + (outputRecorderActive ? 10 : 0)
            + (metronomeRunning ? 3 : 0)
        )
      );
      setPerformanceSnapshot({
        baseLatencyMs,
        outputLatencyMs,
        sampleRate: engineRef.current.getSampleRate(),
        activeNodes,
        averageFrameMs,
        estimatedCpuLoad,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isRunning, metronomeRunning, outputRecorderActive, updateTunerSnapshot]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (lastRecordingUrl) URL.revokeObjectURL(lastRecordingUrl);
    };
  }, [lastRecordingUrl]);

  return {
    isRunning,
    chain,
    lockedPedalIds,
    masterVolume,
    inputTrim,
    monoInputToStereo,
    inputMuted,
    muted,
    ampChannel,
    ampPresence,
    ampLevel,
    inputLevel,
    outputLevel,
    outputPeak,
    tuner,
    contextState,
    looperStatus,
    looperDuration,
    looperState,
    backingTrackState,
    metronomeBpm,
    metronomeRunning,
    padsThroughChain,
    globalNoiseGateEnabled,
    globalNoiseGateThreshold,
    globalNoiseGateRelease,
    globalNoiseGateReduction,
    cabinetIrLibrary,
    cabinetIrLibraryBusy,
    cabinetIrActiveId,
    cabinetIrName,
    cabinetIrEnabled,
    cabinetIrMix,
    outputRecorderActive,
    outputRecorderDuration,
    lastRecordingUrl,
    lastRecordingName,
    lastRecordingBlob,
    lastRecordingDuration,
    performanceSnapshot,
    start,
    stop,
    resumeAudioContext,
    addEffect,
    removeEffect,
    reorderEffects,
    setEffectParam,
    toggleBypass,
    duplicateEffect,
    copyEffectSettings,
    pasteEffectSettings,
    hasCopiedEffectSettings,
    toggleLockedEffect,
    isEffectLocked,
    setMasterVolume,
    setInputTrim,
    setMonoInputToStereo,
    setInputMuted,
    setMuted,
    setAmpChannel,
    setAmpPresence,
    setAmpLevel,
    loadPresetChain,
    loadRigSnapshot,
    switchInput,
    switchOutput,
    getChainState: () => engineRef.current.getChainState(),
    getRackState,
    looperStartRecord,
    looperStopRecord,
    looperPlay,
    looperStop,
    looperClear,
    setLooperLevel,
    setLooperRecordLength,
    setLooperTrimRange,
    resetLooperTrim,
    applyLooperTrim,
    metronomeStart,
    metronomeStop,
    setMetronomeBpm,
    applyTapTempoToEffects,
    playDrumPad,
    setPadsThroughChain,
    setGlobalNoiseGateEnabled,
    setGlobalNoiseGateThreshold,
    setGlobalNoiseGateRelease,
    setGlobalNoiseGateReduction,
    captureMicToPad,
    loadFactoryDrumKit,
    exportDrumPadKitSnapshot,
    importDrumPadKitSnapshot,
    loadBackingTrack,
    playBackingTrack,
    pauseBackingTrack,
    stopBackingTrack,
    clearBackingTrack,
    setBackingTrackVolume,
    seekBackingTrack,
    setBackingTrackSection,
    setBackingTrackSectionLoopEnabled,
    setBackingTrackPlaybackRate,
    loadCabinetIr,
    selectCabinetIr,
    renameCabinetIrEntry,
    deleteCabinetIrEntry,
    clearCabinetIr,
    setCabinetIrEnabled,
    setCabinetIrMix,
    startOutputRecording,
    stopOutputRecording,
    clearLastOutputRecording,
  };
}

export type AudioEngineAPI = ReturnType<typeof useAudioEngine>;
