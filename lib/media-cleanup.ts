import { getSupabaseEnvironment, supabaseRequest, SupabaseError } from "@/lib/supabase-server";
import { RequestError } from "@/lib/request-security";

type StagedPhoto = { storage_path: string; invitation_id: string; slot: string; digest: string; mime_type: string; size_bytes: number; uploaded: boolean; delete_after: string };

export async function stagePhoto(photo: Omit<StagedPhoto, "uploaded" | "delete_after">) {
  try {
    await supabaseRequest("/rest/v1/media_cleanup", {
      method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(photo),
    });
    return false;
  } catch (error) {
    if (!(error instanceof SupabaseError) || error.code !== "23505") throw error;
    const response = await supabaseRequest(`/rest/v1/media_cleanup?${new URLSearchParams({ storage_path: `eq.${photo.storage_path}`, select: "storage_path,invitation_id,slot,digest,mime_type,size_bytes,uploaded,delete_after", limit: "1" })}`, { cache: "no-store" });
    const existing = (await response.json() as StagedPhoto[])[0];
    if (!existing || existing.digest !== photo.digest || existing.invitation_id !== photo.invitation_id || existing.slot !== photo.slot
      || Date.parse(existing.delete_after) <= Date.now() + 30 * 60 * 1000) {
      throw new RequestError("This photo slot has already been used or expired. Please save the design again.", 409);
    }
    return existing.uploaded;
  }
}

export async function markPhotoUploaded(path: string) {
  await supabaseRequest(`/rest/v1/media_cleanup?${new URLSearchParams({ storage_path: `eq.${path}` })}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ uploaded: true }),
  });
}

export async function drainMediaCleanup(limit = 10) {
  const response = await supabaseRequest("/rest/v1/rpc/claim_media_cleanup", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_limit: limit }),
  });
  const jobs = await response.json() as Array<{ storage_path: string; lease_token: string }>;
  const { bucket } = getSupabaseEnvironment();
  for (const job of jobs) {
    try {
      await supabaseRequest(`/storage/v1/object/${encodeURIComponent(bucket)}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [job.storage_path] }),
      });
      await supabaseRequest(`/rest/v1/media_cleanup?${new URLSearchParams({ storage_path: `eq.${job.storage_path}`, lease_token: `eq.${job.lease_token}` })}`, { method: "DELETE" });
    } catch { /* The durable lease expires in five minutes; the next run retries. */ }
  }
}

export async function tryMediaCleanup() {
  try { await drainMediaCleanup(); } catch { console.error("Media cleanup is pending; the durable queue will be retried."); }
}
