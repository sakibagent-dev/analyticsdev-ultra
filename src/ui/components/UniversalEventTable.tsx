import React, { useState } from "react";
import { UniversalEvent } from "../../types/audit";
import { Check, X, AlertCircle } from "lucide-react";

interface UniversalEventTableProps {
  events: UniversalEvent[];
}

export const UniversalEventTable: React.FC<UniversalEventTableProps> = ({ events }) => {
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const platforms = Array.from(new Set(events.map((e) => e.platform)));

  const filtered = filterPlatform === "all"
    ? events
    : events.filter((e) => e.platform === filterPlatform);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Universal Event Audit Matrix</h3>
          <p className="text-xs text-slate-500">Cross-platform browser and server-side conversion mapping</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Filter Platform:</label>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Platforms ({events.length})</option>
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold text-[11px]">
              <th className="py-3 px-4">Event</th>
              <th className="py-3 px-4">Platform</th>
              <th className="py-3 px-4 text-center">Browser</th>
              <th className="py-3 px-4 text-center">Server Signal</th>
              <th className="py-3 px-4">Event ID (Dedup)</th>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Value / Currency</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No standard or custom events detected.
                </td>
              </tr>
            ) : (
              filtered.map((ev, idx) => (
                <tr key={`${ev.platform}_${ev.event}_${idx}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {ev.event}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{ev.platform}</td>
                  <td className="py-3 px-4 text-center">
                    {ev.browser ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {ev.serverSignal ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {ev.eventId ? (
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {ev.eventId}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {ev.transactionId ? (
                      <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {ev.transactionId}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {ev.value !== undefined ? `${ev.value} ${ev.currency || ""}` : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    {ev.status === "verified" && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Verified
                      </span>
                    )}
                    {ev.status === "detected" && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                        Detected
                      </span>
                    )}
                    {ev.status === "warning" && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Warning
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
