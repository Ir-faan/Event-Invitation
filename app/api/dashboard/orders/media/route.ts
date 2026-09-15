import { NextResponse } from "next/server";
import { mediaFolderForOrder } from "@/lib/invitation-media-path";
import { getInvitationOrder } from "@/lib/invitation-orders-server";
import { validInvitationId } from "@/lib/invitation-validation";
import { issuePhotoReceipt, removeStoredPhotos, validSlot, verifyPhotos } from "@/lib/media-submission";
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
    const link = form.get("link");
    const customerName = form.get("customerName");

    if (!(file instanceof File) || typeof invitationId !== "string" || typeof slot !== "string") {
      return NextResponse.json({ error: "The photo upload is incomplete." }, { status: 400 });
    }
    if (!validInvitationId(invitationId) || !validSlot(slot)) {
      return NextResponse.json({ error: "The photo destination is invalid." }, { status: 400 });
    }
    if ((link !== null && typeof link !== "string") || (customerName !== null && typeof customerName !== "string")) {
      return NextResponse.json({ error: "The photo folder details are invalid." }, { status: 400 });
    }
    const extension = allowedTypes.get(file.type);
    if (!extension) return NextResponse.json({ error: "Please use a JPG, PNG or WebP photo." }, { status: 415 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Each photo must be 5 MB or smaller." }, { status: 413 });
    const order = await getInvitationOrder(invitationId);
    if (!order) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });

    const { bucket } = getSupabaseEnvironment();
    const storagePath = `${mediaFolderForOrder(order, {
      ...(typeof link === "string" ? { link } : {}),
      ...(typeof customerName === "string" ? { customerName } : {}),
    })}/${slot}-${crypto.randomUUID()}.${extension}`;
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
    console.error("Unable to upload administrator invitation photo", error);
    if (error instanceof Error && /request failed \(413\)/.test(error.message)) {
      return NextResponse.json({ error: "This optimized photo exceeded the storage limit. Please choose a smaller photo." }, { status: 413 });
    }
    return NextResponse.json({ error: "This photo could not be uploaded." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { invitationId, media } = await request.json() as { invitationId?: unknown; media?: unknown };
    if (!validInvitationId(invitationId)) return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    const photos = await verifyPhotos(invitationId, media);
    if (!photos) return NextResponse.json({ error: "Invalid photo receipts." }, { status: 400 });
    const params = new URLSearchParams({ select: "storage_path", invitation_id: `eq.${invitationId}`, storage_path: `in.(${photos.map((photo) => `"${photo.path}"`).join(",")})` });
    const response = photos.length ? await supabaseRequest(`/rest/v1/invitation_media?${params.toString()}`, { cache: "no-store" }) : null;
    const committed = new Set(response ? (await response.json() as Array<{ storage_path: string }>).map((row) => row.storage_path) : []);
    await removeStoredPhotos(photos.filter((photo) => !committed.has(photo.path)));
    return NextResponse.json({ cancelled: true });
  } catch (error) {
    console.error("Unable to clean up unsuccessful admin uploads", error);
    return NextResponse.json({ error: "Could not clean up unused photos." }, { status: 503 });
  }
}
