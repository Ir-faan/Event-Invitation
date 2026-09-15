import { makeInvitationSlug } from "@/lib/invitation-orders";
import type { InvitationOrderRecord } from "@/lib/invitation-orders";

function storageSegment(value: string, maxLength: number, fallback: string) {
  return value.trim().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, maxLength).replace(/-+$/g, "") || fallback;
}

export function mediaFolderForIdentity({ link, id, customerName }: { link: string; id: string; customerName: string }) {
  return `${storageSegment(link, 90, "invitation")}-${id}-${storageSegment(customerName, 48, "customer")}`;
}

export function mediaFolderForOrder(
  order: Pick<InvitationOrderRecord, "id" | "slug" | "config">,
  current?: { link?: string; customerName?: string },
): string {
  return mediaFolderForIdentity({
    link: current?.link ?? order.slug ?? makeInvitationSlug(order.config),
    id: order.id,
    customerName: current?.customerName ?? order.config.contact.name,
  });
}

/** Keep both earlier <id>/ and <id>-<name>-<slug>/ objects readable. */
export function belongsToOrder(path: string, id: string): boolean {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return path.startsWith(`${id}/`)
    || path.startsWith(`${id}-`)
    || new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*-${escapedId}-[a-z0-9]+(?:-[a-z0-9]+)*/$`, "i").test(path.replace(/[^/]+$/, ""));
}
