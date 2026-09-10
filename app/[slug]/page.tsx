import { notFound } from "next/navigation";
import { PublishedInvitation } from "@/components/invitation-phone-preview";
import { normalizeInvitationConfig } from "@/lib/invitation-designer";
import { getPublicInvitationBySlug } from "@/lib/invitation-orders-server";
import type { Metadata } from "next";
import "@/app/design-invitation/design-invitation.css";
import "./published-invitation.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PublishedInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const order = await getPublicInvitationBySlug(slug).catch((error) => {
    console.error("Unable to load published invitation", error);
    return null;
  });
  if (!order) notFound();
  return <PublishedInvitation config={normalizeInvitationConfig(order.config)} />;
}
