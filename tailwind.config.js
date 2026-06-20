/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background
        'bg-base': '#1C1815',
        'bg-surface': '#231F1C',
        'bg-dark': '#120F0D',
        
        // Text
        'warm-title': '#F0EDE8',
        'warm-body': 'rgba(240, 237, 232, 0.7)',
        'warm-muted': 'rgba(240, 237, 232, 0.4)',
        
        // Accent
        'accent-gold': '#C8A460',
        'accent-gold-light': '#D9BD7A',
        'accent-gold-dark': '#A88A4A',
        'accent-red': '#C06A4A',
        'accent-green': '#6B9E85',
        
        // Glass
        'glass-bg': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'glass-hover': 'rgba(255, 255, 255, 0.1)',
      },
      
      fontFamily: {
        serif: ['"Playfair Display"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Noto Sans SC"', '"PingFang SC"', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"SF Mono"', 'monospace'],
      },
      
      borderRadius: {
        'glass': '12px',
        'glass-lg': '16px',
        'glass-xl': '20px',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      
      boxShadow: {
        'glass-sm': '0 2px 12px rgba(0, 0, 0, 0.2)',
        'glass-md': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'gold-glow': '0 0 20px rgba(200, 164, 96, 0.15)',
      },
    },
  },
  plugins: [],
}
