import { NextResponse } from "next/server";
import { parsePrivateSpaceSnapshot, spaceStateToSnapshot } from "../../../lib/space-state-sync";
import { createClient } from "../../../lib/supabase/server";
import type { SpaceState } from "../../../lib/space-state";

const MAX_BYTES = 120_000;

function payloadTooLarge(state: unknown) {
  try {
    return JSON.stringify(state).length > MAX_BYTES;
  } catch {
    return true;
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("private_space, private_space_updated_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load your Space." }, { status: 500 });
  }

  const state = parsePrivateSpaceSnapshot(data?.private_space) || {};
  return NextResponse.json({
    state,
    updatedAt: data?.private_space_updated_at || null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { state?: SpaceState };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const snapshot = spaceStateToSnapshot(body.state || {});
  if (payloadTooLarge(snapshot)) {
    return NextResponse.json({ error: "Space data is too large." }, { status: 413 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      private_space: snapshot,
      private_space_updated_at: now,
    })
    .eq("id", userData.user.id);

  if (error) {
    return NextResponse.json({ error: "Could not save your Space." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updatedAt: now });
}