import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

function safeRelativePath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/auth/continue";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeRelativePath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  const errorUrl = new URL("/sign-in", url.origin);
  errorUrl.searchParams.set("error", "We could not complete your sign-in. Please try again.");
  return NextResponse.redirect(errorUrl);
}

