import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Event Invitations — Beautiful celebrations, beautifully shared",
    template: "%s — Event Invitations",
  },
  description:
    "Create an elegant, personalized digital invitation for your wedding, engagement, birthday, or special celebration.",
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
