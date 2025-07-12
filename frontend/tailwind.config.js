/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'primary-black': '#000000',
        'luxury-gold': '#d4af37',
        'soft-cream': '#faf8f5',
        'cream': '#faf8f5',
        'warm-gray': '#6b7280',
        'light-gray': '#f3f4f6',
        'white': '#ffffff',
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'border': '#e5e7eb'
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      boxShadow: {
        'luxury': '0 4px 20px rgba(212, 175, 55, 0.1)',
        'elegant': '0 8px 32px rgba(0, 0, 0, 0.1)'
      }
    },
  },
  plugins: [],
}