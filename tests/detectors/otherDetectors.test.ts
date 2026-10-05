import { describe, it, expect } from "vitest";
import { TikTokDetector } from "../../src/detectors/tiktok/tiktokDetector";
import { OpenAiAdsDetector } from "../../src/detectors/openai/openaiDetector";
import { ConsentDetector } from "../../src/detectors/consent/consentDetector";
import { createConsentEnabledContext, createCleanContext } from "../fixtures/sampleContexts";

describe("Other Platform Detectors & Consent", () => {
  it("detects TikTok pixel when ttq.load is present", async () => {
    const context = createCleanContext();
    context.dom.scripts = [
      { inline: true, contentSnippet: "ttq.load('C1234567890'); ttq.page();" },
    ];
    context.runtime.globals.ttq = true;

    const tiktok = new TikTokDetector();
    const result = await tiktok.detect(context);

    expect(result.status).toBe("detected");
    expect(result.identifiers).toContain("C1234567890");
  });

  it("strictly reports OpenAI Ads as Not Verifiable from Browser without inventing APIs", async () => {
    const context = createCleanContext();
    const openai = new OpenAiAdsDetector();
    const result = await openai.detect(context);

    expect(result.status).toBe("not_detected");
    expect(result.notes.some((n) => n.includes("Not Verifiable from Browser"))).toBe(true);
    expect(result.identifiers.length).toBe(0);
  });

  it("detects OneTrust CMP and Google Consent Mode v2 signals", async () => {
    const context = createConsentEnabledContext();
    const consent = new ConsentDetector();
    const result = await consent.detect(context);

    expect(result.status).toBe("detected");
    expect(result.rawDetails?.cmpDetected).toBe("OneTrust");
    expect(result.rawDetails?.hasConsentModeV2).toBe(true);
  });
});
