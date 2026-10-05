import { NetworkRequestItem } from "../types/detection";
import { NetworkCollector } from "../collectors/networkCollector";
import { MessageRouter } from "./messageRouter";

const tabNetworkBuffers = new Map<number, NetworkRequestItem[]>();
const MAX_BUFFER_PER_TAB = 150;

const messageRouter = new MessageRouter(tabNetworkBuffers);

// 1. Listen for network requests passively
if (typeof chrome !== "undefined" && chrome.webRequest) {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.tabId < 0) return; // Background or internal browser request

      const buffer = tabNetworkBuffers.get(details.tabId) || [];

      // Extract raw post data snippet if available
      let postDataSnippet: string | undefined = undefined;
      if (details.requestBody?.raw && details.requestBody.raw[0]?.bytes) {
        try {
          const decoder = new TextDecoder("utf-8");
          postDataSnippet = decoder.decode(details.requestBody.raw[0].bytes).slice(0, 500);
        } catch {
          // ignore
        }
      }

      const classified = NetworkCollector.classifyRequest(
        details.url,
        details.method,
        "",
        postDataSnippet
      );

      // Only buffer tracking/analytics/consent/server-side/conversion requests to save memory
      if (classified.type !== "unknown" || details.url.includes("collect") || details.url.includes("analytics")) {
        buffer.unshift(classified);
        if (buffer.length > MAX_BUFFER_PER_TAB) {
          buffer.pop();
        }
        tabNetworkBuffers.set(details.tabId, buffer);
      }
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
  );
}

// 2. Clean up tab memory on tab closure
if (typeof chrome !== "undefined" && chrome.tabs) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    tabNetworkBuffers.delete(tabId);
  });
}

// 3. Listen for extension runtime messages
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    messageRouter
      .handleMessage(message, sender)
      .then((res) => sendResponse(res))
      .catch((err) => {
        sendResponse({ error: err instanceof Error ? err.message : String(err) });
      });
    return true; // asynchronous response
  });
}

console.log("AnalyticsDev Ultra background service worker initialized.");
