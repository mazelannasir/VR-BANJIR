import {
  Building2,
  Camera,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Droplets,
  ShieldCheck,
  Trees,
  Trash2,
} from 'lucide-react';
import { CAMERA_PRESETS, STATIONS } from '../data/curriculumContent';
import {
  CameraPresetId,
  HydrologyMetrics,
  SimulationParams,
  StationId,
} from '../types/simulation';

interface ControlDockProps {
  collapsed: boolean;
  params: SimulationParams;
  metrics: HydrologyMetrics;
  activePreset: CameraPresetId;
  activeStation: StationId | null;
  onToggleCollapse: () => void;
  onChangeParams: (patch: Partial<SimulationParams>) => void;
  onSelectPreset: (id: CameraPresetId) => void;
  onSelectStation: (id: StationId) => void;
}

export default function ControlDock({
  collapsed,
  params,
  metrics,
  activePreset,
  activeStation,
  onToggleCollapse,
  onChangeParams,
  onSelectPreset,
  onSelectStation,
}: ControlDockProps) {
  return (
    <div
      className="fixed bottom-3 left-1/2 z-20 w-[min(940px,95vw)] -translate-x-1/2 flex flex-col items-center pointer-events-none"
    >
      {/* Collapse / Expand Toggle Handle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/94 px-3 py-1 text-xs font-medium text-slate-300 shadow hover:text-white cursor-pointer"
      >
        {collapsed ? (
          <>
            <ChevronUp className="h-3.5 w-3.5 text-sky-400" />
            <span>Papar Kawalan Simulasi (H)</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
            <span>Sembunyi Kawalan (H)</span>
          </>
        )}
      </button>

      {/* Main Dock Panel */}
      <div
        className={`pointer-events-auto w-full rounded-2xl border border-slate-700/75 bg-slate-950/94 p-3.5 shadow-2xl transition-transform duration-200 ${
          collapsed ? 'translate-y-[120%] pointer-events-none hidden' : 'translate-y-0'
        }`}
      >
        {/* Row 1: Camera Presets + 5 Station Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 pb-2.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-slate-400">
              <Camera className="h-3.5 w-3.5" />
              Sudut:
            </span>
            {CAMERA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activePreset === preset.id && !activeStation
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1 text-xs font-medium text-slate-400">Stesen:</span>
            {STATIONS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onSelectStation(st.id)}
                title={st.title}
                className={`h-7 min-w-7 rounded-md px-2 font-mono-num text-xs font-semibold transition-colors cursor-pointer ${
                  activeStation === st.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {st.number}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Environmental Sliders (Rainfall & Urbanization) */}
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <label
                htmlFor="rainfall-slider"
                className="inline-flex items-center gap-1.5 font-medium text-slate-200"
              >
                <CloudRain className="h-3.5 w-3.5 text-sky-400" />
                Keamatan Hujan
              </label>
              <span className="font-mono-num font-semibold text-sky-300">
                {params.rainfallMmHr} mm/jam
              </span>
            </div>
            <input
              id="rainfall-slider"
              type="range"
              min={0}
              max={150}
              step={5}
              value={params.rainfallMmHr}
              onChange={(e) => onChangeParams({ rainfallMmHr: Number(e.target.value) })}
              className="sim-slider w-full"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <label
                htmlFor="urban-slider"
                className="inline-flex items-center gap-1.5 font-medium text-slate-200"
              >
                <Building2 className="h-3.5 w-3.5 text-amber-400" />
                Kadar Pembangunan &amp; Penebangan
              </label>
              <span className="font-mono-num font-semibold text-amber-300">
                {params.urbanizationPct}% · Kelodak {metrics.siltLoadPct}%
              </span>
            </div>
            <input
              id="urban-slider"
              type="range"
              min={0}
              max={100}
              step={5}
              value={params.urbanizationPct}
              onChange={(e) => onChangeParams({ urbanizationPct: Number(e.target.value) })}
              className="sim-slider w-full"
            />
          </div>
        </div>

        {/* Row 3: 4 Interactive Green Engineering Mitigation Toggles */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => onChangeParams({ reforestation: !params.reforestation })}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              params.reforestation
                ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Trees className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Penghutanan Semula</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeParams({ permeablePavement: !params.permeablePavement })}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              params.permeablePavement
                ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Droplets className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Turapan Telap Air</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeParams({ drainClearing: !params.drainClearing })}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              params.drainClearing
                ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Bersih Longkang</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeParams({ retentionBasin: !params.retentionBasin })}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              params.retentionBasin
                ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Kolam &amp; Benteng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
