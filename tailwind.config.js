/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4332', // Emerald dark
          light: '#2D6A4F',
          dark: '#001F12', // Sidebar background
          emerald: '#34D399',
        },
        accent: {
          DEFAULT: '#D97706', // Amber
          light: '#FFFBEB',
        },
        bg: {
          main: '#F2F5F3',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
