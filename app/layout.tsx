import type { Metadata } from "next";
import "./globals.css";
import "./landing-paperless.css";
import "./landing-contact-polish.css";
import "./coastal-reverie-decorations.css";
import "./envelope-opening-fixes.css";
import "./traditional-card-fixes.css";
import "./coastal-programme-gift-polish.css";
import "./rose-scratch-sparkles.css";
import "./footer-redesign.css";
import "./landing-refresh.css";
import "./landing-preview-fix.css";
import "./landing-navbar-cleanup.css";
import { TemplateCardRouter } from "@/components/template-card-router";

export const metadata: Metadata = {
  title: "Paperless Invites — The most elegant save the date",
  description:
    "Modern digital invitations built around your chosen colours, interactive details and sections.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TemplateCardRouter />
        {children}
      </body>
    </html>
  );
}
