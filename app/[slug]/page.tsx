import { notFound } from "next/navigation";
import { PublishedInvitation } from "@/components/invitation-phone-preview";
import { normalizeInvitationConfig } from "@/lib/invitation-designer";
import { defaultPublicSiteOrigin, getConfiguredPublicSiteOrigin, getPublicInvitationBySlug } from "@/lib/invitation-orders-server";
import { invitationSocialDetails, invitationSocialImage } from "@/lib/invitation-social";
import { sanitizeInvitationCustomSections } from "@/lib/custom-sections";
import type { Metadata } from "next";
import "@/app/design-invitation/design-invitation.css";
import "./published-invitation.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const order = await getPublicInvitationBySlug(slug).catch(() => null);
  if (!order) return { robots: { index: false, follow: false } };
  const config = sanitizeInvitationCustomSections(normalizeInvitationConfig(order.config));
  const origin = getConfiguredPublicSiteOrigin() ?? defaultPublicSiteOrigin;
  const social = invitationSocialDetails(config, origin, slug);
  return {
    title: social.title,
    description: social.description,
    metadataBase: new URL(origin),
    alternates: { canonical: social.url },
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "Paperless Invites",
      title: social.title,
      description: social.description,
      url: social.url,
      images: [{
        url: social.image,
        width: invitationSocialImage.width,
        height: invitationSocialImage.height,
        type: invitationSocialImage.type,
        alt: "You're Invited — Paperless Invites",
      }],
    },
    twitter: { card: "summary_large_image", title: social.title, description: social.description, images: [social.image] },
  };
}

export default async function PublishedInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const order = await getPublicInvitationBySlug(slug).catch((error) => {
    console.error("Unable to load published invitation", error);
    return null;
  });
  if (!order) notFound();
  return <PublishedInvitation config={sanitizeInvitationCustomSections(normalizeInvitationConfig(order.config))} />;
}
