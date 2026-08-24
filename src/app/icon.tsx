import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

const GREEN = '#0E5C34'

// Same suspension-bridge mark as src/components/SetuLogo.tsx, rendered onto
// a square canvas for the browser tab icon — there was no favicon at all
// before this.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F6F5F1',
          borderRadius: 6,
        }}
      >
        <svg width="26" height="24" viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="31" width="32" height="2.5" rx="1.25" fill={GREEN} />
          <rect x="10" y="12" width="3.5" height="19" rx="1.25" fill={GREEN} />
          <rect x="26.5" y="12" width="3.5" height="19" rx="1.25" fill={GREEN} />
          <path d="M10,12 Q20,3.5 30,12" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="16" y1="8.4" x2="16" y2="31" stroke={GREEN} strokeWidth="1.2" opacity="0.55" />
          <line x1="20" y1="7.75" x2="20" y2="31" stroke={GREEN} strokeWidth="1.2" opacity="0.55" />
          <line x1="24" y1="8.4" x2="24" y2="31" stroke={GREEN} strokeWidth="1.2" opacity="0.55" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
