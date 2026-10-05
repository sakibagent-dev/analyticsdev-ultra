import { DetectionResult, Evidence } from "../types/detection";

export interface EvidenceSummary {
  totalEvidenceCount: number;
  byType: Record<string, number>;
  allEvidence: Evidence[];
}

export class EvidenceEngine {
  /**
   * Aggregates and indexes all evidence collected across all detectors.
   */
  public static aggregate(results: DetectionResult[]): EvidenceSummary {
    const allEvidence: Evidence[] = [];
    const byType: Record<string, number> = {};

    results.forEach((res) => {
      res.evidence.forEach((ev) => {
        allEvidence.push(ev);
        byType[ev.type] = (byType[ev.type] || 0) + 1;
      });
    });

    return {
      totalEvidenceCount: allEvidence.length,
      byType,
      allEvidence,
    };
  }
}
