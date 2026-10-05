export const GA4_RECOMMENDED_EVENTS = [
  "page_view",
  "view_item",
  "view_item_list",
  "select_item",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "refund",
  "generate_lead",
  "sign_up",
  "login",
  "search"
] as const;

export const GOOGLE_COOKIES = ["_ga", "_gid", "_gcl_au", "_gcl_aw", "_gcl_dc"] as const;

export const GOOGLE_ATTRIBUTION_PARAMS = ["gclid", "gbraid", "wbraid"] as const;
