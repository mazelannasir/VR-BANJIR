import { useCallback, useEffect, useMemo, useState } from 'react';
import ActivityModal from './components/ActivityModal';
import ControlDock from './components/ControlDock';
import FloodWorldCanvas from './components/FloodWorldCanvas';
import QuizModal from './components/QuizModal';
import StationCard from './components/StationCard';
import TitleScreen from './components/TitleScreen';
import TopHud from './components/TopHud';
import {
  CameraPresetId,
  ExplorationMode,
  SimulationParams,
  StationId,
} from './types/simulation';
import { computeHydrology } from './utils/hydrologyModel';
import { audioEngine } from './utils/proceduralAudio';

export default function App() {
  const [started, setStarted] = useState(false);
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('orbit');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [muted, setMuted] = useState(false);

  const [params, setParams] = useState<SimulationParams>({
    rainfallMmHr: 65,
    urbanizationPct: 55,
    reforestation: false,
    permeablePavement: false,
    drainClearing: false,
    retentionBasin: false,
  });

  const [activePreset, setActivePreset] = useState<CameraPresetId>('overview');
  const [activeStation, setActiveStation] = useState<StationId | null>(null);
  const [cameraCommand, setCameraCommand] = useState<{
    presetId?: CameraPresetId;
    stationId?: StationId;
    seq: number;
  } | null>(null);

  const [showActivity, setShowActivity] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const metrics = useMemo(() => computeHydrology(params), [params]);

  const challengeCompleted =
    params.urbanizationPct >= 80 &&
    params.rainfallMmHr >= 120 &&
    metrics.waterLevelM < 3.5 &&
    [
      params.reforestation,
      params.permeablePavement,
      params.drainClearing,
      params.retentionBasin,
    ].filter(Boolean).length >= 3;

  // Keep ambient rain & river sound synchronized with live simulation
  useEffect(() => {
    if (!started) return;
    audioEngine.updateAmbience(params.rainfallMmHr, metrics.waterLevelM);
  }, [started, params.rainfallMmHr, metrics.waterLevelM]);

  // Keyboard shortcuts: 'H' to hide/show dock, 'Enter' on Title Screen to start
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!started && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStart();
        return;
      }
      if (started && e.code === 'KeyH') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleStart = useCallback(() => {
    audioEngine.init();
    audioEngine.playTone('station');
    setStarted(true);
    setCameraCommand({ presetId: 'overview', seq: Date.now() });
  }, []);

  const handleChangeParams = useCallback((patch: Partial<SimulationParams>) => {
    const toggleKeys: Array<keyof SimulationParams> = [
      'reforestation',
      'permeablePavement',
      'drainClearing',
      'retentionBasin',
    ];
    for (const k of toggleKeys) {
      if (k in patch) {
        audioEngine.playTone(patch[k] ? 'toggleOn' : 'toggleOff');
      }
    }
    setParams((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSelectPreset = useCallback((presetId: CameraPresetId) => {
    audioEngine.playTone('click');
    setActivePreset(presetId);
    setActiveStation(null);
    setExplorationMode('orbit');
    setCameraCommand((prev) => ({ presetId, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const handleSelectStation = useCallback((stationId: StationId | null) => {
    setActiveStation(stationId);
    if (stationId) {
      audioEngine.playTone('station');
      setCameraCommand((prev) => ({ stationId, seq: (prev?.seq ?? 0) + 1 }));
    }
  }, []);

  const handleChangeMode = useCallback((mode: ExplorationMode) => {
    audioEngine.playTone('click');
    setExplorationMode(mode);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      audioEngine.setMuted(next);
      return next;
    });
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {/* Isolated Full-Bleed WebGL 3D World */}
      <FloodWorldCanvas
        started={started}
        params={params}
        metrics={metrics}
        explorationMode={explorationMode}
        activeStation={activeStation}
        cameraCommand={cameraCommand}
        onSelectStation={handleSelectStation}
        onExitWalk={() => setExplorationMode('orbit')}
      />

      {!started && <TitleScreen onStart={handleStart} />}

      {started && (
        <>
          <TopHud
            metrics={metrics}
            explorationMode={explorationMode}
            muted={muted}
            quizScore={quizScore}
            challengeCompleted={challengeCompleted}
            onChangeMode={handleChangeMode}
            onToggleMute={handleToggleMute}
            onOpenActivity={() => {
              audioEngine.playTone('click');
              setShowActivity(true);
            }}
            onOpenQuiz={() => {
              audioEngine.playTone('click');
              setShowQuiz(true);
            }}
          />

          {/* Subtle center divider & guide when in Stereoscopic VR or Walk VR Mode */}
          {explorationMode === 'stereo' && (
            <div className="pointer-events-none fixed inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-slate-950/90" />
          )}

          {(explorationMode === 'walk' || explorationMode === 'stereo') && (
            <div className="pointer-events-none fixed top-16 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-slate-700/80 bg-slate-950/90 px-3 py-1 text-xs text-slate-200">
              {explorationMode === 'stereo' ? 'VR Stereoskopik · ' : 'Mod Jalan VR · '}
              Kekunci WASD / Anak Panah untuk bergerak · Seret tetikus untuk melihat · Esc keluar
            </div>
          )}

          {activeStation && explorationMode !== 'stereo' && (
            <StationCard
              stationId={activeStation}
              onSelectStation={(id) => handleSelectStation(id)}
              onClose={() => setActiveStation(null)}
            />
          )}

          {explorationMode !== 'stereo' && (
            <ControlDock
              collapsed={dockCollapsed}
              params={params}
              metrics={metrics}
              activePreset={activePreset}
              activeStation={activeStation}
              onToggleCollapse={() => setDockCollapsed((c) => !c)}
              onChangeParams={handleChangeParams}
              onSelectPreset={handleSelectPreset}
              onSelectStation={(id) => handleSelectStation(id)}
            />
          )}

          {showActivity && (
            <ActivityModal
              params={params}
              metrics={metrics}
              onApplyPreset={handleChangeParams}
              onClose={() => setShowActivity(false)}
            />
          )}

          {showQuiz && (
            <QuizModal
              onCompleteScore={(s) => setQuizScore(s)}
              onJumpToStation={(stationId) => {
                setExplorationMode('orbit');
                handleSelectStation(stationId);
              }}
              onClose={() => setShowQuiz(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
