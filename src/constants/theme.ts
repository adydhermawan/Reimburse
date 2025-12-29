/**
 * Centralized Design Tokens / Theme Constants
 * All color, spacing, typography, and other style values are defined here.
 */

export const colors = {
    // Primary
    primary: '#22D3EE',
    primaryDark: '#0891B2',
    primaryLight: 'rgba(34,211,238,0.15)',

    // Backgrounds
    background: '#0D1117',
    surface: '#161B22',
    surfaceElevated: '#1C2128',

    // Text
    text: '#FFFFFF',
    textSecondary: '#8B949E',
    textMuted: '#6E7681',

    // Status
    success: '#10B981',
    successBg: 'rgba(16,185,129,0.2)',
    warning: '#F59E0B',
    warningBg: 'rgba(245,158,11,0.2)',
    danger: '#EF4444',
    dangerBg: 'rgba(239,68,68,0.1)',
    info: '#3B82F6',
    infoBg: 'rgba(59,130,246,0.2)',

    // Category Colors
    categoryFood: '#F43F5E',
    categoryCoffee: '#D946EF',
    categoryFuel: '#EAB308',
    categoryTransport: '#3B82F6',
    categoryTopup: '#10B981',

    // Borders
    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.05)',
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
} as const;

export const fontSize = {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
} as const;

export const fontWeight = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
} as const;

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
} as const;

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#22D3EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    primary: {
        shadowColor: '#22D3EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
} as const;

// Status badge configurations
export const statusConfig = {
    Draft: {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-500',
        color: '#EAB308',
    },
    New: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        color: '#3B82F6',
    },
    Diajukan: {
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        color: '#A855F7',
    },
    Finish: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        color: '#10B981',
    },
} as const;

export const theme = {
    colors,
    spacing,
    fontSize,
    fontWeight,
    borderRadius,
    shadows,
    statusConfig,
} as const;

export default theme;
