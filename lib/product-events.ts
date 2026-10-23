export const PRODUCT_EVENT_NAMES = [
  "activation_page_opened",
  "activation_completed",
  "discovery_started",
  "discovery_completed",
  "world_viewed",
  "world_chosen",
  "space_opened",
  "ritual_opened",
  "property_circle_opened",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type ProductEventPayload = {
  name: ProductEventName;
  stayId?: string;
  worldNumber?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

function sessionId() {
  const key = "jdd-product-session";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return undefined;
  }
}

export async function trackProductEvent(payload: ProductEventPayload) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, sessionId: sessionId() }),
      keepalive: true,
    });
  } catch {
    // Analytics must never interrupt the guest experience.
  }
}
