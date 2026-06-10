/**
 * PROTOTYPE — iPhone 14 Pro CSS frame
 * 393×852px screen area, Dynamic Island, home indicator, side buttons.
 *
 * Vises kun på desktop (≥1024px). På mobile + tablet returneres `children`
 * fullscreen, så prototypen kører som rigtig PWA.
 */
import type { ReactNode } from 'react'
import { useViewport } from '@/hooks/useViewport'

export interface IPhoneFrameProps {
  children: ReactNode
}

const SCREEN_W = 393
const SCREEN_H = 852
const BORDER = 12

export function IPhoneFrame({ children }: IPhoneFrameProps) {
  const { isDesktop } = useViewport()

  // På mobile/tablet: vis fullscreen uden ramme — PWA-mode.
  if (!isDesktop) {
    return <>{children}</>
  }

  const outerW = SCREEN_W + BORDER * 2
  const outerH = SCREEN_H + BORDER * 2

  return (
    <div style={{ position: 'relative', width: outerW, height: outerH, flexShrink: 0 }}>
      {/* Phone body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#1A1A1C',
          borderRadius: 52,
          boxShadow: [
            '0 0 0 1px #3A3A3C',
            'inset 0 1px 0 rgba(255,255,255,0.07)',
            '0 50px 120px rgba(0,0,0,0.8)',
            '0 20px 50px rgba(0,0,0,0.5)',
          ].join(', '),
        }}
      />

      {/* Screen */}
      <div
        style={{
          position: 'absolute',
          top: BORDER,
          left: BORDER,
          width: SCREEN_W,
          height: SCREEN_H,
          backgroundColor: '#000',
          borderRadius: 42,
          overflow: 'hidden',
        }}
      >
        {children}

        {/* Dynamic Island — overlays content */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 126,
            height: 37,
            backgroundColor: '#000',
            borderRadius: 20,
            zIndex: 200,
            pointerEvents: 'none',
          }}
        />

        {/* Home indicator */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 134,
            height: 5,
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 3,
            zIndex: 200,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Mute switch */}
      <div style={{ position: 'absolute', left: -3, top: 116, width: 3, height: 26, backgroundColor: '#3A3A3C', borderRadius: '2px 0 0 2px' }} />
      {/* Volume up */}
      <div style={{ position: 'absolute', left: -3, top: 160, width: 3, height: 36, backgroundColor: '#3A3A3C', borderRadius: '2px 0 0 2px' }} />
      {/* Volume down */}
      <div style={{ position: 'absolute', left: -3, top: 210, width: 3, height: 36, backgroundColor: '#3A3A3C', borderRadius: '2px 0 0 2px' }} />
      {/* Power button */}
      <div style={{ position: 'absolute', right: -3, top: 178, width: 3, height: 72, backgroundColor: '#3A3A3C', borderRadius: '0 2px 2px 0' }} />
    </div>
  )
}
