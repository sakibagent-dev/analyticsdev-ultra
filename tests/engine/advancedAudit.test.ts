import { describe, it, expect } from "vitest";
import { AuditEngine } from "../../src/engine/auditEngine";
import { CookieCollector } from "../../src/collectors/cookieCollector";
import { TechDetector } from "../../src/detectors/technology/techDetector";
import { AuditHistoryManager } from "../../src/storage/auditHistory";
import { HtmlGenerator } from "../../src/report/htmlGenerator";
import { PdfGenerator } from "../../src/report/pdfGenerator";
import { DEFAULT_CONSULTANT_PROFILE } from "../../src/types/report";
import {
  createBaseContext,
  createDataLayerEcommerceContext,
  createCleanContext,
} from "../fixtures/sampleContexts";

describe("Advanced Auditing, Duplicates, Tech, and Reporting", () => {
  it("detects dual-tagging duplicate tracking for GA4 when direct script and GTM both exist", async () => {
    const ctx = createBaseContext("dual-tagging.com");
    ctx.dom.scripts = [
      { src: "https://www.googletagmanager.com/gtm.js?id=GTM-AAAA11" },
      { src: "https://www.googletagmanager.com/gtag/js?id=G-BBBB22" },
    ];
    ctx.runtime.globals.google_tag_manager = true;

    const engine = new AuditEngine();
    const report = await engine.runAudit(ctx);

    const dupWarning = report.duplicates.find((d) => d.platform === "Google Analytics 4");
    expect(dupWarning).toBeDefined();
    expect(dupWarning?.event).toBe("page_view");
    expect(dupWarning?.severity).toBe("high");
  });

  it("detects WordPress and WooCommerce CMS stack", async () => {
    const ctx = createBaseContext("wp-store.com");
    ctx.dom.scripts = [
      { src: "https://wp-store.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js" },
      { src: "https://wp-store.com/wp-includes/js/jquery/jquery.min.js" },
    ];
    ctx.dom.metaTags = [
      { name: "generator", content: "WordPress 6.4; WooCommerce 8.5" },
    ];
    ctx.dom.domMarkers = ["wp-generator", "wp-content", "woocommerce"];

    const tech = new TechDetector();
    const result = await tech.detect(ctx);

    expect(result.status).toBe("detected");
    expect(result.identifiers).toContain("WordPress");
    expect(result.identifiers).toContain("WooCommerce");
  });

  it("identifies cookie security warnings for insecure cookies", () => {
    const cookies = [
      {
        name: "_fbp",
        value: "fb.1.123",
        domain: ".test.com",
        path: "/",
        secure: false, // Insecure!
        httpOnly: false,
        sameSite: "lax" as const,
      },
    ];

    const analysis = CookieCollector.analyze(cookies);
    expect(analysis.securityWarnings.length).toBeGreaterThan(0);
    expect(analysis.securityWarnings[0]).toContain("missing the Secure attribute");
  });

  it("calculates accurate Before vs After comparison delta", async () => {
    const engine = new AuditEngine();
    const beforeCtx = createCleanContext();
    const afterCtx = createDataLayerEcommerceContext();

    const beforeReport = await engine.runAudit(beforeCtx);
    const afterReport = await engine.runAudit(afterCtx);

    const comparison = AuditHistoryManager.compare(beforeReport, afterReport);

    expect(comparison.scoreDiff).toBeGreaterThan(0);
    expect(comparison.scoreAfter).toBe(afterReport.score.total);
    expect(comparison.scoreBefore).toBe(beforeReport.score.total);
  });

  it("generates valid HTML and PDF audit reports without runtime exceptions", async () => {
    const engine = new AuditEngine();
    const ctx = createDataLayerEcommerceContext();
    const report = await engine.runAudit(ctx);

    // 1. Generate HTML
    const html = HtmlGenerator.generate(report, DEFAULT_CONSULTANT_PROFILE);
    expect(html).toContain("Website Tracking & Conversion Audit");
    expect(html).toContain(report.website);
    expect(html).toContain(DEFAULT_CONSULTANT_PROFILE.name);

    // 2. Generate PDF
    const pdf = PdfGenerator.generate(report, DEFAULT_CONSULTANT_PROFILE);
    expect(pdf).toBeDefined();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  });
});
