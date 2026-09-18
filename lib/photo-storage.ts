import { validatePhoto } from "@/lib/image-validation";
import { stagePhoto, markPhotoUploaded } from "@/lib/media-cleanup";
import { issuePhotoReceipt } from "@/lib/media-submission";
import { privateDigest } from "@/lib/rate-limit";
import { getSupabaseEnvironment, publicStorageUrl, supabaseRequest, SupabaseError } from "@/lib/supabase-server";

export { privateMediaFolder, mediaPathBelongsToOrder } from "@/lib/private-media-path";

export async function storePhoto(file: File, invitationId: string, slot: string, folder: string, singleUse = false) {
  const { bytes, mimeType, extension } = await validatePhoto(file);
  // Public slots have one immutable path regardless of MIME type. Replaying a
  // capability cannot create another object or overwrite the existing bytes.
  const name = singleUse ? await privateDigest(`slot:${slot}`) : `${crypto.randomUUID()}.${extension}`;
  const path = `${folder}/${name}`;
  const digest = await privateDigest(`photo:${Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer))).join(",")}`);
  const alreadyUploaded = await stagePhoto({ storage_path: path, invitation_id: invitationId, slot, digest, mime_type: mimeType, size_bytes: bytes.length });
  if (!alreadyUploaded) {
    const { bucket } = getSupabaseEnvironment();
    try {
      await supabaseRequest(`/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`, {
        method: "POST", headers: { "Content-Type": mimeType, "x-upsert": "false", "cache-control": "31536000" }, body: new Uint8Array(bytes).buffer,
      });
    } catch (error) {
      if (!(error instanceof SupabaseError) || ![400, 409].includes(error.status)) throw error;
      // Recover an upload whose successful storage response was lost. Never
      // issue a receipt for different bytes at the deterministic path.
      const response = await fetch(publicStorageUrl(path), { cache: "no-store" });
      if (!response.ok || Number(response.headers.get("content-length")) > 5 * 1024 * 1024) throw error;
      const stored = new Uint8Array(await response.arrayBuffer());
      if (stored.length !== bytes.length || stored.some((byte, index) => byte !== bytes[index])) throw error;
    }
    await markPhotoUploaded(path);
  }
  const receipt = await issuePhotoReceipt({ id: invitationId, path, slot, mimeType, sizeBytes: bytes.length });
  return { url: publicStorageUrl(path), path, slot, mimeType, sizeBytes: bytes.length, receipt };
}
