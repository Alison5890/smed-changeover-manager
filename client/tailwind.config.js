/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4f9',
          100: '#dbe4f0',
          200: '#bfcfe3',
          300: '#93aecf',
          400: '#6086b5',
          500: '#3f659b',
          600: '#2d4f83',
          700: '#263f6a',
          800: '#233659',
          900: '#1E293B',
          950: '#131d2d',
        },
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0D9488',
          700: '#0f766e',
          800: '#115e59',
        },
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.12)',
      },
    },
  },
  plugins: [],
}
