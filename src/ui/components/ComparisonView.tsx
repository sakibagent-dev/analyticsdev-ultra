import React, { useState } from "react";
import { AuditReport, AuditComparison } from "../../types/audit";
import { AuditHistoryManager } from "../../storage/auditHistory";
import { ArrowRight, TrendingUp, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";

interface ComparisonViewProps {
  currentReport: AuditReport;
  savedAudits: AuditReport[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ currentReport, savedAudits }) => {
  const previousAudits = savedAudits.filter((a) => a.id !== currentReport.id);
  const [selectedBeforeId, setSelectedBeforeId] = useState<string>(
    previousAudits.length > 0 ? previousAudits[0].id : ""
  );

  const beforeReport = previousAudits.find((a) => a.id === selectedBeforeId);
  const comparison: AuditComparison | null = beforeReport
    ? AuditHistoryManager.compare(beforeReport, currentReport)
    : null;

  if (previousAudits.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 text-sm">No Previous Audits Available to Compare</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Perform multiple audits over time or after fixing website tracking errors to visualize score improvements, resolved issues, and new events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Before / After Audit Comparison</h3>
            <p className="text-xs text-slate-500">Measure optimization progress and client deliverable ROI</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Compare With:</span>
            <select
              value={selectedBeforeId}
              onChange={(e) => setSelectedBeforeId(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 bg-white text-slate-800 font-medium"
            >
              {previousAudits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.auditDate} (Score: {a.score.total})
                </option>
              ))}
            </select>
          </div>
        </div>

        {comparison && (
          <div className="mt-6 space-y-6">
            {/* Score Delta Banner */}
            <div className="flex flex-wrap items-center justify-center gap-8 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-xs font-semibold text-slate-500 block uppercase">Before Score</span>
                <span className="text-3xl font-extrabold text-slate-700">{comparison.scoreBefore}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{comparison.beforeDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="w-6 h-6 text-slate-400" />
                <div className={`px-4 py-2 rounded-xl font-extrabold text-lg flex items-center gap-1.5 ${
                  comparison.scoreDiff >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
                  <TrendingUp className="w-5 h-5" />
                  {comparison.scoreDiff >= 0 ? `+${comparison.scoreDiff}` : comparison.scoreDiff} Points
                </div>
                <ArrowRight className="w-6 h-6 text-slate-400" />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 block uppercase">After Score</span>
                <span className="text-3xl font-extrabold text-emerald-600">{comparison.scoreAfter}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{comparison.afterDate}</span>
              </div>
            </div>

            {/* Resolved vs Remaining Issues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Fixed / Resolved Issues ({comparison.fixedIssues.length})
                </h4>
                {comparison.fixedIssues.length === 0 ? (
                  <p className="text-xs text-slate-400">No issues resolved yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-emerald-800">
                    {comparison.fixedIssues.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Remaining Open Issues ({comparison.remainingIssues.length})
                </h4>
                {comparison.remainingIssues.length === 0 ? (
                  <p className="text-xs text-slate-400">All previous issues resolved!</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-amber-800">
                    {comparison.remainingIssues.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span> {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
