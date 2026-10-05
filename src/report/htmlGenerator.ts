import { AuditReport } from "../types/audit";
import { ConsultantProfile } from "../types/report";
import { ReportModel } from "./reportModel";

export class HtmlGenerator {
  public static generate(report: AuditReport, consultant: ConsultantProfile): string {
    const prepared = ReportModel.prepare(report, consultant);

    const issuesHtml = report.issues.map((issue) => `
      <div class="issue-card severity-${issue.severity}">
        <div class="issue-header">
          <span class="badge badge-${issue.severity}">${issue.severity.toUpperCase()}</span>
          <h3>${issue.title}</h3>
        </div>
        <div class="issue-grid">
          <div><strong>Finding:</strong> ${issue.finding}</div>
          <div><strong>Business Impact:</strong> ${issue.impact}</div>
          <div><strong>Recommendation:</strong> ${issue.recommendation}</div>
        </div>
      </div>
    `).join("");

    const platformsHtml = report.results.map((r) => `
      <tr>
        <td><strong>${r.platform}</strong></td>
        <td>${r.component}</td>
        <td><span class="badge badge-status-${r.status}">${r.status.toUpperCase()}</span></td>
        <td>${r.confidence}%</td>
        <td><code>${r.identifiers.join(", ") || "None"}</code></td>
        <td>${r.events.join(", ") || "None"}</td>
      </tr>
    `).join("");

    const eventsHtml = report.events.map((e) => `
      <tr>
        <td><strong>${e.event}</strong></td>
        <td>${e.platform}</td>
        <td>${e.browser ? "✓" : "—"}</td>
        <td>${e.serverSignal ? "✓" : "—"}</td>
        <td>${e.eventId || "—"}</td>
        <td>${e.transactionId || "—"}</td>
        <td><span class="badge badge-status-${e.status}">${e.status.toUpperCase()}</span></td>
      </tr>
    `).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tracking & Conversion Audit — ${report.website}</title>
  <style>
    :root {
      --primary: ${consultant.brandColor || "#059669"};
      --navy: #0f172a;
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #e2e8f0;
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: #334155; margin: 0; padding: 40px 20px; line-height: 1.5; }
    .container { max-width: 1000px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 40px; }
    header { border-bottom: 2px solid var(--border); padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { color: var(--navy); font-size: 26px; margin: 0 0 6px 0; }
    .consultant-meta { color: #64748b; font-size: 13px; text-align: right; }
    .score-badge { background: #f0fdf4; border: 2px solid var(--primary); color: var(--primary); padding: 12px 24px; border-radius: 10px; text-align: center; font-size: 32px; font-weight: 800; }
    .score-grade { font-size: 13px; font-weight: 600; text-transform: uppercase; color: #475569; }
    .section-title { font-size: 18px; color: var(--navy); border-bottom: 1px solid var(--border); padding-bottom: 8px; margin: 32px 0 16px 0; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; border-bottom: 2px solid var(--border); color: #1e293b; }
    td { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #e0f2fe; color: #075985; }
    .badge-status-verified { background: #dcfce7; color: #166534; }
    .badge-status-detected { background: #dbeafe; color: #1e40af; }
    .badge-status-possible { background: #fef3c7; color: #92400e; }
    .badge-status-requires_access { background: #ede9fe; color: #5b21b6; }
    .badge-status-not_detected { background: #f1f5f9; color: #64748b; }
    .issue-card { border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fafafa; }
    .issue-card.severity-critical { border-left: 5px solid #ef4444; }
    .issue-card.severity-high { border-left: 5px solid #f97316; }
    .issue-card.severity-medium { border-left: 5px solid #f59e0b; }
    .issue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .issue-header h3 { margin: 0; font-size: 15px; color: var(--navy); }
    .issue-grid { display: grid; gap: 8px; font-size: 13px; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Website Tracking & Conversion Audit</h1>
        <p style="margin: 0; color: #64748b;">Target: <strong>${report.website}</strong> &bull; Date: ${report.auditDate}</p>
      </div>
      <div class="consultant-meta">
        <strong>${consultant.name}</strong><br>
        ${consultant.title}<br>
        ${consultant.email} &bull; ${consultant.phone}
      </div>
    </header>

    <div style="display: flex; gap: 30px; align-items: center; margin-bottom: 24px;">
      <div class="score-badge">
        ${report.score.total}<span style="font-size: 18px; color: #94a3b8;">/100</span>
        <div class="score-grade">GRADE ${report.score.grade}</div>
      </div>
      <div style="flex: 1; font-size: 14px; color: #475569;">
        <p>${prepared.executiveSummary}</p>
      </div>
    </div>

    <h2 class="section-title">Platform Audit & Implementation Status</h2>
    <table>
      <thead>
        <tr><th>Platform</th><th>Component</th><th>Status</th><th>Confidence</th><th>Identifiers</th><th>Events</th></tr>
      </thead>
      <tbody>
        ${platformsHtml}
      </tbody>
    </table>

    <h2 class="section-title">Universal Conversion & Event Audit</h2>
    <table>
      <thead>
        <tr><th>Event</th><th>Platform</th><th>Browser</th><th>Server Signal</th><th>Event ID</th><th>Transaction ID</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${eventsHtml}
      </tbody>
    </table>

    <h2 class="section-title">Audit Findings & Strategic Recommendations</h2>
    ${issuesHtml}

    <h2 class="section-title">Server-Side Tracking Architecture</h2>
    <p style="font-size: 13px; color: #475569;">${report.serverSide.disclaimer}</p>
    <p style="font-size: 13px; color: #64748b;"><strong>Required Container Access:</strong> ${report.serverSide.requirements.join("; ")}.</p>

    <footer>
      ${consultant.reportFooter} &bull; Generated by AnalyticsDev Ultra
    </footer>
  </div>
</body>
</html>`;
  }
}
