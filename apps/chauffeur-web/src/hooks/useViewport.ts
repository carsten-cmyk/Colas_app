/**
 * useViewport — viewport size detection hook.
 *
 * Returnerer aktuel viewport-størrelse baseret på `window.innerWidth` og
 * opdaterer ved resize. Bruges til at vise/skjule iPhone-rammen i prototyper
 * (kun desktop) og til andre responsive valg.
 *
 * Breakpoints matcher tailwind.config.ts:
 * - mobile: <768px (xs/sm/md)
 * - tablet: 768–1023px (lg)
 * - desktop: ≥1024px (xl+)
 *
 * Tilføjet 2026-06-10 som del af responsive-foundation (issue #56).
 */
import { useEffect, useState } from 'react'

export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

export interface UseViewportResult {
  size: ViewportSize
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

function detectSize(): ViewportSize {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export function useViewport(): UseViewportResult {
  const [size, setSize] = useState<ViewportSize>(() => detectSize())

  useEffect(() => {
    const onResize = () => setSize(detectSize())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return {
    size,
    isMobile: size === 'mobile',
    isTablet: size === 'tablet',
    isDesktop: size === 'desktop',
  }
}
