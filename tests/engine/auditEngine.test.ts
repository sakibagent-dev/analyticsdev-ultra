import { describe, it, expect } from "vitest";
import { AuditEngine } from "../../src/engine/auditEngine";
import {
  createDataLayerEcommerceContext,
  createCleanContext,
  createMetaOnlyContext,
  createServerSideContext,
} from "../fixtures/sampleContexts";

describe("AuditEngine Integration & Scoring", () => {
  it("runs end-to-end audit on an ecommerce website and parses transaction payload", async () => {
    const engine = new AuditEngine();
    const context = createDataLayerEcommerceContext();

    const report = await engine.runAudit(context);

    expect(report.website).toBe("ecommerce-brand.com");
    expect(report.dataLayer.hasEcommerce).toBe(true);
    expect(report.dataLayer.purchaseData?.transaction_id).toBe("ORD_99482");
    expect(report.dataLayer.purchaseData?.value).toBe(149.99);

    // Universal events table should capture purchase
    const purchaseEvent = report.events.find((e) => e.event.toLowerCase() === "purchase");
    expect(purchaseEvent).toBeDefined();
    expect(purchaseEvent?.transactionId).toBe("ORD_99482");
  });

  it("calculates a transparent score within 0 to 100", async () => {
    const engine = new AuditEngine();
    const context = createServerSideContext();

    const report = await engine.runAudit(context);

    expect(report.score.total).toBeGreaterThan(0);
    expect(report.score.total).toBeLessThanOrEqual(100);
    expect(report.score.categories.serverSideTracking.score).toBeGreaterThan(0);
  });

  it("flags missing event_id for Meta Purchase deduplication", async () => {
    const engine = new AuditEngine();
    const context = createMetaOnlyContext();
    // Add purchase event without event_id
    context.runtime.fbqEvents?.push({ event: "Purchase", params: { value: 100 } });

    const report = await engine.runAudit(context);

    const dedupIssue = report.issues.find((i) => i.id === "issue_meta_capi_dedup_missing_event_id");
    expect(dedupIssue).toBeDefined();
    expect(dedupIssue?.severity).toBe("high");
  });

  it("produces low score on plain website with zero false platform detections", async () => {
    const engine = new AuditEngine();
    const context = createCleanContext();

    const report = await engine.runAudit(context);

    expect(report.stats.platformsDetected).toBe(0);
    expect(report.score.total).toBeLessThan(40);
    expect(report.score.grade).toBe("F");
  });
});
