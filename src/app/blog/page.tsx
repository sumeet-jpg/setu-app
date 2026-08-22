import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { BLOG_POSTS } from '@/lib/blog/posts'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Blog — Setu',
  description: 'Real numbers, real accounts, real trade-offs on AI Employees vs. human hiring.',
  alternates: { canonical: `${BASE}/blog` },
}

const BG = '#F6F5F1', WHITE = '#FFFFFF', INK = '#0D0C09', GREEN = '#0E5C34'
const GRAY = '#E3E1DA', MUTED = '#78746E', DIM = '#9E9891', F = 'var(--font-jakarta)'

export default function BlogIndexPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F, lineHeight: 1.6 }}>
      <Nav theme="light" />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Blog</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 12px' }}>Real numbers, not hype</h1>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 48, maxWidth: 480 }}>
          What AI Employees actually cost, actually do, and actually don't — written to survive scrutiny, not just SEO crawlers.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {BLOG_POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{
              display: 'block', background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 18,
              padding: '26px 28px', textDecoration: 'none', color: 'inherit',
            }}>
              <div style={{ fontSize: 11, color: DIM, fontFamily: 'monospace', marginBottom: 8 }}>
                {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {post.readMins} min read
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', color: INK }}>{post.title}</h2>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, margin: 0 }}>{post.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer theme="light" />
    </div>
  )
}
