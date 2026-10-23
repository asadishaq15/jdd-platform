import "server-only";

import type { AdminContext } from "./admin-auth";
import { createAdminClient } from "./supabase/admin";

export type OverviewRange = {
  key: "7" | "30" | "90" | "365";
  days: number;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
  label: string;
};

export type OverviewMetric = { value: number; previous: number };
export type PropertyMetric = { id: string; name: string; checkouts: number; invited: number; activated: number; activationRate: number; connectedGuests: number };
export type TrendBucket = { label: string; checkouts: number; activated: number };

export type OverviewAnalytics = {
  users: OverviewMetric;
  newUsers: OverviewMetric;
  activatedStays: OverviewMetric;
  cardOrders: OverviewMetric;
  positiveSentiment: OverviewMetric;
  checkouts: OverviewMetric;
  activationRate: OverviewMetric;
  connectedGuests: OverviewMetric;
  returningGuests: OverviewMetric;
  discoveryRate: OverviewMetric;
  funnel: { checkedOut: number; invited: number; activated: number; discoveryCompleted: number };
  trend: TrendBucket[];
  properties: PropertyMetric[];
};

type StayRow = { id: string; property_id: string; guest_id: string | null; guest_email: string | null; check_out: string | null; activated_at: string | null };
type LinkRow = { stay_id: string };
type ProfileRow = { id: string; discovery_completed_at: string | null };
type AuthUserRow = { id: string; created_at: string };
type CardOrderRow = { created_at: string };
type FeedbackRow = { sentiment: string; submitted_at: string };

export function getOverviewRange(value?: string): OverviewRange {
  const key: OverviewRange["key"] = value === "7" || value === "90" || value === "365" ? value : "30";
  const days = Number(key);
  const today = startOfUtcDay(new Date());
  const start = addUtcDays(today, -(days - 1));
  const previousEnd = addUtcDays(start, -1);
  const previousStart = addUtcDays(previousEnd, -(days - 1));
  return { key, days, start: dateKey(start), end: dateKey(today), previousStart: dateKey(previousStart), previousEnd: dateKey(previousEnd), label: `${formatDate(start)} – ${formatDate(today)}` };
}

