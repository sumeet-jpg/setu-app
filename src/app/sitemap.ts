import { MetadataRoute } from 'next'
import { EMPLOYEES } from '@/lib/employees/profiles'

const BASE = 'https://setuagents.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/employees`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/agents`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/flows`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  const employeeRoutes: MetadataRoute.Sitemap = EMPLOYEES.flatMap(e => [
    { url: `${BASE}/employees/${e.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE}/employees/${e.slug}/interview`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${BASE}/employees/${e.slug}/hire`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.85 },
  ])

  return [...staticRoutes, ...employeeRoutes]
}
