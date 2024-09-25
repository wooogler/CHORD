import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHORD",
  description: "CHatbot for Online Revision and Drafting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
