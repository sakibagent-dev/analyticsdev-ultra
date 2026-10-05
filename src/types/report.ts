export interface ConsultantProfile {
  name: string;
  title: string;
  company: string;
  website: string;
  email: string;
  phone: string;
  brandColor: string;
  logoUrl?: string;
  reportFooter: string;
}

export const DEFAULT_CONSULTANT_PROFILE: ConsultantProfile = {
  name: "Sakib Hossain",
  title: "Founder, Analytics Dev",
  company: "Analytics Dev",
  website: "https://analyticsdev.com",
  email: "sakib@analyticsdev.com",
  phone: "+1 (555) 019-2834",
  brandColor: "#059669",
  reportFooter: "Confidential Tracking & Conversion Audit • Created by Analytics Dev Founder Sakib Hossain",
};

export interface ReportConfig {
  includeExecutiveSummary: boolean;
  includeTechnicalEvidence: boolean;
  includeRecommendations: boolean;
  includeUniversalEvents: boolean;
  includeDataLayer: boolean;
  includeCookies: boolean;
  includeConsent: boolean;
  includeServerSide: boolean;
  mode: "client" | "technical";
}
