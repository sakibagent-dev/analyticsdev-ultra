import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class GoogleAdsDetector implements Detector {
  public id = "google_ads";
  public name = "Google Ads Conversion Tracking";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script & DOM Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.googleAdsConversionIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `Google Ads Conversion ID(s) detected: ${identifiers.join(", ")}`,
          source: "gtag('config') or script tag",
          value: identifiers.join(", "),
          confidence: 0.95,
        })
      );
    }

    // 2. Conversion Labels and enhanced conversion signals from scripts
    const convLabelRegex = /AW-[0-9]{6,12}\/([a-zA-Z0-9_-]{4,35})/g;
    const conversionLabels: string[] = [];
    context.dom.scripts.forEach((s) => {
      const text = `${s.src || ""} ${s.contentSnippet || ""}`;
      let match: RegExpExecArray | null;
      while ((match = convLabelRegex.exec(text)) !== null) {
        if (match[1] && !conversionLabels.includes(match[1])) {
          conversionLabels.push(match[1]);
        }
      }
    });

    if (conversionLabels.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `Observed ${conversionLabels.length} Google Ads Conversion Action Label(s).`,
          source: "gtag conversion call",
          value: conversionLabels.join(", "),
          confidence: 0.95,
        })
      );
    }

    // 3. Network Analysis (googleadservices.com or google.com/pagead/conversion)
    const adsRequests = context.network.filter((r) =>
      r.url.includes("googleadservices.com/pagead/conversion") ||
      r.url.includes("google.com/pagead/1p-conversion") ||
      r.platform === "google_ads"
    );

    let enhancedConversionSignal = false;
    adsRequests.forEach((req) => {
      // Extract AW- ID if present in path or query
      const match = req.url.match(/conversion\/([0-9]+)/);
      if (match && match[1]) {
        const id = `AW-${match[1]}`;
        if (!identifiers.includes(id)) identifiers.push(id);
      }
      // Check for enhanced conversions: em= (hashed email) or pn= (hashed phone)
      if (req.params["em"] || req.params["pn"] || req.params["ec_mode"]) {
        enhancedConversionSignal = true;
      }
      const label = req.params["label"];
      if (label && !conversionLabels.includes(label)) {
        conversionLabels.push(label);
      }
      const dataLayerEvent = req.params["data"];
      if (dataLayerEvent && !events.includes(dataLayerEvent)) {
        events.push(dataLayerEvent);
      }
    });

    if (adsRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${adsRequests.length} conversion beacon(s) to Google Ads endpoints.`,
          source: "Network Observation",
          confidence: 1.0,
        })
      );
    }

    if (enhancedConversionSignal) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: "Observable Enhanced Conversions signal detected (hashed user identifiers in conversion payload).",
          source: "Network conversion beacon",
          confidence: 0.9,
        })
      );
    }

    // 4. URL Attribution signals: gclid, gbraid, wbraid
    const gclid = context.urlParams["gclid"];
    const gbraid = context.urlParams["gbraid"];
    const wbraid = context.urlParams["wbraid"];

    if (gclid || gbraid || wbraid) {
      const clickTokens = [
        gclid ? `gclid (${gclid.slice(0, 8)}...)` : null,
        gbraid ? `gbraid (${gbraid.slice(0, 8)}...)` : null,
        wbraid ? `wbraid (${wbraid.slice(0, 8)}...)` : null,
      ].filter(Boolean);

      evidenceList.push(
        createEvidence({
          type: "url",
          description: `Google Ads attribution parameter(s) present: ${clickTokens.join(", ")}`,
          source: "URL parameters",
          confidence: 1.0,
        })
      );
      notes.push("Google attribution signals detected. Note: Does not verify active ad campaign delivery without Google Ads API authorization.");
    }

    // 5. Cookies: _gcl_aw, _gcl_au
    const gclCookies = context.cookies.filter((c) => c.name.startsWith("_gcl_"));
    if (gclCookies.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "cookie",
          description: `Google Conversion Linker cookie(s) detected: ${gclCookies.map((c) => c.name).join(", ")}`,
          source: "Cookies",
          confidence: 0.95,
        })
      );
    }

    // 6. DataLayer conversion events
    if (context.dataLayer.purchaseData?.hasPurchase) {
      events.push("Purchase");
    }
    if (context.dataLayer.events.some((e) => e.toLowerCase().includes("conversion") || e.toLowerCase().includes("lead"))) {
      events.push("Lead/Conversion");
    }

    // 7. Status Resolution
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || adsRequests.length > 0) {
      if (conversionLabels.length > 0 || adsRequests.length > 0) {
        status = "verified";
        confidence = 95;
        confidenceLevel = "high";
      } else {
        status = "detected";
        confidence = 85;
        confidenceLevel = "high";
      }
    } else if (gclCookies.length > 0 || gclid || gbraid || wbraid) {
      status = "possible";
      confidence = 45;
      confidenceLevel = "medium";
      notes.push("Google Conversion Linker or Click ID detected, but no explicit Google Ads tag was observed on this page.");
    }

    return {
      id: this.id,
      platform: "Google Ads",
      component: "Conversion Tracking",
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
        conversionLabels,
        enhancedConversionSignal,
        requestCount: adsRequests.length,
        hasConversionLinker: gclCookies.length > 0,
      },
    };
  }
}
