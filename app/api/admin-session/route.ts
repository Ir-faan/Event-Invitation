import { NextResponse } from "next/server";
import { authIsConfigured, clearAdminCookies, isSameOrigin, loginWithSupabase, revokeAdminSession, setAdminCookies, accessCookieName, refreshCookieName } from "@/lib/admin-session";

export const runtime = "edge";

export async function POST(request: Request) {
  if (!authIsConfigured()) return NextResponse.json({ error: "Admin login is not configured. Set the Supabase URL, publishable key and service-role key." }, { status: 503 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid login request." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return NextResponse.json({ error: "Invalid login request." }, { status: 413 });
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: "Enter your email and password." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 1024) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  try {
    const tokens = await loginWithSupabase(email, password);
    if (!tokens) return NextResponse.json({ error: "Invalid credentials or this account is not an administrator." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const response = NextResponse.json({ loggedIn: true }, { headers: { "Cache-Control": "no-store" } });
    return setAdminCookies(response, request, tokens);
  } catch (error) {
    console.error("Unable to sign in to Supabase Auth", error);
    return NextResponse.json({ error: "Login is temporarily unavailable. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid sign-out request." }, { status: 403 });
  const cookies = request.headers.get("cookie")?.split(";").map((cookie) => cookie.trim()) ?? [];
  const cookieValue = (name: string) => cookies.find((cookie) => cookie.startsWith(name + "="))?.slice(name.length + 1);
  await revokeAdminSession(cookieValue(accessCookieName), cookieValue(refreshCookieName));
  return clearAdminCookies(NextResponse.json({ loggedIn: false }, { headers: { "Cache-Control": "no-store" } }), request);
}
