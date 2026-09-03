import type { Metadata } from "next";
import "./globals.css";
import "./coastal-reverie-decorations.css";

export const metadata: Metadata = {
  title: "Event Invitations — The most elegant save the date",
  description:
    "Modern digital invitations for weddings, engagements, birthdays and the celebrations worth remembering.",
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
      <body>{children}</body>
    </html>
  );
}
