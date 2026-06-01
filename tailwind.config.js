/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        sand: {
          50: '#fdf8f0',
          100: '#f9eedb',
          200: '#f2d9b1',
          300: '#e8be7e',
          400: '#dc9e4a',
          500: '#d08428',
          600: '#b8671e',
          700: '#994f1a',
          800: '#7d401c',
          900: '#67361a',
        },
        obsidian: {
          50: '#f4f4f5',
          100: '#e8e8ea',
          200: '#d1d1d5',
          300: '#a8a8b0',
          400: '#787885',
          500: '#5c5c6b',
          600: '#4b4b59',
          700: '#3e3e4a',
          800: '#28282f',
          900: '#18181d',
          950: '#0c0c0f',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
    },
  },
  plugins: [],
};
