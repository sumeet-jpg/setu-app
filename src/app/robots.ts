import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/manage/', '/my-employees/', '/dashboard/', '/auth/', '/blueprints/'],
      },
    ],
    sitemap: 'https://setuagents.com/sitemap.xml',
    host: 'https://setuagents.com',
  }
}
