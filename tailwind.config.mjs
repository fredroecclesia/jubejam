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
          DEFAULT: '#B08D57',
          light: '#D9BE8F',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'gold-fade': 'linear-gradient(rgba(176,141,87,0.35), transparent)',
      },
    },
  },
  plugins: [],
};
