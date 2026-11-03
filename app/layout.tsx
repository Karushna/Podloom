import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Podloom — Podcast to Buffer Social Drafts",
  description: "Turn podcast audio into platform-specific social media drafts and dispatch to Buffer channels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
