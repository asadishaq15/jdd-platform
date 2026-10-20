import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);

    if (deleteError) {
      console.error("Account deletion failed", deleteError.message);
      return NextResponse.json({ error: "We could not delete your account. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (caughtError) {
    console.error("Account deletion is not configured", caughtError instanceof Error ? caughtError.message : caughtError);
    return NextResponse.json({ error: "Account deletion is temporarily unavailable." }, { status: 500 });
  }
}
