import { AuditReport, AuditComparison } from "../types/audit";
import { StorageService } from "./storageService";

export class AuditHistoryManager {
  public static async getAll(): Promise<AuditReport[]> {
    return StorageService.getAuditHistory();
  }

  public static async save(report: AuditReport): Promise<void> {
    return StorageService.saveAudit(report);
  }

  public static async delete(id: string): Promise<void> {
    return StorageService.deleteAudit(id);
  }

  /**
   * Compares two audits (Before vs After) for client deliverables.
   */
  public static compare(before: AuditReport, after: AuditReport): AuditComparison {
    const scoreDiff = after.score.total - before.score.total;

    const beforeIssueIds = new Set(before.issues.map((i) => i.id));
    const afterIssueIds = new Set(after.issues.map((i) => i.id));

    const fixedIssues = before.issues
      .filter((i) => !afterIssueIds.has(i.id))
      .map((i) => i.title);

    const newIssues = after.issues
      .filter((i) => !beforeIssueIds.has(i.id))
      .map((i) => i.title);

    const remainingIssues = after.issues
      .filter((i) => beforeIssueIds.has(i.id))
      .map((i) => i.title);

    const beforeEventNames = new Set(before.events.map((e) => `${e.platform}_${e.event}`));
    const eventsAdded = after.events
      .filter((e) => !beforeEventNames.has(`${e.platform}_${e.event}`))
      .map((e) => `${e.platform}: ${e.event}`);

    const summary = scoreDiff >= 0
      ? `Tracking health score improved by +${scoreDiff} points (from ${before.score.total} to ${after.score.total}). Resolved ${fixedIssues.length} critical/warning issue(s).`
      : `Tracking health score changed by ${scoreDiff} points (from ${before.score.total} to ${after.score.total}). Review ${newIssues.length} newly identified issue(s).`;

    return {
      beforeAuditId: before.id,
      afterAuditId: after.id,
      website: after.website,
      beforeDate: before.auditDate,
      afterDate: after.auditDate,
      scoreBefore: before.score.total,
      scoreAfter: after.score.total,
      scoreDiff,
      fixedIssues,
      newIssues,
      remainingIssues,
      eventsAdded,
      summary,
    };
  }
}
