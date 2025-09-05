/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neutral: {
          950: '#0a0a0a', // base background
          900: '#171717', // panel background
          850: '#262626', // input/card background
          800: '#404040', // hover states
          750: '#525252', // border states  
          700: '#525252', // borders
          600: '#737373', // disabled text
          200: '#e5e5e5', // primary text
          100: '#f5f5f5'  // secondary text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px'
      }
    },
  },
  plugins: [],
}