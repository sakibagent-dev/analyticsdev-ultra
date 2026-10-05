import React, { useState, useEffect } from "react";
import { AuditReport } from "../../types/audit";
import { ConsultantProfile, DEFAULT_CONSULTANT_PROFILE } from "../../types/report";
import { StorageService } from "../../storage/storageService";
import { ScoreGauge } from "../components/ScoreGauge";
import { StatCard } from "../components/StatCard";
import { PlatformBadge } from "../components/PlatformBadge";
import { UniversalEventTable } from "../components/UniversalEventTable";
import { IssuesList } from "../components/IssuesList";
import { DataLayerInspectorView } from "../components/DataLayerInspectorView";
import { CookieAuditView } from "../components/CookieAuditView";
import { ServerSideAuditView } from "../components/ServerSideAuditView";
import { ConsentAuditView } from "../components/ConsentAuditView";
import { ComparisonView } from "../components/ComparisonView";
import { ReportExportView } from "../components/ReportExportView";
import { SettingsView } from "../components/SettingsView";
import { ScanProgress, ScanStep } from "../components/ScanProgress";
import {
  ShieldCheck,
  Activity,
  Layers,
  Database,
  Cookie,
  Server,
  Cpu,
  AlertCircle,
  FileDown,
  Settings,
  GitCompare,
  RotateCw,
  Laptop,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

export const DashboardApp: React.FC = () => {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [savedAudits, setSavedAudits] = useState<AuditReport[]>([]);
  const [consultant, setConsultant] = useState<ConsultantProfile>(DEFAULT_CONSULTANT_PROFILE);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [mode, setMode] = useState<"client" | "technical">("technical");
  const [isScanning, setIsScanning] = useState(false);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([]);

  useEffect(() => {
    // Load initial data
    (async () => {
      const history = await StorageService.getAuditHistory();
      setSavedAudits(history);
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
      { id: "analysis", label: "Analysis", completed: false, active: false },
      { id: "report", label: "Report", completed: false, active: false },
    ];
    setScanSteps(initialSteps);

    // Progress animation runner
    for (let i = 0; i < initialSteps.length; i++) {
      await new Promise((res) => setTimeout(res, 200));
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
            StorageService.getAuditHistory().then(setSavedAudits);
          } else {
            console.error("Audit error:", response?.error);
          }
          setIsScanning(false);
        });
      } else {
        // Fallback for preview / dev environment
        setTimeout(() => setIsScanning(false), 300);
      }
    } catch {
      setIsScanning(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "platforms", label: "Platforms", icon: Layers },
    { id: "events", label: "Events", icon: ShieldCheck },
    { id: "datalayer", label: "DataLayer", icon: Database },
    { id: "cookies", label: "Cookies", icon: Cookie },
    { id: "consent", label: "Consent", icon: ShieldCheck },
    { id: "serverside", label: "Server-side", icon: Server },
    { id: "technology", label: "Technology", icon: Cpu },
    { id: "issues", label: "Issues & Recs", icon: AlertCircle, count: report?.issues.length },
    { id: "comparison", label: "Compare", icon: GitCompare },
    { id: "exports", label: "Reports", icon: FileDown },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top SaaS Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon48.png"
              alt="AnalyticsDev Ultra Logo"
              className="w-9 h-9 rounded-lg shadow-sm object-contain bg-white/10 p-0.5 border border-emerald-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">AnalyticsDev Ultra</span>
                <span className="text-[11px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                  ULTRA AUDIT SUITE
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Created by <strong className="text-emerald-400 font-semibold">Analytics Dev Founder Sakib Hossain</strong>
              </span>
            </div>
          </div>

          {/* Center Target Info */}
          {report && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Audited Target:</span>
              <span className="font-bold text-white font-mono">{report.website}</span>
              <span className="text-slate-500">&bull;</span>
              <span>{report.auditDate}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Client Mode vs Technical Mode */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setMode("client")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                  mode === "client" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Client Mode
              </button>
              <button
                onClick={() => setMode("technical")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                  mode === "technical" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <Laptop className="w-3.5 h-3.5" /> Technical Mode
              </button>
            </div>

            <button
              onClick={handleStartAudit}
              disabled={isScanning}
              className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning..." : "Start Audit"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm space-y-0.5 sticky top-22">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 min-w-0">
          {isScanning ? (
            <ScanProgress steps={scanSteps} />
          ) : !report ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-800">No Technical Audit Performed Yet</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                Open a website in your browser and click "Start Audit" to inspect DOM scripts, runtime globals, dataLayer events, cookies, and network tracking beacons.
              </p>
              <button
                onClick={handleStartAudit}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-2 shadow"
              >
                <RotateCw className="w-4 h-4" /> Start Complete Audit
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Tracking Health"
                      value={`${report.score.total} / 100`}
                      subtext={`Grade ${report.score.grade}`}
                      icon={Activity}
                      variant="emerald"
                    />
                    <StatCard
                      label="Critical Issues"
                      value={report.stats.criticalCount}
                      subtext="Requires immediate fix"
                      icon={AlertCircle}
                      variant={report.stats.criticalCount > 0 ? "rose" : "slate"}
                    />
                    <StatCard
                      label="Platforms Detected"
                      value={report.stats.platformsDetected}
                      subtext="Ad & analytics components"
                      icon={Layers}
                      variant="blue"
                    />
                    <StatCard
                      label="Events Detected"
                      value={report.stats.eventsDetected}
                      subtext="Browser & conversion signals"
                      icon={ShieldCheck}
                      variant="amber"
                    />
                  </div>

                  {/* Main Overview Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <ScoreGauge score={report.score} />
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      {/* Priority Issues Preview */}
                      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-slate-800 text-sm">Key Findings & Immediate Actions</h3>
                          <button
                            onClick={() => setActiveTab("issues")}
                            className="text-xs text-emerald-600 font-semibold hover:underline"
                          >
                            View All ({report.issues.length})
                          </button>
                        </div>
                        <IssuesList issues={report.issues.slice(0, 3)} mode={mode} />
                      </div>

                      {/* Platforms Preview */}
                      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-slate-800 text-sm">Active Tracking Platforms</h3>
                          <button
                            onClick={() => setActiveTab("platforms")}
                            className="text-xs text-emerald-600 font-semibold hover:underline"
                          >
                            Deep Dive
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {report.results
                            .filter((r) => r.category !== "technology" && r.category !== "consent")
                            .slice(0, 6)
                            .map((r, i) => (
                              <div
                                key={i}
                                className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-800 text-xs block">{r.platform}</span>
                                  <span className="text-[11px] text-slate-500">{r.component}</span>
                                </div>
                                <PlatformBadge status={r.status} />
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PLATFORMS */}
              {activeTab === "platforms" && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">
                    Audited Tracking & Advertising Platforms ({report.results.length})
                  </h3>
                  <div className="space-y-4">
                    {report.results.map((r, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-sm text-slate-900">{r.platform}</span>
                            <span className="text-xs text-slate-500 ml-2">({r.component})</span>
                          </div>
                          <PlatformBadge status={r.status} confidence={r.confidence} />
                        </div>

                        {r.identifiers.length > 0 && (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-600">Identifiers / IDs: </span>
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {r.identifiers.join(", ")}
                            </span>
                          </div>
                        )}

                        {r.events.length > 0 && (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-600">Observed Events: </span>
                            <span className="text-slate-800">{r.events.join(", ")}</span>
                          </div>
                        )}

                        {r.warnings.length > 0 && (
                          <div className="space-y-1">
                            {r.warnings.map((w, wi) => (
                              <div key={wi} className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {r.notes.length > 0 && (
                          <div className="text-xs text-slate-500 italic">
                            {r.notes.join(" • ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: EVENTS */}
              {activeTab === "events" && <UniversalEventTable events={report.events} />}

              {/* TAB 4: DATALAYER */}
              {activeTab === "datalayer" && <DataLayerInspectorView dataLayer={report.dataLayer} />}

              {/* TAB 5: COOKIES */}
              {activeTab === "cookies" && <CookieAuditView cookies={report.cookies} />}

              {/* TAB 6: CONSENT */}
              {activeTab === "consent" && <ConsentAuditView consent={report.consent} />}

              {/* TAB 7: SERVERSIDE */}
              {activeTab === "serverside" && <ServerSideAuditView serverSide={report.serverSide} />}

              {/* TAB 8: TECHNOLOGY */}
              {activeTab === "technology" && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-800 text-sm">Technology & CMS Stack Detection</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 block uppercase">Content Management System</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {report.technology.cms.join(", ") || "Custom / Unknown"}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 block uppercase">Ecommerce Engine</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {report.technology.ecommerce.join(", ") || "None Recognized"}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 block uppercase">Frontend Frameworks</span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {report.technology.frameworks.join(", ") || "Vanilla / Static"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: ISSUES & RECS */}
              {activeTab === "issues" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Prioritized Audit Recommendations</h3>
                      <p className="text-xs text-slate-500">Every issue is validated with observable technical evidence</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      Total Issues: {report.issues.length}
                    </span>
                  </div>
                  <IssuesList issues={report.issues} mode={mode} />
                </div>
              )}

              {/* TAB 10: COMPARISON */}
              {activeTab === "comparison" && (
                <ComparisonView currentReport={report} savedAudits={savedAudits} />
              )}

              {/* TAB 11: EXPORTS */}
              {activeTab === "exports" && (
                <ReportExportView report={report} consultant={consultant} />
              )}

              {/* TAB 12: SETTINGS */}
              {activeTab === "settings" && (
                <SettingsView consultant={consultant} onUpdate={setConsultant} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* SaaS Footer */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/icons/icon16.png" alt="Logo" className="w-4 h-4 object-contain" />
            <span className="font-semibold text-white">AnalyticsDev Ultra</span>
            <span className="text-slate-600">&bull;</span>
            <span>Enterprise Tracking & Conversion Audit Platform</span>
          </div>
          <div>
            Created with excellence by <span className="text-emerald-400 font-semibold">Analytics Dev Founder Sakib Hossain</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
