import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/discover")
    || path.startsWith("/space")
    || path.startsWith("/activate/");

  if (isProtected && !data.user) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (path === "/sign-in" && data.user) {
    const requestedNext = request.nextUrl.searchParams.get("next");
    const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/auth/continue";
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return response;
}

