import type { Metadata } from "next";
import { RoseAfterglowInvitation } from "@/components/rose-afterglow-invitation";

export const metadata: Metadata = {
  title: "Sofia & Samuel — Rose Afterglow",
  description: "An elegant wedding invitation with tap-to-open floral curtains and scratch-to-reveal memories.",
};

export default function RoseAfterglowPage() {
  return <RoseAfterglowInvitation />;
}
