import {
  AuditContext,
  DetectionResult,
} from "../types/detection";
import {
  UniversalEvent,
  DuplicateTrackingWarning,
  ServerSideAudit,
  AttributionSignals,
} from "../types/audit";

export class ValidationEngine {
  /**
   * Compiles the Universal Event Table by cross-referencing events
   * across Meta, GA4, Google Ads, TikTok, and other platforms.
   */
  public static compileUniversalEvents(
    context: AuditContext,
    results: DetectionResult[]
  ): UniversalEvent[] {
    const eventsMap = new Map<string, UniversalEvent>();

    // 1. Process Meta events
    const metaResult = results.find((r) => r.platform === "Meta" && r.component === "Meta Pixel");
    if (metaResult && metaResult.status !== "not_detected") {
      metaResult.events.forEach((ev) => {
        const key = `meta_${ev}`;
        const hasServerSignal = context.serverSideSignals.firstPartyEndpoints.length > 0;
        const matchingFbq = context.runtime.fbqEvents?.find((f) => f.event === ev);
        const eventId = matchingFbq?.eventId;
        const value = matchingFbq?.params?.value as number | string | undefined;
        const currency = matchingFbq?.params?.currency as string | undefined;

        eventsMap.set(key, {
          event: ev,
          platform: "Meta Pixel",
          browser: true,
          serverSignal: hasServerSignal,
          eventId,
          value,
          currency,
          evidenceSummary: `Detected via ${metaResult.component} (${metaResult.status})`,
          status: hasServerSignal && eventId ? "verified" : "detected",
        });
      });
    }

    // 2. Process GA4 events
    const ga4Result = results.find((r) => r.platform === "Google Analytics");
    if (ga4Result && ga4Result.status !== "not_detected") {
      ga4Result.events.forEach((ev) => {
        const key = `ga4_${ev}`;
        const isPurchase = ev === "purchase";
        const txId = isPurchase ? context.dataLayer.purchaseData?.transaction_id : undefined;
        const val = isPurchase ? context.dataLayer.purchaseData?.value : undefined;
        const curr = isPurchase ? context.dataLayer.purchaseData?.currency : undefined;

        eventsMap.set(key, {
          event: ev,
          platform: "Google Analytics 4",
          browser: true,
          serverSignal: context.serverSideSignals.firstPartyEndpoints.length > 0,
          transactionId: txId,
          value: val,
          currency: curr,
          evidenceSummary: `Observed via GA4 measurement beacon/dataLayer`,
          status: isPurchase && (!txId || !val) ? "warning" : "verified",
        });
      });
    }

    // 3. Process Google Ads events
    const gadsResult = results.find((r) => r.platform === "Google Ads");
    if (gadsResult && gadsResult.status !== "not_detected") {
      gadsResult.events.forEach((ev) => {
        const key = `gads_${ev}`;
        eventsMap.set(key, {
          event: ev,
          platform: "Google Ads",
          browser: true,
          serverSignal: false,
          evidenceSummary: "Google Ads conversion action observed",
          status: "detected",
        });
      });
    }

    // 4. Process TikTok events
    const ttResult = results.find((r) => r.platform === "TikTok");
    if (ttResult && ttResult.status !== "not_detected") {
      ttResult.events.forEach((ev) => {
        const key = `tiktok_${ev}`;
        eventsMap.set(key, {
          event: ev,
          platform: "TikTok Pixel",
          browser: true,
          serverSignal: false,
          evidenceSummary: "TikTok standard event observed",
          status: "detected",
        });
      });
    }

    // 5. If dataLayer has Purchase, make sure it's captured in universal table
    if (context.dataLayer.purchaseData?.hasPurchase) {
      if (!eventsMap.has("ga4_purchase")) {
        eventsMap.set("dl_purchase", {
          event: "purchase",
          platform: "DataLayer Ecommerce",
          browser: true,
          serverSignal: false,
          transactionId: context.dataLayer.purchaseData.transaction_id,
          value: context.dataLayer.purchaseData.value,
          currency: context.dataLayer.purchaseData.currency,
          evidenceSummary: "Captured in window.dataLayer ecommerce object",
          status: context.dataLayer.purchaseData.transaction_id ? "verified" : "warning",
        });
      }
    }

    return Array.from(eventsMap.values());
  }

