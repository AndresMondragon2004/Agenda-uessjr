/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #163020)', // Deep Forest (Fallback)
          light: '#2D4F3F',   // Soft Moss
          dark: '#05140B',    // Midnight Sage (New Dark Mode base)
          emerald: '#34D399',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #D97706)', // Amber (Fallback)
        },
        accent: {
          DEFAULT: '#D97706', // Editorial Amber
          light: '#F59E0B',
        },
        sage: {
          50: '#F2F5F2',
          100: '#E6EBE6',
          200: '#CCD6CD',
          300: '#B3C1B4',
          400: '#99AB9B',
          500: '#809681',
          600: '#667C67',
          700: '#4D5E4D',
          800: '#333F33',
          900: '#1A1F1A',
        },
        bg: {
          main: '#FAF9F6',    // Ivory
          surface: '#F5F4F0', // Sand
          dark: '#08120A',    // Softer Dark
        },
        gray: {
          50: '#F9FAF9',
          100: '#F1F3F1',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#1A1A1A',
          950: '#0A0A0A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
