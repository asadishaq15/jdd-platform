import { NextResponse } from "next/server";
import { PRODUCT_EVENT_NAMES, type ProductEventName } from "../../../lib/product-events";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_METADATA = new Set(["recommended_world", "chosen_world", "source"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  const name = String(body.name || "") as ProductEventName;
  if (!PRODUCT_EVENT_NAMES.includes(name)) return NextResponse.json({ error: "Unsupported event." }, { status: 400 });

  const stayId = typeof body.stayId === "string" && UUID_PATTERN.test(body.stayId) ? body.stayId : null;
  const worldNumber = Number(body.worldNumber);
  const sessionId = typeof body.sessionId === "string" && body.sessionId.length >= 8 && body.sessionId.length <= 100 ? body.sessionId : null;
  const metadata = sanitizeMetadata(body.metadata);
  if (Number.isInteger(worldNumber) && worldNumber >= 1 && worldNumber <= 22) metadata.world_number = worldNumber;

  const admin = createAdminClient();
  let propertyId: string | null = null;
  let verifiedStayId: string | null = null;

  if (stayId) {
    const { data: stay } = await admin.from("stays").select("id, property_id, guest_id").eq("id", stayId).maybeSingle();
    if (stay?.guest_id === userData.user.id) {
      verifiedStayId = stay.id;
      propertyId = stay.property_id;
    }
  }

  if (!propertyId && Number.isInteger(worldNumber) && worldNumber >= 1 && worldNumber <= 22) {
    const { data: property } = await admin.from("properties").select("id").eq("world_number", worldNumber).maybeSingle();
    propertyId = property?.id || null;
  }

  if (!propertyId && name === "space_opened") {
    const { data: stay } = await admin.from("stays").select("id, property_id").eq("guest_id", userData.user.id).order("activated_at", { ascending: false }).limit(1).maybeSingle();
    if (stay) { verifiedStayId = stay.id; propertyId = stay.property_id; }
  }

  const { data: membership } = await admin.from("admin_memberships").select("id").eq("user_id", userData.user.id).eq("is_active", true).limit(1).maybeSingle();
  const { error } = await admin.from("product_events").insert({
    event_name: name,
    user_id: userData.user.id,
    stay_id: verifiedStayId,
    property_id: propertyId,
    session_id: sessionId,
    metadata,
    is_internal: Boolean(membership),
  });

  if (error) {
    console.error("Product event insert failed", error.message);
    return NextResponse.json({ error: "Event could not be recorded." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, string | number | boolean | null>;
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!ALLOWED_METADATA.has(key)) continue;
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null) clean[key] = item;
  }
  return clean;
}
