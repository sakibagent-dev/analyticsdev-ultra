import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class RedditDetector implements Detector {
  public id = "reddit_pixel";
  public name = "Reddit Pixel";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.redditPixelIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (scriptAnalysis.hasRedditScript) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "Reddit Pixel core script (alb.reddit.com/rp.js) detected in DOM scripts.",
          source: "DOM Script Tag",
          confidence: 0.95,
        })
      );
    }

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `Reddit Pixel ID detected: ${identifiers.join(", ")}`,
          source: "rdt('init') call",
          value: identifiers.join(", "),
          confidence: 0.98,
        })
      );
    }

    // 2. Runtime rdt
    if (context.runtime.globals.rdt) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "Global window.rdt function is active.",
          source: "window.rdt",
          confidence: 1.0,
        })
      );
    }

    // 3. Network Observation
    const redditRequests = context.network.filter((r) =>
      r.url.includes("alb.reddit.com") || r.platform === "reddit"
    );

    redditRequests.forEach((req) => {
      const id = req.params["id"];
      if (id && !identifiers.includes(id)) identifiers.push(id);
      const ev = req.params["event"];
      if (ev && !events.includes(ev)) events.push(ev);
    });

    if (redditRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${redditRequests.length} Reddit tracking request(s).`,
          source: "Network Observation",
          confidence: 1.0,
        })
      );
    }

    // 4. Attribution: rdt_cid
    if (context.urlParams["rdt_cid"]) {
      evidenceList.push(
        createEvidence({
          type: "url",
          description: "Reddit Click ID (rdt_cid) present in URL.",
          source: "URL query parameter",
          value: context.urlParams["rdt_cid"],
          confidence: 1.0,
        })
      );
    }

    // 5. Status Determination
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || redditRequests.length > 0) {
      status = "detected";
      confidence = 90;
      confidenceLevel = "high";
    } else if (scriptAnalysis.hasRedditScript || context.runtime.globals.rdt) {
      status = "possible";
      confidence = 50;
      confidenceLevel = "medium";
    }

    return {
      id: this.id,
      platform: "Reddit",
      component: "Reddit Pixel",
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
        requestCount: redditRequests.length,
      },
    };
  }
}
