/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AGRI SMART brand colours — green-first agricultural palette
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',  // main brand green
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // golden harvest
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        soil: {
          50:  '#fdf8f0',
          100: '#faefd8',
          200: '#f5dca8',
          300: '#eec26b',
          400: '#e5a337',
          500: '#d97706',  // rich soil orange
          600: '#b45309',
        },
        sky: {
          light: '#e0f2fe',
          DEFAULT: '#0ea5e9',
          dark: '#0369a1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Kannada', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
