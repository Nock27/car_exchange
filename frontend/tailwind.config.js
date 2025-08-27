/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ← add this (keeps current behavior unless 'dark' class is present)
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // main accent (blue-500)
          600: '#2563eb',
          700: '#1d4ed8', // logo dark blue
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // NEW semantic accents (don’t touch brand scale)
        accent:  { 500: '#f59e0b', 600: '#d97706' }, // amber: prices/highlights
        success: { 500: '#10b981', 600: '#059669' }, // emerald: confirmations
        danger:  { 500: '#ef4444', 600: '#dc2626' }, // errors
        info:    { 500: '#0ea5e9', 600: '#0284c7' }, // secondary blue/sky
      },
    },
  },
  plugins: [],
}
