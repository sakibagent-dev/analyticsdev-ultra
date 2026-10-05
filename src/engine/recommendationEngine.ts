import { AuditContext, DetectionResult } from "../types/detection";
import { AuditIssue, UniversalEvent, DuplicateTrackingWarning, ServerSideAudit } from "../types/audit";
import { createEvidence } from "../types/evidence";

export class RecommendationEngine {
  public static generate(
    context: AuditContext,
    results: DetectionResult[],
    events: UniversalEvent[],
    duplicates: DuplicateTrackingWarning[],
    serverSide: ServerSideAudit
  ): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // 1. Purchase Tracking with missing transaction_id
    const hasPurchase = events.some((e) => e.event.toLowerCase() === "purchase");
    const purchaseDl = context.dataLayer.purchaseData;
    if (hasPurchase && !purchaseDl?.transaction_id) {
      issues.push({
        id: "issue_purchase_missing_txid",
        title: "Purchase Tracking Missing Transaction ID",
        severity: "critical",
        category: "Conversion Tracking",
        finding: "Purchase tracking event was observed, but no transaction_id was detected in the payload or dataLayer.",
        impact: "Severe risk of duplicate conversion reporting upon browser refresh and inability to deduplicate orders across platforms.",
        recommendation: "Ensure your ecommerce dataLayer or purchase event includes a unique order transaction ID (e.g. order_10482).",
        evidence: [
          createEvidence({
            type: "datalayer",
            description: "Purchase event observed without a unique transaction_id parameter.",
            source: "dataLayer purchaseData",
            confidence: 0.95,
          }),
        ],
      });
    }

    // 2. Meta Pixel Purchase without event_id
    const metaPixel = results.find((r) => r.id === "meta_pixel");
    const metaHasPurchase = metaPixel?.events.some((e) => e.toLowerCase() === "purchase");
    const hasEventId = Boolean(metaPixel?.rawDetails?.hasEventId);

    if (metaHasPurchase && !hasEventId) {
      issues.push({
        id: "issue_meta_capi_dedup_missing_event_id",
        title: "Meta Purchase Event Missing Deduplication event_id",
        severity: "high",
        category: "Meta Advertising",
        platform: "Meta",
        finding: "Meta browser Purchase event fires without an event_id parameter.",
        impact: "Meta Conversions API (CAPI) deduplication requires the exact same event_id in both browser and server payloads. Without this, conversions will either be double-counted or rejected.",
        recommendation: "Pass an identical event_id (e.g. order ID or timestamp-hash) to both fbq('track', 'Purchase', {...}, {eventID: '...'}) and the CAPI payload.",
        evidence: [
          createEvidence({
            type: "javascript",
            description: "Meta fbq('track', 'Purchase') invoked without eventID argument.",
            source: "Meta Pixel Event Hook",
            confidence: 0.9,
          }),
        ],
      });
    }

    // 3. Duplicate Tracking issues
    duplicates.forEach((dup, idx) => {
      issues.push({
        id: `issue_duplicate_${idx}`,
        title: `Duplicate Tracking Risk: ${dup.platform} (${dup.event})`,
        severity: dup.severity,
        category: "Implementation Quality",
        platform: dup.platform,
        finding: `${dup.platform} ${dup.event} has multiple execution paths: ${dup.paths.join(" & ")}.`,
        impact: "Metrics and conversions may be inflated due to multiple tags firing for the same user interaction.",
        recommendation: dup.recommendation,
        evidence: [
          createEvidence({
            type: "javascript",
            description: `Conflicting tracking paths: ${dup.paths.join(" | ")}`,
            source: "Architecture Validation",
            confidence: 0.9,
          }),
        ],
      });
    });

    // 4. Missing Consent Mode v2
    const consentResult = results.find((r) => r.id === "consent_management");
    const rawConsent = consentResult?.rawDetails as Record<string, unknown> | undefined;
    const hasGoogleTags = results.some((r) => (r.id === "google_ads" || r.id === "google_analytics_4") && r.status !== "not_detected");

    if (hasGoogleTags && !rawConsent?.hasConsentModeV2) {
      const isV1 = Boolean(rawConsent?.hasConsentModeV1);
      issues.push({
        id: "issue_missing_consent_mode_v2",
        title: isV1 ? "Upgrade to Google Consent Mode v2 Required" : "Google Consent Mode v2 Not Detected",
        severity: "high",
        category: "Privacy & Compliance",
        finding: isV1
          ? "Legacy Google Consent Mode is active, but lacks required v2 parameters (ad_user_data, ad_personalization)."
          : "Active Google tracking tags detected without Google Consent Mode v2 signals.",
        impact: "Google Ads remarketing, audience building, and conversion modeling for EEA/EU users will be significantly degraded without Consent Mode v2.",
        recommendation: "Configure your CMP (Cookiebot, OneTrust, etc.) to trigger Google Consent Mode v2 with default consent states before Google tags load.",
        evidence: [
          createEvidence({
            type: "datalayer",
            description: "No ad_user_data or ad_personalization consent signals observed in GTM/dataLayer.",
            source: "Consent Mode Inspector",
            confidence: 0.85,
          }),
        ],
      });
    }

    // 5. Missing DataLayer
    if (!context.dataLayer.exists && hasGoogleTags) {
      issues.push({
        id: "issue_missing_datalayer",
        title: "Standard window.dataLayer Missing",
        severity: "medium",
        category: "Architecture",
        finding: "Google tracking is present but window.dataLayer object is not initialized.",
        impact: "Direct inline tagging without a centralized dataLayer makes event governance difficult and increases vulnerability to website frontend changes.",
        recommendation: "Initialize window.dataLayer = window.dataLayer || []; and route all conversion events through standardized dataLayer pushes.",
        evidence: [
          createEvidence({
            type: "datalayer",
            description: "window.dataLayer was undefined during page execution.",
            source: "Runtime window inspector",
            confidence: 1.0,
          }),
        ],
      });
    }

    // 6. Server-side tracking recommendation if only browser tracking
    const hasOnlyBrowserPixels = results.some(
      (r) => (r.id === "meta_pixel" || r.id === "tiktok_pixel") && r.status === "verified"
    );
    if (hasOnlyBrowserPixels && serverSide.status === "requires_access") {
      issues.push({
        id: "issue_server_side_missing",
        title: "Server-Side Tracking Architecture Not Observable",
        severity: "medium",
        category: "Server-Side Tracking",
        finding: "Advertising pixels rely solely on browser execution with no observable first-party endpoints or server-side tagging signals.",
        impact: "Browser-only tracking loses up to 20-30% of conversion signals due to Safari ITP cookie capping, ad blockers, and network disconnects.",
        recommendation: "Deploy a Server-Side GTM container or Stape endpoint with Meta CAPI and TikTok Events API to restore signal resilience.",
        evidence: [
          createEvidence({
            type: "network",
            description: "All tracking requests flow directly to third-party domains without first-party proxy.",
            source: "Network analysis",
            confidence: 0.85,
          }),
        ],
      });
    }

    // Sort issues by severity: critical > high > medium > low > informational
    const severityWeight: Record<AuditIssue["severity"], number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      informational: 1,
    };

    return issues.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
  }
}
