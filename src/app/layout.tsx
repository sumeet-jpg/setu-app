// @ts-nocheck
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import PostHogInit from "@/components/PostHogInit";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Setu — Hire AI Employees for Your Business",
    template: "%s | Setu",
  },
  description:
    "Hire AI Employees that command fleets of specialized agents. 100 roles across Marketing, Finance, Ops, Sales, HR, and more — interview free, go live in days.",
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

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {META_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');
              `,
            }}
          />
        )}
      </head>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <PostHogInit />
        {children}
        {META_PIXEL_ID && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
      </body>
    </html>
  );
}
