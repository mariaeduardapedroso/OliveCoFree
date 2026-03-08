/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores personalizadas do tema Olho de Pavão
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        olive: {
          50: '#fafaf5',
          100: '#f5f5e8',
          200: '#e8e8d0',
          300: '#d4d4a8',
          400: '#a3a352',
          500: '#808000',
          600: '#6b6b00',
          700: '#525200',
          800: '#3d3d00',
          900: '#292900',
        },
        danger: {
          light: '#fecaca',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },
        warning: {
          light: '#fef08a',
          DEFAULT: '#eab308',
          dark: '#a16207',
        },
        success: {
          light: '#bbf7d0',
          DEFAULT: '#22c55e',
          dark: '#15803d',
        },
      },
    },
  },
  plugins: [],
}
