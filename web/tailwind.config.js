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
        // New premium wellness palette
        forest:         '#1B4332',
        'forest-light': '#2D6A4F',
        'forest-dark':  '#0F2419',
        gold:           '#D4AF37',
        'gold-light':   '#E8C85A',
        'gold-dark':    '#B8930A',
        sage:           '#87A878',
        'sage-light':   '#A8C49A',
        'sage-dark':    '#6B8A5D',
        warmwhite:      '#FAFAF8',
        'warmwhite-dark': '#F0EDE6',
        // Legacy colors kept for backward compat
        moss:     '#2E4036',
        clay:     '#CC5833',
        cream:    '#F2F0E9',
        charcoal: '#1A1A1A',
      },
      fontFamily: {
        sans:   ['"Plus Jakarta Sans"', 'Outfit', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        serif:  ['"Cormorant Garamond"', 'serif'],
        mono:   ['"IBM Plex Mono"', 'monospace'],
      },
      letterSpacing: {
        tightest: '-.075em',
        tighter:  '-.05em',
        tight:    '-.025em',
        normal:   '0',
        wide:     '.025em',
        wider:    '.05em',
        widest:   '.2em',
      },
      animation: {
        'fade-up':           'fadeUp 0.8s ease-out forwards',
        'fade-in':           'fadeIn 0.6s ease-out forwards',
        'float':             'float 6s ease-in-out infinite',
        'spin-slow':         'spin 20s linear infinite',
        'spin-slow-reverse': 'spin 15s linear infinite reverse',
        'pulse-slow':        'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':           'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400% 0' },
          '100%': { backgroundPosition: '400% 0' },
        },
      },
    },
  },
  plugins: [],
}
