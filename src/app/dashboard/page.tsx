// @ts-nocheck
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './_client'

export const metadata: Metadata = {
  title: 'My Dashboard — Setu',
  description: 'Manage your hired AI Employees, track status, and hire more.',
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return <DashboardClient user={{ email: user.email, name: user.user_metadata?.full_name, avatar: user.user_metadata?.avatar_url }} />
}
