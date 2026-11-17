import { ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react';
import { STATIONS } from '../data/curriculumContent';
import { StationId } from '../types/simulation';

interface StationCardProps {
  stationId: StationId;
  onSelectStation: (id: StationId) => void;
  onClose: () => void;
}

export default function StationCard({
  stationId,
  onSelectStation,
  onClose,
}: StationCardProps) {
  const index = STATIONS.findIndex((s) => s.id === stationId);
  const station = STATIONS[index];
  if (!station) return null;

  const prevStation = STATIONS[(index - 1 + STATIONS.length) % STATIONS.length];
  const nextStation = STATIONS[(index + 1) % STATIONS.length];

  return (
    <aside
      aria-label={`Konsep Saintifik ${station.title}`}
      className="fixed top-20 left-3 z-20 w-[min(360px,calc(100vw-24px))] rounded-xl border border-slate-700/80 bg-slate-950/94 p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-sky-400">
            Stesen {station.number} · {station.subtitle}
          </div>
          <h2 className="font-display mt-1 text-base font-bold leading-snug text-white">
            {station.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup penerangan stesen"
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 text-xs font-medium text-amber-300">
        Konsep: {station.conceptTag}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
        {station.explanation}
      </p>

      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/90 p-2.5 text-xs leading-relaxed text-slate-200">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-400">
          <Lightbulb className="h-3.5 w-3.5 shrink-0" />
          <span>Fakta Saintifik</span>
        </div>
        {station.scientificFact}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5">
        <button
          type="button"
          onClick={() => onSelectStation(prevStation.id)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Stesen {prevStation.number}</span>
        </button>
        <span className="font-mono-num text-xs text-slate-500">
          {index + 1} / {STATIONS.length}
        </span>
        <button
          type="button"
          onClick={() => onSelectStation(nextStation.id)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <span>Stesen {nextStation.number}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
