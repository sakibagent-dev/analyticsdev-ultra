import { AuditContext, NetworkRequestItem, CookieCollectionItem } from "../types/detection";
import { AuditReport } from "../types/audit";
import { ConsultantProfile } from "../types/report";
import { AuditEngine } from "../engine/auditEngine";
import { StorageService } from "../storage/storageService";
import { AuditHistoryManager } from "../storage/auditHistory";

export class MessageRouter {
  private auditEngine: AuditEngine;
  private networkBuffer: Map<number, NetworkRequestItem[]>;

  constructor(networkBuffer: Map<number, NetworkRequestItem[]>) {
    this.auditEngine = new AuditEngine();
    this.networkBuffer = networkBuffer;
  }

  public async handleMessage(
    message: { type: string; payload?: unknown },
    sender: chrome.runtime.MessageSender
  ): Promise<unknown> {
    switch (message.type) {
      case "RUN_AUDIT":
        return this.handleRunAudit(sender);

      case "GET_SAVED_AUDITS":
        return await AuditHistoryManager.getAll();

      case "SAVE_AUDIT":
        if (message.payload) {
          await AuditHistoryManager.save(message.payload as AuditReport);
          return { success: true };
        }
        return { success: false, error: "Missing payload" };

      case "DELETE_AUDIT":
        if (typeof message.payload === "string") {
          await AuditHistoryManager.delete(message.payload);
          return { success: true };
        }
        return { success: false };

      case "GET_CONSULTANT_PROFILE":
        return await StorageService.getConsultantProfile();

      case "SAVE_CONSULTANT_PROFILE":
        if (message.payload) {
          await StorageService.saveConsultantProfile(message.payload as ConsultantProfile);
          return { success: true };
        }
        return { success: false };

      case "GET_NETWORK_BUFFER": {
        const tabId = (message.payload as number) || sender.tab?.id;
        return tabId ? (this.networkBuffer.get(tabId) || []) : [];
      }

      case "OPEN_DASHBOARD":
        if (typeof chrome !== "undefined" && chrome.tabs) {
          const dashboardUrl = chrome.runtime.getURL("dashboard.html");
          chrome.tabs.create({ url: dashboardUrl });
          return { success: true };
        }
        return { success: false };

      default:
        return { error: `Unknown message type: ${message.type}` };
    }
  }

  private async handleRunAudit(sender: chrome.runtime.MessageSender): Promise<AuditReport> {
    // 1. Identify active tab
    let tabId = sender.tab?.id;
    let tabUrl = sender.tab?.url;

    if (!tabId && typeof chrome !== "undefined" && chrome.tabs) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        tabId = activeTab.id;
        tabUrl = activeTab.url;
      }
    }

    if (!tabId || !tabUrl) {
      throw new Error("No active browser tab found to audit.");
    }

    const parsedUrl = new URL(tabUrl);
    const domain = parsedUrl.hostname;

    // 2. Fetch DOM & Runtime data from content script
    let pageData: {
      url: string;
      domain: string;
      title: string;
      dom: AuditContext["dom"];
      runtime: AuditContext["runtime"];
      dataLayer: AuditContext["dataLayer"];
      urlParams: AuditContext["urlParams"];
    };

    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: "COLLECT_PAGE_DATA" });
      if (!response || !response.success) {
        throw new Error(response?.error || "Failed to communicate with content script.");
      }
      pageData = response.data;
    } catch {
      // Content script might not be injected yet (e.g. extension newly reloaded)
      // Inject content script dynamically
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
      // Retry message
      const retryResponse = await chrome.tabs.sendMessage(tabId, { type: "COLLECT_PAGE_DATA" });
      pageData = retryResponse.data;
    }

    // 3. Fetch cookies for target domain
    const cookieItems: CookieCollectionItem[] = [];
    if (typeof chrome !== "undefined" && chrome.cookies) {
      try {
        const cookies = await chrome.cookies.getAll({ domain });
        cookies.forEach((c) => {
          cookieItems.push({
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            expires: c.expirationDate,
            secure: c.secure,
            httpOnly: c.httpOnly,
            sameSite: c.sameSite as CookieCollectionItem["sameSite"],
          });
        });
      } catch {
        // Fallback if permission restricted
      }
    }

    // 4. Gather network requests buffer
    const networkRequests = this.networkBuffer.get(tabId) || [];

    // 5. Gather server side signals
    const firstPartyEndpoints: string[] = [];
    const customSubdomains: string[] = [];
    const sgtmMarkers: string[] = [];
    const stapeMarkers: string[] = [];

    networkRequests.forEach((req) => {
      if (req.type === "first_party" || req.type === "server_side") {
        if (!firstPartyEndpoints.includes(req.url)) firstPartyEndpoints.push(req.url);
      }
      if (req.url.includes("stape.io") || req.url.includes("capig.io")) {
        stapeMarkers.push(req.url);
      }
    });

    const context: AuditContext = {
      url: pageData.url || tabUrl,
      domain: pageData.domain || domain,
      title: pageData.title || domain,
      timestamp: Date.now(),
      dom: pageData.dom,
      runtime: pageData.runtime,
      cookies: cookieItems,
      dataLayer: pageData.dataLayer,
      network: networkRequests,
      urlParams: pageData.urlParams,
      serverSideSignals: {
        firstPartyEndpoints,
        customSubdomains,
        sgtmMarkers,
        stapeMarkers,
        eventIdsSeen: [],
      },
    };

    // 6. Run full audit
    const report = await this.auditEngine.runAudit(context);

    // 7. Save to local history
    await StorageService.saveAudit(report);

    return report;
  }
}
