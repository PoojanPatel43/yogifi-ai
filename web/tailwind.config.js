/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clauaskee editorial palette
        'ck-bg':      '#F7F4EE',
        'ck-surface': '#EDEAE2',
        'ck-ink':     '#1A1816',
        'ck-muted':   '#6B6760',
        'ck-accent':  '#C9472F',
        'ck-blue':    '#3B5BDB',
        'ck-line':    '#D4CFC6',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        dm:       ['"DM Sans"', 'sans-serif'],
        mono:     ['"IBM Plex Mono"', 'monospace'],
      },
      maxWidth: {
        editorial: '1200px',
      },
    },
  },
  plugins: [],
}
