import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export interface ScanStep {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

interface ScanProgressProps {
  steps: ScanStep[];
}

export const ScanProgress: React.FC<ScanProgressProps> = ({ steps }) => {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-xl font-mono text-sm max-w-md mx-auto my-8 border border-slate-800">
      <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        <span className="font-semibold text-emerald-400">Scanning website technical signals...</span>
      </div>
      <div className="space-y-2.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between">
            <span className={step.completed ? "text-slate-300" : step.active ? "text-emerald-300 font-bold" : "text-slate-600"}>
              {step.label.padEnd(12, ".")}
            </span>
            <span>
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
              ) : step.active ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin inline" />
              ) : (
                <span className="text-slate-600 text-xs">pending</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
