import { CheckCircle2, Circle, Play, RotateCcw, Target, X } from 'lucide-react';
import { HydrologyMetrics, SimulationParams } from '../types/simulation';

interface ActivityModalProps {
  params: SimulationParams;
  metrics: HydrologyMetrics;
  onApplyPreset: (patch: Partial<SimulationParams>) => void;
  onClose: () => void;
}

export default function ActivityModal({
  params,
  metrics,
  onApplyPreset,
  onClose,
}: ActivityModalProps) {
  const highUrbanOk = params.urbanizationPct >= 80;
  const heavyRainOk = params.rainfallMmHr >= 120;
  const safeWaterOk = metrics.waterLevelM < 3.5;
  const mitigationCount = [
    params.reforestation,
    params.permeablePavement,
    params.drainClearing,
    params.retentionBasin,
  ].filter(Boolean).length;
  const missionSuccess = highUrbanOk && heavyRainOk && safeWaterOk && mitigationCount >= 3;

  const triggerFloodScenario = () => {
    onApplyPreset({
      rainfallMmHr: 130,
      urbanizationPct: 85,
      reforestation: false,
      permeablePavement: false,
      drainClearing: false,
      retentionBasin: false,
    });
  };

  const resetPristineScenario = () => {
    onApplyPreset({
      rainfallMmHr: 40,
      urbanizationPct: 20,
      reforestation: true,
      permeablePavement: true,
      drainClearing: true,
      retentionBasin: true,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-title"
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
              <Target className="h-4 w-4" />
              <span>Aktiviti Interaktif Sains Tingkatan 4</span>
            </div>
            <h2 id="activity-title" className="font-display mt-1 text-xl font-bold text-white">
              Misi Jurutera: Bandar Moden Tahan Banjir
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup aktiviti"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scientific Scenario Comparison */}
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <p className="leading-relaxed">
            Jalankan eksperimen dalam dunia 3D untuk membandingkan kesan pembangunan tanpa kawalan terhadap paras air sungai dan menguji penyelesaian teknologi hijau.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                triggerFloodScenario();
                onClose();
              }}
              className="flex flex-col items-start rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-left transition-colors hover:border-rose-400 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <Play className="h-3.5 w-3.5" />
                <span>Langkah 1: Uji Simulasi Banjir Kilat</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Tetapkan Pembangunan 85% dan Hujan 130 mm/jam tanpa mitigasi. Perhatikan tolok sungai melimpah melebihi 3.50 m!
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                resetPristineScenario();
                onClose();
              }}
              className="flex flex-col items-start rounded-xl border border-slate-700 bg-slate-900/70 p-3.5 text-left transition-colors hover:border-sky-400 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Tetap Semula Lembah Hijau</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Kembalikan lembah kepada keadaan asal yang seimbang (hujan 40 mm/jam, pembangunan 20%).
              </p>
            </button>
          </div>
        </div>

        {/* Live Mission Checklist */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">
              Cabaran Kejuruteraan Hijau (Semakan Langsung)
            </h3>
            <span
              className={`text-xs font-semibold ${
                missionSuccess ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {missionSuccess ? 'Misi Berjaya!' : 'Sedang Diuji'}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Gunakan gelangsar dan butang mitigasi di panel kawalan bawah untuk memenuhi kesemua syarat berikut serentak:
          </p>

          <ul className="mt-3 space-y-2 text-xs">
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-slate-200">
                {highUrbanOk ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                Kadar Pembangunan Bandar mencapai sekurang-kurangnya 80%
              </span>
              <span className="font-mono-num text-slate-400">{params.urbanizationPct}%</span>
            </li>

            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-slate-200">
                {heavyRainOk ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                Keamatan Hujan Lebat diuji pada 120 mm/jam atau lebih
              </span>
              <span className="font-mono-num text-slate-400">{params.rainfallMmHr} mm/jam</span>
            </li>

            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-slate-200">
                {mitigationCount >= 3 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                Aktifkan sekurang-kurangnya 3 teknologi hijau / tebatan banjir
              </span>
              <span className="font-mono-num text-slate-400">{mitigationCount} / 4</span>
            </li>

            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-slate-200">
                {safeWaterOk ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-500 shrink-0" />
                )}
                Kawal Paras Air Sungai supaya kekal di bawah 3.50 m
              </span>
              <span
                className={`font-mono-num font-semibold ${
                  safeWaterOk ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.waterLevelM.toFixed(2)} m
              </span>
            </li>
          </ul>
        </div>

        {/* Live Data Summary Row */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
            <div className="text-[11px] text-slate-400">Kadar Resapan</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-emerald-400">
              {metrics.infiltrationPct}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
            <div className="text-[11px] text-slate-400">Larian Permukaan</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-sky-400">
              {metrics.runoffPct}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
            <div className="text-[11px] text-slate-400">Beban Kelodak</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-amber-400">
              {metrics.siltLoadPct}%
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
          >
            Kembali ke Dunia 3D
          </button>
        </div>
      </div>
    </div>
  );
}
