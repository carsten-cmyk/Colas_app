/**
 * Theme Configuration - Colas GPS Test
 *
 * Centralized theme following configuration-first architecture.
 * No hardcoded colors or values in components.
 */

export const theme = {
  // Colas Brand Colors
  colors: {
    // Primary brand colors
    colasYellow: '#FEEE32',      // Main brand yellow (background)
    colasYellowLight: '#FEF589', // Light yellow (button)
    colasBlack: '#000000',       // Logo and text
    colasWhite: '#FFFFFF',       // White text/elements

    // Design system (Figma node 3-3)
    darkTeal: '#0E4764',         // Brand secondary
    deepTeal: '#0B3950',         // Stat card text (Ordre detaljer)
    lightAqua: '#A0C7D7',        // Accent
    charcoal: '#1D1D1D',         // Text primary
    textSecondaryDark: '#2B2B2B',// Text secondary / headings
    textMuted: '#717182',        // Muted / labels

    // Action colors
    statusSuccess: '#CAE6E3',    // Aktivt Projekt
    statusWarning: '#FAEF68',    // Afventer Godkendelse
    statusError: '#F04E4E',      // Urgent Handling

    // Dæmpede baggrunde
    softGray: '#F8F8F8',
    softAqua: '#F0F7FA',
    boxOutline: '#EDEDED',

    // Functional colors (for GPS tracking screens)
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',

    // Neutral colors
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#3C3C43',
    border: '#C7C7CC',
  },

  // Typography
  fonts: {
    // Poppins — overskrifter og stats
    poppinsMedium: 'Poppins_500Medium',
    poppinsSemiBold: 'Poppins_600SemiBold',
    // Inter — brødtekst og labels
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },

  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },

  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Spacing System
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },

  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Shadows (for elevation)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};
