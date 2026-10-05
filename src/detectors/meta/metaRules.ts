export const META_STANDARD_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "Lead",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "Schedule",
  "StartTrial",
  "SubmitApplication",
  "Subscribe"
] as const;

export const META_COOKIES = ["_fbp", "_fbc"] as const;

export const META_ATTRIBUTION_PARAMS = ["fbclid"] as const;
