import { DomInspector } from "./domInspector";
import { DomCollection, RuntimeCollection, DataLayerCollection } from "../types/detection";

(() => {
  // Extract URL parameters (UTMs & Click IDs)
  function extractUrlParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (typeof window === "undefined") return params;

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((val, key) => {
      params[key] = val;
    });
    return params;
  }

  // Request runtime data from the MAIN world inspector
  function fetchMainWorldData(): Promise<{
    runtime: RuntimeCollection;
    dataLayer: DataLayerCollection;
  }> {
    return new Promise((resolve) => {
      let resolved = false;

      const handler = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        if (customEvent.detail) {
          try {
            const data = JSON.parse(customEvent.detail);
            resolved = true;
            window.removeEventListener("__TRACKAUDIT_RESPONSE_RUNTIME__", handler);
            resolve({
              runtime: data.runtime || { globals: {} },
              dataLayer: data.dataLayer || { exists: false, pushesCount: 0, events: [], hasEcommerce: false, rawItems: [] },
            });
          } catch {
            // parse error fallback
          }
        }
      };

      window.addEventListener("__TRACKAUDIT_RESPONSE_RUNTIME__", handler);
      window.dispatchEvent(new CustomEvent("__TRACKAUDIT_REQUEST_RUNTIME__"));

      // Timeout fallback in case main world script was blocked or delayed
      setTimeout(() => {
        if (!resolved) {
          window.removeEventListener("__TRACKAUDIT_RESPONSE_RUNTIME__", handler);
          resolve({
            runtime: { globals: {} },
            dataLayer: { exists: false, pushesCount: 0, events: [], hasEcommerce: false, rawItems: [] },
          });
        }
      }, 500);
    });
  }

  // Handle extension runtime messages
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ status: "ok" });
      return true;
    }

    if (message.type === "COLLECT_PAGE_DATA") {
      (async () => {
        try {
          const dom: DomCollection = DomInspector.inspect();
          const mainData = await fetchMainWorldData();
          const urlParams = extractUrlParams();

          sendResponse({
            success: true,
            data: {
              url: window.location.href,
              domain: window.location.hostname,
              title: document.title,
              dom,
              runtime: mainData.runtime,
              dataLayer: mainData.dataLayer,
              urlParams,
            },
          });
        } catch (err: unknown) {
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
      return true; // Asynchronous sendResponse
    }

    return false;
  });
})();
