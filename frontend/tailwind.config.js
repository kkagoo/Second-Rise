/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sunrise: {
          50:  '#fff8f1',
          100: '#ffe8d6',
          200: '#ffd0ad',
          300: '#ffb07a',
          400: '#ff8545',
          500: '#f0722e',
          600: '#e0521a',
          700: '#ba3d14',
          800: '#953118',
          900: '#762b16',
        },
        earth: {
          50:  '#f9f6f0',
          100: '#f0e8d8',
          200: '#dfd0b0',
          300: '#c9b082',
          400: '#b5915a',
          500: '#9a7348',
          600: '#7d5c39',
          700: '#644830',
          800: '#4e3828',
          900: '#2e1f0e',
        },
        cream: '#fdf8f0',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        screen: '100svh',
      },
    },
  },
  plugins: [],
};
