import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-guard";
import { getInvitationOrder } from "@/lib/invitation-orders-server";
import { validInvitationId } from "@/lib/invitation-validation";
import { validSlot, verifyPhotos } from "@/lib/media-submission";
import { readJson, readPhotoForm, requestErrorResponse } from "@/lib/request-security";
import { privateMediaFolder, storePhoto } from "@/lib/photo-storage";
import { limitRequest } from "@/lib/rate-limit";

export const runtime = "edge";

export const POST = withAdmin(async (request: Request) => {
  try {
    await limitRequest(request, "admin-photo", 150, 900);
    const form = await readPhotoForm(request);
    const file = form.get("file");
    const id = form.get("invitationId");
    const slot = form.get("slot");
    if (!(file instanceof File) || !validInvitationId(id) || !validSlot(slot)) return NextResponse.json({ error: "The photo upload is incomplete." }, { status: 400 });
    if (!await getInvitationOrder(id)) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });
    return NextResponse.json(await storePhoto(file, id, slot, await privateMediaFolder(id)), { status: 201 });
  } catch (error) {
    return requestErrorResponse(error) || NextResponse.json({ error: "This photo could not be uploaded." }, { status: 503 });
  }
});

export const DELETE = withAdmin(async (request: Request) => {
  const { invitationId, media } = await readJson<{ invitationId?: unknown; media?: unknown }>(request);
  if (!validInvitationId(invitationId) || !await verifyPhotos(invitationId, media)) return NextResponse.json({ error: "Invalid photo receipts." }, { status: 400 });
  // Uploads are already durably queued. Wait beyond receipt expiry so a failed
  // response/cancellation racing a successful commit cannot remove live photos.
  return NextResponse.json({ cancelled: true });
});
