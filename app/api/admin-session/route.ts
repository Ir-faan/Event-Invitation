import { NextResponse } from "next/server";
import { adminCookieName, adminIsConfigured, isSameOrigin, issueAdminSession, matchesAdminCredentials } from "@/lib/admin-session";

export const runtime = "edge";

export async function POST(request: Request) {
  if (!adminIsConfigured()) return NextResponse.json({ error: "Admin login is not configured. Set the dashboard credentials and session secret." }, { status: 503 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid login request." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return NextResponse.json({ error: "Invalid login request." }, { status: 413 });
  let body: { username?: unknown; password?: unknown };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: "Enter your username and password." }, { status: 400 }); }
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password || username.length > 128 || password.length > 256 || !(await matchesAdminCredentials(username, password))) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const session = await issueAdminSession();
  const response = NextResponse.json({ loggedIn: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(adminCookieName, session.value, { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: session.maxAge });
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid sign-out request." }, { status: 403 });
  const response = NextResponse.json({ loggedIn: false }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(adminCookieName, "", { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
