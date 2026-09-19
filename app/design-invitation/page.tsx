import type { Metadata } from "next";
import { InvitationDesigner } from "@/components/designer/invitation-designer";
import "./invitation.css";
import "./editor.css";

export const metadata: Metadata = {
  title: "Design your invitation — Paperless Invites",
  description: "Choose your colours, opening, photos and invitation parts while viewing a live mobile preview.",
};

export default function DesignInvitationPage() {
  return <InvitationDesigner />;
}
