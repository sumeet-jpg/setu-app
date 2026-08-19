// @ts-nocheck
import Link from 'next/link'

interface SetuLogoProps {
  href?: string
  size?: number      // mark height in px
  color?: string     // bridge line color
  wordColor?: string // wordmark color
  animate?: boolean  // play the build-up animation
}

// Viewbox 40×36 — suspension bridge mark, no background box
// animate=true adds CSS class names; setuLogoStyle in globals.css drives the animation
export function SetuLogo({
  href = '/',
  size = 30,
  color = '#0E5C34',
  wordColor = '#0D0C09',
  animate = true,
}: SetuLogoProps) {
  const w = Math.round(size * (40 / 36))
  const fs = Math.round(size * 0.57)

  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <svg
        width={w}
        height={size}
        viewBox="0 0 40 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Deck — horizontal road surface at the bottom */}
        <rect
          className={animate ? 'setu-deck' : undefined}
          x="4" y="31" width="32" height="2.5" rx="1.25"
          fill={color}
        />
        {/* Left tower */}
        <rect
          className={animate ? 'setu-tower-l' : undefined}
          x="10" y="12" width="3.5" height="19" rx="1.25"
          fill={color}
        />
        {/* Right tower */}
        <rect
          className={animate ? 'setu-tower-r' : undefined}
          x="26.5" y="12" width="3.5" height="19" rx="1.25"
          fill={color}
        />
        {/* Catenary cable — quadratic bezier M(10,12) Q(20,3.5) (30,12) */}
        <path
          className={animate ? 'setu-cable' : undefined}
          d="M10,12 Q20,3.5 30,12"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Hanger 1 — x≈16, y from cable down to deck */}
        <line
          className={animate ? 'setu-hanger-1' : undefined}
          x1="16" y1="8.4" x2="16" y2="31"
          stroke={color} strokeWidth="1.2"
          style={animate ? undefined : { opacity: 0.55 }}
        />
        {/* Hanger 2 — center, from cable nadir */}
        <line
          className={animate ? 'setu-hanger-2' : undefined}
          x1="20" y1="7.75" x2="20" y2="31"
          stroke={color} strokeWidth="1.2"
          style={animate ? undefined : { opacity: 0.55 }}
        />
        {/* Hanger 3 */}
        <line
          className={animate ? 'setu-hanger-3' : undefined}
          x1="24" y1="8.4" x2="24" y2="31"
          stroke={color} strokeWidth="1.2"
          style={animate ? undefined : { opacity: 0.55 }}
        />
      </svg>
      <span
        className={animate ? 'setu-word' : undefined}
        style={{
          fontSize: fs,
          fontWeight: 800,
          color: wordColor,
          letterSpacing: '-0.05em',
          fontFamily: 'var(--font-jakarta, system-ui)',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        setu
      </span>
    </Link>
  )
}
