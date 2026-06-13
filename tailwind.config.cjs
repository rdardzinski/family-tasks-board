/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          page: '#f3fbf7',
          surface: '#ffffff',
          ink: '#123020',
          muted: '#5b7169',
          border: 'rgba(18, 48, 32, 0.08)',
          mint: '#3ccf91',
          mintSoft: '#e7faf1',
          sky: '#59b7ff',
          skySoft: '#eaf5ff',
          sun: '#ffd45e',
          sunSoft: '#fff6d9',
          coral: '#ff8d7a',
          coralSoft: '#fff0eb',
        },
      },
      fontFamily: {
        sans: ['Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 50px rgba(29, 76, 56, 0.12)',
        pop: '0 16px 28px rgba(29, 76, 56, 0.16)',
      },
    },
  },
  plugins: [],
}
