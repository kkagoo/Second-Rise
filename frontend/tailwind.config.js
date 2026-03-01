/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary blue
        blue: {
          50:  '#eff8ff',
          100: '#dbeffe',
          200: '#b9e0fd',
          300: '#7bc8fb',
          400: '#4BA3E3',  // primary CTA
          500: '#2e8ecf',
          600: '#1a72b3',
          700: '#145a8f',
          800: '#124b77',
          900: '#0e3d5e',
        },
        // Accent orange
        orange: {
          50:  '#fff6f0',
          100: '#ffe8d6',
          200: '#fecfae',
          300: '#fdae7d',
          400: '#F4874B',  // accent
          500: '#f0692a',
          600: '#e04f18',
          700: '#b73d14',
          800: '#913215',
          900: '#6e2b13',
        },
        // Neutral grays
        gray: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Light blue surface for cards
        'sky-card': '#EBF5FD',
        // Keep legacy aliases so existing pages don't break
        cream: '#ffffff',
        accent: {
          50:  '#fff6f0',
          500: '#F4874B',
          600: '#f0692a',
        },
        sunrise: {
          50:  '#fff6f0',
          200: '#fecfae',
          500: '#F4874B',
          600: '#f0692a',
          700: '#b73d14',
        },
        earth: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        stone: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      minHeight: {
        screen: '100svh',
      },
    },
  },
  plugins: [],
};
