import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { verifyAdminRequest } from "@/server/admin-auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(request))) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  await getDb().update(invitations).set({ status: "published", publishedAt: sql`CURRENT_TIMESTAMP`, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(invitations.id, id));
  return Response.redirect(new URL("/admin", request.url), 303);
}
