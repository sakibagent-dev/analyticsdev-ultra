import { Detector, AuditContext, DetectionResult } from "../../types/detection";
import { createEvidence } from "../../types/evidence";

export class TechDetector implements Detector {
  public id = "tech_stack";
  public name = "CMS & Technology Stack";
  public category = "technology" as const;

  public async detect(context: AuditContext): Promise<DetectionResult> {
    const evidenceList = [];
    const cmsFound: string[] = [];
    const ecommerceFound: string[] = [];
    const frameworksFound: string[] = [];
    const infrastructureFound: string[] = [];
    const warnings: string[] = [];
    const notes: string[] = [];

    const dom = context.dom;
    const scripts = dom.scripts;
    const meta = dom.metaTags;
    const attrs = dom.htmlAttributes;
    const markers = dom.domMarkers;

    // 1. WordPress (Multiple signals)
    const hasWpMeta = meta.some((m) => m.name === "generator" && m.content?.includes("WordPress"));
    const hasWpScript = scripts.some((s) => s.src?.includes("/wp-content/") || s.src?.includes("/wp-includes/"));
    const hasWpMarker = markers.includes("wp-generator") || markers.includes("wp-content");
    if (hasWpMeta || (hasWpScript && hasWpMarker)) {
      cmsFound.push("WordPress");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "WordPress CMS detected via core scripts and generator meta tags.",
          source: hasWpMeta ? "Meta Generator" : "Script paths",
          confidence: 0.95,
        })
      );
    }

    // 2. WooCommerce
    const hasWooMeta = meta.some((m) => m.name === "generator" && m.content?.includes("WooCommerce"));
    const hasWooScript = scripts.some((s) => s.src?.includes("/woocommerce/"));
    const hasWooBody = Object.keys(attrs).some((k) => attrs[k].includes("woocommerce"));
    if (hasWooMeta || hasWooScript || hasWooBody) {
      ecommerceFound.push("WooCommerce");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "WooCommerce ecommerce plugin detected.",
          source: "Plugins / Body classes",
          confidence: 0.95,
        })
      );
    }

    // 3. Shopify
    const hasShopifyScript = scripts.some((s) => s.src?.includes("cdn.shopify.com"));
    const hasShopifyVar = markers.includes("shopify");
    const hasShopifyMeta = meta.some((m) => m.content?.includes("Shopify"));
    if (hasShopifyScript || hasShopifyVar || hasShopifyMeta) {
      cmsFound.push("Shopify");
      ecommerceFound.push("Shopify");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "Shopify Ecommerce platform detected.",
          source: "CDN / Theme scripts",
          confidence: 0.95,
        })
      );
    }

    // 4. Webflow
    const hasWfAttr = Object.keys(attrs).some((k) => k.includes("data-wf-page") || k.includes("data-wf-site"));
    const hasWfScript = scripts.some((s) => s.src?.includes("webflow.com") || s.src?.includes("assets.website-files.com"));
    if (hasWfAttr || hasWfScript) {
      cmsFound.push("Webflow");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "Webflow CMS and visual frontend builder detected.",
          source: "HTML data attributes",
          confidence: 0.95,
        })
      );
    }

    // 5. Wix
    const hasWixScript = scripts.some((s) => s.src?.includes("static.parastorage.com") || s.src?.includes("wix.com"));
    const hasWixMeta = meta.some((m) => m.name === "generator" && m.content?.includes("Wix.com"));
    if (hasWixScript || hasWixMeta) {
      cmsFound.push("Wix");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "Wix website builder detected.",
          source: "Wix assets / Generator",
          confidence: 0.95,
        })
      );
    }

    // 6. Squarespace
    const hasSqScript = scripts.some((s) => s.src?.includes("static1.squarespace.com"));
    const hasSqMeta = meta.some((m) => m.content?.includes("Squarespace"));
    if (hasSqScript || hasSqMeta) {
      cmsFound.push("Squarespace");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "Squarespace platform detected.",
          source: "Squarespace assets",
          confidence: 0.95,
        })
      );
    }

    // 7. Elementor (WordPress Page Builder)
    const hasElementorScript = scripts.some((s) => s.src?.includes("/plugins/elementor/"));
    if (hasElementorScript) {
      frameworksFound.push("Elementor");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "Elementor WordPress Page Builder detected.",
          source: "Elementor plugins",
          confidence: 0.95,
        })
      );
    }

    // 8. Next.js / React / Vue
    const hasNextScript = scripts.some((s) => s.src?.includes("/_next/static/"));
    const hasNextMarker = markers.includes("nextjs");
    if (hasNextScript || hasNextMarker) {
      frameworksFound.push("Next.js");
      frameworksFound.push("React");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "Next.js (React framework) detected.",
          source: "/_next/ script bundles",
          confidence: 0.95,
        })
      );
    }

    // 9. Cloudflare
    const hasCfScript = scripts.some((s) => s.src?.includes("cloudflare.com") || s.src?.includes("/cdn-cgi/"));
    if (hasCfScript) {
      infrastructureFound.push("Cloudflare");
      evidenceList.push(
        createEvidence({
          type: "technology",
          description: "Cloudflare edge CDN and proxy detected.",
          source: "CDN /cdn-cgi/ scripts",
          confidence: 0.95,
        })
      );
    }

    const allTech = [...cmsFound, ...ecommerceFound, ...frameworksFound, ...infrastructureFound];
    const uniqueIdentifiers = Array.from(new Set(allTech));

    return {
      id: this.id,
      platform: "Technology",
      component: "CMS & Framework Detector",
      category: this.category,
      status: uniqueIdentifiers.length > 0 ? "detected" : "not_detected",
      confidence: uniqueIdentifiers.length > 0 ? 90 : 0,
      confidenceLevel: uniqueIdentifiers.length > 0 ? "high" : "low",
      identifiers: uniqueIdentifiers,
      events: [],
      evidence: evidenceList,
      warnings,
      notes,
      rawDetails: {
        cms: cmsFound,
        ecommerce: ecommerceFound,
        frameworks: frameworksFound,
        infrastructure: infrastructureFound,
      },
    };
  }
}
