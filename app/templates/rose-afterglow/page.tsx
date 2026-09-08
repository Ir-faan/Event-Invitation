import type { Metadata } from "next";
import { RoseAfterglowInvitation } from "@/components/rose-afterglow-invitation";
import "./rose-section-transitions.css";
import "./rose-glimpse-scatter.css";
import "./rose-glimpse-spacing.css";
import "./rose-template1-layout.css";
import "./rose-template1-layout-fixes.css";

export const metadata: Metadata = {
  title: "Sofia & Samuel — Rose Afterglow",
  description: "An elegant wedding invitation with floral curtains, a scratch-to-reveal hero and complete wedding details.",
};

export default function RoseAfterglowPage() {
  return <RoseAfterglowInvitation />;
}
