export const theme = {
  colors: {
    yellow: '#FEEE32',
    darkTeal: '#0E4764',
    deepTeal: '#0B3950',
    lightAqua: '#A0C7D7',
    // Status — semantic (v2)
    good: '#1F8A5B',
    goodBg: '#E7F4EE',
    bad: '#C8372D',
    badBg: '#FBECEA',
    warnBg: '#FFF6CC',
    // Status — legacy (beholdes for eksisterende komponenter)
    success: '#CAE6E3',
    error: '#F04E4E',
    warning: '#FAEF68',
    softGray: '#F8F8F8',
    softAqua: '#F0F7FA',
    white: '#FFFFFF',
    boxOutline: '#EDEDED',
    dividerStrong: '#C4C4C4', // Mørkere divider — øget kontrast ift. boxOutline (#EDEDED)
    textPrimary: '#1D1D1D',
    textSecondary: '#2B2B2B',
    textMuted: '#717182',
  },
  fonts: {
    poppinsSemiBold: 'Poppins_600SemiBold',
    poppinsMedium: 'Poppins_500Medium',
    interRegular: 'Inter_400Regular',
    interMedium: 'Inter_500Medium',
    interSemiBold: 'Inter_600SemiBold',
    interBold: 'Inter_700Bold',
  },
  fontSizes: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 30,
  },
  spacing: {
    xxs: 2,
    xxxs: 4,
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
  },
  lineHeights: {
    stat: 26,   // Poppins 20px stat-værdier
    name: 18,   // Inter 14px navn i ContactCard
  },
  letterSpacing: {
    label: 0.5, // Uppercase labels
  },
  avatarSize: {
    contact: 64, // Cirkulært kontaktfoto i ContactCard
  },
  cardWidth: {
    contact: 100,        // Fast bredde på ContactCard
    meetingTime: 64,     // Mødetid-kolonne i LocationCard
  },
  contactCard: {
    avatarSize: 58,          // var avatarSize.contact (64px), -10%
    width: 110,              // tilpasset faktisk tilgængelig bredde i contactsCard swiper-slot
    nameFontSize: 14,        // fontSizes.sm — outdoor minimum
    nameLineHeight: 18,      // lineHeights.name
    phoneIconSize: 12,       // standard icon størrelse
    phoneRowMinHeight: 40,   // var 44px, -10%
  },
  locationCard: {
    nameFontSize: 16,         // fontSizes.md
    addressFontSize: 14,      // fontSizes.sm — outdoor minimum
    meetingValueFontSize: 20, // fontSizes.lg
    paddingVertical: 14,      // var spacing.sm (16px), -10%
    paddingHorizontal: 14,    // var spacing.sm (16px), -10%
    meetingTimeWidth: 58,     // var cardWidth.meetingTime (64px), -10%
  },
  orderMetrics: {
    dividerMarginVertical: 0, // ingen margin på divider — minimerer vertikal space
  },
  infoCard: {
    titleFontSize: 16,   // fontSizes.md — matcher locationCard.nameFontSize
    messageFontSize: 14, // fontSizes.sm — outdoor minimum
  },
  statCard: {
    valueFontSize: 28,     // ~2× locationCard/contactCard — fremhævet ordredata
    valueLineHeight: 36,   // proportional til 28px
    labelFontSize: 14,     // fontSizes.sm — outdoor minimum
    paddingVertical: 2,    // minimal vertikal padding — reducerer space mellem rækker
    paddingHorizontal: 13, // var spacing.sm (16px), -25% +10%
  },
  transportIcon: {
    size: 25,      // Truck icon — tallest element i rækken
    arrowSize: 23, // Pile-ikoner — lidt mindre end truck
    gap: 14,       // Gap mellem ikoner i rækken
  },
  taskSwiper: {
    sidePeek: 22, // var spacing.md (24px), -10%
    gap: 7,       // var spacing.xs (8px), -10%
  },
  cardHeight: {
    info: 158,           // InfoCard + swiper-korthøjde — var 175px, -10%
    task: 220,           // TaskCard i DashboardScreen swiper — Figma node 90:692
    contactDivider: 80,  // Divider-linje højde i contactsCard
  },
  buttonHeight: {
    action: 52, // ActionButton — var 64px, reduceret for at spare skærmareal
  },
  sheet: {
    horizontalMargin: 20, // Vandret margin på TaskSheet
  },
  skeleton: {
    metricsCellHeight: 64,   // OrderMetrics-pladsholder cellehøjde
    locationCardHeight: 80,  // LocationCard-pladsholder højde
  },
  dashboardHeader: {
    height: 56,        // Figma node 9:68 — ~48px + safe area buffer
    logoHeight: 40,    // var 36px +10%
    logoWidth: 110,    // var 100px +10%
    bottomSpacing: 48, // 3 linjeskift under logo
  },
  tabBar: {
    height: 58,          // Figma node 3-932
    inactiveOpacity: 0.5,
    indicatorHeight: 4,  // Gul aktiv-streg under label
    indicatorWidth: 32,  // Fast bredde — undgår at stregen går til kant i yderpositioner
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
  },
  shadows: {
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
