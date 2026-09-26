/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        'bg-panel': '#121212',
        'bg-panel-2': '#171717',
        ink: '#EDEAE2',
        'ink-dim': '#9CA1AD',
        hairline: '#262626',
        gold: {
          DEFAULT: '#C9A46B',
          light: '#DDBB85',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'gold-fade': 'linear-gradient(rgba(201,164,107,0.35), transparent)',
      },
    },
  },
  plugins: [],
};
