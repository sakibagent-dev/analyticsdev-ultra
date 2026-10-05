import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class SnapchatDetector implements Detector {
  public id = "snapchat_pixel";
  public name = "Snapchat Pixel";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.snapchatPixelIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (scriptAnalysis.hasSnapchatScript) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "Snapchat Pixel script (sc-static.net/scevent.min.js) detected.",
          source: "DOM Script Tag",
          confidence: 0.95,
        })
      );
    }

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `Snapchat Pixel ID detected: ${identifiers.join(", ")}`,
          source: "snaptr('init') call",
          value: identifiers.join(", "),
          confidence: 0.98,
        })
      );
    }

    // 2. Runtime snaptr
    if (context.runtime.globals.snaptr) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "Global window.snaptr function is active.",
          source: "window.snaptr",
          confidence: 1.0,
        })
      );
    }

    // 3. Network Observation
    const snapRequests = context.network.filter((r) =>
      r.url.includes("tr.snapchat.com") || r.platform === "snapchat"
    );

    snapRequests.forEach((req) => {
      const pid = req.params["pid"];
      if (pid && !identifiers.includes(pid)) identifiers.push(pid);
      const ev = req.params["ev"];
      if (ev && !events.includes(ev)) events.push(ev);
    });

    if (snapRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${snapRequests.length} Snapchat tracking request(s).`,
          source: "Network Observation",
          confidence: 1.0,
        })
      );
    }

    // 4. Attribution: ScCid
    const scCid = context.urlParams["ScCid"] || context.urlParams["sccid"];
    if (scCid) {
      evidenceList.push(
        createEvidence({
          type: "url",
          description: "Snapchat Click ID (ScCid) present in URL.",
          source: "URL query parameter",
          value: scCid,
          confidence: 1.0,
        })
      );
    }

    // 5. Status Determination
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || snapRequests.length > 0) {
      status = "detected";
      confidence = 90;
      confidenceLevel = "high";
    } else if (scriptAnalysis.hasSnapchatScript || context.runtime.globals.snaptr) {
      status = "possible";
      confidence = 50;
      confidenceLevel = "medium";
    }

    return {
      id: this.id,
      platform: "Snapchat",
      component: "Snap Pixel",
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
        requestCount: snapRequests.length,
      },
    };
  }
}
