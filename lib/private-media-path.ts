import { belongsToOrder } from "@/lib/invitation-media-path";
import { supabaseRequest } from "@/lib/supabase-server";
import { privateDigest } from "@/lib/rate-limit";

export async function privateMediaFolder(id: string) { return `media-${await privateDigest(`folder:${id}`)}`; }
export async function mediaPathBelongsToOrder(path: string, id: string) {
  if (path.includes("..") || /[\\\u0000-\u0020]/.test(path)) return false;
  if (belongsToOrder(path, id) || path.startsWith(`${await privateMediaFolder(id)}/`)) return true;
  // Key rotation must not strand media already committed under an old HMAC.
  if (!/^media-[a-f0-9]{64}\/[a-f0-9.-]+$/.test(path)) return false;
  const query = new URLSearchParams({ select: "storage_path", invitation_id: `eq.${id}`, storage_path: `eq.${path}`, limit: "1" });
  const response = await supabaseRequest(`/rest/v1/invitation_media?${query}`, { cache: "no-store" });
  return (await response.json() as Array<{ storage_path: string }>).some((row) => row.storage_path === path);
}
