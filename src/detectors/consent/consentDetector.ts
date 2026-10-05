import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";

export class ConsentDetector implements Detector {
  public id = "consent_management";
  public name = "Consent Management Platform & Consent Mode";
  public category = "consent" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const identifiers: string[] = [];
    const events: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    let cmpDetected: string | null = null;
    let bannerObservable = false;

    // 1. Check DOM markers for CMPs
    const domMarkers = context.dom.domMarkers;
    if (domMarkers.includes("onetrust") || context.runtime.globals.oneTrust) {
      cmpDetected = "OneTrust";
      bannerObservable = true;
    } else if (domMarkers.includes("cookiebot") || context.runtime.globals.cookiebot) {
      cmpDetected = "Cookiebot";
      bannerObservable = true;
    } else if (domMarkers.includes("usercentrics")) {
      cmpDetected = "Usercentrics";
      bannerObservable = true;
    } else if (domMarkers.includes("cookieyes")) {
      cmpDetected = "CookieYes";
      bannerObservable = true;
    } else if (domMarkers.includes("axeptio")) {
      cmpDetected = "Axeptio";
      bannerObservable = true;
    } else if (domMarkers.includes("didomi")) {
      cmpDetected = "Didomi";
      bannerObservable = true;
    } else if (domMarkers.includes("klaro")) {
      cmpDetected = "Klaro";
      bannerObservable = true;
    }

    // Also check script src for CMPs
    context.dom.scripts.forEach((s) => {
      const src = s.src || "";
      if (!cmpDetected) {
        if (src.includes("cookielaw.org") || src.includes("onetrust.com")) {
          cmpDetected = "OneTrust";
          bannerObservable = true;
        } else if (src.includes("consent.cookiebot.com")) {
          cmpDetected = "Cookiebot";
          bannerObservable = true;
        } else if (src.includes("app.usercentrics.eu")) {
          cmpDetected = "Usercentrics";
          bannerObservable = true;
        } else if (src.includes("cdn-cookieyes.com")) {
          cmpDetected = "CookieYes";
          bannerObservable = true;
        } else if (src.includes("termly.io")) {
          cmpDetected = "Termly";
          bannerObservable = true;
        } else if (src.includes("complianz")) {
          cmpDetected = "Complianz";
          bannerObservable = true;
        }
      }
    });

    if (cmpDetected) {
      identifiers.push(cmpDetected);
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: `Consent Management Platform (CMP) detected: ${cmpDetected}`,
          source: "DOM / Script / Global API",
          value: cmpDetected,
          confidence: 0.95,
        })
      );
    }

    // 2. TCF API global
    if (context.runtime.globals.tcfApi) {
      evidenceList.push(
        createEvidence({
          type: "runtime",
          description: "IAB Transparency & Consent Framework API (window.__tcfapi) detected.",
          source: "window.__tcfapi",
          confidence: 1.0,
        })
      );
    }

    // 3. Google Consent Mode v1 & v2 Signals
    const consentState = context.runtime.consentState || {};
    // Also check dataLayer pushes for consent commands
    const consentCommands: Record<string, string> = { ...consentState };

    context.dataLayer.rawItems.forEach((item) => {
      // Check if dataLayer contains ['consent', 'default', {...}] or gtag('consent', ...)
      if (item["0"] === "consent" && typeof item["2"] === "object" && item["2"] !== null) {
        const payload = item["2"] as Record<string, unknown>;
        Object.entries(payload).forEach(([k, v]) => {
          consentCommands[k] = String(v);
        });
      }
    });

    const hasConsentModeV2 = Boolean(
      consentCommands["ad_user_data"] ||
      consentCommands["ad_personalization"]
    );
    const hasConsentModeV1 = Boolean(
      consentCommands["ad_storage"] ||
      consentCommands["analytics_storage"]
    );

    if (hasConsentModeV1 || hasConsentModeV2) {
      const modeName = hasConsentModeV2 ? "Google Consent Mode v2" : "Google Consent Mode v1";
      identifiers.push(modeName);
      evidenceList.push(
        createEvidence({
          type: "datalayer",
          description: `${modeName} signals observed: ${Object.entries(consentCommands)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}`,
          source: "dataLayer / GTM Consent API",
          confidence: 0.95,
        })
      );
    }

    // 4. Disclaimers & Non-negotiable Compliance rule
    notes.push("Technical consent implementation detected.");
    notes.push("Legal/privacy compliance requires separate review (GDPR, ePrivacy, CCPA).");

    if (!cmpDetected && !hasConsentModeV1 && !hasConsentModeV2) {
      warnings.push("No observable Consent Management Platform (CMP) or Google Consent Mode signals were detected.");
    }

    if (hasConsentModeV1 && !hasConsentModeV2) {
      warnings.push("Legacy Google Consent Mode detected without v2 signals (ad_user_data, ad_personalization). Upgrading to v2 is required for EU advertising traffic.");
    }

    // 5. Status Resolution
    let status: DetectionResult["status"] = "not_detected";
    let confidence = 0;
    let confidenceLevel: DetectionResult["confidenceLevel"] = "low";

    if (cmpDetected || hasConsentModeV1 || hasConsentModeV2) {
      status = "detected";
      confidence = 90;
      confidenceLevel = "high";
    }

    return {
      id: this.id,
      platform: "Consent",
      component: "Consent Management & Consent Mode",
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
        cmpDetected,
        bannerObservable,
        hasConsentModeV1,
        hasConsentModeV2,
        consentSignals: consentCommands,
      },
    };
  }
}
