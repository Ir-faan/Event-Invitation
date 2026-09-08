import type { Metadata } from "next";
import { RoseAfterglowInvitation } from "@/components/rose-afterglow-invitation";
import "./rose-hero-mobile-fill.css";

export const metadata: Metadata = {
  title: "Sofia & Samuel — Rose Afterglow",
  description: "An elegant wedding invitation with floral curtains, a scratch-to-reveal hero and complete wedding details.",
};

export default function RoseAfterglowPage() {
  return <RoseAfterglowInvitation />;
}
