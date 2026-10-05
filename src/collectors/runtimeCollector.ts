import { RuntimeCollection } from "../types/detection";

export class RuntimeCollector {
  /**
   * Safely inspects runtime globals and returns a sanitized snapshot.
   * Can be executed in the MAIN world context.
   */
  public static inspectWindow(win: typeof window): RuntimeCollection {
    const w = win as unknown as Record<string, unknown>;
    const globals: Record<string, boolean> = {
      dataLayer: Array.isArray(w.dataLayer),
      google_tag_manager: typeof w.google_tag_manager === "object" && w.google_tag_manager !== null,
      gtag: typeof w.gtag === "function",
      googleAnalytics: typeof w.ga === "function" || typeof w.googleAnalytics === "function",
      fbq: typeof w.fbq === "function",
      ttq: typeof w.ttq === "object" && w.ttq !== null,
      pintrk: typeof w.pintrk === "function",
      snaptr: typeof w.snaptr === "function",
      rdt: typeof w.rdt === "function",
      uetq: Array.isArray(w.uetq) || typeof w.uetq === "object",
      oneTrust: typeof w.OneTrust === "object" && w.OneTrust !== null,
      cookiebot: typeof w.Cookiebot === "object" && w.Cookiebot !== null,
      tcfApi: typeof w.__tcfapi === "function",
    };

    // Safely observe consent state if available in GTM dataLayer or window
    const consentState: Record<string, string> = {};
    if (typeof w.google_tag_manager === "object" && w.google_tag_manager !== null) {
      const gtm = w.google_tag_manager as Record<string, unknown>;
      // Some GTM builds expose consent settings
      if (typeof gtm.dataLayer === "object" && gtm.dataLayer !== null) {
        const dl = gtm.dataLayer as Record<string, unknown>;
        if (typeof dl.get === "function") {
          try {
            const consent = dl.get("consent");
            if (consent && typeof consent === "object") {
              Object.entries(consent as Record<string, unknown>).forEach(([k, v]) => {
                consentState[k] = String(v);
              });
            }
          } catch {
            // ignore
          }
        }
      }
    }

    return {
      globals,
      consentState: Object.keys(consentState).length > 0 ? consentState : undefined,
    };
  }
}
