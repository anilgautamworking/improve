/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        charcoal: '#050505',
        graphite: '#101010',
        smoke: '#f5f5f5',
        slate: '#7d7d7d',
      },
    },
  },
  plugins: [],
};
