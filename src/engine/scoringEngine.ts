import { AuditContext, DetectionResult } from "../types/detection";
import { AuditScore, UniversalEvent, DuplicateTrackingWarning, ServerSideAudit } from "../types/audit";

export class ScoringEngine {
  public static calculate(
    context: AuditContext,
    results: DetectionResult[],
    events: UniversalEvent[],
    duplicates: DuplicateTrackingWarning[],
    serverSide: ServerSideAudit
  ): AuditScore {
    // 1. Platform Coverage (max 15)
    // Points for active recognized analytics, tag managers, and ad platforms
    let platformPoints = 0;
    const recognizedPlatforms = results.filter(
      (r) => r.category !== "technology" && r.category !== "consent" && r.status !== "not_detected"
    );

    const hasAnalytics = results.some((r) => r.category === "analytics" && r.status !== "not_detected");
    const hasTagManager = results.some((r) => r.category === "tag_manager" && r.status !== "not_detected");
    const hasAdPlatform = results.some((r) => r.category === "ad_platform" && r.status !== "not_detected");

    if (hasAnalytics) platformPoints += 5;
    if (hasTagManager) platformPoints += 5;
    if (hasAdPlatform) platformPoints += 5;
    platformPoints = Math.min(15, platformPoints);

    const platformExplanation = `Detected ${recognizedPlatforms.length} active platform components (Analytics: ${hasAnalytics ? "Yes" : "No"}, Tag Manager: ${hasTagManager ? "Yes" : "No"}, Ad Pixels: ${hasAdPlatform ? "Yes" : "No"}).`;

    // 2. Conversion Tracking (max 20)
    let convPoints = 0;
    const hasPurchase = events.some((e) => e.event.toLowerCase() === "purchase" || e.event.toLowerCase() === "completepayment");
    const hasLead = events.some((e) => e.event.toLowerCase().includes("lead") || e.event.toLowerCase().includes("conversion"));
    const hasTxId = Boolean(context.dataLayer.purchaseData?.transaction_id);
    const hasValCurr = Boolean(context.dataLayer.purchaseData?.value && context.dataLayer.purchaseData?.currency);

    if (hasPurchase) convPoints += 8;
    if (hasLead) convPoints += 4;
    if (hasTxId) convPoints += 4;
    if (hasValCurr) convPoints += 4;
    convPoints = Math.min(20, convPoints);

    const convExplanation = `Conversion audit: Purchase event (${hasPurchase ? "✓" : "✗"}), Lead/Conversion (${hasLead ? "✓" : "✗"}), Transaction ID (${hasTxId ? "✓" : "✗"}), Revenue/Currency (${hasValCurr ? "✓" : "✗"}).`;

    // 3. Event Tracking (max 20)
    let eventPoints = 0;
    const uniqueEventsCount = new Set(events.map((e) => e.event)).size;
    if (uniqueEventsCount >= 6) eventPoints = 20;
    else if (uniqueEventsCount >= 4) eventPoints = 16;
    else if (uniqueEventsCount >= 2) eventPoints = 12;
    else if (uniqueEventsCount >= 1) eventPoints = 8;
    else eventPoints = 0;

    const eventExplanation = `Observed ${uniqueEventsCount} unique standard/custom event actions across platforms.`;

    // 4. Server-Side Tracking (max 15)
    let serverPoints = 0;
    if (serverSide.status === "detected") serverPoints = 15;
    else if (serverSide.status === "possible" && serverSide.eventDeduplicationObserved) serverPoints = 12;
    else if (serverSide.status === "possible") serverPoints = 8;
    else if (serverSide.status === "requires_access") serverPoints = 4;
    else serverPoints = 0;

    const serverExplanation = `Server-side signals: Status is "${serverSide.status}". ${serverSide.eventDeduplicationObserved ? "Browser event_id deduplication observed." : "No browser deduplication signals."}`;

    // 5. DataLayer (max 10)
    let dlPoints = 0;
    if (context.dataLayer.exists) {
      dlPoints += 4;
      if (context.dataLayer.pushesCount > 0) dlPoints += 2;
      if (context.dataLayer.hasEcommerce) dlPoints += 4;
    }
    dlPoints = Math.min(10, dlPoints);

    const dlExplanation = context.dataLayer.exists
      ? `window.dataLayer active with ${context.dataLayer.pushesCount} pushes. Ecommerce schema: ${context.dataLayer.hasEcommerce ? "Detected" : "Not observed"}.`
      : "window.dataLayer is not initialized on this website.";

    // 6. Consent Management (max 10)
    let consentPoints = 0;
    const consentResult = results.find((r) => r.id === "consent_management");
    const rawConsent = consentResult?.rawDetails as Record<string, unknown> | undefined;
    const cmpDetected = Boolean(rawConsent?.cmpDetected);
    const hasConsentV2 = Boolean(rawConsent?.hasConsentModeV2);
    const hasConsentV1 = Boolean(rawConsent?.hasConsentModeV1);

    if (cmpDetected) consentPoints += 5;
    if (hasConsentV2) consentPoints += 5;
    else if (hasConsentV1) consentPoints += 3;
    consentPoints = Math.min(10, consentPoints);

    const consentExplanation = `CMP Detected: ${cmpDetected ? String(rawConsent?.cmpDetected) : "None"}. Google Consent Mode: ${hasConsentV2 ? "v2 Active" : hasConsentV1 ? "v1 (Legacy)" : "Not observed"}.`;

    // 7. Implementation Quality & Duplication (max 10)
    let qualityPoints = 10;
    // Deduct for duplicates or critical warnings
    if (duplicates.length > 0) {
      qualityPoints -= Math.min(6, duplicates.length * 3);
    }
    const hasErrors = results.some((r) => r.status === "error");
    if (hasErrors) qualityPoints -= 3;
    qualityPoints = Math.max(2, qualityPoints);

    const qualityExplanation = `Evaluated duplicate tracking paths and script conflicts. ${duplicates.length} duplicate risk warning(s) found.`;

    const total = platformPoints + convPoints + eventPoints + serverPoints + dlPoints + consentPoints + qualityPoints;

    let grade: AuditScore["grade"] = "F";
    if (total >= 90) grade = "A+";
    else if (total >= 80) grade = "A";
    else if (total >= 70) grade = "B";
    else if (total >= 60) grade = "C";
    else if (total >= 50) grade = "D";

    return {
      total,
      grade,
      categories: {
        platformCoverage: {
          score: platformPoints,
          max: 15,
          explanation: platformExplanation,
        },
        conversionTracking: {
          score: convPoints,
          max: 20,
          explanation: convExplanation,
        },
        eventTracking: {
          score: eventPoints,
          max: 20,
          explanation: eventExplanation,
        },
        serverSideTracking: {
          score: serverPoints,
          max: 15,
          explanation: serverExplanation,
        },
        dataLayer: {
          score: dlPoints,
          max: 10,
          explanation: dlExplanation,
        },
        consent: {
          score: consentPoints,
          max: 10,
          explanation: consentExplanation,
        },
        implementationQuality: {
          score: qualityPoints,
          max: 10,
          explanation: qualityExplanation,
        },
      },
    };
  }
}
