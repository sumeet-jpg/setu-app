// @ts-nocheck
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Setu — Hire AI Employees for Your Business",
    template: "%s | Setu",
  },
  description:
    "Hire AI Employees that command fleets of specialized agents. Marketing Manager, CFO, Compliance Officer and 17 more — interview free, go live in days.",
  metadataBase: new URL("https://setuagents.com"),
  openGraph: {
    siteName: "Setu AI Employees",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    site: "@setuagents",
    creator: "@setuagents",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
