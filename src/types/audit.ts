import { DetectionResult, Evidence, DataLayerCollection, CookieCollectionItem } from "./detection";

export type AuditIssueSeverity = "critical" | "high" | "medium" | "low" | "informational";

export interface AuditIssue {
  id: string;
  title: string;
  severity: AuditIssueSeverity;
  category: string;
  platform?: string;
  finding: string;
  impact: string;
  recommendation: string;
  evidence: Evidence[];
}

export interface ScoreCategory {
  score: number;
  max: number;
  explanation: string;
}

export interface AuditScore {
  total: number; // 0-100
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  categories: {
    platformCoverage: ScoreCategory;      // max 15
    conversionTracking: ScoreCategory;    // max 20
    eventTracking: ScoreCategory;         // max 20
    serverSideTracking: ScoreCategory;    // max 15
    dataLayer: ScoreCategory;             // max 10
    consent: ScoreCategory;               // max 10
    implementationQuality: ScoreCategory; // max 10
  };
}

export interface UniversalEvent {
  event: string;
  platform: string;
  browser: boolean;
  serverSignal: boolean;
  eventId?: string;
  transactionId?: string;
  value?: number | string;
  currency?: string;
  itemsCount?: number;
  evidenceSummary: string;
  status: "verified" | "detected" | "partial" | "warning";
}

export interface DuplicateTrackingWarning {
  platform: string;
  event: string;
  paths: string[];
  severity: "critical" | "high" | "medium";
  recommendation: string;
}

export interface ServerSideAudit {
  status: "verified" | "detected" | "possible" | "not_detected" | "requires_access";
  confidence: number;
  firstPartyEndpoints: string[];
  customSubdomains: string[];
  sgtmIndicators: string[];
  stapeIndicators: string[];
  eventDeduplicationObserved: boolean;
  disclaimer: string;
  requirements: string[];
}

export interface TechnologyAudit {
  cms: string[];
  ecommerce: string[];
  frameworks: string[];
  tagManagers: string[];
  analyticsTools: string[];
  infrastructure: string[];
}

export interface ConsentAudit {
  cmpDetected: string | null;
  bannerObservable: boolean;
  consentModeV2: boolean;
  consentModeSignals: {
    ad_storage?: string;
    analytics_storage?: string;
    ad_user_data?: string;
    ad_personalization?: string;
  };
  disclaimer: string;
}

export interface AttributionSignals {
  utms: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  clickIds: {
    fbclid?: string;
    gclid?: string;
    gbraid?: string;
    wbraid?: string;
    ttclid?: string;
    msclkid?: string;
    li_fat_id?: string;
    epik?: string;
    sc_cid?: string;
    rdt_cid?: string;
  };
  summary: string[];
}

export interface AuditReport {
  id: string;
  website: string;
  url: string;
  auditDate: string;
  timestamp: number;
  score: AuditScore;
  results: DetectionResult[];
  events: UniversalEvent[];
  issues: AuditIssue[];
  duplicates: DuplicateTrackingWarning[];
  serverSide: ServerSideAudit;
  dataLayer: DataLayerCollection;
  cookies: CookieCollectionItem[];
  attribution: AttributionSignals;
  technology: TechnologyAudit;
  consent: ConsentAudit;
  stats: {
    platformsDetected: number;
    eventsDetected: number;
    criticalCount: number;
    warningCount: number;
  };
}

export interface AuditComparison {
  beforeAuditId: string;
  afterAuditId: string;
  website: string;
  beforeDate: string;
  afterDate: string;
  scoreBefore: number;
  scoreAfter: number;
  scoreDiff: number;
  fixedIssues: string[];
  newIssues: string[];
  remainingIssues: string[];
  eventsAdded: string[];
  summary: string;
}
