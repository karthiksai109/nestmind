import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NestMind - AI for International Students",
  description: "AI-powered agents helping international students navigate housing, budgets, campus life, and careers in the US.",
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
