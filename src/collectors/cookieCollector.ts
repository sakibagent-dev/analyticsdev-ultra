import { CookieCollectionItem } from "../types/detection";

export interface CookieAnalysis {
  items: CookieCollectionItem[];
  metaCookies: { fbp?: CookieCollectionItem; fbc?: CookieCollectionItem };
  googleCookies: { ga?: CookieCollectionItem; gid?: CookieCollectionItem; gcl?: CookieCollectionItem[] };
  tikTokCookies: { ttp?: CookieCollectionItem };
  securityWarnings: string[];
}

export class CookieCollector {
  /**
   * Classifies cookies into platforms, categories, and evaluates health/security attributes.
   */
  public static analyze(cookies: CookieCollectionItem[]): CookieAnalysis {
    const analysis: CookieAnalysis = {
      items: cookies,
      metaCookies: {},
      googleCookies: { gcl: [] },
      tikTokCookies: {},
      securityWarnings: [],
    };

    cookies.forEach((cookie) => {
      // 1. Meta cookies
      if (cookie.name === "_fbp") {
        analysis.metaCookies.fbp = cookie;
        cookie.category = "advertising";
      } else if (cookie.name === "_fbc") {
        analysis.metaCookies.fbc = cookie;
        cookie.category = "advertising";
      }

      // 2. Google cookies
      else if (cookie.name === "_ga") {
        analysis.googleCookies.ga = cookie;
        cookie.category = "analytics";
      } else if (cookie.name === "_gid") {
        analysis.googleCookies.gid = cookie;
        cookie.category = "analytics";
      } else if (cookie.name.startsWith("_gcl_")) {
        analysis.googleCookies.gcl?.push(cookie);
        cookie.category = "advertising";
      }

      // 3. TikTok cookies
      else if (cookie.name === "_ttp") {
        analysis.tikTokCookies.ttp = cookie;
        cookie.category = "advertising";
      }

      // 4. General advertising & analytics categorization
      else if (cookie.name.startsWith("_uet") || cookie.name === "MUID") {
        cookie.category = "advertising";
      } else if (cookie.name.startsWith("li_") || cookie.name === "bcookie") {
        cookie.category = "advertising";
      } else if (cookie.name.startsWith("_pin_") || cookie.name === "_epik") {
        cookie.category = "advertising";
      } else if (cookie.name.includes("session") || cookie.name.includes("csrf") || cookie.name.includes("token")) {
        cookie.category = "essential";
      } else {
        cookie.category = cookie.category || "unknown";
      }

      // 5. Security & health checks
      if (!cookie.secure) {
        analysis.securityWarnings.push(`Cookie "${cookie.name}" is missing the Secure attribute.`);
      }
      if (cookie.sameSite === "no_restriction" && !cookie.secure) {
        analysis.securityWarnings.push(`Cookie "${cookie.name}" has SameSite=None without Secure.`);
      }
      if (cookie.expires) {
        const expiresInDays = (cookie.expires * 1000 - Date.now()) / (1000 * 60 * 60 * 24);
        if (cookie.name === "_fbp" && expiresInDays < 2) {
          analysis.securityWarnings.push(`_fbp cookie lifetime is under 2 days, suggesting client-side ITP capping.`);
        }
      }
    });

    return analysis;
  }
}
