import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Osman | Full-Stack Developer & Business Owner",
  description:
    "Full-stack developer and business owner from Charlotte, NC. Built AutoRx Center's complete tech ecosystem. Specializing in React, Next.js, Node.js, and AI integration.",
  keywords: [
    "developer",
    "full-stack",
    "Next.js",
    "React",
    "TypeScript",
    "Supabase",
    "portfolio",
  ],
  authors: [{ name: "Osman", url: siteConfig.githubUrl }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: "Osman | Full-Stack Developer & Business Owner",
    description:
      "Full-stack developer and business owner from Charlotte, NC. Built AutoRx Center's complete tech ecosystem.",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Osman | Full-Stack Developer & Business Owner",
    description:
      "Full-stack developer and business owner from Charlotte, NC. Built AutoRx Center's complete tech ecosystem.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
