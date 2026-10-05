import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class LinkedInDetector implements Detector {
  public id = "linkedin_insight";
  public name = "LinkedIn Insight Tag";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.linkedInPartnerIds.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (scriptAnalysis.hasLinkedInScript) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "LinkedIn Insight Tag script (snap.licdn.com/li.lms-analytics) detected.",
          source: "DOM Script Tag",
          confidence: 0.95,
        })
      );
    }

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `LinkedIn Partner ID detected: ${identifiers.join(", ")}`,
          source: "_linkedin_partner_id definition",
          value: identifiers.join(", "),
          confidence: 0.98,
        })
      );
    }

    // 2. Network Requests
    const liRequests = context.network.filter((r) =>
      r.url.includes("licdn.com") ||
      r.url.includes("linkedin.com/li/track") ||
      r.url.includes("px.ads.linkedin.com") ||
      r.platform === "linkedin"
    );

    liRequests.forEach((req) => {
      const pid = req.params["pid"];
      if (pid && !identifiers.includes(pid)) {
        identifiers.push(pid);
      }
      const conversionId = req.params["conversionId"];
      if (conversionId) {
        events.push(`Conversion (${conversionId})`);
      }
    });

    if (liRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Observed ${liRequests.length} network tracking request(s) to LinkedIn conversion endpoints.`,
          source: "Network Observation",
          confidence: 1.0,
        })
      );
    }

    // 3. Cookies
    const liCookies = context.cookies.filter((c) => c.name.startsWith("li_") || c.name === "bcookie");
    if (liCookies.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "cookie",
          description: `LinkedIn cookie(s) detected: ${liCookies.map((c) => c.name).join(", ")}`,
          source: "Cookies",
          confidence: 0.95,
        })
      );
    }

    // 4. Attribution: li_fat_id
    if (context.urlParams["li_fat_id"]) {
      evidenceList.push(
        createEvidence({
          type: "url",
          description: "LinkedIn Click ID (li_fat_id) present in URL.",
          source: "URL query parameter",
          value: context.urlParams["li_fat_id"],
          confidence: 1.0,
        })
      );
      notes.push("LinkedIn attribution click signal detected. (Note: does not verify active ad campaign delivery).");
    }

    // 5. Status Determination
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0 || liRequests.length > 0) {
      status = "detected";
      confidence = 90;
      confidenceLevel = "high";
    } else if (scriptAnalysis.hasLinkedInScript || liCookies.length > 0) {
      status = "possible";
      confidence = 50;
      confidenceLevel = "medium";
      notes.push("LinkedIn tag script or cookie present, but Partner ID could not be identified.");
    }

    return {
      id: this.id,
      platform: "LinkedIn",
      component: "LinkedIn Insight Tag",
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
        requestCount: liRequests.length,
        hasCookies: liCookies.length > 0,
      },
    };
  }
}
