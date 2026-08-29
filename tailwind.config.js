import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ZCOOL KuaiLe / Microsoft YaHei act as CJK fallbacks so Chinese text
        // keeps a playful look when the Latin comic fonts have no CJK glyphs.
        'comic': ['"Comic Neue"', '"ZCOOL KuaiLe"', '"Microsoft YaHei"', 'sans-serif'],
        'bangers': ['"Bangers"', '"ZCOOL KuaiLe"', '"Microsoft YaHei"', 'cursive'],
      },
      colors: {
        'comic-yellow': '#F9F871',
        'comic-blue': '#00C9A7',
        'comic-purple': '#845EC2',
      }
    },
  },
  plugins: [animate],
}
