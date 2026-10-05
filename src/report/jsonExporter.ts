import { AuditReport } from "../types/audit";

export class JsonExporter {
  public static exportJson(report: AuditReport): string {
    return JSON.stringify(report, null, 2);
  }

  public static exportIssuesCsv(report: AuditReport): string {
    const headers = ["Severity", "Title", "Category", "Platform", "Finding", "Impact", "Recommendation"];
    const rows = report.issues.map((i) => [
      `"${i.severity}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.category.replace(/"/g, '""')}"`,
      `"${(i.platform || "").replace(/"/g, '""')}"`,
      `"${i.finding.replace(/"/g, '""')}"`,
      `"${i.impact.replace(/"/g, '""')}"`,
      `"${i.recommendation.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  public static exportEventsCsv(report: AuditReport): string {
    const headers = ["Event", "Platform", "Browser", "Server Signal", "Event ID", "Transaction ID", "Status"];
    const rows = report.events.map((e) => [
      `"${e.event}"`,
      `"${e.platform}"`,
      e.browser ? "true" : "false",
      e.serverSignal ? "true" : "false",
      `"${e.eventId || ""}"`,
      `"${e.transactionId || ""}"`,
      `"${e.status}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  public static exportPlatformsCsv(report: AuditReport): string {
    const headers = ["Platform", "Component", "Status", "Confidence", "Identifiers", "Events"];
    const rows = report.results.map((r) => [
      `"${r.platform}"`,
      `"${r.component}"`,
      `"${r.status}"`,
      r.confidence,
      `"${r.identifiers.join("; ")}"`,
      `"${r.events.join("; ")}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}
