import { NextResponse } from "next/server";
import { issuePhotoReceipt, validSlot, verifyUploadCapability } from "@/lib/media-submission";
import { getInvitationOrder } from "@/lib/invitation-orders-server";
import {
  getSupabaseEnvironment,
  publicStorageUrl,
  supabaseRequest,
} from "@/lib/supabase-server";

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
    const uploadToken = form.get("uploadToken");
    const slot = form.get("slot");

    if (!(file instanceof File) || typeof invitationId !== "string" || typeof uploadToken !== "string" || typeof slot !== "string") {
      return NextResponse.json({ error: "The photo upload is incomplete." }, { status: 400 });
    }
    if (!validSlot(slot)) {
      return NextResponse.json({ error: "The photo destination is invalid." }, { status: 400 });
    }
    const extension = allowedTypes.get(file.type);
    if (!extension) return NextResponse.json({ error: "Please use a JPG, PNG or WebP photo." }, { status: 415 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Each photo must be 5 MB or smaller." }, { status: 413 });
    const capability = await verifyUploadCapability(uploadToken, invitationId);
    if (!capability || !capability.slots.includes(slot)) {
      return NextResponse.json({ error: "This submission cannot accept photo uploads." }, { status: 403 });
    }
    if (await getInvitationOrder(invitationId)) {
      return NextResponse.json({ error: "This invitation has already been submitted and cannot be edited." }, { status: 409 });
    }
    const { bucket } = getSupabaseEnvironment();
    const storagePath = `${capability.folder}/${slot}-${crypto.randomUUID()}.${extension}`;
    const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
    await supabaseRequest(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
      method: "POST",
      headers: { "Content-Type": file.type, "x-upsert": "false", "cache-control": "31536000" },
      body: await file.arrayBuffer(),
    });

    const url = publicStorageUrl(storagePath);
    const receipt = await issuePhotoReceipt({ id: invitationId, path: storagePath, slot, mimeType: file.type, sizeBytes: file.size });
    return NextResponse.json({ url, path: storagePath, slot, mimeType: file.type, sizeBytes: file.size, receipt }, { status: 201 });
  } catch (error) {
    console.error("Unable to upload invitation photo", error);
    if (error instanceof Error && /request failed \(413\)/.test(error.message)) {
      return NextResponse.json({ error: "This optimized photo exceeded the storage limit. Please choose a smaller photo." }, { status: 413 });
    }
    return NextResponse.json({ error: "This photo could not be uploaded. Your preview has not been changed." }, { status: 503 });
  }
}
