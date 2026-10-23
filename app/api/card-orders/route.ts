import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const stayId = String(body.stayId || "");
  const recipientName = String(body.recipientName || "").trim();
  const shippingAddress = String(body.shippingAddress || "").trim();
  if (!UUID_PATTERN.test(stayId)) return NextResponse.json({ error: "Choose an activated stay." }, { status: 400 });
  if (recipientName.length < 2 || recipientName.length > 120) return NextResponse.json({ error: "Enter the recipient name." }, { status: 400 });
  if (shippingAddress.length < 8 || shippingAddress.length > 500) return NextResponse.json({ error: "Enter a complete delivery address." }, { status: 400 });

  const admin = createAdminClient();
  const { data: stay, error: stayError } = await admin.from("stays").select("id, property_id, guest_id").eq("id", stayId).eq("guest_id", userData.user.id).maybeSingle();
  if (stayError || !stay) return NextResponse.json({ error: "This stay is not connected to your account." }, { status: 403 });
  const { data: order, error } = await admin.from("card_orders").insert({ guest_id: userData.user.id, stay_id: stay.id, property_id: stay.property_id, recipient_name: recipientName, shipping_address: shippingAddress }).select("id, stay_id, property_id, recipient_name, status, created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order }, { status: 201 });
}
