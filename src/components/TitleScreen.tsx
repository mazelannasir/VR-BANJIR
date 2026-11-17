import { ArrowRight, Compass } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between pointer-events-none">
      {/* Subtle top and bottom edge gradient scrims so central 3D valley stays vivid */}
      <div className="h-28 bg-gradient-to-b from-slate-950/75 to-transparent" />

      <div className="mx-auto mb-10 w-full max-w-3xl px-6 pointer-events-auto">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/92 p-7 shadow-2xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              {/* Bespoke inline SVG hydrological crest + title lockup */}
              <div className="flex items-center gap-3 text-sky-400">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 32 32"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path
                    d="M16 3C16 3 7 13.5 7 19.5C7 24.47 11.03 28.5 16 28.5C20.97 28.5 25 24.47 25 19.5C25 13.5 16 3 16 3Z"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    fill="rgba(56, 189, 248, 0.16)"
                  />
                  <path
                    d="M10.5 20.5C12.2 19 14.1 19 16 20.5C17.9 22 19.8 22 21.5 20.5"
                    stroke="#34d399"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xs font-medium tracking-wide text-slate-300">
                  Sains Tingkatan 4 · Pembelajaran VR 3D Interaktif
                </span>
              </div>

              <h1 className="font-display mt-2.5 text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
                Pembangunan dan Banjir
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Terokai bagaimana penebangan hutan, permukaan konkrit dan longkang tersumbat memicu banjir kilat — serta uji penyelesaian teknologi hijau secara langsung dalam dunia 3D.
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 sm:w-auto cursor-pointer whitespace-nowrap"
              >
                <Compass className="h-4 w-4" />
                <span>Mula Teroka 3D</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800 pt-3.5 text-xs text-slate-400">
            <span>Klik penanda 01–05 untuk konsep saintifik</span>
            <span aria-hidden="true">·</span>
            <span>Seret untuk putar kamera</span>
            <span aria-hidden="true">·</span>
            <span>Skrol untuk zum</span>
            <span aria-hidden="true">·</span>
            <span>Mod Jalan VR: WASD + Seret pandangan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
