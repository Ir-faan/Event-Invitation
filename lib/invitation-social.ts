import type { InvitationConfig } from "@/lib/invitation-designer";

/** Generic branded artwork: never send a customer's uploaded photo to a crawler. */
export function invitationPreviewImage(_config: InvitationConfig, origin: string): string {
  return new URL("/social/invitation-preview.jpg", origin).href;
}
