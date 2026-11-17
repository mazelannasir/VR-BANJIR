import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Footprints,
  Glasses,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ExplorationMode, HydrologyMetrics } from '../types/simulation';

interface TopHudProps {
  metrics: HydrologyMetrics;
  explorationMode: ExplorationMode;
  muted: boolean;
  quizScore: number | null;
  challengeCompleted: boolean;
  onChangeMode: (mode: ExplorationMode) => void;
  onToggleMute: () => void;
  onOpenActivity: () => void;
  onOpenQuiz: () => void;
}

export default function TopHud({
  metrics,
  explorationMode,
  muted,
  quizScore,
  challengeCompleted,
  onChangeMode,
  onToggleMute,
  onOpenActivity,
  onOpenQuiz,
}: TopHudProps) {
  const statusConfig = {
    normal: {
      label: 'Normal',
      colorClass: 'text-emerald-400',
      Icon: CheckCircle2,
    },
    waspada: {
      label: 'Waspada',
      colorClass: 'text-amber-400',
      Icon: AlertTriangle,
    },
    bahaya: {
      label: 'Bahaya Banjir',
      colorClass: 'text-rose-400',
      Icon: AlertTriangle,
    },
  }[metrics.floodStatus];

  const StatusIcon = statusConfig.Icon;

  return (
    <header className="fixed top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-950/92 px-4 py-2.5 shadow-lg">
      {/* Zone 1: Brand Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="font-display text-sm font-bold tracking-tight text-white whitespace-nowrap sm:text-base">
          EkoBanjir VR
        </span>
        <span className="hidden text-xs text-slate-400 sm:inline whitespace-nowrap">
          · Sains Tingkatan 4
        </span>
      </div>

      {/* Zone 2: Live Hydrological Telemetry (Tabular numerals, no pills, no pulsing dots) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-slate-400">Paras Sungai:</span>
          <span className="font-mono-num font-semibold text-white">
            {metrics.waterLevelM.toFixed(2)} m
          </span>
        </div>
        <span className="hidden text-slate-600 md:inline" aria-hidden="true">
          |
        </span>
        <div className="hidden items-center gap-1.5 md:flex whitespace-nowrap">
          <span className="text-slate-400">Resapan:</span>
          <span className="font-mono-num font-semibold text-emerald-400">
            {metrics.infiltrationPct}%
          </span>
        </div>
        <div className="hidden items-center gap-1.5 md:flex whitespace-nowrap">
          <span className="text-slate-400">Larian:</span>
          <span className="font-mono-num font-semibold text-sky-400">
            {metrics.runoffPct}%
          </span>
        </div>
        <span className="text-slate-600" aria-hidden="true">
          |
        </span>
        <div className={`flex items-center gap-1.5 font-semibold whitespace-nowrap ${statusConfig.colorClass}`}>
          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{statusConfig.label}</span>
          {metrics.floodDepthM > 0 && (
            <span className="font-mono-num text-rose-300">
              (+{metrics.floodDepthM.toFixed(2)}m)
            </span>
          )}
        </div>
      </div>

      {/* Zone 3: Mode Switchers, Activity & Quiz Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Exploration Mode Segmented Control */}
        <div
          className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5"
          role="group"
          aria-label="Mod Penerokaan VR"
        >
          <button
            type="button"
            onClick={() => onChangeMode('orbit')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              explorationMode === 'orbit'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Kamera Orbit 3D"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Orbit</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('walk')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              explorationMode === 'walk'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Mod Jalan Kaki VR (WASD)"
          >
            <Footprints className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Jalan VR</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('stereo')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              explorationMode === 'stereo'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Paparan VR Stereoskopik Dwi-Mata"
          >
            <Glasses className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">VR Stereo</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenActivity}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            challengeCompleted
              ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
              : 'border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          <span>Aktiviti Misi</span>
        </button>

        <button
          type="button"
          onClick={onOpenQuiz}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer whitespace-nowrap"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>{quizScore !== null ? `Kuiz (${quizScore}/3)` : 'Kuiz (3 Soalan)'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Buka bunyi simulasi' : 'Bisukan bunyi simulasi'}
          title={muted ? 'Buka bunyi' : 'Bisukan bunyi'}
          className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition-colors hover:border-slate-600 hover:text-white cursor-pointer"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
