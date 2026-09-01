import { ADMIN_COOKIE, authenticateAdmin, createAdminToken } from "@/server/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    if (!(await authenticateAdmin(username, password))) {
      return Response.redirect(new URL("/admin/login?error=1", request.url), 303);
    }
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL("/admin", request.url).toString(),
        "Set-Cookie": `${ADMIN_COOKIE}=${await createAdminToken()}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=28800`,
      },
    });
  } catch {
    return Response.redirect(new URL("/admin/login?configuration=1", request.url), 303);
  }
}
