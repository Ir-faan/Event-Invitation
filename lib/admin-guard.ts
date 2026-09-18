import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { accessCookieName, refreshCookieName, authIsConfigured, getAdminSession, isSameOrigin, setAdminCookies } from "@/lib/admin-session";
import { requestErrorResponse } from "@/lib/request-security";

/** A handler must authorize independently of the route proxy/matcher. */
export function withAdmin(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      if (!authIsConfigured()) return NextResponse.json({ error: "Admin login is unavailable." }, { status: 503 });
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !isSameOrigin(request)) {
        return NextResponse.json({ error: "This action must come from the dashboard." }, { status: 403 });
      }
      const values = new Map<string, string>();
      for (const part of (request.headers.get("cookie") || "").split(";")) {
        const index = part.indexOf("=");
        if (index <= 0) continue;
        values.set(part.slice(0, index).trim(), part.slice(index + 1));
      }
      const session = await getAdminSession(values.get(accessCookieName), values.get(refreshCookieName));
      if (!session.authorized) return NextResponse.json({ error: "Please log in to the dashboard." }, { status: 401 });
      const result = await handler(request);
      const response = new NextResponse(result.body, { status: result.status, headers: result.headers });
      response.headers.set("Cache-Control", "private, no-store");
      return session.tokens ? setAdminCookies(response, request, session.tokens) : response;
    } catch (error) {
      return requestErrorResponse(error) || NextResponse.json({ error: "This action is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  };
}

export async function requireAdminPage() {
  if (!authIsConfigured()) redirect("/login");
  const values = await cookies();
  const session = await getAdminSession(values.get(accessCookieName)?.value, values.get(refreshCookieName)?.value).catch(() => null);
  if (!session?.authorized) redirect("/login");
}
