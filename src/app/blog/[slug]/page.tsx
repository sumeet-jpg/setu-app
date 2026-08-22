import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { BLOG_POSTS, getBlogPost } from '@/lib/blog/posts'

const BASE = 'https://setuagents.com'
const BG = '#F6F5F1', WHITE = '#FFFFFF', INK = '#0D0C09', GREEN = '#0E5C34'
const GRAY = '#E3E1DA', MUTED = '#78746E', DIM = '#9E9891', F = 'var(--font-jakarta)'

export async function generateStaticParams() {
  return BLOG_POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} — Setu Blog`,
    description: post.description,
    alternates: { canonical: `${BASE}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${BASE}/blog/${slug}`,
      siteName: 'Setu',
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'Setu' },
    publisher: { '@type': 'Organization', name: 'Setu', url: BASE },
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F, lineHeight: 1.6 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav theme="light" />
      <article style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px) 60px' }}>
        <Link href="/blog" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>← Blog</Link>
        <div style={{ fontSize: 11, color: DIM, fontFamily: 'monospace', margin: '20px 0 10px' }}>
          {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {post.readMins} min read
        </div>
        <h1 style={{ fontSize: 'clamp(28px,4.5vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 32px', lineHeight: 1.15 }}>{post.title}</h1>

        {post.body.map((section, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            {section.heading && (
              <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 14px' }}>{section.heading}</h2>
            )}
            {(section.paragraphs ?? []).map((p, j) => (
              <p key={j} style={{ fontSize: 15.5, color: '#3f3d38', lineHeight: 1.8, margin: '0 0 16px' }}>{p}</p>
            ))}
            {section.list && (
              <ul style={{ margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.list.map((item, k) => (
                  <li key={k} style={{ fontSize: 15, color: '#3f3d38', lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div style={{ marginTop: 48, padding: '24px 26px', background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>See it yourself, not just the argument</div>
          <Link href="/employees" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 10, background: GREEN, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Interview an AI Employee free →
          </Link>
        </div>
      </article>
      <Footer theme="light" />
    </div>
  )
}
