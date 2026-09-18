import { notFound } from "next/navigation";
import { PublishedInvitation } from "@/components/invitation-phone-preview";
import { getPublicInvitationBySlug, getPublicSiteOrigin } from "@/lib/invitation-orders-server";
import { invitationPreviewImage } from "@/lib/invitation-social";
import type { Metadata } from "next";
import "@/app/design-invitation/design-invitation.css";
import "./published-invitation.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const order = await getPublicInvitationBySlug(slug).catch(() => null);
  if (!order) return { robots: { index: false, follow: false } };
  const config = order.config;
  const origin = getPublicSiteOrigin();
  const url = `${origin}/${slug}`;
  const title = `${config.hero.firstName} & ${config.hero.secondName} — You're invited`;
  const description = `Join ${config.hero.firstName} and ${config.hero.secondName} for their celebration. Open their invitation for the details.`;
  const image = invitationPreviewImage(config, origin);
  return {
    title, description,
    metadataBase: new URL(origin),
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: { type: "website", siteName: "Paperless Invites", title, description, url, images: [{ url: image, alt: `Invitation for ${config.hero.firstName} and ${config.hero.secondName}` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PublishedInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const order = await getPublicInvitationBySlug(slug).catch(() => {
    console.error("Unable to load published invitation");
    return null;
  });
  if (!order) notFound();
  return <PublishedInvitation config={order.config} />;
}
