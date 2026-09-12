import { NextResponse } from "next/server";
import { getInvitationOrder } from "@/lib/invitation-orders-server";
import { validInvitationId } from "@/lib/invitation-validation";
import { getSupabaseEnvironment, publicStorageUrl, supabaseRequest } from "@/lib/supabase-server";

export const runtime = "edge";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const invitationId = form.get("invitationId");
    const slot = form.get("slot");

    if (!(file instanceof File) || typeof invitationId !== "string" || typeof slot !== "string") {
      return NextResponse.json({ error: "The photo upload is incomplete." }, { status: 400 });
    }
    if (!validInvitationId(invitationId) || !/^[a-z0-9:_-]{1,120}$/i.test(slot)) {
      return NextResponse.json({ error: "The photo destination is invalid." }, { status: 400 });
    }
    const extension = allowedTypes.get(file.type);
    if (!extension) return NextResponse.json({ error: "Please use a JPG, PNG or WebP photo." }, { status: 415 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Each photo must be 5 MB or smaller." }, { status: 413 });
    if (!(await getInvitationOrder(invitationId))) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });

    const { bucket } = getSupabaseEnvironment();
    const storagePath = `${invitationId}/${slot}-${crypto.randomUUID()}.${extension}`;
    const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
    await supabaseRequest(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
      method: "POST",
      headers: { "Content-Type": file.type, "x-upsert": "false" },
      body: await file.arrayBuffer(),
    });

    const url = publicStorageUrl(storagePath);
    await supabaseRequest("/rest/v1/invitation_media", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        invitation_id: invitationId,
        storage_path: storagePath,
        public_url: url,
        slot,
        mime_type: file.type,
        size_bytes: file.size,
      }),
    });

    return NextResponse.json({ url, path: storagePath }, { status: 201 });
  } catch (error) {
    console.error("Unable to upload administrator invitation photo", error);
    return NextResponse.json({ error: "This photo could not be uploaded." }, { status: 503 });
  }
}
