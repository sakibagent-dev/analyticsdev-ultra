export type DetectionStatus =
  | "verified"
  | "detected"
  | "possible"
  | "not_detected"
  | "requires_access"
  | "error";

export type ConfidenceLevel = "high" | "medium" | "low";

export type EvidenceType =
  | "dom"
  | "javascript"
  | "cookie"
  | "network"
  | "datalayer"
  | "url"
  | "header"
  | "runtime"
  | "technology";

export interface Evidence {
  id: string;
  type: EvidenceType;
  description: string;
  source?: string;
  value?: string;
  confidence?: number;
  timestamp?: number;
}

export interface DetectionResult {
  id: string;
  platform: string;
  component: string;
  category: "ad_platform" | "analytics" | "tag_manager" | "cms" | "ecommerce" | "consent" | "technology";
  status: DetectionStatus;
  confidence: number; // 0 - 100
  confidenceLevel: ConfidenceLevel;
  identifiers: string[];
  events: string[];
  evidence: Evidence[];
  warnings: string[];
  notes: string[];
  rawDetails?: Record<string, unknown>;
}

export interface AuditContext {
  url: string;
  domain: string;
  title: string;
  timestamp: number;
  dom: DomCollection;
  runtime: RuntimeCollection;
  cookies: CookieCollectionItem[];
  dataLayer: DataLayerCollection;
  network: NetworkRequestItem[];
  urlParams: Record<string, string>;
  serverSideSignals: ServerSideSignals;
}

export interface DomCollection {
  scripts: Array<{ src?: string; inline?: boolean; contentSnippet?: string; type?: string; id?: string }>;
  iframes: string[];
  metaTags: Array<{ name?: string; property?: string; content?: string }>;
  htmlAttributes: Record<string, string>;
  domMarkers: string[];
}

export interface RuntimeCollection {
  globals: Record<string, boolean>; // e.g., { fbq: true, gtag: true, dataLayer: true, ttq: true, pintrk: true, ... }
  fbqEvents?: Array<{ event: string; params?: Record<string, unknown>; eventId?: string }>;
  gtagConfigs?: Array<{ target: string; params?: Record<string, unknown> }>;
  consentState?: Record<string, string>;
  rawErrors?: string[];
}

export interface CookieCollectionItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "no_restriction" | "unspecified";
  category?: "analytics" | "advertising" | "functional" | "essential" | "unknown";
}

export interface DataLayerCollection {
  exists: boolean;
  pushesCount: number;
  events: string[];
  hasEcommerce: boolean;
  purchaseData?: {
    hasPurchase: boolean;
    transaction_id?: string;
    value?: number | string;
    currency?: string;
    itemsCount?: number;
    items?: Array<{ item_id?: string; item_name?: string; price?: number | string; quantity?: number }>;
  };
  rawItems: Array<Record<string, unknown>>;
}

export interface NetworkRequestItem {
  id: string;
  url: string;
  method: string;
  timestamp: number;
  type: "analytics" | "advertising" | "conversion" | "consent" | "first_party" | "server_side" | "unknown";
  platform?: string;
  params: Record<string, string>;
  postData?: string;
  statusCode?: number;
}

export interface ServerSideSignals {
  firstPartyEndpoints: string[];
  customSubdomains: string[];
  sgtmMarkers: string[];
  stapeMarkers: string[];
  eventIdsSeen: string[];
}

export interface Detector {
  id: string;
  name: string;
  category: "ad_platform" | "analytics" | "tag_manager" | "cms" | "ecommerce" | "consent" | "technology";
  detect(context: AuditContext): Promise<DetectionResult>;
}
