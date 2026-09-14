import { NextResponse, type NextRequest } from "next/server";
import { accessCookieName, authIsConfigured, getAdminSession, isSameOrigin, refreshCookieName, setAdminCookies } from "@/lib/admin-session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/dashboard/login") {
    const destination = new URL("/login", request.url);
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination);
  }
  if (!authIsConfigured()) {
    if (pathname === "/login") return NextResponse.next();
    return new NextResponse("Dashboard login is not configured. Add Supabase Auth settings.", { status: 503 });
  }
  let session;
  try {
    session = await getAdminSession(request.cookies.get(accessCookieName)?.value, request.cookies.get(refreshCookieName)?.value);
  } catch (error) {
    console.error("Unable to verify Supabase administrator", error);
    return new NextResponse("Admin login is temporarily unavailable.", { status: 503 });
  }
  if (pathname === "/login") {
    const response = session.authorized ? NextResponse.redirect(new URL("/dashboard", request.url)) : NextResponse.next();
    return session.tokens ? setAdminCookies(response, request, session.tokens) : response;
  }
  if (!session.authorized) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Please log in to the dashboard." }, { status: 401 });
    const destination = new URL("/login", request.url);
    destination.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(destination);
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !isSameOrigin(request)) {
    return NextResponse.json({ error: "This action must come from the dashboard." }, { status: 403 });
  }
  const response = NextResponse.next();
  return session.tokens ? setAdminCookies(response, request, session.tokens) : response;
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/api/dashboard/:path*"],
};
