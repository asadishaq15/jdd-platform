import "server-only";

import type { AdminContext } from "./admin-auth";
import type { OverviewRange } from "./admin-analytics";
import { createAdminClient } from "./supabase/admin";

type EventRow = {
  event_name: string;
  user_id: string | null;
  property_id: string | null;
  session_id: string | null;
  metadata: Record<string, unknown>;
  is_internal: boolean;
  occurred_at: string;
};

export type JourneyAnalytics = {
  totalEvents: number;
  uniqueGuests: number;
  discoveryAbandonment: number;
  stateMatchRate: number;
  return7Rate: number;
  return30Rate: number;
  funnel: Array<{ label: string; value: number }>;
  trend: Array<{ label: string; value: number }>;
  worlds: Array<{ worldNumber: number; views: number }>;
};

export async function loadJourneyAnalytics(context: AdminContext, range: OverviewRange, requestedProperty?: string, includeInternal = false): Promise<JourneyAnalytics> {
  const selectedProperty = requestedProperty && context.properties.some((property) => property.id === requestedProperty) ? requestedProperty : null;
  const allowedProperties = new Set(selectedProperty ? [selectedProperty] : context.properties.map((property) => property.id));
  const admin = createAdminClient();
  const retentionStart = new Date(`${range.start}T00:00:00Z`);
  retentionStart.setUTCDate(retentionStart.getUTCDate() - 30);
  let query = admin.from("product_events").select("event_name, user_id, property_id, session_id, metadata, is_internal, occurred_at")
    .gte("occurred_at", retentionStart.toISOString()).lte("occurred_at", `${range.end}T23:59:59.999Z`).order("occurred_at").limit(20000);
  if (!includeInternal) query = query.eq("is_internal", false);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load journey analytics: ${error.message}`);

  const scoped = ((data || []) as EventRow[]).filter((event) => {
    if (selectedProperty) return event.property_id === selectedProperty;
    if (event.property_id) return allowedProperties.has(event.property_id);
    return context.isSuperAdmin;
  });
  const current = scoped.filter((event) => event.occurred_at.slice(0, 10) >= range.start);
  const usersFor = (name: string) => new Set(current.filter((event) => event.event_name === name && event.user_id).map((event) => event.user_id!));
  const activationOpened = usersFor("activation_page_opened");
  const activationCompleted = usersFor("activation_completed");
  const discoveryStarted = usersFor("discovery_started");
  const discoveryCompleted = usersFor("discovery_completed");
  const spaceOpened = usersFor("space_opened");
  const uniqueGuests = new Set(current.map((event) => event.user_id).filter((id): id is string => Boolean(id))).size;
  const discoveryAbandonment = discoveryStarted.size ? Math.max(0, Math.round(((discoveryStarted.size - discoveryCompleted.size) / discoveryStarted.size) * 100)) : 0;

  const completedWithWorlds = current.filter((event) => event.event_name === "discovery_completed" && Number(event.metadata.recommended_world) > 0 && Number(event.metadata.chosen_world) > 0);
  const stateMatches = completedWithWorlds.filter((event) => Number(event.metadata.recommended_world) === Number(event.metadata.chosen_world)).length;
  const stateMatchRate = completedWithWorlds.length ? Math.round((stateMatches / completedWithWorlds.length) * 100) : 0;
  const retention = calculateRetention(scoped, range);

  const worldCounts = new Map<number, number>();
  current.filter((event) => event.event_name === "world_viewed").forEach((event) => {
    const world = Number(event.metadata.world_number);
    if (Number.isInteger(world) && world >= 1 && world <= 22) worldCounts.set(world, (worldCounts.get(world) || 0) + 1);
  });

  return {
    totalEvents: current.length,
    uniqueGuests,
    discoveryAbandonment,
    stateMatchRate,
    return7Rate: retention.return7Rate,
    return30Rate: retention.return30Rate,
    funnel: [
      { label: "Activation opened", value: activationOpened.size },
      { label: "Activation completed", value: activationCompleted.size },
      { label: "Discovery started", value: discoveryStarted.size },
      { label: "Discovery completed", value: discoveryCompleted.size },
      { label: "My Space opened", value: spaceOpened.size },
    ],
    trend: buildEventTrend(current, range),
    worlds: [...worldCounts.entries()].map(([worldNumber, views]) => ({ worldNumber, views })).sort((a, b) => b.views - a.views).slice(0, 8),
  };
}

function calculateRetention(events: EventRow[], range: OverviewRange) {
  const activations = events.filter((event) => event.event_name === "activation_completed" && event.user_id && event.occurred_at.slice(0, 10) >= range.start);
  let returned7 = 0;
  let returned30 = 0;
  for (const activation of activations) {
    const activatedAt = new Date(activation.occurred_at).getTime();
    const returns = events.filter((event) => event.user_id === activation.user_id && event.event_name === "space_opened").map((event) => new Date(event.occurred_at).getTime() - activatedAt);
    if (returns.some((elapsed) => elapsed >= 86_400_000 && elapsed <= 7 * 86_400_000)) returned7 += 1;
    if (returns.some((elapsed) => elapsed >= 86_400_000 && elapsed <= 30 * 86_400_000)) returned30 += 1;
  }
  return {
    return7Rate: activations.length ? Math.round((returned7 / activations.length) * 100) : 0,
    return30Rate: activations.length ? Math.round((returned30 / activations.length) * 100) : 0,
  };
}

function buildEventTrend(events: EventRow[], range: OverviewRange) {
  const bucketCount = range.days <= 30 ? Math.min(range.days, 10) : 12;
  const bucketDays = Math.ceil(range.days / bucketCount);
  const start = new Date(`${range.start}T00:00:00Z`);
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({ label: new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(start.getTime() + index * bucketDays * 86_400_000)), value: 0 }));
  for (const event of events) {
    const offset = Math.floor((new Date(event.occurred_at).getTime() - start.getTime()) / 86_400_000);
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor(offset / bucketDays)));
    buckets[index].value += 1;
  }
  return buckets;
}
