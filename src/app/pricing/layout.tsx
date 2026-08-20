import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — $49/month, 14-day free trial | Setu',
  description: 'One price for any AI Employee: $49/month, locked at signup. Price rises $10/month as we ship. Start with a 14-day free trial — no credit card needed.',
  openGraph: {
    title: 'Setu AI Employees — $49/month',
    description: '14-day free trial → $49/mo locked at hire. Price rises $10/month for new signups. Any AI Employee, every function.',
    type: 'website',
    siteName: 'Setu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Setu AI Employees — $49/month locked at hire',
    description: '14-day free trial. Price escalates $10/month. Sign up now, keep the lowest rate forever.',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
