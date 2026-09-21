/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        defense: {
          dark: '#0f172a',
          panel: '#1e293b',
          neon: '#10b981',
          alert: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}