export async function loadOverviewAnalytics(context: AdminContext, range: OverviewRange, requestedProperty?: string): Promise<OverviewAnalytics> {
  const selectedProperty = requestedProperty && context.properties.some((property) => property.id === requestedProperty) ? requestedProperty : null;
  const propertyIds = selectedProperty ? [selectedProperty] : context.properties.map((property) => property.id);
  if (!propertyIds.length) return emptyAnalytics();

  const admin = createAdminClient();
  const { data: periodStayData, error: periodError } = await admin.from("stays")
    .select("id, property_id, guest_id, guest_email, check_out, activated_at")
    .in("property_id", propertyIds).gte("check_out", range.previousStart).lte("check_out", range.end).order("check_out").limit(10000);
  if (periodError) throw new Error(`Unable to load overview stays: ${periodError.message}`);

  const { data: identityStayData, error: identityError } = await admin.from("stays")
    .select("id, property_id, guest_id, guest_email, check_out, activated_at").in("property_id", propertyIds).limit(10000);
  if (identityError) throw new Error(`Unable to load returning guests: ${identityError.message}`);

  const periodStays = (periodStayData || []) as StayRow[];
  const allStays = (identityStayData || []) as StayRow[];
  const allScopedGuestIds = new Set(allStays.map((stay) => stay.guest_id).filter((id): id is string => Boolean(id)));
  const links = await loadLinks(periodStays.map((stay) => stay.id));
  const invitedStayIds = new Set(links.map((link) => link.stay_id));
  const guestIds = [...new Set(periodStays.map((stay) => stay.guest_id).filter((id): id is string => Boolean(id)))];
  const profiles = await loadProfiles(guestIds);
  const completedGuestIds = new Set(profiles.filter((profile) => profile.discovery_completed_at).map((profile) => profile.id));
  const identityCounts = countIdentities(allStays);

  const current = periodStays.filter((stay) => stay.check_out! >= range.start && stay.check_out! <= range.end);
  const previous = periodStays.filter((stay) => stay.check_out! >= range.previousStart && stay.check_out! <= range.previousEnd);
  const currentSummary = summarize(current, invitedStayIds, completedGuestIds, identityCounts);
  const previousSummary = summarize(previous, invitedStayIds, completedGuestIds, identityCounts);
  const propertyName = new Map(context.properties.map((property) => [property.id, property.name]));
  const properties = propertyIds.map((propertyId) => {
    const summary = summarize(current.filter((stay) => stay.property_id === propertyId), invitedStayIds, completedGuestIds, identityCounts);
    return { id: propertyId, name: propertyName.get(propertyId) || "Unknown property", checkouts: summary.checkouts, invited: summary.invited, activated: summary.activated, activationRate: summary.activationRate, connectedGuests: summary.connectedGuests };
  }).filter((property) => property.checkouts || property.invited || property.activated).sort((a, b) => b.checkouts - a.checkouts || a.name.localeCompare(b.name));

  const [{ data: membershipRows }, authUsers, { data: cardOrderData, error: cardOrderError }, { data: feedbackData, error: feedbackError }] = await Promise.all([
    admin.from("admin_memberships").select("user_id").eq("is_active", true),
    loadAllAuthUsers(),
    admin.from("card_orders").select("created_at").in("property_id", propertyIds).gte("created_at", `${range.previousStart}T00:00:00Z`).lte("created_at", `${range.end}T23:59:59.999Z`).limit(10000),
    admin.from("guest_feedback").select("sentiment, submitted_at").in("property_id", propertyIds).is("withdrawn_at", null).gte("submitted_at", `${range.previousStart}T00:00:00Z`).lte("submitted_at", `${range.end}T23:59:59.999Z`).limit(10000),
  ]);
  if (cardOrderError) throw new Error(`Unable to load card order metrics: ${cardOrderError.message}`);
  if (feedbackError) throw new Error(`Unable to load feedback metrics: ${feedbackError.message}`);
  const adminUserIds = new Set((membershipRows || []).map((membership) => membership.user_id));
  const scopedUsers = authUsers.filter((user) => !adminUserIds.has(user.id) && (context.isSuperAdmin ? true : allScopedGuestIds.has(user.id)));
  const currentUsers = scopedUsers.filter((user) => dateKey(new Date(user.created_at)) <= range.end);
  const previousUsers = scopedUsers.filter((user) => dateKey(new Date(user.created_at)) <= range.previousEnd);
  const currentNewUsers = scopedUsers.filter((user) => dateKey(new Date(user.created_at)) >= range.start && dateKey(new Date(user.created_at)) <= range.end);
  const previousNewUsers = scopedUsers.filter((user) => dateKey(new Date(user.created_at)) >= range.previousStart && dateKey(new Date(user.created_at)) <= range.previousEnd);
  const cardOrders = (cardOrderData || []) as CardOrderRow[];
  const feedback = (feedbackData || []) as FeedbackRow[];
  const currentOrders = cardOrders.filter((order) => dateKey(new Date(order.created_at)) >= range.start);
  const previousOrders = cardOrders.filter((order) => dateKey(new Date(order.created_at)) <= range.previousEnd);
  const currentFeedback = feedback.filter((item) => dateKey(new Date(item.submitted_at)) >= range.start);
  const previousFeedback = feedback.filter((item) => dateKey(new Date(item.submitted_at)) <= range.previousEnd);

  return {
    users: metric(currentUsers.length, previousUsers.length),
    newUsers: metric(currentNewUsers.length, previousNewUsers.length),
    activatedStays: metric(currentSummary.activated, previousSummary.activated),
    cardOrders: metric(currentOrders.length, previousOrders.length),
    positiveSentiment: metric(positiveRate(currentFeedback), positiveRate(previousFeedback)),
    checkouts: metric(currentSummary.checkouts, previousSummary.checkouts),
    activationRate: metric(currentSummary.activationRate, previousSummary.activationRate),
    connectedGuests: metric(currentSummary.connectedGuests, previousSummary.connectedGuests),
    returningGuests: metric(currentSummary.returningGuests, previousSummary.returningGuests),
    discoveryRate: metric(currentSummary.discoveryRate, previousSummary.discoveryRate),
    funnel: { checkedOut: currentSummary.checkouts, invited: currentSummary.invited, activated: currentSummary.activated, discoveryCompleted: currentSummary.discoveryCompleted },
    trend: buildTrend(current, range),
    properties,
  };

  async function loadAllAuthUsers() {
    const users: AuthUserRow[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(`Unable to load user metrics: ${error.message}`);
      users.push(...data.users.map((user) => ({ id: user.id, created_at: user.created_at })));
      if (data.users.length < 1000) return users;
      page += 1;
    }
  }

  async function loadLinks(stayIds: string[]) {
    const results: LinkRow[] = [];
    for (let index = 0; index < stayIds.length; index += 200) {
      const chunk = stayIds.slice(index, index + 200);
      if (!chunk.length) continue;
      const { data, error } = await admin.from("guest_activation_links").select("stay_id").in("stay_id", chunk).limit(10000);
      if (error) throw new Error(`Unable to load activation metrics: ${error.message}`);
      results.push(...((data || []) as LinkRow[]));
    }
    return results;
  }

  async function loadProfiles(ids: string[]) {
    const results: ProfileRow[] = [];
    for (let index = 0; index < ids.length; index += 200) {
      const chunk = ids.slice(index, index + 200);
      if (!chunk.length) continue;
      const { data, error } = await admin.from("profiles").select("id, discovery_completed_at").in("id", chunk);
      if (error) throw new Error(`Unable to load discovery metrics: ${error.message}`);
      results.push(...((data || []) as ProfileRow[]));
    }
    return results;
  }
}

