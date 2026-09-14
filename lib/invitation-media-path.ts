import { makeInvitationSlug } from "@/lib/invitation-orders";
import type { InvitationOrderRecord } from "@/lib/invitation-orders";

export function mediaFolderForOrder(order: Pick<InvitationOrderRecord, "id" | "slug" | "config">): string {
  const name = order.config.contact.name.trim().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 48).replace(/-+$/g, "") || "customer";
  return `${order.id}-${name}-${order.slug || makeInvitationSlug(order.config)}`;
}

/** Existing media lives in <id>/; keep it readable when duplicating older orders. */
export function belongsToOrder(path: string, id: string): boolean {
  return path.startsWith(`${id}/`) || new RegExp(`^${id}-[^/]+/`).test(path);
}
