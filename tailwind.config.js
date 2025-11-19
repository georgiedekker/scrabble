/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        board: {
          normal: '#D4A574',
          dw: '#FFB5B5',
          tw: '#FF6B6B',
          dl: '#B8E6FF',
          tl: '#4A90E2'
        },
        tile: {
          bg: '#F4E4C1',
          text: '#2C1810'
        }
      },
    },
  },
  plugins: [],
}
