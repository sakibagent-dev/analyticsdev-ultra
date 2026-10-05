import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";

export class MetaCapiDetector implements Detector {
  public id = "meta_capi";
  public name = "Meta Conversions API (CAPI)";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Look for event_id in browser signals
    let eventIdObserved = false;
    let eventIdValue: string | undefined = undefined;

    // Check runtime fbq events
    if (context.runtime.fbqEvents) {
      context.runtime.fbqEvents.forEach((ev) => {
        if (ev.eventId) {
          eventIdObserved = true;
          eventIdValue = ev.eventId;
          if (!events.includes(ev.event)) events.push(ev.event);
        }
      });
    }

    // Check network requests for eid or event_id
    context.network.forEach((req) => {
      const eid = req.params["eid"] || req.params["event_id"];
      if (eid) {
        eventIdObserved = true;
        eventIdValue = eid;
        const evName = req.params["ev"] || req.params["event"];
        if (evName && !events.includes(evName)) events.push(evName);
      }
    });

    if (eventIdObserved) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "event_id parameter observed in browser event payload (mandatory for Meta CAPI deduplication).",
          source: "Event Payload",
          value: eventIdValue ? `Sample ID: ${eventIdValue}` : "Present",
          confidence: 0.9,
        })
      );
    }

    // 2. Look for first-party tracking endpoint or custom proxy
    const hasFirstPartyEndpoint = context.serverSideSignals.firstPartyEndpoints.length > 0;
    const hasSgtmMarker = context.serverSideSignals.sgtmMarkers.length > 0;
    const hasStapeMarker = context.serverSideSignals.stapeMarkers.length > 0;

    if (hasFirstPartyEndpoint) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `First-party tracking endpoint observed: ${context.serverSideSignals.firstPartyEndpoints.join(", ")}`,
          source: "Network Inspection",
          confidence: 0.85,
        })
      );
    }

    if (hasSgtmMarker || hasStapeMarker) {
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: `Server-side tagging infrastructure detected (${[...context.serverSideSignals.sgtmMarkers, ...context.serverSideSignals.stapeMarkers].join(", ")}).`,
          source: "Infrastructure Marker",
          confidence: 0.85,
        })
      );
    }

    // 3. Status determination with strict non-negotiable honesty
    const hasAnyMetaSignal =
      eventIdObserved ||
      hasFirstPartyEndpoint ||
      hasSgtmMarker ||
      hasStapeMarker ||
      context.cookies.some((c) => c.name === "_fbp" || c.name === "_fbc") ||
      context.dom.scripts.some((s) => s.src?.includes("facebook") || s.contentSnippet?.includes("fbq"));

    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (eventIdObserved && (hasFirstPartyEndpoint || hasSgtmMarker || hasStapeMarker)) {
      status = "possible";
      confidence = 70;
      confidenceLevel = "medium";
      notes.push("Observable prerequisites for Meta CAPI are present: event_id for deduplication and server-side tracking infrastructure.");
      notes.push("Definitive verification requires Meta Events Manager or Server Container access to confirm server-side event reception.");
    } else if (eventIdObserved) {
      status = "possible";
      confidence = 55;
      confidenceLevel = "medium";
      notes.push("event_id deduplication signal detected in browser events. Full server-side CAPI pipeline requires account verification.");
    } else if (hasAnyMetaSignal) {
      status = "requires_access";
      confidence = 20;
      confidenceLevel = "low";
      notes.push("Meta Pixel or infrastructure signals detected, but server-side CAPI cannot be verified from browser signals alone.");
      notes.push("Verification requires access to Meta Events Manager or Server GTM container.");
    } else {
      status = "not_detected";
      confidence = 100;
      confidenceLevel = "high";
    }

    warnings.push("Browser-level scanning cannot confirm private server-to-server delivery to Meta servers.");

    return {
      id: this.id,
      platform: "Meta",
      component: "Conversions API (CAPI)",
      category: this.category,
      status,
      confidence,
      confidenceLevel,
      identifiers,
      events,
      evidence: evidenceList,
      warnings,
      notes,
      rawDetails: {
        eventIdObserved,
        hasFirstPartyEndpoint,
        hasSgtmMarker,
        hasStapeMarker,
      },
    };
  }
}
