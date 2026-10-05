import { AuditContext, DetectionResult } from "../types/detection";
import { AuditReport, TechnologyAudit, ConsentAudit } from "../types/audit";
import { DetectionEngine } from "./detectionEngine";
import { ValidationEngine } from "./validationEngine";
import { ScoringEngine } from "./scoringEngine";
import { RecommendationEngine } from "./recommendationEngine";

export class AuditEngine {
  private detectionEngine: DetectionEngine;

  constructor() {
    this.detectionEngine = new DetectionEngine();
  }

  /**
   * Executes the full audit pipeline for a website context.
   */
  public async runAudit(context: AuditContext): Promise<AuditReport> {
    const timestamp = Date.now();
    const auditDate = new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Run all registered detectors
    const results: DetectionResult[] = await this.detectionEngine.runAll(context);

    // 2. Validate events, duplicates, server-side, attribution
    const events = ValidationEngine.compileUniversalEvents(context, results);
    const duplicates = ValidationEngine.detectDuplicates(context, results);
    const serverSide = ValidationEngine.evaluateServerSide(context, results);
    const attribution = ValidationEngine.parseAttribution(context);

    // 3. Score tracking health
    const score = ScoringEngine.calculate(context, results, events, duplicates, serverSide);

    // 4. Generate recommendations
    const issues = RecommendationEngine.generate(context, results, events, duplicates, serverSide);

    // 5. Build technology & consent sub-models
    const techResult = results.find((r) => r.id === "tech_stack");
    const techDetails = (techResult?.rawDetails || {}) as Record<string, string[]>;
    const technology: TechnologyAudit = {
      cms: techDetails.cms || [],
      ecommerce: techDetails.ecommerce || [],
      frameworks: techDetails.frameworks || [],
      tagManagers: results.filter((r) => r.category === "tag_manager" && r.status !== "not_detected").map((r) => r.platform),
      analyticsTools: results.filter((r) => r.category === "analytics" && r.status !== "not_detected").map((r) => r.platform),
      infrastructure: techDetails.infrastructure || [],
    };

    const consentResult = results.find((r) => r.id === "consent_management");
    const consentDetails = (consentResult?.rawDetails || {}) as Record<string, unknown>;
    const consent: ConsentAudit = {
      cmpDetected: (consentDetails.cmpDetected as string) || null,
      bannerObservable: Boolean(consentDetails.bannerObservable),
      consentModeV2: Boolean(consentDetails.hasConsentModeV2),
      consentModeSignals: (consentDetails.consentSignals as Record<string, string>) || {},
      disclaimer: "Technical consent implementation detected. Legal/privacy compliance requires separate legal counsel review.",
    };

    // 6. Statistics
    const platformsDetected = results.filter(
      (r) => r.category !== "technology" && r.category !== "consent" && r.status !== "not_detected"
    ).length;

    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const warningCount = issues.filter((i) => i.severity === "high" || i.severity === "medium").length;

    const reportId = `audit_${context.domain.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}`;

    return {
      id: reportId,
      website: context.domain,
      url: context.url,
      auditDate,
      timestamp,
      score,
      results,
      events,
      issues,
      duplicates,
      serverSide,
      dataLayer: context.dataLayer,
      cookies: context.cookies,
      attribution,
      technology,
      consent,
      stats: {
        platformsDetected,
        eventsDetected: events.length,
        criticalCount,
        warningCount,
      },
    };
  }
}
