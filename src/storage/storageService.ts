import { AuditReport } from "../types/audit";
import { ConsultantProfile, DEFAULT_CONSULTANT_PROFILE } from "../types/report";

export class StorageService {
  private static isChromeStorageAvailable(): boolean {
    return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
  }

  public static async get<T>(key: string, defaultValue: T): Promise<T> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          if (result && result[key] !== undefined) {
            resolve(result[key] as T);
          } else {
            resolve(defaultValue);
          }
        });
      });
    }

    // LocalStorage fallback for dev / testing
    try {
      const item = localStorage.getItem(`analyticsdev_${key}`);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  public static async set<T>(key: string, value: T): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    }

    try {
      localStorage.setItem(`analyticsdev_${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  public static async getConsultantProfile(): Promise<ConsultantProfile> {
    return this.get<ConsultantProfile>("consultant_profile", DEFAULT_CONSULTANT_PROFILE);
  }

  public static async saveConsultantProfile(profile: ConsultantProfile): Promise<void> {
    return this.set<ConsultantProfile>("consultant_profile", profile);
  }

  public static async getAuditHistory(): Promise<AuditReport[]> {
    return this.get<AuditReport[]>("audit_history", []);
  }

  public static async saveAudit(report: AuditReport): Promise<void> {
    const history = await this.getAuditHistory();
    // Prepend new audit and keep last 50 audits locally
    const filtered = history.filter((h) => h.id !== report.id);
    const updated = [report, ...filtered].slice(0, 50);
    await this.set("audit_history", updated);
  }

  public static async deleteAudit(auditId: string): Promise<void> {
    const history = await this.getAuditHistory();
    const updated = history.filter((h) => h.id !== auditId);
    await this.set("audit_history", updated);
  }

  public static async getLatestAuditForDomain(domain: string): Promise<AuditReport | null> {
    const history = await this.getAuditHistory();
    return history.find((h) => h.website === domain) || null;
  }
}
