import type { Metadata } from "next";
import "./styles/global.css";
import "./styles/landing/base.css";
import "./styles/invitation-templates.css";
import "./styles/landing/page.css";

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
        {children}
      </body>
    </html>
  );
}
