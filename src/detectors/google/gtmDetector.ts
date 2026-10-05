import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";
import { ScriptCollector } from "../../collectors/scriptCollector";

export class GtmDetector implements Detector {
  public id = "google_tag_manager";
  public name = "Google Tag Manager (GTM)";
  public category = "tag_manager" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    // 1. Script & DOM Analysis
    const scriptAnalysis = ScriptCollector.analyze(context.dom);
    scriptAnalysis.gtmContainers.forEach((id) => {
      if (!identifiers.includes(id)) identifiers.push(id);
    });

    if (scriptAnalysis.hasGtmScript) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: "Google Tag Manager core script (gtm.js) detected in DOM scripts.",
          source: "DOM Script Tag",
          confidence: 0.95,
        })
      );
    }

    if (identifiers.length > 0) {
      evidenceList.push(
        createEvidence({
          type: "javascript",
          description: `GTM Container ID(s) detected: ${identifiers.join(", ")}`,
          source: "gtm.js script URL or container call",
          value: identifiers.join(", "),
          confidence: 0.98,
        })
      );
    }

    // 2. Noscript iframe verification
    const hasNoscriptGtm = context.dom.iframes.some((iframe) =>
      iframe.includes("googletagmanager.com/ns.html")
    );

    if (hasNoscriptGtm) {
      evidenceList.push(
        createEvidence({
          type: "dom",
          description: "GTM <noscript> fallback iframe implementation found in DOM.",
          source: "DOM <iframe> / <noscript>",
          confidence: 0.95,
        })
      );
    } else if (identifiers.length > 0) {
      warnings.push("GTM noscript fallback iframe was not observed in <body>. Best practice requires noscript iframe for non-JS environments.");
    }

    // 3. Runtime GTM object inspection (window.google_tag_manager)
    if (context.runtime.globals.google_tag_manager) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "window.google_tag_manager object is active and managing tag execution.",
          source: "window.google_tag_manager",
          confidence: 1.0,
        })
      );
    }

    // 4. Duplicate Containers check
    const isDuplicate = identifiers.length > 1;
    if (isDuplicate) {
      warnings.push(`Multiple GTM containers detected (${identifiers.length}): ${identifiers.join(", ")}. This often leads to duplicate tracking tags and tag conflicts unless explicitly architected.`);
    }

    // 5. DataLayer connection
    if (context.dataLayer.exists) {
      notes.push(`Connected to dataLayer with ${context.dataLayer.pushesCount} pushes.`);
    }

    // 6. Status Determination
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (identifiers.length > 0) {
      status = context.runtime.globals.google_tag_manager ? "verified" : "detected";
      confidence = context.runtime.globals.google_tag_manager ? 98 : 90;
      confidenceLevel = "high";
    } else if (context.runtime.globals.google_tag_manager || scriptAnalysis.hasGtmScript) {
      status = "possible";
      confidence = 60;
      confidenceLevel = "medium";
      notes.push("GTM script or runtime signature found, but container ID could not be parsed.");
    }

    return {
      id: this.id,
      platform: "Google Tag Manager",
      component: "GTM Web Container",
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
        containerCount: identifiers.length,
        isDuplicate,
        hasNoscript: hasNoscriptGtm,
        runtimeActive: context.runtime.globals.google_tag_manager,
      },
    };
  }
}
