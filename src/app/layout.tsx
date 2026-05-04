// @ts-nocheck
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Setu — AI Operations Control Plane",
    template: "%s | Setu",
  },
  description:
    "Governed AI process agents for enterprise operations. Blueprint → Sandbox → Pilot → Production.",
  robots: {
    index: false, // app.setuagents.com is not indexed
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
