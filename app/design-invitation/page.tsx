import type { Metadata } from "next";
import { InvitationDesigner } from "@/components/invitation-designer";
import "./design-invitation.css";

export const metadata: Metadata = {
  title: "Design your invitation — Paperless Invites",
  description: "Choose your colours, opening, photos and invitation parts while viewing a live mobile preview.",
};

export default function DesignInvitationPage() {
  return <InvitationDesigner />;
}
