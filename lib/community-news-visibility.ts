export type NewsVisibilityStatus = "draft" | "scheduled" | "live" | "expired" | "empty";

type NewsVisibilityInput = {
  category: string;
  isPublished: boolean;
  visibleFrom: string | null;
  visibleUntil: string | null;
};

export function newsVisibilityStatus(event: NewsVisibilityInput | null, now = Date.now()): NewsVisibilityStatus {
  if (!event) return "empty";
  if (!event.isPublished) return "draft";
  if (event.category !== "news") return "live";
  if (!event.visibleFrom || !event.visibleUntil) return "draft";
  const from = Date.parse(event.visibleFrom);
  const until = Date.parse(event.visibleUntil);
  if (Number.isNaN(from) || Number.isNaN(until)) return "draft";
  if (now < from) return "scheduled";
  if (now >= until) return "expired";
  return "live";
}

export function isNewsVisibleNow(input: {
  category: string;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
}, now = Date.now()): boolean {
  if (input.category !== "news") return true;
  if (!input.visibleFrom || !input.visibleUntil) return false;
  const from = Date.parse(input.visibleFrom);
  const until = Date.parse(input.visibleUntil);
  if (Number.isNaN(from) || Number.isNaN(until)) return false;
  return now >= from && now < until;
}
