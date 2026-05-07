import type { Config } from 'tailwindcss'

// Design tokens — afspejler chauffeur-appens theme.js. Tokens er frosne.
// Ingen nye farver uden eksplicit godkendelse.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        yellow: '#FEEE32',
        'dark-teal': '#0E4764',
        'deep-teal': '#0B3950',
        'light-aqua': '#A0C7D7',
        warning: '#FAEF68',

        // Neutral layer (v2 — desktop/content areas)
        page: '#FAFAFA',
        surface: '#FFFFFF',
        'surface-2': '#F5F5F5',
        hairline: '#E8E8E8',
        'hairline-2': '#DEDEDE',

        // Status — semantic (v2)
        good: '#1F8A5B',
        'good-bg': '#E7F4EE',
        bad: '#C8372D',
        'bad-bg': '#FBECEA',
        'warn-bg': '#FFF6CC',

        // Status — legacy (beholdes for eksisterende komponenter)
        success: '#CAE6E3',
        error: '#F04E4E',

        // Baggrunde
        'soft-gray': '#F8F8F8',
        'soft-aqua': '#F0F7FA',

        // Borders
        'box-outline': '#EDEDED',
        'divider-strong': '#C4C4C4',

        // Tekst
        'text-primary': '#1D1D1D',
        'text-secondary': '#2B2B2B',
        'text-muted': '#717182',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xxs: ['10px', '14px'],
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        md: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['30px', '38px'],
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
        '2xl': '20px',
      },
      boxShadow: {
        md: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
