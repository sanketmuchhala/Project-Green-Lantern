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
          850: '#262626', // card/input background
          800: '#404040', // hover states
          750: '#525252', // border states  
          700: '#525252', // borders
          600: '#737373', // disabled text
          400: '#a3a3a3', // muted text
          300: '#d4d4d4', // secondary text
          200: '#e5e5e5', // primary text
          100: '#f5f5f5', // bright text
          50: '#fafafa'   // brightest text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],    // meta text
        'sm': ['14px', { lineHeight: '20px' }],    // body text  
        'base': ['15px', { lineHeight: '24px' }],  // default body
        'lg': ['16px', { lineHeight: '24px' }],    // inputs
        'xl': ['18px', { lineHeight: '28px' }],    // heading-sm
        '2xl': ['20px', { lineHeight: '32px' }],   // heading-md
        '3xl': ['24px', { lineHeight: '36px' }]    // heading-lg
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px'
      },
      spacing: {
        '18': '4.5rem' // 72px for better spacing options
      }
    },
  },
  plugins: [],
}