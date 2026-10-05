import { describe, it, expect } from "vitest";
import { MetaPixelDetector } from "../../src/detectors/meta/pixelDetector";
import { MetaCapiDetector } from "../../src/detectors/meta/capiDetector";
import { createMetaOnlyContext, createCleanContext, createServerSideContext } from "../fixtures/sampleContexts";

describe("Meta Pixel & CAPI Detectors", () => {
  it("detects Meta Pixel ID, events, and cookies correctly on Meta-enabled site", async () => {
    const context = createMetaOnlyContext();
    const pixelDetector = new MetaPixelDetector();
    const result = await pixelDetector.detect(context);

    expect(result.platform).toBe("Meta");
    expect(result.status).toBe("verified");
    expect(result.identifiers).toContain("123456789012345");
    expect(result.events).toContain("PageView");
    expect(result.confidence).toBeGreaterThanOrEqual(85);
  });

  it("does NOT falsely claim Meta Pixel on a clean website (no false positives)", async () => {
    const context = createCleanContext();
    const pixelDetector = new MetaPixelDetector();
    const result = await pixelDetector.detect(context);

    expect(result.status).toBe("not_detected");
    expect(result.identifiers.length).toBe(0);
    expect(result.events.length).toBe(0);
  });

  it("strictly enforces non-negotiable accuracy rule for Meta CAPI", async () => {
    // When only client-side Meta Pixel exists, CAPI MUST NOT be claimed as verified!
    const context = createMetaOnlyContext();
    const capiDetector = new MetaCapiDetector();
    const result = await capiDetector.detect(context);

    expect(result.status).not.toBe("verified");
    expect(result.status).toBe("requires_access");
    expect(result.notes.some((n) => n.includes("requires access") || n.includes("Events Manager"))).toBe(true);
  });

  it("marks CAPI as possible when event_id and first-party endpoints are observed", async () => {
    const context = createServerSideContext();
    const capiDetector = new MetaCapiDetector();
    const result = await capiDetector.detect(context);

    expect(result.status).toBe("possible");
    expect(result.rawDetails?.eventIdObserved).toBe(true);
  });
});
