/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'comic': ['"Comic Neue"', 'cursive'],
        'bangers': ['"Bangers"', 'cursive'],
      },
      colors: {
        'comic-yellow': '#F9F871',
        'comic-blue': '#00C9A7',
        'comic-purple': '#845EC2',
      }
    },
  },
  plugins: [],
}