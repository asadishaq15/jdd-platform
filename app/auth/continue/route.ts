import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.redirect(new URL("/sign-in", url.origin));
  }

  const [{ data: profile }, { data: stays }, { data: adminMemberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("discovery_completed_at")
      .eq("id", userData.user.id)
      .maybeSingle(),
    supabase
      .from("stays")
      .select("id")
      .eq("guest_id", userData.user.id)
      .limit(1),
    supabase
      .from("admin_memberships")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .limit(1),
  ]);

  if (adminMemberships?.length) {
    return NextResponse.redirect(new URL("/admin", url.origin));
  }

  const destination = profile?.discovery_completed_at || stays?.length
    ? "/space"
    : "/discover";

  return NextResponse.redirect(new URL(destination, url.origin));
}
