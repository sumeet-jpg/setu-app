import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG = '#F6F5F1'
const GREEN = '#0E5C34'
const INK = '#0D0C09'
const MUTED = '#78746E'

// Site-wide default share-link preview — there was none before this, so
// every link posted to Slack/Twitter/LinkedIn/WhatsApp unfurled with no
// image at all despite per-page OG title/description copy already existing.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <svg width="88" height="80" viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="31" width="32" height="2.5" rx="1.25" fill={GREEN} />
            <rect x="10" y="12" width="3.5" height="19" rx="1.25" fill={GREEN} />
            <rect x="26.5" y="12" width="3.5" height="19" rx="1.25" fill={GREEN} />
            <path d="M10,12 Q20,3.5 30,12" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="8.4" x2="16" y2="31" stroke={GREEN} strokeWidth="1.2" opacity="0.55" />
            <line x1="20" y1="7.75" x2="20" y2="31" stroke={GREEN} strokeWidth="1.2" opacity="0.55" />
            <line x1="24" y1="8.4" x2="24" y2="31" stroke={GREEN} strokeWidth="1.2" opacity="0.55" />
          </svg>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: '-0.05em', color: INK, display: 'flex' }}>setu</div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', color: INK, display: 'flex', marginBottom: 16 }}>
          Hire AI Employees for Your Business
        </div>
        <div style={{ fontSize: 24, color: MUTED, display: 'flex' }}>
          100 roles · Interview free · $49/mo, locked at signup
        </div>
      </div>
    ),
    { ...size }
  )
}
