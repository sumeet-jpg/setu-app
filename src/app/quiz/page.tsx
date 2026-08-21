import type { Metadata } from 'next'
import QuizClient from './_client'

export const metadata: Metadata = {
  title: 'Which AI Employee Do You Need? — Free Quiz · Setu',
  description: 'Answer 4 quick questions and find out which of 100 AI Employees fits your business — every one is $49/mo. Free to interview.',
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
