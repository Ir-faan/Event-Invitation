import { makeInvitationSlug } from "@/lib/invitation-orders";
import type { InvitationOrderRecord } from "@/lib/invitation-orders";

export function mediaFolderForOrder(order: Pick<InvitationOrderRecord, "id" | "slug" | "config">): string {
  const name = order.config.contact.name.trim().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 48).replace(/-+$/g, "") || "customer";
  const slug = order.slug || makeInvitationSlug(order.config);
  return `${slug}-${order.id}-${name}`;
}

/** Keep both earlier <id>/ and <id>-<name>-<slug>/ objects readable. */
export function belongsToOrder(path: string, id: string): boolean {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return path.startsWith(`${id}/`)
    || path.startsWith(`${id}-`)
    || new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*-${escapedId}-[a-z0-9]+(?:-[a-z0-9]+)*/$`, "i").test(path.replace(/[^/]+$/, ""));
}
