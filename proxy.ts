import { NextResponse, type NextRequest } from "next/server";
import { adminCookieName, adminIsConfigured, isSameOrigin, verifyAdminSession } from "@/lib/admin-session";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/dashboard/login") return NextResponse.next();
  if (!adminIsConfigured()) return new NextResponse("Dashboard login is not configured.", { status: 503 });
  const allowed = await verifyAdminSession(request.cookies.get(adminCookieName)?.value);
  if (!allowed) {
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Please log in to the dashboard." }, { status: 401 });
    const destination = new URL("/dashboard/login", request.url);
    destination.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(destination);
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !isSameOrigin(request)) {
    return NextResponse.json({ error: "This action must come from the dashboard." }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
