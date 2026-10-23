"use client";

import { useEffect } from "react";
import { trackProductEvent, type ProductEventPayload } from "../../lib/product-events";

export default function ProductEvent({ dedupeKey, ...payload }: ProductEventPayload & { dedupeKey?: string }) {
  useEffect(() => {
    const key = `jdd-event:${payload.name}:${dedupeKey || "page"}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    void trackProductEvent(payload);
  }, [dedupeKey, payload.name, payload.stayId, payload.worldNumber]);
  return null;
}
