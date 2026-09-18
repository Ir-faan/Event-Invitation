import { NextResponse } from "next/server";
import { validSlot, verifyUploadCapability } from "@/lib/media-submission";
import { getInvitationOrder } from "@/lib/invitation-orders-server";
import { readPhotoForm, requestErrorResponse } from "@/lib/request-security";
import { limitRequest } from "@/lib/rate-limit";
import { storePhoto } from "@/lib/photo-storage";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    await limitRequest(request, "photo-upload", 80, 900);
    const form = await readPhotoForm(request);
    const file = form.get("file");
    const invitationId = form.get("invitationId");
    const slot = form.get("slot");
    if (!(file instanceof File) || typeof invitationId !== "string" || !validSlot(slot)) {
      return NextResponse.json({ error: "The photo upload is incomplete." }, { status: 400 });
    }
    const capability = await verifyUploadCapability(form.get("uploadToken"), invitationId);
    if (!capability || !capability.slots.includes(slot)) return NextResponse.json({ error: "This submission cannot accept photo uploads." }, { status: 403 });
    await limitRequest(request, "photo-capability", 64, 1800, capability.id);
    if (await getInvitationOrder(invitationId)) return NextResponse.json({ error: "This invitation has already been submitted." }, { status: 409 });
    return NextResponse.json(await storePhoto(file, invitationId, slot, capability.folder, true), { status: 201 });
  } catch (error) {
    return requestErrorResponse(error) || NextResponse.json({ error: "This photo could not be uploaded. Please try again." }, { status: 503 });
  }
}
