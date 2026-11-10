import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

/** Hospitality subdomain serves admin entry, not guest onboarding. */
const HOSPITALITY_HOSTS = new Set([
  "hospitality.jardindudesert.com",
]);

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() || "";
  if (HOSPITALITY_HOSTS.has(host) && request.nextUrl.pathname === "/") {
    const adminSignIn = request.nextUrl.clone();
    adminSignIn.pathname = "/admin/sign-in";
    adminSignIn.search = "";
    return NextResponse.redirect(adminSignIn);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|prototype/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

