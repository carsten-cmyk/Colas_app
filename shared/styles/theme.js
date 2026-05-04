/**
 * Colas Design System - Theme Configuration
 * Baseret på Figma: https://www.figma.com/design/FvtXz7MabxzJrLDQYtxaZv/Colas---Eksekvering?node-id=3-3
 *
 * ALDRIG hardcode farver eller typografi direkte i komponenter.
 * Brug altid værdier fra denne fil.
 */

// ─────────────────────────────────────────────
// FARVER
// ─────────────────────────────────────────────

export const colors = {
  // Brand Foundation
  yellow: '#FEEE32',
  darkTeal: '#0E4764',
  lightAqua: '#A0C7D7',
  charcoal: '#1D1D1D',

  // Action Colors
  success: '#CAE6E3',
  error: '#F04E4E',
  warning: '#FAEF68',

  // Dæmpede farver (Douche) - baggrunde & kort
  softGray: '#F8F8F8',
  softAqua: '#F0F7FA',
  white: '#FFFFFF',
  boxOutline: '#EDEDED',

  // Tekst
  textPrimary: '#1D1D1D',
  textSecondary: '#2B2B2B',
  textMuted: '#717182',

  // Ekstra
  progressTrack: '#1B4F5C',
};

// ─────────────────────────────────────────────
// TYPOGRAFI
// ─────────────────────────────────────────────

export const fontFamilies = {
  heading: 'Poppins',
  body: 'Inter',
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
};

export const typography = {
  // Overskrifter - Poppins
  h1: {
    fontFamily: fontFamilies.heading,
    fontWeight: fontWeights.semiBold,
    fontSize: 36,
    lineHeight: 43,
    letterSpacing: 0,
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontWeight: fontWeights.semiBold,
    fontSize: 30,
    lineHeight: 39,
    letterSpacing: 0,
  },
  h3: {
    fontFamily: fontFamilies.heading,
    fontWeight: fontWeights.semiBold,
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: 0,
  },
  h4: {
    fontFamily: fontFamilies.heading,
    fontWeight: fontWeights.medium,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0,
  },

  // Brødtekst - Inter
  body: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodyRegular: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Etiketter & kaptioner - Inter
  labelMedium: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  labelRegular: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
};

// ─────────────────────────────────────────────
// BADGES & STATUS
// ─────────────────────────────────────────────

export const badges = {
  success: {
    backgroundColor: colors.success,
    color: colors.textPrimary,
    label: 'Aktivt Projekt',
  },
  warning: {
    backgroundColor: colors.warning,
    color: colors.textPrimary,
    label: 'Afventer Godkendelse',
  },
  error: {
    backgroundColor: colors.error,
    color: colors.white,
    label: 'Urgent Handling',
  },
  info: {
    backgroundColor: colors.softAqua,
    color: colors.textPrimary,
    label: 'Information',
  },
};

// ─────────────────────────────────────────────
// SPACING & LAYOUT
// ─────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ─────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────

export const shadows = {
  card: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
};

// ─────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────

const theme = {
  colors,
  fontFamilies,
  fontWeights,
  typography,
  badges,
  spacing,
  borderRadius,
  shadows,
};

export default theme;
