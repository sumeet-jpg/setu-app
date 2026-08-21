import type { Metadata } from 'next'
import WhatsAppClient from './_client'

export const metadata: Metadata = {
  title: 'AI WhatsApp Employees — Setu',
  description: 'AI Employees that run your entire WhatsApp Business — reply to leads, handle orders, book appointments, send follow-ups. $49/mo. Interview free.',
  openGraph: {
    title: 'AI WhatsApp Employees — Setu',
    description: 'Your WhatsApp inbox, handled by AI. 24/7. $49/mo.',
    url: 'https://setuagents.com/whatsapp',
    siteName: 'Setu',
    type: 'website',
  },
}

export default function WhatsAppPage() {
  return <WhatsAppClient />
}
