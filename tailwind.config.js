/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#22573E', // Softer Eucalyptus green (formerly #1B4332)
          light: '#2D6A4F',
          dark: '#001F12', // Sidebar background
          emerald: '#34D399',
        },
        accent: {
          DEFAULT: '#D97706', // Amber
          light: '#FFFBEB',
        },
        bg: {
          main: '#F4F6F4', // Soft sage/gray tone (formerly #F2F5F3)
          card: '#FFFFFF',
        },
        gray: {
          50: '#F4F6F4',   // Softer sage background
          100: '#E9EFEA',  // Very soft border
          200: '#D6DFD9',  // Medium border
          300: '#B8C6BD',  // Muted line
          400: '#95A69B',  // Muted text light
          500: '#738478',  // Regular secondary text
          600: '#5A695F',  // Accent text
          700: '#434E47',  // High contrast text
          800: '#2E3531',  // Near black dark text
          900: '#1C201E',  // Pure black text in sage theme
          950: '#0D0F0E',
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
