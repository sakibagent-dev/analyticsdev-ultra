import { describe, it, expect } from "vitest";
import { Ga4Detector } from "../../src/detectors/google/ga4Detector";
import { GtmDetector } from "../../src/detectors/google/gtmDetector";
import { GoogleAdsDetector } from "../../src/detectors/google/adsDetector";
import { createGa4GtmContext, createMultipleGtmContext, createCleanContext } from "../fixtures/sampleContexts";

describe("Google Detectors (GA4, GTM, Google Ads)", () => {
  it("detects GA4 measurement ID and measurement beacon", async () => {
    const context = createGa4GtmContext();
    const ga4 = new Ga4Detector();
    const result = await ga4.detect(context);

    expect(result.status).toBe("verified");
    expect(result.identifiers).toContain("G-ABC1234567");
    expect(result.events).toContain("page_view");
  });

  it("detects GTM container ID and noscript iframe", async () => {
    const context = createGa4GtmContext();
    const gtm = new GtmDetector();
    const result = await gtm.detect(context);

    expect(result.status).toBe("verified");
    expect(result.identifiers).toContain("GTM-TEST1234");
    expect(result.rawDetails?.hasNoscript).toBe(true);
    expect(result.rawDetails?.isDuplicate).toBe(false);
  });

  it("detects duplicate GTM containers and emits warning", async () => {
    const context = createMultipleGtmContext();
    const gtm = new GtmDetector();
    const result = await gtm.detect(context);

    expect(result.identifiers.length).toBe(2);
    expect(result.rawDetails?.isDuplicate).toBe(true);
    expect(result.warnings.some((w) => w.includes("Multiple GTM containers"))).toBe(true);
  });

  it("detects Google Ads conversion tag when present", async () => {
    const context = createCleanContext();
    context.dom.scripts = [
      { inline: true, contentSnippet: "gtag('config', 'AW-987654321'); gtag('event', 'conversion', {'send_to': 'AW-987654321/abcDEF'});" },
    ];
    const ads = new GoogleAdsDetector();
    const result = await ads.detect(context);

    expect(result.status).toBe("verified");
    expect(result.identifiers).toContain("AW-987654321");
  });
});
