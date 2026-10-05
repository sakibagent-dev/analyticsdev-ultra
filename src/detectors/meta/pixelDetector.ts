import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class MetaPixelDetector implements Detector {
  public id = "meta_pixel";
  public name = "Meta Pixel (Facebook)";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script & DOM Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.metaPixelIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (scriptAnalysis.hasMetaScript) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "Meta Pixel JavaScript library (fbevents.js / connect.facebook.net) detected in DOM scripts.",
          source: "DOM Script Tag",
          confidence: 0.95,
        })
      );
    }

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `Meta Pixel ID(s) detected: ${identifiers.join(", ")}`,
          source: "fbq('init') or noscript iframe",
          value: identifiers.join(", "),
          confidence: 0.98,
        })
      );
    }

    // 2. Runtime Window fbq Analysis
    if (context.runtime.globals.fbq) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "window.fbq function is initialized and available in global window runtime.",
          source: "window.fbq",
          confidence: 1.0,
        })
      );
    }

    // Check runtime fbq calls recorded
    let hasEventId = false;
    if (context.runtime.fbqEvents && context.runtime.fbqEvents.length > 0) {
      context.runtime.fbqEvents.forEach((ev) => {
        if (!events.includes(ev.event)) events.push(ev.event);
        if (ev.eventId) hasEventId = true;
      });
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: `Observed active fbq('track') events: ${events.join(", ")}`,
          source: "Runtime fbq hook",
          confidence: 1.0,
        })
      );
    }

    // 3. Network Analysis (facebook.com/tr)
    const metaRequests = context.network.filter((r) =>
      r.url.includes("facebook.com/tr") || (r.platform === "meta" && r.type !== "unknown")
    );

    metaRequests.forEach((req) => {
      const pixelId = req.params["id"];
      if (pixelId && !identifiers.includes(pixelId)) {
        identifiers.push(pixelId);
      }
      const eventName = req.params["ev"];
      if (eventName && !events.includes(eventName)) {
        events.push(eventName);
      }
      if (req.params["eid"] || req.params["event_id"]) {
        hasEventId = true;
      }
    });

    if (metaRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${metaRequests.length} outgoing network beacon(s) to facebook.com/tr`,
          source: "Network Observation",
          value: `Events: ${events.join(", ")}`,
          confidence: 1.0,
        })
      );
    }

    // 4. Cookies Analysis (_fbp, _fbc)
    const hasFbp = context.cookies.some((c) => c.name === "_fbp");
    const hasFbc = context.cookies.some((c) => c.name === "_fbc");

    if (hasFbp) {
      evidenceList.push(
        createEvidence({
          type: "cookie",
          description: "Meta first-party browser cookie _fbp detected.",
          source: "_fbp Cookie",
          confidence: 0.95,
        })
      );
    }

    if (hasFbc) {
      evidenceList.push(
        createEvidence({
          type: "cookie",
          description: "Meta click attribution cookie _fbc detected.",
          source: "_fbc Cookie",
          confidence: 0.95,
        })
      );
    }

    // 5. URL Attribution Parameter (fbclid)
    if (context.urlParams["fbclid"]) {
      evidenceList.push(
        createEvidence({
          type: "url",
          description: "Meta Click ID (fbclid) present in current page URL.",
          source: "URL query parameter",
          value: context.urlParams["fbclid"],
          confidence: 1.0,
        })
      );
      notes.push("Meta attribution signal detected via fbclid. (Note: does not verify active ad campaign delivery).");
    }

    // 6. Quality Checks & Warnings
    if (identifiers.length > 1) {
      warnings.push(`Multiple Meta Pixel IDs detected on this page (${identifiers.join(", ")}). Verify whether intentional or duplicate.`);
    }

    if (events.includes("Purchase") && !hasEventId) {
      warnings.push("Meta Purchase event was observed without an event_id parameter. Server-side CAPI deduplication will fail without consistent event_id.");
    }

    if (!hasFbp && identifiers.length > 0) {
      warnings.push("Meta Pixel is present but _fbp cookie was not found. First-party browser attribution may be hindered.");
    }

    // 7. Status Resolution
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || metaRequests.length > 0) {
      if (events.length > 0 || metaRequests.length > 0) {
        status = "verified";
        confidence = 95;
        confidenceLevel = "high";
      } else {
        status = "detected";
        confidence = 85;
        confidenceLevel = "high";
      }
    } else if (scriptAnalysis.hasMetaScript || context.runtime.globals.fbq) {
      status = "possible";
      confidence = 50;
      confidenceLevel = "medium";
      notes.push("Meta library or global detected, but no Pixel ID was explicitly recognized.");
    }

    return {
      id: this.id,
      platform: "Meta",
      component: "Meta Pixel",
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
        browserPixel: scriptAnalysis.hasMetaScript || context.runtime.globals.fbq,
        hasFbp,
        hasFbc,
        hasEventId,
        requestCount: metaRequests.length,
      },
    };
  }
}
