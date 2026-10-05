import React, { useState } from "react";
import { AuditReport } from "../../types/audit";
import { ConsultantProfile } from "../../types/report";
import { PdfGenerator } from "../../report/pdfGenerator";
import { HtmlGenerator } from "../../report/htmlGenerator";
import { JsonExporter } from "../../report/jsonExporter";
import { FileDown, FileText, Code2, Table, Loader2 } from "lucide-react";

interface ReportExportViewProps {
  report: AuditReport;
  consultant: ConsultantProfile;
}

export const ReportExportView: React.FC<ReportExportViewProps> = ({ report, consultant }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadBlob = (content: string | Blob, filename: string, type: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    setDownloading("pdf");
    setTimeout(() => {
      try {
        const doc = PdfGenerator.generate(report, consultant);
        doc.save(`AnalyticsDev_Ultra_${report.website}_${Date.now()}.pdf`);
      } catch (err) {
        console.error("PDF generation failed:", err);
      } finally {
        setDownloading(null);
      }
    }, 100);
  };

  const handleDownloadHtml = () => {
    setDownloading("html");
    const html = HtmlGenerator.generate(report, consultant);
    downloadBlob(html, `AnalyticsDev_Ultra_${report.website}_${Date.now()}.html`, "text/html");
    setDownloading(null);
  };

  const handleDownloadJson = () => {
    setDownloading("json");
    const json = JsonExporter.exportJson(report);
    downloadBlob(json, `AnalyticsDev_Ultra_${report.website}_${Date.now()}.json`, "application/json");
    setDownloading(null);
  };

  const handleDownloadIssuesCsv = () => {
    const csv = JsonExporter.exportIssuesCsv(report);
    downloadBlob(csv, `AnalyticsDev_Ultra_Issues_${report.website}.csv`, "text/csv");
  };

  const handleDownloadEventsCsv = () => {
    const csv = JsonExporter.exportEventsCsv(report);
    downloadBlob(csv, `AnalyticsDev_Ultra_Events_${report.website}.csv`, "text/csv");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <FileDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Client Report Exports & Raw Data</h3>
            <p className="text-xs text-slate-500">
              Generate branded client-ready audits and technical export bundles
            </p>
          </div>
        </div>

        {/* Primary Export Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* PDF Card */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="p-2 rounded-lg bg-emerald-600 text-white w-fit mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Download PDF Audit Report</h4>
              <p className="text-xs text-slate-600 mt-1">
                Executive summary, transparent 100-pt scorecard, conversion matrix, and consultant branding.
              </p>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading === "pdf"}
              className="mt-4 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
            >
              {downloading === "pdf" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" /> Download Client PDF
                </>
              )}
            </button>
          </div>

          {/* HTML Card */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 flex flex-col justify-between">
            <div>
              <div className="p-2 rounded-lg bg-blue-600 text-white w-fit mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Download HTML Standalone</h4>
              <p className="text-xs text-slate-600 mt-1">
                Self-contained interactive report ready to email or host directly for client review.
              </p>
            </div>
            <button
              onClick={handleDownloadHtml}
              className="mt-4 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" /> Download HTML Report
            </button>
          </div>

          {/* JSON Card */}
          <div className="p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 flex flex-col justify-between">
            <div>
              <div className="p-2 rounded-lg bg-purple-600 text-white w-fit mb-3">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Structured JSON Export</h4>
              <p className="text-xs text-slate-600 mt-1">
                Full structured data including raw payloads, identifiers, and technical evidence objects.
              </p>
            </div>
            <button
              onClick={handleDownloadJson}
              className="mt-4 w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" /> Download JSON Model
            </button>
          </div>
        </div>

        {/* CSV Exports */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
            Spreadsheet Data Exports (CSV)
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadIssuesCsv}
              className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-200 transition"
            >
              <Table className="w-4 h-4 text-slate-500" /> Export Issues CSV ({report.issues.length})
            </button>
            <button
              onClick={handleDownloadEventsCsv}
              className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-200 transition"
            >
              <Table className="w-4 h-4 text-slate-500" /> Export Events CSV ({report.events.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
