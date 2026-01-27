/**
 * Design System - Colas App
 * Code-first design system with copy-paste patterns
 *
 * Design Tokens for Colas Transport & Logistics
 *
 * USAGE EXAMPLE:
 * import { typography } from '../styles/designSystem';
 * <h2 className="home-greeting">Godmorgen Jens</h2>
 * // CSS: font-size: 16px; font-weight: 700; (sectionTitle)
 */

export const colors = {
  // Primary Brand
  'colas-yellow': '#FFE600',
  'colas-black': '#161616',
  'colas-dark': '#3d3d3d',
  
  // Semantic
  dark: '#161616',
  darkGrey: '#1a1a1a',
  grey: '#3d3d3d',
  lightGrey: '#64748b',
  white: '#ffffff',
  
  // Task Status Colors
  'task-default': '#ece378',
  'task-variant2': '#f7f09e',
  'task-variant3': '#f7f2c1',
  
  // Text
  'text-white': '#ffffff',
  'text-dark': '#212121',
  'text-grey': '#ffffff',
};

export const typography = {
  // Page/Screen titles
  pageTitle: {
    tailwind: 'font-bold text-2xl text-white',
    css: 'font-size: 24px; font-weight: 700; color: white; font-family: Inter, sans-serif;'
  },

  // Section titles (e.g., "Opgaver idag", "Godmorgen Jens")
  sectionTitle: {
    tailwind: 'font-bold text-base text-white',
    css: 'font-size: 16px; font-weight: 700; color: white; font-family: Inter, sans-serif;',
    size: '16px',
    weight: '700',
    color: '#ffffff'
  },

  // Card content
  cardTitle: {
    tailwind: 'font-bold text-lg text-white',
    css: 'font-size: 18px; font-weight: 700; color: white; font-family: Inter, sans-serif;'
  },
  contactName: 'font-bold text-sm text-white',
  taskTitle: 'font-bold text-sm text-gray-900',

  // Body text
  body: 'font-normal text-sm text-slate-300',
  small: 'font-normal text-xs text-slate-400',

  // Status/Metadata
  metadata: 'font-normal text-xs text-slate-500',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
};

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '20px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

/**
 * Component Patterns
 */

// Task Card - Clickable variant
export const taskCardClickable = {
  base: 'cursor-pointer transition-transform transition-shadow',
  hover: 'hover:translate-y-[-2px] hover:shadow-lg',
  active: 'active:translate-y-0',
};

// Task Detail Card - Full screen yellow card
export const taskDetailCard = {
  container: 'flex-1 bg-[#ece378] rounded-t-[20px] p-6 overflow-y-auto relative',
  animation: 'animate-fold-out',
};

// Dark Info Boxes (used in task detail)
export const darkInfoBox = {
  base: 'bg-[#3d3d3d] rounded-xl p-4',
  text: 'text-white font-inter',
  label: 'text-xs text-gray-400',
};

// Transitions
export const transitions = {
  slideIn: 'animate-slide-in',
  foldOut: 'animate-fold-out',
  fast: 'transition-all duration-200',
  normal: 'transition-all duration-300',
  slow: 'transition-all duration-500',
};

// Home Page Components
export const homePage = {
  heroHeight: '480px',
  contentBg: colors['colas-black'],
  activityBoxBg: colors['colas-dark'],
  continueButton: {
    size: '64px',
    bg: colors['task-default'],
    hoverBg: colors['task-variant2'],
  },
};

/**
 * Animation Keyframes (add to CSS)
 *
 * @keyframes slideIn {
 *   from { opacity: 0; transform: scale(0.95); }
 *   to { opacity: 1; transform: scale(1); }
 * }
 *
 * @keyframes foldOut {
 *   from { transform: scaleY(0.1); transform-origin: top; }
 *   to { transform: scaleY(1); transform-origin: top; }
 * }
 */
