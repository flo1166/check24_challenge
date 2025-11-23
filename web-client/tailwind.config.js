/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'c24': {
          'primary-deep': '#022D94',
          'primary-medium': '#0563C1',
          'primary-light': '#0578E1',
          'alert-red': '#e30613',
          'highlight-yellow': '#FFBB1C',
          'text-dark': '#181818',
          'text-muted': '#666',
          'border-gray': '#949494',
          'light-gray': '#f5f5f5',
          'hover-blue': '#064E9C',
          'focus-blue': '#005ea8',
        }
      },

      spacing: {
        'c24-xs': '4px',
        'c24-sm': '8px',
        'c24-md': '16px',
        'c24-lg': '24px',
        'c24-xl': '32px',
        'c24-2xl': '48px',
      },

      borderRadius: {
        'c24-sm': '3px',
        'c24-md': '6px',
        'c24-lg': '12px',
      },

      boxShadow: {
        'c24-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'c24-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'c24-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'c24-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },

      fontFamily: {
        'c24': ['Verdana', 'Arial', 'Helvetica', 'sans-serif'],
      },

      fontSize: {
        'c24-xs': '10px',
        'c24-sm': '12px',
        'c24-base': '14px',
        'c24-lg': '16px',
        'c24-xl': '18px',
        'c24-2xl': '20px',
        'c24-3xl': '24px',
        'c24-4xl': '28px',
        'c24-5xl': '32px',
      },

      zIndex: {
        'c24-dropdown': '100',
        'c24-sticky': '200',
        'c24-fixed': '300',
        'c24-modal': '400',
        'c24-tooltip': '500',
      },

      /** ⭐ GLOW ANIMATION (NEW) ⭐ */
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 0px 0 rgba(255,255,255,0)' },
          '50%':  { boxShadow: '0 0 20px 8px rgba(255,255,255,0.75)' },
          '100%': { boxShadow: '0 0 0px 0 rgba(255,255,255,0)' },
        },
      },
      animation: {
        glow: 'glow 1.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
