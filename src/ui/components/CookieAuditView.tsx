import React from "react";
import { CookieCollectionItem } from "../../types/detection";
import { Cookie, ShieldCheck, AlertTriangle } from "lucide-react";

interface CookieAuditViewProps {
  cookies: CookieCollectionItem[];
}

export const CookieAuditView: React.FC<CookieAuditViewProps> = ({ cookies }) => {
  const metaCookies = cookies.filter((c) => c.name === "_fbp" || c.name === "_fbc");
  const googleCookies = cookies.filter((c) => c.name.startsWith("_ga") || c.name.startsWith("_gcl"));
  const tiktokCookies = cookies.filter((c) => c.name === "_ttp");

  return (
    <div className="space-y-6">
      {/* Cookie Health Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Cookie Health & Attribution Inventory</h3>
            <p className="text-xs text-slate-500">Inspection of first-party cookies available to the audited domain</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">Meta Attribution Cookies</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {metaCookies.map((c) => c.name).join(", ") || "None Detected"}
            </span>
            <span className="text-[11px] text-slate-400">_fbp: 1st party browser, _fbc: click attribution</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">Google Analytics / Ads</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {googleCookies.map((c) => c.name).join(", ") || "None Detected"}
            </span>
            <span className="text-[11px] text-slate-400">_ga: client id, _gcl: conversion linker</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">TikTok Analytics</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {tiktokCookies.map((c) => c.name).join(", ") || "None Detected"}
            </span>
            <span className="text-[11px] text-slate-400">_ttp: user identification</span>
          </div>
        </div>
      </div>

      {/* Cookies Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            All Domain Cookies ({cookies.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Domain</th>
                <th className="py-2.5 px-4">Secure</th>
                <th className="py-2.5 px-4">HttpOnly</th>
                <th className="py-2.5 px-4">SameSite</th>
                <th className="py-2.5 px-4">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cookies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No cookies found for current domain.
                  </td>
                </tr>
              ) : (
                cookies.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-4 capitalize text-slate-600">{c.category || "unknown"}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{c.domain}</td>
                    <td className="py-2.5 px-4">
                      {c.secure ? (
                        <span className="text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-amber-600 inline-flex items-center gap-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> No
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{c.httpOnly ? "Yes" : "No"}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">{c.sameSite}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {c.expires ? new Date(c.expires * 1000).toLocaleDateString() : "Session"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
