import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  // 'server' dibutuhkan karena ada endpoint CRUD admin di src/pages/api/*.ts
  // yang jalan sebagai serverless function di Vercel.
  output: 'server',
  adapter: vercel(),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // kita pakai global.css sendiri
    }),
  ],
  vite: {
    ssr: {
      // biar driver Neon (ws) tidak dibundling aneh di edge/serverless
      noExternal: ['@neondatabase/serverless'],
    },
  },
});
