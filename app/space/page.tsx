import { redirect } from "next/navigation";
import SpaceEntry from "../../components/space/SpaceEntry";
import { resolveProviderAvatarUrl } from "../../lib/avatar";
import type { CardOrder, CommunityCircleEvent, ConnectedStay } from "../../lib/space-data";
import { createClient } from "../../lib/supabase/server";
import "../../components/discovery/discovery.css";
import "../../components/space/space-entry.css";

type SpacePageProps = {
  searchParams: Promise<{ stay?: string }>;
};

type RawStay = {
  id: string;
  property_id: string;
  guest_name: string | null;
  check_in: string | null;
  check_out: string | null;
  activated_at: string | null;
  property: {
    id: string;
    name: string;
    country: string | null;
    world_number: number;
  } | null;
};

export default async function SpacePage({ searchParams }: SpacePageProps) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/sign-in?next=/space");

  const [{ data: profile }, { data: stayRows }, { data: orderRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, recommended_world_number, chosen_world_number")
      .eq("id", userData.user.id)
      .maybeSingle(),
    supabase
      .from("stays")
      .select("id, property_id, guest_name, check_in, check_out, activated_at, property:properties(id, name, country, world_number)")
      .order("activated_at", { ascending: false }),
    supabase
      .from("card_orders")
      .select("id, stay_id, property_id, recipient_name, status, created_at, property:properties(name)")
      .order("created_at", { ascending: false }),
  ]);

  const stays: ConnectedStay[] = ((stayRows || []) as unknown as RawStay[])
    .filter((stay) => stay.property)
    .map((stay) => ({
      id: stay.id,
      guestName: stay.guest_name,
      checkIn: stay.check_in,
      checkOut: stay.check_out,
      activatedAt: stay.activated_at,
      property: {
        id: stay.property!.id || stay.property_id,
        name: stay.property!.name,
        country: stay.property!.country,
        worldNumber: stay.property!.world_number,
      },
    }));

  const requestedStay = (await searchParams).stay;
  const activeStayId = stays.some((stay) => stay.id === requestedStay)
    ? requestedStay
    : stays[0]?.id;
  const activeStay = stays.find((stay) => stay.id === activeStayId) || stays[0];
  const propertyIds = [...new Set(stays.map((stay) => stay.property.id))];

  let circleEvents: CommunityCircleEvent[] = [];
  let initialRsvps: Record<string, boolean> = {};

  if (propertyIds.length) {
    const [{ data: eventRows }, { data: rsvpRows }] = await Promise.all([
      supabase
        .from("community_events")
        .select("id, property_id, category, title, timing, body, thumbnail_url, visible_from, visible_until")
        .in("property_id", propertyIds)
        .eq("is_published", true),
      supabase
        .from("community_event_rsvps")
        .select("event_id")
        .eq("guest_id", userData.user.id),
    ]);

    const now = Date.now();
    circleEvents = ((eventRows || []) as Array<{
      id: string;
      property_id: string;
      category: CommunityCircleEvent["category"];
      title: string;
      timing: string;
      body: string;
      thumbnail_url: string | null;
      visible_from: string | null;
      visible_until: string | null;
    }>)
      .filter((row) => {
        if (row.category !== "news") return true;
        if (!row.visible_from || !row.visible_until) return false;
        const from = Date.parse(row.visible_from);
        const until = Date.parse(row.visible_until);
        if (Number.isNaN(from) || Number.isNaN(until)) return false;
        return now >= from && now < until;
      })
      .map((row) => ({
        id: row.id,
        propertyId: row.property_id,
        category: row.category,
        title: row.title,
        timing: row.timing,
        body: row.body,
        thumbnailUrl: row.thumbnail_url,
      }));

    const rsvpEventIds = new Set((rsvpRows || []).map((row: { event_id: string }) => row.event_id));
    for (const event of circleEvents) {
      if (rsvpEventIds.has(event.id)) {
        initialRsvps[event.category] = true;
        initialRsvps[event.id] = true;
      }
    }
  }

  const activeCircleEvents = activeStay
    ? circleEvents.filter((event) => event.propertyId === activeStay.property.id)
    : [];

  const orders: CardOrder[] = ((orderRows || []) as unknown as Array<{
    id: string;
    stay_id: string | null;
    property_id: string;
    recipient_name: string;
    status: CardOrder["status"];
    created_at: string;
    property: { name: string } | null;
  }>).map((order) => ({
    id: order.id,
    stayId: order.stay_id,
    propertyId: order.property_id,
    propertyName: order.property?.name || "Property",
    recipientName: order.recipient_name,
    status: order.status,
    createdAt: order.created_at,
  }));

  const providerAvatarUrl = resolveProviderAvatarUrl(userData.user.user_metadata);
  const avatarUrl = profile?.avatar_url || providerAvatarUrl || null;

  return (
    <SpaceEntry
      account={{
        id: userData.user.id,
        fullName: profile?.full_name
          || userData.user.user_metadata.full_name
          || userData.user.user_metadata.name
          || "Guest",
        email: userData.user.email || "",
        pendingEmail: userData.user.new_email || undefined,
        avatarUrl,
        providerAvatarUrl,
      }}
      stays={stays}
      activeStayId={activeStayId}
      initialOrders={orders}
      circleEvents={activeCircleEvents}
      initialRsvps={initialRsvps}
      initialState={{
        recommended: profile?.recommended_world_number || undefined,
        chosen: profile?.chosen_world_number || undefined,
      }}
    />
  );
}
