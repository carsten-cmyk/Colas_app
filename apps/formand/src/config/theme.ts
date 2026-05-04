/**
 * Design tokens — Colas Formand webapp.
 * Afspejler chauffeur-appens theme.js. Single source of truth.
 * Tokens er frosne — ingen nye værdier uden eksplicit godkendelse.
 *
 * Brug via Tailwind-klasser primært (tailwind.config.ts).
 * Referer direkte til theme.colors.* kun ved dynamiske inline styles.
 */
export const theme = {
  colors: {
    yellow: '#FEEE32',
    darkTeal: '#0E4764',
    deepTeal: '#0B3950',
    lightAqua: '#A0C7D7',
    success: '#CAE6E3',
    error: '#F04E4E',
    warning: '#FAEF68',
    softGray: '#F8F8F8',
    softAqua: '#F0F7FA',
    white: '#FFFFFF',
    boxOutline: '#EDEDED',
    dividerStrong: '#C4C4C4',
    textPrimary: '#1D1D1D',
    textSecondary: '#2B2B2B',
    textMuted: '#717182',
  },
  fontSizes: {
    xxs: '10px',
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '30px',
  },
  spacing: {
    xxs: '2px',
    xxxs: '4px',
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '20px',
  },
} as const
