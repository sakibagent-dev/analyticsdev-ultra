import React, { useState } from "react";
import { AuditIssue } from "../../types/audit";
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";

interface IssuesListProps {
  issues: AuditIssue[];
  mode: "client" | "technical";
}

export const IssuesList: React.FC<IssuesListProps> = ({ issues, mode }) => {
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIssues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSeverityBadge = (sev: AuditIssue["severity"]) => {
    switch (sev) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <AlertCircle className="w-3.5 h-3.5" /> HIGH
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3.5 h-3.5" /> INFO
          </span>
        );
    }
  };

  if (issues.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center text-emerald-800">
        <p className="font-bold text-base">Outstanding Implementation Quality</p>
        <p className="text-xs text-emerald-600 mt-1">
          No critical errors or severe duplicate tracking risks were identified during this audit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {issues.map((issue) => {
        const isExpanded = expandedIssues[issue.id] || mode === "technical";

        return (
          <div
            key={issue.id}
            className={`bg-white rounded-xl border transition-shadow shadow-sm overflow-hidden ${
              issue.severity === "critical"
                ? "border-rose-200 hover:shadow-rose-50"
                : issue.severity === "high"
                ? "border-orange-200 hover:shadow-orange-50"
                : "border-slate-200 hover:shadow-md"
            }`}
          >
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {getSeverityBadge(issue.severity)}
                  <h4 className="font-bold text-slate-900 text-sm">{issue.title}</h4>
                </div>
                {issue.platform && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {issue.platform}
                  </span>
                )}
              </div>

              {/* Finding & Impact */}
              <div className="mt-4 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Observed Finding: </span>
                  <span className="text-slate-600">{issue.finding}</span>
                </div>
                <div>
                  <span className="font-semibold text-rose-700">Business Impact: </span>
                  <span className="text-slate-700 font-medium">{issue.impact}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-3">
                  <span className="font-bold text-emerald-900 block mb-0.5">Recommended Action:</span>
                  <span className="text-emerald-800 text-xs">{issue.recommendation}</span>
                </div>
              </div>

              {/* Technical Mode Toggle for Evidence */}
              {issue.evidence.length > 0 && mode === "client" && (
                <button
                  onClick={() => toggleExpand(issue.id)}
                  className="mt-3 text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 focus:outline-none"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {isExpanded ? "Hide Technical Evidence" : `View Technical Evidence (${issue.evidence.length})`}
                </button>
              )}

              {/* Technical Evidence Accordion */}
              {isExpanded && issue.evidence.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Supporting Technical Evidence
                  </h5>
                  <div className="space-y-1.5">
                    {issue.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs font-mono text-slate-700"
                      >
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-bold uppercase text-slate-600">[{ev.type}]</span>
                          {ev.source && <span>Source: {ev.source}</span>}
                        </div>
                        <p className="font-sans text-xs text-slate-800">{ev.description}</p>
                        {ev.value && (
                          <div className="mt-1 bg-white p-1 rounded border border-slate-200 text-[11px] text-slate-600 break-all">
                            {ev.value}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
