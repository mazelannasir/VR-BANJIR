import { useState } from 'react';
import { CheckCircle2, Compass, RotateCcw, X, XCircle } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/curriculumContent';
import { StationId } from '../types/simulation';
import { audioEngine } from '../utils/proceduralAudio';

interface QuizModalProps {
  onCompleteScore: (score: number) => void;
  onJumpToStation: (stationId: StationId) => void;
  onClose: () => void;
}

export default function QuizModal({
  onCompleteScore,
  onJumpToStation,
  onClose,
}: QuizModalProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUIZ_QUESTIONS.length;
  const score = QUIZ_QUESTIONS.reduce(
    (acc, q) => (answers[q.id] === q.correctIndex ? acc + 1 : acc),
    0,
  );

  const handleSelectOption = (questionId: number, optionIndex: number, correctIndex: number) => {
    if (answers[questionId] !== undefined) return;
    const next = { ...answers, [questionId]: optionIndex };
    setAnswers(next);

    if (optionIndex === correctIndex) {
      audioEngine.playTone('success');
    } else {
      audioEngine.playTone('error');
    }

    if (Object.keys(next).length === QUIZ_QUESTIONS.length) {
      const total = QUIZ_QUESTIONS.reduce(
        (acc, q) => (next[q.id] === q.correctIndex ? acc + 1 : acc),
        0,
      );
      onCompleteScore(total);
    }
  };

  const handleRetry = () => {
    audioEngine.playTone('click');
    setAnswers({});
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-medium text-sky-400">
              Penilaian Pemahaman · Sains Tingkatan 4
            </div>
            <h2 id="quiz-title" className="font-display mt-1 text-xl font-bold text-white">
              Kuiz Ringkas: Pembangunan dan Banjir (3 Soalan)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kuiz"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-6">
          {QUIZ_QUESTIONS.map((q, qIdx) => {
            const selected = answers[q.id];
            const isAnswered = selected !== undefined;
            const isCorrect = selected === q.correctIndex;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-800 bg-slate-900/65 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold leading-snug text-white">
                    {qIdx + 1}. {q.question}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToStation(q.relatedStation);
                      onClose();
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-medium text-sky-300 transition-colors hover:border-sky-400 cursor-pointer whitespace-nowrap"
                  >
                    <Compass className="h-3 w-3" />
                    <span>Lihat 3D</span>
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isThisSelected = selected === optIdx;
                    const isThisCorrect = optIdx === q.correctIndex;

                    let styleClass =
                      'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-600';
                    if (isAnswered) {
                      if (isThisCorrect) {
                        styleClass = 'border-emerald-500/80 bg-emerald-500/15 text-emerald-200';
                      } else if (isThisSelected && !isThisCorrect) {
                        styleClass = 'border-rose-500/80 bg-rose-500/15 text-rose-200';
                      } else {
                        styleClass = 'border-slate-800/60 bg-slate-950/40 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(q.id, optIdx, q.correctIndex)}
                        className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-xs leading-relaxed transition-colors ${
                          isAnswered ? 'cursor-default' : 'cursor-pointer'
                        } ${styleClass}`}
                      >
                        <span className="font-mono-num mt-0.5 font-semibold text-slate-400">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isAnswered && isThisCorrect && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        )}
                        {isAnswered && isThisSelected && !isThisCorrect && (
                          <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div
                    className={`mt-3 rounded-lg border p-3 text-xs leading-relaxed ${
                      isCorrect
                        ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
                        : 'border-amber-500/30 bg-amber-950/40 text-amber-200'
                    }`}
                  >
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer / Score Summary */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="text-sm text-slate-300">
            {allAnswered ? (
              <span>
                Markah Akhir:{' '}
                <strong className="font-mono-num text-white">
                  {score} / {QUIZ_QUESTIONS.length}
                </strong>{' '}
                {score === 3
                  ? '— Penguasaan Cemerlang!'
                  : score >= 2
                    ? '— Bagus, teruskan meneroka!'
                    : '— Cuba semak semula stesen 3D.'}
              </span>
            ) : (
              <span>
                Dijawab:{' '}
                <strong className="font-mono-num text-white">
                  {answeredCount} / {QUIZ_QUESTIONS.length}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {answeredCount > 0 && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Cuba Semula</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
            >
              Tutup Kuiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
