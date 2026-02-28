/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Refined terracotta accent — deeper, more muted than the original orange
        accent: {
          50:  '#fdf3ee',
          100: '#fbe4d5',
          200: '#f6c7aa',
          300: '#efa177',
          400: '#e6794a',
          500: '#c45c38',  // primary accent
          600: '#a8492a',
          700: '#8a3921',
          800: '#6e2d1b',
          900: '#4f2015',
        },
        // Neutral warm grays — replaces "earth"
        stone: {
          50:  '#fafaf9',
          100: '#f4f3f1',
          200: '#e6e3de',
          300: '#ccc8c1',
          400: '#a8a39a',
          500: '#857f76',
          600: '#635e57',
          700: '#4a4540',
          800: '#302d29',
          900: '#1c1a17',
        },
        // Keep sunrise alias pointing to accent for backward compatibility
        sunrise: {
          50:  '#fdf3ee',
          100: '#fbe4d5',
          200: '#f6c7aa',
          300: '#efa177',
          400: '#e6794a',
          500: '#c45c38',
          600: '#a8492a',
          700: '#8a3921',
          800: '#6e2d1b',
          900: '#4f2015',
        },
        // Keep earth alias for backward compat
        earth: {
          50:  '#fafaf9',
          100: '#f4f3f1',
          200: '#e6e3de',
          300: '#ccc8c1',
          400: '#a8a39a',
          500: '#857f76',
          600: '#635e57',
          700: '#4a4540',
          800: '#302d29',
          900: '#1c1a17',
        },
        cream: '#f8f7f5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        screen: '100svh',
      },
    },
  },
  plugins: [],
};
