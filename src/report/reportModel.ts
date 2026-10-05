import { AuditReport } from "../types/audit";
import { ConsultantProfile } from "../types/report";

export interface PreparedReportData {
  report: AuditReport;
  consultant: ConsultantProfile;
  executiveSummary: string;
  actionPlan: Array<{ priority: number; task: string; impact: string }>;
}

export class ReportModel {
  public static prepare(report: AuditReport, consultant: ConsultantProfile): PreparedReportData {
    const criticalIssues = report.issues.filter((i) => i.severity === "critical");
    const highIssues = report.issues.filter((i) => i.severity === "high");

    const executiveSummary = `An automated technical tracking audit was conducted on ${report.website} on ${report.auditDate}. The website achieved an overall Tracking Health Score of ${report.score.total}/100 (Grade ${report.score.grade}). A total of ${report.stats.platformsDetected} tracking platform(s) and ${report.stats.eventsDetected} tracked event action(s) were observed. The audit identified ${criticalIssues.length} critical issue(s) and ${highIssues.length} high-priority optimization opportunity(ies) impacting attribution reliability, deduplication, and privacy compliance.`;

    const actionPlan: Array<{ priority: number; task: string; impact: string }> = [];
    let priorityCounter = 1;

    report.issues.slice(0, 5).forEach((issue) => {
      actionPlan.push({
        priority: priorityCounter++,
        task: `${issue.title}: ${issue.recommendation}`,
        impact: issue.impact,
      });
    });

    return {
      report,
      consultant,
      executiveSummary,
      actionPlan,
    };
  }
}
