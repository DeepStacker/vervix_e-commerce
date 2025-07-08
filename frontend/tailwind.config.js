/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'primary-black': '#1a1a1a',
        'secondary-black': '#2d2d2d',
        'luxury-gold': '#c9a96e',
        'warm-gold': '#b8956a',
        'soft-cream': '#f8f6f3',
        'pure-white': '#ffffff',
        'warm-gray': '#8a8a8a',
        'light-gray': '#f5f5f5',
        'border-light': '#e8e8e8',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'crimson': ['Crimson Text', 'serif'],
      },
      boxShadow: {
        'luxury': '0 10px 25px rgba(0, 0, 0, 0.1)',
        'luxury-hover': '0 15px 35px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

