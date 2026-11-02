/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ios: {
          blue: '#007AFF',
          purple: '#AF52DE',
          green: '#34C759',
          orange: '#FF9500',
          red: '#FF3B30',
          yellow: '#FFCC00',
          darkBg: '#0D0E11',
          cardDark: '#181A20',
          cardBorder: '#272A34',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