function summarize(stays: StayRow[], invitedStayIds: Set<string>, completedGuestIds: Set<string>, identityCounts: Map<string, number>) {
  const invited = stays.filter((stay) => invitedStayIds.has(stay.id)).length;
  const activatedStays = stays.filter((stay) => stay.activated_at);
  const connectedIds = new Set(activatedStays.map((stay) => stay.guest_id).filter((id): id is string => Boolean(id)));
  const identities = new Set(stays.map(identityKey).filter((id): id is string => Boolean(id)));
  const returningGuests = [...identities].filter((identity) => (identityCounts.get(identity) || 0) >= 2).length;
  const discoveryCompleted = [...connectedIds].filter((id) => completedGuestIds.has(id)).length;
  return { checkouts: stays.length, invited, activated: activatedStays.length, activationRate: invited ? Math.round((activatedStays.length / invited) * 100) : 0, connectedGuests: connectedIds.size, returningGuests, discoveryCompleted, discoveryRate: connectedIds.size ? Math.round((discoveryCompleted / connectedIds.size) * 100) : 0 };
}

function countIdentities(stays: StayRow[]) {
  const counts = new Map<string, number>();
  for (const stay of stays) { const identity = identityKey(stay); if (identity) counts.set(identity, (counts.get(identity) || 0) + 1); }
  return counts;
}

function identityKey(stay: StayRow) {
  if (stay.guest_id) return `user:${stay.guest_id}`;
  const email = stay.guest_email?.trim().toLowerCase();
  return email ? `email:${email}` : null;
}

function buildTrend(stays: StayRow[], range: OverviewRange): TrendBucket[] {
  const bucketCount = range.days <= 30 ? Math.min(range.days, 10) : 12;
  const bucketDays = Math.ceil(range.days / bucketCount);
  const start = new Date(`${range.start}T00:00:00Z`);
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({ label: shortDate(addUtcDays(start, index * bucketDays)), checkouts: 0, activated: 0 }));
  for (const stay of stays) {
    if (!stay.check_out) continue;
    const offset = Math.floor((new Date(`${stay.check_out}T00:00:00Z`).getTime() - start.getTime()) / 86_400_000);
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor(offset / bucketDays)));
    buckets[index].checkouts += 1;
    if (stay.activated_at) buckets[index].activated += 1;
  }
  return buckets;
}

function metric(value: number, previous: number): OverviewMetric { return { value, previous }; }
function positiveRate(feedback: FeedbackRow[]) { return feedback.length ? Math.round(feedback.filter((item) => item.sentiment === "at_home" || item.sentiment === "some_parts").length / feedback.length * 100) : 0; }
function emptyAnalytics(): OverviewAnalytics { const empty = metric(0, 0); return { users: empty, newUsers: empty, activatedStays: empty, cardOrders: empty, positiveSentiment: empty, checkouts: empty, activationRate: empty, connectedGuests: empty, returningGuests: empty, discoveryRate: empty, funnel: { checkedOut: 0, invited: 0, activated: 0, discoveryCompleted: 0 }, trend: [], properties: [] }; }
function startOfUtcDay(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
function addUtcDays(date: Date, days: number) { return new Date(date.getTime() + days * 86_400_000); }
function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function formatDate(date: Date) { return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date); }
function shortDate(date: Date) { return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" }).format(date); }
