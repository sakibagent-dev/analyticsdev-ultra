import React from "react";
import { AuditScore } from "../../types/audit";

interface ScoreGaugeProps {
  score: AuditScore;
  showBreakdown?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, showBreakdown = true }) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "B":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "C":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-rose-600 bg-rose-50 border-rose-200";
    }
  };

  const getProgressColor = (val: number, max: number) => {
    const ratio = val / max;
    if (ratio >= 0.8) return "bg-emerald-500";
    if (ratio >= 0.6) return "bg-blue-500";
    if (ratio >= 0.4) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Tracking Health Score
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent algorithmic audit across 7 dimensions
          </p>
        </div>
        <div className={`px-3 py-1 rounded-lg border font-bold text-sm ${getGradeColor(score.grade)}`}>
          GRADE {score.grade}
        </div>
      </div>

      <div className="flex items-baseline gap-2 my-5">
        <span className="text-5xl font-extrabold tracking-tight text-slate-900">
          {score.total}
        </span>
        <span className="text-xl font-medium text-slate-400">/ 100</span>
      </div>

      {showBreakdown && (
        <div className="space-y-3 pt-2">
          {Object.entries(score.categories).map(([key, cat]) => {
            const formattedLabel = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());
            const percent = Math.round((cat.score / cat.max) * 100);

            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{formattedLabel}</span>
                  <span className="font-semibold text-slate-900">
                    {cat.score} <span className="text-slate-400 font-normal">/ {cat.max}</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(cat.score, cat.max)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
