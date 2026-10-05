import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";
import { GA4_RECOMMENDED_EVENTS } from "./googleRules";

export class Ga4Detector implements Detector {
  public id = "google_analytics_4";
  public name = "Google Analytics 4 (GA4)";
  public category = "analytics" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script & DOM Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.ga4MeasurementIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `GA4 Measurement ID(s) detected in scripts: ${identifiers.join(", ")}`,
          source: "gtag('config') or script tag",
          value: identifiers.join(", "),
          confidence: 0.95,
        })
      );
    }

    // 2. Network Analysis (google-analytics.com/g/collect or analytics.google.com/g/collect)
    const ga4Requests = context.network.filter((r) =>
      r.url.includes("/g/collect") || (r.platform === "ga4" && r.type !== "unknown")
    );

    let hasPageview = false;
    let hasPurchase = false;
    let ecommerceObserved = false;

    ga4Requests.forEach((req) => {
      // TID parameter contains G- Measurement ID
      const tid = req.params["tid"];
      if (tid && !identifiers.includes(tid)) {
        identifiers.push(tid);
      }
      const eventName = req.params["en"];
      if (eventName && !events.includes(eventName)) {
        events.push(eventName);
        if (eventName === "page_view") hasPageview = true;
        if (eventName === "purchase") {
          hasPurchase = true;
          ecommerceObserved = true;
        }
      }
      if (req.params["ep.transaction_id"] || req.params["tr"] || req.params["pr1"]) {
        ecommerceObserved = true;
      }
    });

    if (ga4Requests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${ga4Requests.length} GA4 measurement beacon(s) sent to Google Analytics.`,
          source: "Network Observation",
          confidence: 1.0,
        })
      );
    }

    // 3. Runtime & DataLayer Analysis
    if (context.runtime.globals.gtag) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "Global window.gtag function is active.",
          source: "window.gtag",
          confidence: 1.0,
        })
      );
    }

    // Match recommended GA4 events in dataLayer
    context.dataLayer.events.forEach((dlEvent) => {
      if (GA4_RECOMMENDED_EVENTS.some((rec) => rec.toLowerCase() === dlEvent.toLowerCase())) {
        if (!events.includes(dlEvent)) events.push(dlEvent);
      }
    });

    if (context.dataLayer.hasEcommerce) {
      ecommerceObserved = true;
      evidenceList.push(
        createEvidence({
          type: "datalayer",
          description: "GA4 ecommerce schema object observed in dataLayer.",
          source: "window.dataLayer",
          confidence: 0.95,
        })
      );
    }

    if (context.dataLayer.purchaseData?.hasPurchase) {
      hasPurchase = true;
      if (!events.includes("purchase")) events.push("purchase");
    }

    // 4. Cookies Analysis (_ga, _gid)
    const hasGa = context.cookies.some((c) => c.name === "_ga");
    const hasGid = context.cookies.some((c) => c.name === "_gid");

    if (hasGa) {
      evidenceList.push(
        createEvidence({
          type: "cookie",
          description: "GA4 primary client identifier cookie (_ga) detected.",
          source: "_ga Cookie",
          confidence: 0.95,
        })
      );
    }

    // 5. Warnings and Best Practices
    if (identifiers.length > 1) {
      warnings.push(`Multiple GA4 Measurement IDs detected on page (${identifiers.join(", ")}). Verify dual-tagging configuration.`);
    }

    if (identifiers.length > 0 && ga4Requests.length === 0 && !context.runtime.globals.gtag) {
      warnings.push("GA4 Measurement ID is declared in HTML, but no outgoing measurement requests or runtime execution were observed.");
    }

    // 6. Status Determination
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || ga4Requests.length > 0) {
      if (events.length > 0 || ga4Requests.length > 0) {
        status = "verified";
        confidence = 95;
        confidenceLevel = "high";
      } else {
        status = "detected";
        confidence = 85;
        confidenceLevel = "high";
      }
    } else if (hasGa || scriptAnalysis.hasGtagScript) {
      status = "possible";
      confidence = 50;
      confidenceLevel = "medium";
      notes.push("Google Analytics cookie or gtag library detected, but no explicit GA4 G- Measurement ID was found.");
    }

    return {
      id: this.id,
      platform: "Google Analytics",
      component: "GA4 (Google Analytics 4)",
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
        ecommerce: ecommerceObserved,
        hasPageview,
        hasPurchase,
        hasGaCookie: hasGa,
        hasGidCookie: hasGid,
        requestCount: ga4Requests.length,
      },
    };
  }
}
