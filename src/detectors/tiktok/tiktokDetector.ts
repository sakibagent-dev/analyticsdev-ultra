import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class TikTokDetector implements Detector {
  public id = "tiktok_pixel";
  public name = "TikTok Pixel & Events API";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.tikTokPixelIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (scriptAnalysis.hasTikTokScript) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "TikTok Pixel core SDK (analytics.tiktok.com) detected in DOM scripts.",
          source: "DOM Script Tag",
          confidence: 0.95,
        })
      );
    }

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `TikTok Pixel Code detected: ${identifiers.join(", ")}`,
          source: "ttq.load call",
          value: identifiers.join(", "),
          confidence: 0.98,
        })
      );
    }

    // 2. Runtime Window ttq
    if (context.runtime.globals.ttq) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "Global window.ttq object is initialized.",
          source: "window.ttq",
          confidence: 1.0,
        })
      );
    }

    // 3. Network Observation
    const ttRequests = context.network.filter((r) =>
      r.url.includes("analytics.tiktok.com") || r.platform === "tiktok"
    );

    ttRequests.forEach((req) => {
      const code = req.params["pixel_code"] || req.params["id"];
      if (code && !identifiers.includes(code)) {
        identifiers.push(code);
      }
      const eventName = req.params["event"] || req.params["ev"];
      if (eventName && !events.includes(eventName)) {
        events.push(eventName);
      }
    });

    if (ttRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${ttRequests.length} network tracking request(s) to TikTok analytics endpoints.`,
          source: "Network Observation",
          confidence: 1.0,
        })
      );
    }

    // 4. Cookie: _ttp
    const hasTtp = context.cookies.some((c) => c.name === "_ttp");
    if (hasTtp) {
      evidenceList.push(
        createEvidence({
          type: "cookie",
          description: "TikTok first-party tracking cookie _ttp detected.",
          source: "_ttp Cookie",
          confidence: 0.95,
        })
      );
    }

    // 5. Attribution Parameter: ttclid
    if (context.urlParams["ttclid"]) {
      evidenceList.push(
        createEvidence({
          type: "url",
          description: "TikTok Click ID (ttclid) present in URL.",
          source: "URL query parameter",
          value: context.urlParams["ttclid"],
          confidence: 1.0,
        })
      );
      notes.push("TikTok attribution click signal detected. (Note: does not verify active ad campaign delivery).");
    }

    // 6. Status Determination
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || ttRequests.length > 0) {
      status = events.length > 0 || ttRequests.length > 0 ? "verified" : "detected";
      confidence = 90;
      confidenceLevel = "high";
    } else if (hasTtp || scriptAnalysis.hasTikTokScript || context.runtime.globals.ttq) {
      status = "possible";
      confidence = 50;
      confidenceLevel = "medium";
      notes.push("TikTok script or cookie present, but Pixel Code was not extracted.");
    }

    return {
      id: this.id,
      platform: "TikTok",
      component: "TikTok Pixel",
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
        hasTtpCookie: hasTtp,
        requestCount: ttRequests.length,
      },
    };
  }
}
