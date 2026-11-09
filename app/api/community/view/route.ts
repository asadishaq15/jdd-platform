import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const eventId = String(body.eventId || "");
  const stayId = String(body.stayId || "");

  if (!UUID_PATTERN.test(eventId) || !UUID_PATTERN.test(stayId)) {
    return NextResponse.json({ error: "Choose a news item from an activated stay." }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: stay, error: stayError }, { data: event, error: eventError }] = await Promise.all([
    admin
      .from("stays")
      .select("id, property_id, guest_id, activated_at")
      .eq("id", stayId)
      .eq("guest_id", userData.user.id)
      .maybeSingle(),
    admin
      .from("community_events")
      .select("id, property_id, is_published, category, visible_from, visible_until")
      .eq("id", eventId)
      .maybeSingle(),
  ]);

  if (stayError || !stay || !stay.activated_at) {
    return NextResponse.json({ error: "This stay is not connected to your account." }, { status: 403 });
  }
  if (eventError || !event || !event.is_published || event.category !== "news") {
    return NextResponse.json({ error: "This news item is not available." }, { status: 404 });
  }
  if (event.property_id !== stay.property_id) {
    return NextResponse.json({ error: "This item belongs to a different property." }, { status: 403 });
  }

  const now = Date.now();
  const from = event.visible_from ? Date.parse(event.visible_from) : Number.NaN;
  const until = event.visible_until ? Date.parse(event.visible_until) : Number.NaN;
  if (Number.isNaN(from) || Number.isNaN(until) || now < from || now >= until) {
    return NextResponse.json({ error: "This news item is outside its guest visibility window." }, { status: 403 });
  }

  const { error } = await admin.from("community_event_views").insert({
    event_id: event.id,
    guest_id: userData.user.id,
    stay_id: stay.id,
    property_id: stay.property_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message || "Unable to record view." }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
