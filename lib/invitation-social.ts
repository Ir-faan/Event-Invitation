import type { InvitationConfig } from "@/lib/invitation-designer";

export const invitationSocialImage = {
  path: "/social/invitation-preview.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
} as const;

/** Generic branded artwork: never send a customer's uploaded photo to a crawler.
 * The second argument keeps the earlier internal call shape backward compatible. */
export function invitationPreviewImage(originOrConfig: string | InvitationConfig, legacyOrigin?: string): string {
  const origin = typeof originOrConfig === "string" ? originOrConfig : legacyOrigin!;
  return new URL(invitationSocialImage.path, `${origin.replace(/\/$/, "")}/`).href;
}

export function invitationSocialDetails(config: InvitationConfig, origin: string, slug: string) {
  const coupleNames = `${config.hero.firstName.trim()} & ${config.hero.secondName.trim()}`;
  return {
    coupleNames,
    title: `${coupleNames} — You're Invited`,
    description: `You're invited to celebrate the wedding of ${coupleNames}. Open their Paperless Invite for the celebration details.`,
    url: new URL(`/${slug}`, `${origin.replace(/\/$/, "")}/`).href,
    image: invitationPreviewImage(origin),
  };
}
