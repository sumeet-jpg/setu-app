import { MetadataRoute } from 'next'
import { EMPLOYEES } from '@/lib/employees/profiles'
import { BLOG_POSTS } from '@/lib/blog/posts'

const BASE = 'https://setuagents.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/employees`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/whatsapp`, lastModified: now, changeFrequency: 'monthly', priority: 0.92 },
    { url: `${BASE}/enterprise`, lastModified: now, changeFrequency: 'monthly', priority: 0.91 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/signin`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/mcp`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/agents`, lastModified: now, changeFrequency: 'daily', priority: 0.75 },
    { url: `${BASE}/quiz`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/agencies`, lastModified: now, changeFrequency: 'monthly', priority: 0.82 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.55 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/legal/dpa`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map(p => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const pSeoRoles = [
    'ai-marketing-manager', 'whatsapp-sales-bot', 'ai-cfo', 'ai-customer-support',
    'ai-cmo', 'ai-coo', 'ai-sales-manager', 'ai-hr-manager',
    'whatsapp-ecommerce-bot', 'ai-financial-analyst',
  ]
  const pSeoRoutes: MetadataRoute.Sitemap = pSeoRoles.map(role => ({
    url: `${BASE}/hire/${role}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.88,
  }))

  const employeeRoutes: MetadataRoute.Sitemap = EMPLOYEES.flatMap(e => [
    { url: `${BASE}/employees/${e.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE}/employees/${e.slug}/interview`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${BASE}/employees/${e.slug}/hire`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.85 },
  ])

  return [...staticRoutes, ...pSeoRoutes, ...employeeRoutes, ...blogRoutes]
}
