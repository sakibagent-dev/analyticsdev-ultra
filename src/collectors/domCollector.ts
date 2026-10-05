import { DomCollection } from "../types/detection";

export class DomCollector {
  /**
   * Collects technical DOM evidence safely without modifying the page.
   */
  public static collect(): DomCollection {
    if (typeof document === "undefined") {
      return {
        scripts: [],
        iframes: [],
        metaTags: [],
        htmlAttributes: {},
        domMarkers: [],
      };
    }

    // 1. Collect script elements (src, type, id, snippet for inline scripts)
    const scriptElements = Array.from(document.querySelectorAll("script"));
    const scripts = scriptElements.map((el) => {
      const src = el.src || el.getAttribute("src") || undefined;
      const inline = !src;
      let contentSnippet: string | undefined = undefined;

      if (inline && el.textContent) {
        // Truncate to first 500 characters to prevent huge memory footprint
        contentSnippet = el.textContent.trim().slice(0, 500);
      }

      return {
        src,
        inline,
        contentSnippet,
        type: el.type || el.getAttribute("type") || undefined,
        id: el.id || undefined,
      };
    });

    // 2. Collect iframes (src, e.g., GTM noscript iframe, Meta noscript img/iframe)
    const iframeElements = Array.from(document.querySelectorAll("iframe"));
    const iframes = iframeElements
      .map((el) => el.src || el.getAttribute("src") || "")
      .filter(Boolean);

    // Also collect noscript tracking images (e.g. facebook.com/tr, googletagmanager.com/ns.html)
    const noscriptElements = Array.from(document.querySelectorAll("noscript"));
    noscriptElements.forEach((el) => {
      const html = el.innerHTML || "";
      const srcMatches = html.match(/src=["']([^"']+)["']/g);
      if (srcMatches) {
        srcMatches.forEach((m) => {
          const cleanSrc = m.replace(/src=["']|["']/g, "");
          if (cleanSrc) iframes.push(cleanSrc);
        });
      }
    });

    // 3. Collect meta tags (generator, cms, verification tokens, etc.)
    const metaElements = Array.from(document.querySelectorAll("meta"));
    const metaTags = metaElements.map((el) => ({
      name: el.getAttribute("name") || undefined,
      property: el.getAttribute("property") || undefined,
      content: el.getAttribute("content") || undefined,
    }));

    // 4. Collect HTML root and body attributes (e.g. data-wf-page, ng-app, etc.)
    const htmlAttributes: Record<string, string> = {};
    const rootEl = document.documentElement;
    if (rootEl) {
      Array.from(rootEl.attributes).forEach((attr) => {
        htmlAttributes[`html:${attr.name}`] = attr.value;
      });
    }
    const bodyEl = document.body;
    if (bodyEl) {
      Array.from(bodyEl.attributes).forEach((attr) => {
        htmlAttributes[`body:${attr.name}`] = attr.value;
      });
    }

    // 5. Collect specific DOM signature markers for CMS / Consent / Tech
    const domMarkers: string[] = [];
    if (document.querySelector('meta[name="generator"][content*="WordPress"]')) domMarkers.push("wp-generator");
    if (document.querySelector('link[rel*="wp-content"]') || document.querySelector('script[src*="wp-content"]')) domMarkers.push("wp-content");
    if (document.querySelector('script[src*="shopify"], link[href*="shopify"]')) domMarkers.push("shopify");
    if (document.querySelector('html[data-wf-page], html[data-wf-site]')) domMarkers.push("webflow");
    if (document.querySelector('meta[name="generator"][content*="WooCommerce"]')) domMarkers.push("woocommerce");
    if (document.querySelector('#onetrust-banner-sdk, #onetrust-consent-sdk')) domMarkers.push("onetrust");
    if (document.querySelector('#CybotCookiebotDialog, script[src*="cookiebot"]')) domMarkers.push("cookiebot");
    if (document.querySelector('#usercentrics-root, script[src*="usercentrics"]')) domMarkers.push("usercentrics");
    if (document.querySelector('#cookie-law-info-bar, .cky-consent-container')) domMarkers.push("cookieyes");
    if (document.querySelector('#axeptio_overlay')) domMarkers.push("axeptio");
    if (document.querySelector('#didomi-host')) domMarkers.push("didomi");
    if (document.querySelector('div#klaro')) domMarkers.push("klaro");
    if (document.querySelector('div#__next, script[src*="/_next/"]')) domMarkers.push("nextjs");
    if (document.querySelector('div#root, div#app')) domMarkers.push("spa-root");

    return {
      scripts,
      iframes,
      metaTags,
      htmlAttributes,
      domMarkers,
    };
  }
}
