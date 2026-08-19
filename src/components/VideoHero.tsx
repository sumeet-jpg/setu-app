'use client'
// @ts-nocheck
import { useRef, useState } from 'react'

export default function VideoHero() {
  const ref = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)

  const toggleMute = () => {
    if (!ref.current) return
    ref.current.muted = !ref.current.muted
    if (!ref.current.muted && ref.current.paused) ref.current.play()
    setMuted(ref.current.muted)
  }

  const restart = () => {
    if (!ref.current) return
    ref.current.currentTime = 0
    ref.current.muted = false
    ref.current.play()
    setMuted(false)
    setPlaying(true)
  }

  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#000', boxShadow: '0 24px 80px rgba(0,0,0,0.28)' }}>
      <video
        ref={ref}
        src="/setu-ad.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => setPlaying(false)}
        style={{ width: '100%', display: 'block' }}
      />

      {/* Overlay buttons */}
      <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 8 }}>
        {!playing && (
          <button onClick={restart}
            style={{ background: 'rgba(14,92,52,0.92)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, backdropFilter: 'blur(6px)' }}>
            ↺ Replay
          </button>
        )}
        <button onClick={toggleMute}
          style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, backdropFilter: 'blur(6px)' }}>
          {muted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      {/* Muted hint — shown for first 3s */}
      {muted && playing && (
        <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '5px 12px', color: 'rgba(255,255,255,0.85)', fontSize: 11, backdropFilter: 'blur(4px)' }}>
          Tap 🔇 for sound
        </div>
      )}
    </div>
  )
}
