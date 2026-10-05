import { DataLayerCollection } from "../types/detection";

export class DataLayerCollector {
  private static SENSITIVE_KEYS = [
    "password", "pass", "pwd", "token", "auth", "creditcard", "card_number",
    "cvv", "cvc", "ssn", "secret", "apikey", "email", "phone", "first_name", "last_name"
  ];

  /**
   * Sanitizes any raw object to redact PII while preserving tracking metadata.
   */
  public static sanitizeObject(obj: unknown, depth = 0): unknown {
    if (depth > 6) return "[MaxDepth]";
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === "string") {
      // Redact potential email addresses
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(obj)) {
        return "[REDACTED_EMAIL]";
      }
      // Redact potential credit card numbers (13-19 digits)
      if (/^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{1,7}$/.test(obj)) {
        return "[REDACTED_CARD]";
      }
      return obj;
    }

    if (typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item, depth + 1));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (this.SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = this.sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }

  /**
   * Analyzes an array of dataLayer pushes.
   */
  public static analyze(rawPushes: unknown[]): DataLayerCollection {
    if (!Array.isArray(rawPushes) || rawPushes.length === 0) {
      return {
        exists: false,
        pushesCount: 0,
        events: [],
        hasEcommerce: false,
        rawItems: [],
      };
    }

    const events: string[] = [];
    let hasEcommerce = false;
    let purchaseData: DataLayerCollection["purchaseData"] = undefined;
    const sanitizedItems: Array<Record<string, unknown>> = [];

    rawPushes.forEach((rawPush) => {
      if (!rawPush || typeof rawPush !== "object") return;
      const pushObj = rawPush as Record<string, unknown>;

      // Track events
      if (typeof pushObj.event === "string") {
        events.push(pushObj.event);
      }

      // Check for ecommerce
      const ecommerce = (pushObj.ecommerce as Record<string, unknown>) || pushObj;
      if (pushObj.ecommerce || pushObj.event === "purchase" || pushObj.event === "add_to_cart") {
        hasEcommerce = true;
      }

      // Look for purchase specifically
      const isPurchaseEvent = pushObj.event === "purchase";
      const purchaseObj = (ecommerce?.purchase as Record<string, unknown>) || (isPurchaseEvent ? ecommerce : undefined);

      if (purchaseObj || isPurchaseEvent) {
        const actionField = (purchaseObj?.actionField as Record<string, unknown>) || purchaseObj || {};
        const transactionId = (actionField.id || actionField.transaction_id || pushObj.transaction_id || ecommerce.transaction_id) as string | undefined;
        const value = (actionField.revenue || actionField.value || pushObj.value || ecommerce.value) as number | string | undefined;
        const currency = (actionField.currency || pushObj.currency || ecommerce.currency) as string | undefined;

        // Items list
        const rawItemsList = (purchaseObj?.products || purchaseObj?.items || ecommerce?.items || pushObj?.items) as unknown[];
        let items: Array<{ item_id?: string; item_name?: string; price?: number | string; quantity?: number }> | undefined = undefined;

        if (Array.isArray(rawItemsList)) {
          items = rawItemsList.map((item) => {
            const i = (item || {}) as Record<string, unknown>;
            return {
              item_id: (i.id || i.item_id) as string | undefined,
              item_name: (i.name || i.item_name) as string | undefined,
              price: (i.price) as number | string | undefined,
              quantity: (i.quantity) as number | undefined,
            };
          });
        }

        purchaseData = {
          hasPurchase: true,
          transaction_id: transactionId,
          value,
          currency,
          itemsCount: items ? items.length : undefined,
          items,
        };
      }

      // Keep bounded history (last 50 pushes) sanitized
      if (sanitizedItems.length < 50) {
        sanitizedItems.push(this.sanitizeObject(pushObj) as Record<string, unknown>);
      }
    });

    return {
      exists: true,
      pushesCount: rawPushes.length,
      events,
      hasEcommerce,
      purchaseData,
      rawItems: sanitizedItems,
    };
  }
}