  /**
   * Evaluates duplicate tracking risks across scripts, GTM, and plugins.
   */
  public static detectDuplicates(
    context: AuditContext,
    results: DetectionResult[]
  ): DuplicateTrackingWarning[] {
    const duplicates: DuplicateTrackingWarning[] = [];

    // 1. Multiple GTM containers
    const gtmResult = results.find((r) => r.id === "google_tag_manager" || r.platform === "Google Tag Manager");
    if (gtmResult && gtmResult.identifiers.length > 1) {
      duplicates.push({
        platform: "Google Tag Manager",
        event: "Container Initialization",
        paths: gtmResult.identifiers,
        severity: "high",
        recommendation: "Consolidate into a single primary GTM container or verify that multiple containers do not duplicate tags.",
      });
    }

    // 2. Multiple Meta Pixel IDs
    const metaResult = results.find((r) => r.id === "meta_pixel" || r.platform === "Meta");
    if (metaResult && metaResult.identifiers.length > 1) {
      duplicates.push({
        platform: "Meta Pixel",
        event: "Pixel Initialization",
        paths: metaResult.identifiers,
        severity: "medium",
        recommendation: "Ensure multiple Meta Pixels are intentional (e.g. agency vs internal) and avoid duplicate standard event firing.",
      });
    }

    // 3. Direct script + GTM duplication for GA4
    const ga4Result = results.find((r) => r.id === "google_analytics_4" || r.platform === "Google Analytics");
    const hasGtm = gtmResult && gtmResult.status !== "not_detected";
    const hasDirectGtagScript = context.dom.scripts.some((s) => s.src?.includes("googletagmanager.com/gtag/js"));

    if (ga4Result && hasGtm && hasDirectGtagScript) {
      duplicates.push({
        platform: "Google Analytics 4",
        event: "page_view",
        paths: ["Direct gtag.js inline script", "Google Tag Manager container"],
        severity: "high",
        recommendation: "Dual-tagging detected: GA4 is loaded via both direct gtag.js and GTM. Migrate fully to GTM to avoid double-counting pageviews.",
      });
    }

    // 4. Duplicate PageView events
    const pageviewRequests = context.network.filter((r) =>
      (r.platform === "meta" && r.params["ev"] === "PageView") ||
      (r.platform === "ga4" && r.params["en"] === "page_view")
    );

    const metaPvCount = pageviewRequests.filter((r) => r.platform === "meta").length;
    if (metaPvCount > 1) {
      duplicates.push({
        platform: "Meta Pixel",
        event: "PageView",
        paths: [`Observed ${metaPvCount} outgoing PageView requests on initial page load`],
        severity: "high",
        recommendation: "Review GTM and CMS plugins to ensure PageView is only triggered once per page load.",
      });
    }

    return duplicates;
  }

  /**
   * Evaluates server-side tracking infrastructure.
   */
  public static evaluateServerSide(
    context: AuditContext,
    results: DetectionResult[]
  ): ServerSideAudit {
    const firstPartyEndpoints = [...context.serverSideSignals.firstPartyEndpoints];
    const customSubdomains = [...context.serverSideSignals.customSubdomains];
    const sgtmIndicators = [...context.serverSideSignals.sgtmMarkers];
    const stapeIndicators = [...context.serverSideSignals.stapeMarkers];

    // Check script analysis for sgtm host candidates
    context.dom.scripts.forEach((s) => {
      const src = s.src || "";
      if (src.includes("/gtm.js") && !src.includes("googletagmanager.com")) {
        try {
          const u = new URL(src);
          if (!customSubdomains.includes(u.hostname)) customSubdomains.push(u.hostname);
          if (!sgtmIndicators.includes(`Custom GTM host: ${u.hostname}`)) {
            sgtmIndicators.push(`Custom GTM host: ${u.hostname}`);
          }
        } catch {
          // ignore
        }
      }
    });

    // Check network for stape
    context.network.forEach((req) => {
      if (req.url.includes("stape.io") || req.url.includes("capig")) {
        if (!stapeIndicators.includes(req.url)) stapeIndicators.push(req.url);
      }
    });

    const metaCapi = results.find((r) => r.id === "meta_capi");
    const eventDeduplicationObserved = Boolean(metaCapi?.rawDetails?.eventIdObserved);

    let status: ServerSideAudit["status"] = "requires_access";
    let confidence = 25;

    if (sgtmIndicators.length > 0 || stapeIndicators.length > 0) {
      status = "detected";
      confidence = 80;
    } else if (firstPartyEndpoints.length > 0 || eventDeduplicationObserved) {
      status = "possible";
      confidence = 55;
    } else {
      status = "requires_access";
      confidence = 20;
    }

    return {
      status,
      confidence,
      firstPartyEndpoints,
      customSubdomains,
      sgtmIndicators,
      stapeIndicators,
      eventDeduplicationObserved,
      disclaimer: "Browser-level scanning cannot fully verify private server/container configurations. Verifying server-side delivery requires authorized access to GTM Server Container, Stape, or Ad Platform Events Manager.",
      requirements: [
        "GTM Server Container access",
        "Cloud hosting / Stape platform access",
        "Ad platform Events Manager access (Meta CAPI, TikTok Events API, GA4 Measurement Protocol)",
      ],
    };
  }

  /**
   * Parses URL attribution signals (UTMs and click IDs).
   */
  public static parseAttribution(context: AuditContext): AttributionSignals {
    const params = context.urlParams;
    const utms = {
      source: params["utm_source"],
      medium: params["utm_medium"],
      campaign: params["utm_campaign"],
      term: params["utm_term"],
      content: params["utm_content"],
    };

    const clickIds = {
      fbclid: params["fbclid"],
      gclid: params["gclid"],
      gbraid: params["gbraid"],
      wbraid: params["wbraid"],
      ttclid: params["ttclid"],
      msclkid: params["msclkid"],
      li_fat_id: params["li_fat_id"],
      epik: params["epik"],
      sc_cid: params["ScCid"] || params["sccid"],
      rdt_cid: params["rdt_cid"],
    };

    const summary: string[] = [];
    if (utms.source || utms.medium || utms.campaign) {
      summary.push(`UTM Parameters detected (Source: ${utms.source || "n/a"}, Medium: ${utms.medium || "n/a"})`);
    }
    if (clickIds.fbclid) summary.push("Meta attribution signal (fbclid) detected.");
    if (clickIds.gclid || clickIds.gbraid || clickIds.wbraid) summary.push("Google Ads attribution signal (gclid/gbraid/wbraid) detected.");
    if (clickIds.ttclid) summary.push("TikTok attribution signal (ttclid) detected.");
    if (clickIds.msclkid) summary.push("Microsoft Ads attribution signal (msclkid) detected.");
    if (clickIds.li_fat_id) summary.push("LinkedIn attribution signal (li_fat_id) detected.");

    return {
      utms,
      clickIds,
      summary,
    };
  }
}
