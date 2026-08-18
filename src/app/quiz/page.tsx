import type { Metadata } from 'next'
import QuizClient from './_client'

export const metadata: Metadata = {
  title: 'Which AI Employee Do You Need? — Free Quiz · Setu',
  description: 'Answer 4 quick questions and find out which AI Employee fits your business — from a $199/mo WhatsApp Lead Qualifier to a $2,999/mo AI CMO. Free to interview.',
  openGraph: {
    title: 'Which AI Employee Does Your Business Need?',
    description: '4 questions. Instant match. Free to interview.',
    url: 'https://setuagents.com/quiz',
    siteName: 'Setu',
    type: 'website',
  },
}

export default function QuizPage() {
  return <QuizClient />
}
