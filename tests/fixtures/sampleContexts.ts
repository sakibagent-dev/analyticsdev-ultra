import { AuditContext } from "../../src/types/detection";

export function createBaseContext(domain = "example.com"): AuditContext {
  return {
    url: `https://${domain}/`,
    domain,
    title: `Sample ${domain}`,
    timestamp: Date.now(),
    dom: {
      scripts: [],
      iframes: [],
      metaTags: [],
      htmlAttributes: {},
      domMarkers: [],
    },
    runtime: {
      globals: {},
    },
    cookies: [],
    dataLayer: {
      exists: false,
      pushesCount: 0,
      events: [],
      hasEcommerce: false,
      rawItems: [],
    },
    network: [],
    urlParams: {},
    serverSideSignals: {
      firstPartyEndpoints: [],
      customSubdomains: [],
      sgtmMarkers: [],
      stapeMarkers: [],
      eventIdsSeen: [],
    },
  };
}

export function createMetaOnlyContext(): AuditContext {
  const ctx = createBaseContext("meta-store.com");
  ctx.dom.scripts = [
    { src: "https://connect.facebook.net/en_US/fbevents.js" },
    { inline: true, contentSnippet: "fbq('init', '123456789012345'); fbq('track', 'PageView');" },
  ];
  ctx.runtime.globals.fbq = true;
  ctx.runtime.fbqEvents = [{ event: "PageView" }, { event: "ViewContent" }];
  ctx.cookies = [
    {
      name: "_fbp",
      value: "fb.1.1680000000.12345",
      domain: ".meta-store.com",
      path: "/",
      secure: true,
      httpOnly: false,
      sameSite: "lax",
    },
    {
      name: "_fbc",
      value: "fb.1.1680000000.IwAR0...",
      domain: ".meta-store.com",
      path: "/",
      secure: true,
      httpOnly: false,
      sameSite: "lax",
    },
  ];
  ctx.urlParams = { fbclid: "IwAR0sample_click_id" };
  ctx.network = [
    {
      id: "req_meta_1",
      url: "https://www.facebook.com/tr/?id=123456789012345&ev=PageView",
      method: "GET",
      timestamp: Date.now(),
      type: "advertising",
      platform: "meta",
      params: { id: "123456789012345", ev: "PageView" },
    },
  ];
  return ctx;
}

export function createGa4GtmContext(): AuditContext {
  const ctx = createBaseContext("analytics-portal.com");
  ctx.dom.scripts = [
    { src: "https://www.googletagmanager.com/gtm.js?id=GTM-TEST1234" },
    { src: "https://www.googletagmanager.com/gtag/js?id=G-ABC1234567" },
  ];
  ctx.dom.iframes = ["https://www.googletagmanager.com/ns.html?id=GTM-TEST1234"];
  ctx.runtime.globals.google_tag_manager = true;
  ctx.runtime.globals.gtag = true;
  ctx.cookies = [
    {
      name: "_ga",
      value: "GA1.1.123456789.1680000000",
      domain: ".analytics-portal.com",
      path: "/",
      secure: true,
      httpOnly: false,
      sameSite: "lax",
    },
  ];
  ctx.dataLayer = {
    exists: true,
    pushesCount: 3,
    events: ["gtm.js", "page_view"],
    hasEcommerce: false,
    rawItems: [],
  };
  ctx.network = [
    {
      id: "req_ga4_1",
      url: "https://analytics.google.com/g/collect?v=2&tid=G-ABC1234567&en=page_view",
      method: "POST",
      timestamp: Date.now(),
      type: "analytics",
      platform: "ga4",
      params: { tid: "G-ABC1234567", en: "page_view" },
    },
  ];
  return ctx;
}

export function createMultipleGtmContext(): AuditContext {
  const ctx = createBaseContext("multi-container.com");
  ctx.dom.scripts = [
    { src: "https://www.googletagmanager.com/gtm.js?id=GTM-FIRST11" },
    { src: "https://www.googletagmanager.com/gtm.js?id=GTM-SECOND22" },
  ];
  ctx.runtime.globals.google_tag_manager = true;
  return ctx;
}

export function createDataLayerEcommerceContext(): AuditContext {
  const ctx = createBaseContext("ecommerce-brand.com");
  ctx.runtime.globals.dataLayer = true;
  ctx.dataLayer = {
    exists: true,
    pushesCount: 5,
    events: ["page_view", "view_item", "add_to_cart", "purchase"],
    hasEcommerce: true,
    purchaseData: {
      hasPurchase: true,
      transaction_id: "ORD_99482",
      value: 149.99,
      currency: "USD",
      itemsCount: 2,
      items: [
        { item_id: "SKU_1", item_name: "Running Shoes", price: 99.99, quantity: 1 },
        { item_id: "SKU_2", item_name: "Athletic Socks", price: 50.0, quantity: 2 },
      ],
    },
    rawItems: [],
  };
  return ctx;
}

export function createConsentEnabledContext(): AuditContext {
  const ctx = createBaseContext("gdpr-compliant.eu");
  ctx.dom.domMarkers = ["onetrust"];
  ctx.runtime.globals.oneTrust = true;
  ctx.runtime.consentState = {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  };
  return ctx;
}

export function createServerSideContext(): AuditContext {
  const ctx = createBaseContext("modern-brand.com");
  ctx.serverSideSignals = {
    firstPartyEndpoints: ["https://metrics.modern-brand.com/g/collect"],
    customSubdomains: ["metrics.modern-brand.com"],
    sgtmMarkers: ["Custom GTM host: metrics.modern-brand.com"],
    stapeMarkers: ["https://capig.modern-brand.com/events"],
    eventIdsSeen: ["order_evt_10492"],
  };
  ctx.runtime.globals.fbq = true;
  ctx.runtime.fbqEvents = [
    { event: "Purchase", eventId: "order_evt_10492", params: { value: 200, currency: "USD" } },
  ];
  return ctx;
}

export function createCleanContext(): AuditContext {
  return createBaseContext("plain-blog.com");
}
