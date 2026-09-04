import type { Metadata } from "next";
import { RoseAfterglowInvitation } from "@/components/rose-afterglow-invitation";

export const metadata: Metadata = {
  title: "Sofia & Samuel — Rose Afterglow",
  description: "An interactive wedding invitation with a ribbon opening, curtain reveal and scratch-to-reveal memories.",
};

export default function RoseAfterglowPage() {
  return <RoseAfterglowInvitation />;
}
