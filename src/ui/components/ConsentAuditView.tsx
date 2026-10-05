import React from "react";
import { ConsentAudit } from "../../types/audit";
import { ShieldCheck, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface ConsentAuditViewProps {
  consent: ConsentAudit;
}

export const ConsentAuditView: React.FC<ConsentAuditViewProps> = ({ consent }) => {
  const signalEntries = Object.entries(consent.consentModeSignals);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Consent Management & Privacy Audit</h3>
            <p className="text-xs text-slate-500">Evaluation of CMPs, consent banners, and Google Consent Mode signals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">Consent Management Platform</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {consent.cmpDetected ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {consent.cmpDetected}
                </span>
              ) : (
                <span className="text-slate-400">None Recognized</span>
              )}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">Google Consent Mode</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {consent.consentModeV2 ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Consent Mode v2 (Active)
                </span>
              ) : signalEntries.length > 0 ? (
                <span className="text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Consent Mode v1 (Legacy)
                </span>
              ) : (
                <span className="text-slate-400">Not Detected</span>
              )}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block">Banner / Dialog Observable</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {consent.bannerObservable ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Observable Signals Table */}
        {signalEntries.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Captured Google Consent Signals
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {signalEntries.map(([key, val]) => (
                <div key={key} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-mono">
                  <span className="text-slate-500 block text-[11px]">{key}</span>
                  <span className={`font-bold ${val === "granted" ? "text-emerald-600" : "text-amber-600"}`}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Disclaimer Box */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="block font-bold mb-0.5">Legal Notice & Audit Scope:</strong>
            {consent.disclaimer} Technical presence of a CMP does not guarantee legal GDPR/ePrivacy compliance, cookie categorizations, or actual prior-consent blocking logic before user interaction.
          </div>
        </div>
      </div>
    </div>
  );
};
