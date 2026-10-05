import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class PinterestDetector implements Detector {
  public id = "pinterest_tag";
  public name = "Pinterest Tag";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.pinterestTagIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (scriptAnalysis.hasPinterestScript) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "Pinterest Tag script (s.pinimg.com/ct/core.js) detected in DOM scripts.",
          source: "DOM Script Tag",
          confidence: 0.95,
        })
      );
    }

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `Pinterest Tag ID detected: ${identifiers.join(", ")}`,
          source: "pintrk('load') call",
          value: identifiers.join(", "),
          confidence: 0.98,
        })
      );
    }

    // 2. Runtime pintrk
    if (context.runtime.globals.pintrk) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "Global window.pintrk function is active.",
          source: "window.pintrk",
          confidence: 1.0,
        })
      );
    }

    // 3. Network Observation
    const pinRequests = context.network.filter((r) =>
      r.url.includes("ct.pinterest.com") || r.platform === "pinterest"
    );

    pinRequests.forEach((req) => {
      const tid = req.params["tid"];
      if (tid && !identifiers.includes(tid)) {
        identifiers.push(tid);
      }
      const eventName = req.params["event"];
      if (eventName && !events.includes(eventName)) {
        events.push(eventName);
      }
    });

    if (pinRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${pinRequests.length} Pinterest tracking request(s).`,
          source: "Network Observation",
          confidence: 1.0,
        })
      );
    }

    // 4. Attribution: epik
    if (context.urlParams["epik"]) {
      evidenceList.push(
        createEvidence({
          type: "url",
          description: "Pinterest Click ID (epik) present in URL.",
          source: "URL query parameter",
          value: context.urlParams["epik"],
          confidence: 1.0,
        })
      );
    }

    // 5. Status Determination
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || pinRequests.length > 0) {
      status = "detected";
      confidence = 90;
      confidenceLevel = "high";
    } else if (scriptAnalysis.hasPinterestScript || context.runtime.globals.pintrk) {
      status = "possible";
      confidence = 50;
      confidenceLevel = "medium";
    }

    return {
      id: this.id,
      platform: "Pinterest",
      component: "Pinterest Tag",
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
        requestCount: pinRequests.length,
      },
    };
  }
}
