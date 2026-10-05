import React from "react";
import { DetectionStatus } from "../../types/detection";
import { CheckCircle2, AlertTriangle, Key, XCircle, AlertOctagon } from "lucide-react";

interface PlatformBadgeProps {
  status: DetectionStatus;
  confidence?: number;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ status, confidence }) => {
  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified</span>
          {confidence !== undefined && <span className="opacity-75 font-normal">({confidence}%)</span>}
        </span>
      );

    case "detected":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Detected</span>
          {confidence !== undefined && <span className="opacity-75 font-normal">({confidence}%)</span>}
        </span>
      );

    case "possible":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Possible</span>
          {confidence !== undefined && <span className="opacity-75 font-normal">({confidence}%)</span>}
        </span>
      );

    case "requires_access":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Key className="w-3.5 h-3.5 text-purple-600" />
          <span>Requires Access</span>
        </span>
      );

    case "error":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          <span>Error</span>
        </span>
      );

    case "not_detected":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
          <XCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Not Detected</span>
        </span>
      );
  }
};
