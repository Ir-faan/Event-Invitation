import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const username = process.env.DASHBOARD_USERNAME;
  const password = process.env.DASHBOARD_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("Dashboard access is not configured.", { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  const expected = `Basic ${btoa(`${username}:${password}`)}`;
  if (authorization !== expected) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Paperless Invites Dashboard", charset="UTF-8"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
