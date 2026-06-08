/** @type {import('tailwindcss').Config} */
/* global require */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ues-green': '#1A4731', // Verde Pino (Autoridad)
        'ues-gold': '#D4A017',  // Oro (Prestigio)
        'apple': '#84CC16',     // Verde Manzana (Acentuación selecta)
        'surface': {
          'bg': '#FCFCFC',
          'card': '#FFFFFF',
          'dark-bg': '#020403', // Obsidian Black para un look editorial de lujo
          'dark-card': '#0B0F0D',
          'dark-border': '#161B19',
        }
      },
      fontFamily: {
        serif: ['Crimson Pro', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'bento': '0 8px 30px rgba(0,0,0,0.04)',
        'bento-gold': '0 10px 40px rgba(212, 160, 23, 0.1)',
        'bento-dark': '0 20px 40px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
  ],
}
