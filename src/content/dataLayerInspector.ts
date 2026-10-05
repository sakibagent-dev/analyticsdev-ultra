import { DataLayerCollector } from "../collectors/dataLayerCollector";
import { DataLayerCollection } from "../types/detection";

export class DataLayerInspector {
  private static recordedPushes: unknown[] = [];
  private static hooked = false;

  public static initialize(): void {
    if (this.hooked || typeof window === "undefined") return;
    this.hooked = true;

    // Grab initial dataLayer if present
    const win = window as unknown as { dataLayer?: unknown[] };
    if (Array.isArray(win.dataLayer)) {
      this.recordedPushes.push(...win.dataLayer);
      this.hookDataLayer(win.dataLayer);
    } else {
      // If dataLayer doesn't exist yet, define a property setter or poll
      let internalDataLayer: unknown[] | undefined = undefined;
      Object.defineProperty(window, "dataLayer", {
        configurable: true,
        enumerable: true,
        get() {
          return internalDataLayer;
        },
        set(val: unknown[]) {
          internalDataLayer = val;
          if (Array.isArray(val)) {
            DataLayerInspector.hookDataLayer(val);
          }
        },
      });
    }
  }

  private static hookDataLayer(dl: unknown[]): void {
    const originalPush = dl.push;
    dl.push = function (...args: unknown[]) {
      try {
        args.forEach((arg) => {
          DataLayerInspector.recordedPushes.push(arg);
        });
      } catch {
        // Safe fallback
      }
      return originalPush.apply(this, args);
    };
  }

  public static inspect(): DataLayerCollection {
    const win = window as unknown as { dataLayer?: unknown[] };
    const current = Array.isArray(win.dataLayer) ? win.dataLayer : this.recordedPushes;
    return DataLayerCollector.analyze(current);
  }
}
