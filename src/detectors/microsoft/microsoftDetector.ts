import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class MicrosoftAdsDetector implements Detector {
  public id = "microsoft_ads";
  public name = "Microsoft Advertising (Bing UET)";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.microsoftUetTagIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (scriptAnalysis.hasMicrosoftScript) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "Microsoft UET script (bat.bing.com/bat.js) detected in DOM scripts.",
          source: "DOM Script Tag",
          confidence: 0.95,
        })
      );
    }

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `Microsoft UET Tag ID detected: ${identifiers.join(", ")}`,
          source: "bat.bing.com script or uetq",
          value: identifiers.join(", "),
          confidence: 0.98,
        })
      );
    }

    // 2. Runtime uetq
    if (context.runtime.globals.uetq) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "Global window.uetq queue is active.",
          source: "window.uetq",
          confidence: 1.0,
        })
      );
    }

    // 3. Network Observation
    const msRequests = context.network.filter((r) =>
      r.url.includes("bat.bing.com") || r.platform === "microsoft"
    );

    msRequests.forEach((req) => {
      const ti = req.params["ti"];
      if (ti && !identifiers.includes(ti)) {
        identifiers.push(ti);
      }
      const evt = req.params["evt"];
      if (evt && !events.includes(evt)) {
        events.push(evt);
      }
    });

    if (msRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${msRequests.length} Microsoft Advertising tracking request(s).`,
          source: "Network Observation",
          confidence: 1.0,
        })
      );
    }

    // 4. Cookies: _uetsid, _uetvid
    const uetCookies = context.cookies.filter((c) => c.name.startsWith("_uet") || c.name === "MUID");
    if (uetCookies.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "cookie",
          description: `Microsoft Advertising cookie(s) detected: ${uetCookies.map((c) => c.name).join(", ")}`,
          source: "Cookies",
          confidence: 0.95,
        })
      );
    }

    // 5. Attribution: msclkid
    if (context.urlParams["msclkid"]) {
      evidenceList.push(
        createEvidence({
          type: "url",
          description: "Microsoft Click ID (msclkid) present in URL.",
          source: "URL query parameter",
          value: context.urlParams["msclkid"],
          confidence: 1.0,
        })
      );
      notes.push("Microsoft attribution click signal detected. (Note: does not verify active ad campaign delivery).");
    }

    // 6. Status Determination
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || msRequests.length > 0) {
      status = "detected";
      confidence = 90;
      confidenceLevel = "high";
    } else if (scriptAnalysis.hasMicrosoftScript || uetCookies.length > 0) {
      status = "possible";
      confidence = 50;
      confidenceLevel = "medium";
    }

    return {
      id: this.id,
      platform: "Microsoft Advertising",
      component: "Bing UET",
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
        requestCount: msRequests.length,
      },
    };
  }
}
