/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        'sans': ['Quicksand', 'sans-serif'],
        'serif': ['Playfair Display', 'serif'],
      },
      colors: {
        'blush-pink': '#F1C4D9',
        'lavender': '#E6E6FA',
        'soft-mint': '#B2E2D8',
        'creamy-white': '#F5F5DC',
        'peach': '#FFDAB9',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(147, 197, 253, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
      }
    },
  },
  plugins: [],
};