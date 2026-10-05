import { NetworkRequestItem } from "../types/detection";

export interface NetworkAnalysis {
  requests: NetworkRequestItem[];
  metaRequests: NetworkRequestItem[];
  googleAnalyticsRequests: NetworkRequestItem[];
  googleAdsRequests: NetworkRequestItem[];
  tikTokRequests: NetworkRequestItem[];
  linkedInRequests: NetworkRequestItem[];
  pinterestRequests: NetworkRequestItem[];
  microsoftRequests: NetworkRequestItem[];
  snapchatRequests: NetworkRequestItem[];
  redditRequests: NetworkRequestItem[];
  firstPartyRequests: NetworkRequestItem[];
  serverSideCandidateRequests: NetworkRequestItem[];
}

export class NetworkCollector {
  /**
   * Classifies a network request URL and parameters into tracking categories.
   */
  public static classifyRequest(
    url: string,
    method = "GET",
    pageDomain = "",
    postData?: string
  ): NetworkRequestItem {
    let urlObj: URL | null = null;
    try {
      urlObj = new URL(url);
    } catch {
      // Relative or invalid URL fallback
    }

    const params: Record<string, string> = {};
    if (urlObj) {
      urlObj.searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    let type: NetworkRequestItem["type"] = "unknown";
    let platform: string | undefined = undefined;
    const hostname = urlObj ? urlObj.hostname.toLowerCase() : "";
    const pathname = urlObj ? urlObj.pathname.toLowerCase() : "";

    // 1. Meta (Facebook)
    if (hostname.includes("facebook.com") && pathname.includes("/tr")) {
      type = "advertising";
      platform = "meta";
      if (params["ev"] === "Purchase" || params["ev"] === "Lead") {
        type = "conversion";
      }
    }
    // 2. Google Analytics (GA4 / UA)
    else if (
      (hostname.includes("google-analytics.com") || hostname.includes("analytics.google.com")) &&
      (pathname.includes("/g/collect") || pathname.includes("/collect"))
    ) {
      type = "analytics";
      platform = "ga4";
      if (params["en"] === "purchase" || params["en"] === "conversion") {
        type = "conversion";
      }
    }
    // 3. Google Ads Conversions
    else if (hostname.includes("googleadservices.com") || hostname.includes("google.com/pagead")) {
      type = "conversion";
      platform = "google_ads";
    }
    // 4. TikTok
    else if (hostname.includes("analytics.tiktok.com")) {
      type = "advertising";
      platform = "tiktok";
      if (pathname.includes("/api/win8") || params["event"] === "CompletePayment") {
        type = "conversion";
      }
    }
    // 5. LinkedIn
    else if (hostname.includes("licdn.com") || hostname.includes("linkedin.com/li/track") || hostname.includes("px.ads.linkedin.com")) {
      type = "advertising";
      platform = "linkedin";
    }
    // 6. Pinterest
    else if (hostname.includes("ct.pinterest.com")) {
      type = "advertising";
      platform = "pinterest";
      if (params["event"] === "checkout") type = "conversion";
    }
    // 7. Microsoft / Bing
    else if (hostname.includes("bat.bing.com")) {
      type = "advertising";
      platform = "microsoft";
    }
    // 8. Snapchat
    else if (hostname.includes("tr.snapchat.com") || hostname.includes("sc-static.net")) {
      type = "advertising";
      platform = "snapchat";
    }
    // 9. Reddit
    else if (hostname.includes("alb.reddit.com")) {
      type = "advertising";
      platform = "reddit";
    }
    // 10. Consent providers
    else if (
      hostname.includes("onetrust.com") ||
      hostname.includes("cookiebot.com") ||
      hostname.includes("usercentrics.eu") ||
      hostname.includes("cookieyes.com")
    ) {
      type = "consent";
    }
    // 11. First-party or Server-side tracking proxy (e.g., s.domain.com/g/collect, /mp/collect, stape.io)
    else if (hostname.includes("stape.io") || hostname.includes("capig.io")) {
      type = "server_side";
      platform = "server_side";
    } else if (
      pageDomain &&
      (hostname.endsWith(pageDomain) || hostname === pageDomain) &&
      (pathname.includes("/g/collect") || pathname.includes("/collect") || pathname.includes("/metrics") || pathname.includes("/events"))
    ) {
      type = "first_party";
      platform = "server_side";
    }

    return {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url,
      method,
      timestamp: Date.now(),
      type,
      platform,
      params,
      postData,
    };
  }

  /**
   * Summarizes all observed network requests.
   */
  public static analyze(requests: NetworkRequestItem[]): NetworkAnalysis {
    return {
      requests,
      metaRequests: requests.filter((r) => r.platform === "meta"),
      googleAnalyticsRequests: requests.filter((r) => r.platform === "ga4"),
      googleAdsRequests: requests.filter((r) => r.platform === "google_ads"),
      tikTokRequests: requests.filter((r) => r.platform === "tiktok"),
      linkedInRequests: requests.filter((r) => r.platform === "linkedin"),
      pinterestRequests: requests.filter((r) => r.platform === "pinterest"),
      microsoftRequests: requests.filter((r) => r.platform === "microsoft"),
      snapchatRequests: requests.filter((r) => r.platform === "snapchat"),
      redditRequests: requests.filter((r) => r.platform === "reddit"),
      firstPartyRequests: requests.filter((r) => r.type === "first_party"),
      serverSideCandidateRequests: requests.filter((r) => r.type === "server_side" || r.type === "first_party"),
    };
  }
}
