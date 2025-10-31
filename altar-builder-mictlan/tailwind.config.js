/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Day of the Dead inspired color palette
        altar: {
          orange: '#FF6B35',
          purple: '#8B5CF6',
          gold: '#F59E0B',
          red: '#EF4444',
          pink: '#EC4899',
          yellow: '#FDE047',
          green: '#10B981',
          blue: '#3B82F6',
        },
        marigold: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        }
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'flicker': 'flicker 2s ease-in-out infinite alternate',
        'sway': 'sway 3s ease-in-out infinite',
        'flutter': 'flutter 1.5s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        flicker: {
          '0%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
          '100%': { opacity: '0.9', filter: 'brightness(0.9)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        flutter: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-2px) rotate(1deg)' },
          '75%': { transform: 'translateY(-1px) rotate(-1deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.8)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      gridTemplateColumns: {
        'altar-6': 'repeat(6, minmax(0, 1fr))',
        'altar-9': 'repeat(9, minmax(0, 1fr))',
        'altar-12': 'repeat(12, minmax(0, 1fr))',
      },
      gridTemplateRows: {
        'altar-8': 'repeat(8, minmax(0, 1fr))',
        'altar-10': 'repeat(10, minmax(0, 1fr))',
        'altar-12': 'repeat(12, minmax(0, 1fr))',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxWidth: {
        'altar': '1200px',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}