import { DomCollection } from "../types/detection";

export interface ScriptAnalysis {
  gtmContainers: string[];
  ga4MeasurementIds: string[];
  googleAdsConversionIds: string[];
  metaPixelIds: string[];
  tikTokPixelIds: string[];
  linkedInPartnerIds: string[];
  pinterestTagIds: string[];
  microsoftUetTagIds: string[];
  snapchatPixelIds: string[];
  redditPixelIds: string[];
  hasGtmScript: boolean;
  hasGtagScript: boolean;
  hasMetaScript: boolean;
  hasTikTokScript: boolean;
  hasLinkedInScript: boolean;
  hasPinterestScript: boolean;
  hasMicrosoftScript: boolean;
  hasSnapchatScript: boolean;
  hasRedditScript: boolean;
  sgtmHostCandidates: string[];
}

export class ScriptCollector {
  public static analyze(dom: DomCollection): ScriptAnalysis {
    const analysis: ScriptAnalysis = {
      gtmContainers: [],
      ga4MeasurementIds: [],
      googleAdsConversionIds: [],
      metaPixelIds: [],
      tikTokPixelIds: [],
      linkedInPartnerIds: [],
      pinterestTagIds: [],
      microsoftUetTagIds: [],
      snapchatPixelIds: [],
      redditPixelIds: [],
      hasGtmScript: false,
      hasGtagScript: false,
      hasMetaScript: false,
      hasTikTokScript: false,
      hasLinkedInScript: false,
      hasPinterestScript: false,
      hasMicrosoftScript: false,
      hasSnapchatScript: false,
      hasRedditScript: false,
      sgtmHostCandidates: [],
    };

    const gtmIdRegex = /GTM-[A-Z0-9]{4,10}/g;
    const ga4IdRegex = /G-[A-Z0-9]{7,12}/g;
    const adsIdRegex = /AW-[0-9]{6,12}/g;
    const metaPixelRegex = /fbq\s*\(\s*['"]init['"]\s*,\s*['"]([0-9]{10,20})['"]/g;
    const tiktokPixelRegex = /ttq\.load\s*\(\s*['"]([A-Z0-9]+)['"]/g;
    const linkedinIdRegex = /_linkedin_partner_id\s*=\s*['"]?([0-9]+)['"]?/g;
    const pinterestIdRegex = /pintrk\s*\(\s*['"]load['"]\s*,\s*['"]([0-9]+)['"]/g;
    const snapPixelRegex = /snaptr\s*\(\s*['"]init['"]\s*,\s*['"]([a-f0-9-]+)['"]/g;
    const redditPixelRegex = /rdt\s*\(\s*['"]init['"]\s*,\s*['"]([a-z0-9_]+)['"]/g;
    const uetTagRegex = /uetq\s*=\s*.*['"]([0-9]+)['"]|bat\.bing\.com\/bat\.js/g;

    dom.scripts.forEach((script) => {
      const src = script.src || "";
      const content = script.contentSnippet || "";
      const textToScan = `${src} ${content}`;

      // GTM
      if (src.includes("googletagmanager.com/gtm.js") || content.includes("googletagmanager.com/gtm.js")) {
        analysis.hasGtmScript = true;
      }
      // Check for sGTM candidate: custom domain loading gtm.js
      if (src.includes("/gtm.js") && !src.includes("googletagmanager.com")) {
        try {
          const parsed = new URL(src);
          analysis.sgtmHostCandidates.push(parsed.hostname);
          analysis.hasGtmScript = true;
        } catch {
          // ignore invalid URLs
        }
      }

      // Match GTM container IDs
      const gtmMatches = textToScan.match(gtmIdRegex);
      if (gtmMatches) {
        gtmMatches.forEach((id) => {
          if (!analysis.gtmContainers.includes(id)) analysis.gtmContainers.push(id);
        });
      }

      // Gtag / GA4 / Google Ads
      if (src.includes("googletagmanager.com/gtag/js") || content.includes("gtag(")) {
        analysis.hasGtagScript = true;
      }
      const ga4Matches = textToScan.match(ga4IdRegex);
      if (ga4Matches) {
        ga4Matches.forEach((id) => {
          if (!analysis.ga4MeasurementIds.includes(id)) analysis.ga4MeasurementIds.push(id);
        });
      }
      const adsMatches = textToScan.match(adsIdRegex);
      if (adsMatches) {
        adsMatches.forEach((id) => {
          if (!analysis.googleAdsConversionIds.includes(id)) analysis.googleAdsConversionIds.push(id);
        });
      }

      // Meta Pixel
      if (src.includes("connect.facebook.net") || content.includes("connect.facebook.net/en_US/fbevents.js") || content.includes("fbq(")) {
        analysis.hasMetaScript = true;
      }
      let metaMatch: RegExpExecArray | null;
      while ((metaMatch = metaPixelRegex.exec(textToScan)) !== null) {
        if (metaMatch[1] && !analysis.metaPixelIds.includes(metaMatch[1])) {
          analysis.metaPixelIds.push(metaMatch[1]);
        }
      }

      // TikTok
      if (src.includes("analytics.tiktok.com") || content.includes("analytics.tiktok.com/i18n/pixel") || content.includes("ttq.")) {
        analysis.hasTikTokScript = true;
      }
      let ttMatch: RegExpExecArray | null;
      while ((ttMatch = tiktokPixelRegex.exec(textToScan)) !== null) {
        if (ttMatch[1] && !analysis.tikTokPixelIds.includes(ttMatch[1])) {
          analysis.tikTokPixelIds.push(ttMatch[1]);
        }
      }

      // LinkedIn
      if (src.includes("snap.licdn.com/li.lms-analytics") || content.includes("_linkedin_partner_id")) {
        analysis.hasLinkedInScript = true;
      }
      let liMatch: RegExpExecArray | null;
      while ((liMatch = linkedinIdRegex.exec(textToScan)) !== null) {
        if (liMatch[1] && !analysis.linkedInPartnerIds.includes(liMatch[1])) {
          analysis.linkedInPartnerIds.push(liMatch[1]);
        }
      }

      // Pinterest
      if (src.includes("s.pinimg.com/ct/core.js") || content.includes("pintrk(")) {
        analysis.hasPinterestScript = true;
      }
      let pinMatch: RegExpExecArray | null;
      while ((pinMatch = pinterestIdRegex.exec(textToScan)) !== null) {
        if (pinMatch[1] && !analysis.pinterestTagIds.includes(pinMatch[1])) {
          analysis.pinterestTagIds.push(pinMatch[1]);
        }
      }

      // Microsoft / Bing UET
      if (src.includes("bat.bing.com/bat.js") || content.includes("bat.bing.com")) {
        analysis.hasMicrosoftScript = true;
      }
      let uetMatch: RegExpExecArray | null;
      while ((uetMatch = uetTagRegex.exec(textToScan)) !== null) {
        if (uetMatch[1] && !analysis.microsoftUetTagIds.includes(uetMatch[1])) {
          analysis.microsoftUetTagIds.push(uetMatch[1]);
        }
      }

      // Snapchat
      if (src.includes("sc-static.net/scevent.min.js") || content.includes("snaptr(")) {
        analysis.hasSnapchatScript = true;
      }
      let snapMatch: RegExpExecArray | null;
      while ((snapMatch = snapPixelRegex.exec(textToScan)) !== null) {
        if (snapMatch[1] && !analysis.snapchatPixelIds.includes(snapMatch[1])) {
          analysis.snapchatPixelIds.push(snapMatch[1]);
        }
      }

      // Reddit
      if (src.includes("alb.reddit.com/rp.js") || content.includes("rdt(")) {
        analysis.hasRedditScript = true;
      }
      let redditMatch: RegExpExecArray | null;
      while ((redditMatch = redditPixelRegex.exec(textToScan)) !== null) {
        if (redditMatch[1] && !analysis.redditPixelIds.includes(redditMatch[1])) {
          analysis.redditPixelIds.push(redditMatch[1]);
        }
      }
    });

    // Check iframes for noscript GTM & Meta
    dom.iframes.forEach((src) => {
      const gtmMatches = src.match(gtmIdRegex);
      if (gtmMatches) {
        gtmMatches.forEach((id) => {
          if (!analysis.gtmContainers.includes(id)) analysis.gtmContainers.push(id);
        });
      }
      const metaIdMatch = src.match(/facebook\.com\/tr\?id=([0-9]+)/);
      if (metaIdMatch && metaIdMatch[1] && !analysis.metaPixelIds.includes(metaIdMatch[1])) {
        analysis.metaPixelIds.push(metaIdMatch[1]);
      }
    });

    return analysis;
  }
}
