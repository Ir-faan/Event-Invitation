import type { Metadata } from "next";
import { InvitationDesigner } from "@/components/invitation-designer";
import { DesignerMobileEnhancements } from "@/components/designer-mobile-enhancements";
import "./design-invitation.css";
import "./mobile-ui-modifications.css";

export const metadata: Metadata = {
  title: "Design your invitation — Paperless Invites",
  description: "Choose your colours, opening, photos and invitation parts while viewing a live mobile preview.",
};

export default function DesignInvitationPage() {
  return (
    <>
      <DesignerMobileEnhancements />
      <InvitationDesigner />
    </>
  );
}
