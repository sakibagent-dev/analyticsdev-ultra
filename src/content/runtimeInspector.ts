import { DataLayerInspector } from "./dataLayerInspector";
import { RuntimeCollector } from "../collectors/runtimeCollector";
import { RuntimeCollection, DataLayerCollection } from "../types/detection";

export interface MainWorldPayload {
  runtime: RuntimeCollection;
  dataLayer: DataLayerCollection;
  fbqEvents: Array<{ event: string; eventId?: string; params?: Record<string, unknown> }>;
}

(() => {
  if (typeof window === "undefined") return;

  const fbqEvents: Array<{ event: string; eventId?: string; params?: Record<string, unknown> }> = [];

  // Initialize dataLayer hook early
  DataLayerInspector.initialize();

  // Non-intrusively hook fbq if present or when defined
  function hookFbq() {
    const win = window as unknown as { fbq?: (...args: unknown[]) => void };
    if (typeof win.fbq === "function") {
      const origFbq = win.fbq;
      // Ensure we don't double hook
      if (!(origFbq as unknown as { __trackaudit_hooked?: boolean }).__trackaudit_hooked) {
        const wrappedFbq = function (this: unknown, ...args: unknown[]) {
          try {
            if (args[0] === "track" || args[0] === "trackCustom") {
              const eventName = String(args[1] || "unknown");
              const params = (args[2] && typeof args[2] === "object") ? (args[2] as Record<string, unknown>) : undefined;
              const options = (args[3] && typeof args[3] === "object") ? (args[3] as Record<string, unknown>) : undefined;
              const eventId = (options?.eventID || params?.eventID || options?.eventId || params?.eventId) as string | undefined;

              fbqEvents.push({
                event: eventName,
                eventId,
                params: params ? JSON.parse(JSON.stringify(params)) : undefined,
              });
            }
          } catch {
            // Safe fallback
          }
          return origFbq.apply(this, args);
        };
        (wrappedFbq as unknown as { __trackaudit_hooked?: boolean }).__trackaudit_hooked = true;
        win.fbq = wrappedFbq;
      }
    }
  }

  hookFbq();
  // Check again after a delay in case script loaded asynchronously
  setTimeout(hookFbq, 1500);

  function gatherSnapshot(): MainWorldPayload {
    const runtime = RuntimeCollector.inspectWindow(window);
    const dataLayer = DataLayerInspector.inspect();
    runtime.fbqEvents = fbqEvents;

    return {
      runtime,
      dataLayer,
      fbqEvents,
    };
  }

  // Listen for request from isolated content script
  window.addEventListener("__TRACKAUDIT_REQUEST_RUNTIME__", () => {
    hookFbq();
    const payload = gatherSnapshot();
    window.dispatchEvent(
      new CustomEvent("__TRACKAUDIT_RESPONSE_RUNTIME__", {
        detail: JSON.stringify(payload),
      })
    );
  });

  // Also store on DOM node for instant synchronous access if needed
  try {
    const hiddenEl = document.createElement("div");
    hiddenEl.id = "__trackaudit_signal_ready__";
    hiddenEl.style.display = "none";
    document.documentElement.appendChild(hiddenEl);
  } catch {
    // Ignore DOM restriction
  }
})();
