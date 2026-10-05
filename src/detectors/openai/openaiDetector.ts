import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";

export class OpenAiAdsDetector implements Detector {
  public id = "openai_ads";
  public name = "OpenAI Advertising Module";
  public category = "ad_platform" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // Scan for any publicly documented or observable OpenAI ad/conversion signals
    // Currently, OpenAI does not operate a standardized client-side public advertising tracking pixel library.
    const openAiRequests = context.network.filter((r) =>
      r.url.includes("api.openai.com/v1/ad") || r.url.includes("openai.com/ads")
    );

    const openAiParams = ["oai_cid", "openai_click_id"].filter((param) => Boolean(context.urlParams[param]));

    if (openAiRequests.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "network",
          description: `Network request matching OpenAI advertising pattern: ${openAiRequests.map((r) => r.url).join(", ")}`,
          source: "Network Observation",
          confidence: 0.8,
        })
      );
    }

    if (openAiParams.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "url",
          description: `Attribution parameter matching pattern: ${openAiParams.join(", ")}`,
          source: "URL parameters",
          confidence: 0.7,
        })
      );
    }

    let status: DetectionResult["status"] = "requires_access";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (evidenceList.length > 0) {
      status = "possible";
      confidence = 40;
      confidenceLevel = "low";
      notes.push("Possible technical signal matching OpenAI advertising pattern observed.");
    } else {
      status = "not_detected";
      confidence = 100;
      confidenceLevel = "high";
      notes.push("Status: Not Verifiable from Browser.");
      notes.push("OpenAI does not currently provide an open, standardized public browser-side tracking pixel.");
      notes.push("Any sponsored partner attribution or API integrations require authorized platform and server-side verification.");
    }

    return {
      id: this.id,
      platform: "OpenAI Ads",
      component: "OpenAI Ads Detector (Extensible Module)",
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
        isExtensibleModule: true,
        observableClientSignalsExist: false,
      },
    };
  }
}
