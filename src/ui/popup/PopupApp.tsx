import React, { useState, useEffect } from "react";
import { AuditReport } from "../../types/audit";
import { ConsultantProfile, DEFAULT_CONSULTANT_PROFILE } from "../../types/report";
import { StorageService } from "../../storage/storageService";
import { ScoreGauge } from "../components/ScoreGauge";
import { PlatformBadge } from "../components/PlatformBadge";
import { ScanProgress, ScanStep } from "../components/ScanProgress";
import { PdfGenerator } from "../../report/pdfGenerator";
import {
  RotateCw,
  ExternalLink,
  ShieldCheck,
  FileDown,
} from "lucide-react";

export const PopupApp: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [consultant, setConsultant] = useState<ConsultantProfile>(DEFAULT_CONSULTANT_PROFILE);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([]);

  useEffect(() => {
    (async () => {
      const history = await StorageService.getAuditHistory();
      if (history.length > 0) {
        setReport(history[0]);
      }
      const profile = await StorageService.getConsultantProfile();
      setConsultant(profile);
    })();
  }, []);

  const handleStartAudit = async () => {
    setIsScanning(true);
    const initialSteps: ScanStep[] = [
      { id: "dom", label: "DOM", completed: false, active: true },
      { id: "scripts", label: "Scripts", completed: false, active: false },
      { id: "datalayer", label: "DataLayer", completed: false, active: false },
      { id: "cookies", label: "Cookies", completed: false, active: false },
      { id: "network", label: "Network", completed: false, active: false },
      { id: "platforms", label: "Platforms", completed: false, active: false },
      { id: "events", label: "Events", completed: false, active: false },
      { id: "report", label: "Report", completed: false, active: false },
    ];
    setScanSteps(initialSteps);

    for (let i = 0; i < initialSteps.length; i++) {
      await new Promise((res) => setTimeout(res, 180));
      setScanSteps((prev) =>
        prev.map((step, idx) => ({
          ...step,
          completed: idx <= i,
          active: idx === i + 1,
        }))
      );
    }

    try {
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: "RUN_AUDIT" }, (response) => {
          if (response && !response.error) {
            setReport(response as AuditReport);
          }
          setIsScanning(false);
        });
      } else {
        setTimeout(() => setIsScanning(false), 300);
      }
    } catch {
      setIsScanning(false);
    }
  };

  const handleOpenDashboard = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const dashboardUrl = chrome.runtime.getURL("dashboard.html");
      chrome.tabs.create({ url: dashboardUrl });
    }
  };

  const handleQuickPdf = () => {
    if (report) {
      const doc = PdfGenerator.generate(report, consultant);
      doc.save(`AnalyticsDev_Ultra_${report.website}.pdf`);
    }
  };

  return (
    <div className="w-[430px] min-h-[580px] bg-slate-50 flex flex-col font-sans text-slate-800 text-xs">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-extrabold text-slate-950 text-sm shadow">
            AU
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">
              AnalyticsDev Ultra
            </h1>
            <span className="text-[10px] text-emerald-400 font-semibold">
              Conversion & Analytics Audit
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenDashboard}
          title="Open Full Screen Audit Dashboard"
          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
        >
          <span>Dashboard</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </header>

      {/* Target & Action Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="truncate max-w-[240px]">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Target Domain</span>
          <span className="font-bold text-slate-800 font-mono text-xs truncate block">
            {report?.website || "Current Web Page"}
          </span>
        </div>

        <button
          onClick={handleStartAudit}
          disabled={isScanning}
          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Scanning..." : "Audit Page"}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 space-y-4">
        {isScanning ? (
          <ScanProgress steps={scanSteps} />
        ) : !report ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm my-6">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Active Audit</p>
            <p className="text-[11px] text-slate-500 mt-1 mb-4">
              Click the button below to audit tracking, pixels, and dataLayer on this page.
            </p>
            <button
              onClick={handleStartAudit}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" /> Start Audit
            </button>
          </div>
        ) : (
          <>
            {/* Quick Score */}
            <ScoreGauge score={report.score} showBreakdown={false} />

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Critical Issues</span>
                <span className={`text-lg font-bold ${report.stats.criticalCount > 0 ? "text-rose-600" : "text-slate-800"}`}>
                  {report.stats.criticalCount}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Platforms Detected</span>
                <span className="text-lg font-bold text-blue-600">
                  {report.stats.platformsDetected}
                </span>
              </div>
            </div>

            {/* Platform Quick List */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Detected Platforms
                </span>
                <span className="text-[10px] text-slate-400">
                  {report.results.filter((r) => r.status !== "not_detected").length} Active
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {report.results
                  .filter((r) => r.category !== "technology" && r.category !== "consent")
                  .slice(0, 6)
                  .map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-50 rounded">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">{r.platform}</span>
                        <span className="text-[10px] text-slate-400">{r.identifiers[0] || r.component}</span>
                      </div>
                      <PlatformBadge status={r.status} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleOpenDashboard}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Full Audit Report</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleQuickPdf}
                title="Download PDF"
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
