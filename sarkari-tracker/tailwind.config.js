/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tavily: {
          bg: '#0B0D10',
          card: '#1F1E1E',
          surface: '#15181E',
          surfaceAlt: '#1A1D24',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#FFFFFF',
          muted: '#A0A6B1',
          mint: '#00E599',
          purple: '#7C5CFF',
          blue: '#3860BE',
        },
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#00E599', // Map primary saffron highlights to Tavily Mint Green!
          600: '#00c985',
          700: '#00aa70',
          800: '#008c5c',
          900: '#006d48',
        },
        navy: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3860BE',
          600: '#2c4da0',
          700: '#1F1E1E',
          800: '#15181E',
          900: '#0B0D10', // Tavily Primary Background
          950: '#060709',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.25s ease-out forwards',
        'slide-in-right': 'slideInRight 0.25s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'countdown': 'countdown 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0.85' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0.85', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0.85', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        countdown: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
      },
    },
  },
  plugins: [],
};
