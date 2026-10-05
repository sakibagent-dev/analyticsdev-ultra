import React from "react";
import { ServerSideAudit } from "../../types/audit";
import { Server, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { PlatformBadge } from "./PlatformBadge";

interface ServerSideAuditViewProps {
  serverSide: ServerSideAudit;
}

export const ServerSideAuditView: React.FC<ServerSideAuditViewProps> = ({ serverSide }) => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Server-Side Tracking Architecture</h3>
              <p className="text-xs text-slate-500">Observable first-party proxy and server-side tag evaluation</p>
            </div>
          </div>
          <PlatformBadge status={serverSide.status} confidence={serverSide.confidence} />
        </div>

        {/* Observable Signals Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">First-Party Endpoints</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {serverSide.firstPartyEndpoints.length > 0 ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> {serverSide.firstPartyEndpoints.length} Endpoint(s)
                </span>
              ) : (
                <span className="text-slate-400">None Observed</span>
              )}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">Server GTM / Custom Domain</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {serverSide.customSubdomains.length > 0 ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> {serverSide.customSubdomains.join(", ")}
                </span>
              ) : (
                <span className="text-slate-400">Default 3rd-party GTM</span>
              )}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">Browser Deduplication event_id</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {serverSide.eventDeduplicationObserved ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Passed in Browser
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Missing / Unobserved
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Technical Boundary Disclaimer */}
        <div className="mt-6 bg-purple-50/60 border border-purple-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-purple-900 text-xs uppercase tracking-wider">
                Non-Negotiable Architecture Rule & Browser Boundary
              </h4>
              <p className="text-xs text-purple-800 mt-1 leading-relaxed">
                {serverSide.disclaimer}
              </p>
              <div className="mt-3 pt-3 border-t border-purple-200/80">
                <span className="text-[11px] font-bold text-purple-900 block mb-1">
                  Verification Requires Explicit Account Access:
                </span>
                <ul className="list-disc list-inside text-xs text-purple-800 space-y-0.5">
                  {serverSide.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
