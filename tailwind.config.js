/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./dashboard.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        audit: {
          verified: '#10b981',
          detected: '#3b82f6',
          possible: '#f59e0b',
          requires: '#8b5cf6',
          none: '#64748b',
          error: '#ef4444',
        }
      },
    },
  },
  plugins: [],
}
