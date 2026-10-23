import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SENTIMENTS = new Set(["at_home", "some_parts", "not_for_me", "not_sure"]);

export async function GET(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const stayId = new URL(request.url).searchParams.get("stayId") || "";
  if (!UUID_PATTERN.test(stayId)) return NextResponse.json({ error: "Invalid stay." }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin.from("guest_feedback").select("sentiment, comment, submitted_at")
    .eq("stay_id", stayId).eq("guest_id", user.id).is("withdrawn_at", null).maybeSingle();
  return NextResponse.json({ feedback: data || null });
}

export async function POST(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await safeJson(request);
  const stayId = String(body.stayId || "");
  const sentiment = String(body.sentiment || "");
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 600) : "";
  if (!UUID_PATTERN.test(stayId) || !SENTIMENTS.has(sentiment)) return NextResponse.json({ error: "Choose one response." }, { status: 400 });

  const admin = createAdminClient();
  const { data: stay } = await admin.from("stays").select("id, property_id, guest_id, check_out").eq("id", stayId).maybeSingle();
  if (!stay || stay.guest_id !== user.id) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  if (!stay.check_out || stay.check_out > new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: "Feedback opens after checkout." }, { status: 400 });

  const { data, error } = await admin.from("guest_feedback").upsert({
    stay_id: stay.id,
    guest_id: user.id,
    property_id: stay.property_id,
    sentiment,
    comment: comment || null,
    withdrawn_at: null,
    submitted_at: new Date().toISOString(),
  }, { onConflict: "stay_id" }).select("sentiment, comment, submitted_at").single();
  if (error) return NextResponse.json({ error: "Feedback could not be saved." }, { status: 500 });
  return NextResponse.json({ feedback: data });
}

export async function DELETE(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await safeJson(request);
  const stayId = String(body.stayId || "");
  if (!UUID_PATTERN.test(stayId)) return NextResponse.json({ error: "Invalid stay." }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("guest_feedback").update({ withdrawn_at: new Date().toISOString() }).eq("stay_id", stayId).eq("guest_id", user.id);
  if (error) return NextResponse.json({ error: "Feedback could not be withdrawn." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function authenticatedUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

async function safeJson(request: Request): Promise<Record<string, unknown>> {
  try { return await request.json(); } catch { return {}; }
}
