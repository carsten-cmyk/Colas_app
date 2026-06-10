/**
 * Spacing, safe-area og font-size konstanter for chauffeur-web.
 *
 * Matcher tokens i `apps/chauffeur-web/tailwind.config.ts` så inline `style={}`
 * kan bruge samme værdier som Tailwind-klasser. Brug Tailwind-klasser hvor muligt
 * (`p-sm`, `text-xs`), og fald tilbage til disse konstanter når style-objekter
 * er uundgåelige.
 *
 * Tilføjet 2026-06-10 som del af responsive-foundation (issue #54).
 */

/**
 * Safe-area-insets via CSS env(). Returnerer string-værdier klar til inline `style`.
 * Fallback til `0` når enheden ikke rapporterer insets (desktop, ældre browsere).
 */
export const SAFE_AREA = {
  top: 'env(safe-area-inset-top, 0)',
  bottom: 'env(safe-area-inset-bottom, 0)',
  left: 'env(safe-area-inset-left, 0)',
  right: 'env(safe-area-inset-right, 0)',
} as const

/**
 * Spacing-tokens (matcher tailwind.config.ts → theme.extend.spacing).
 */
export const SP = {
  xxs: 2,
  xxxs: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
} as const

/**
 * Font-size-tokens (matcher tailwind.config.ts → theme.extend.fontSize).
 * Værdier i px — brug direkte i inline `style={{ fontSize: FS.xxs }}`.
 *
 * Mapping fra ikke-token-værdier (gælder kun ved migration af legacy prototype-kode):
 * - 10, 11      → xxs (10)
 * - 12          → xs  (12)
 * - 13, 14      → sm  (14)
 * - 15, 16, 17, 18 → md (16)
 * - 19, 20      → lg  (20)
 * - 22, 24      → xl  (24)
 * - 28+         → 2xl (30)
 */
export const FS = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 30,
} as const

/**
 * Touch-target minimum (44×44 — Apple HIG / WCAG 2.5.5).
 */
export const TOUCH = {
  min: 44,
} as const
