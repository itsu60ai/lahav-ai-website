// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// The public marketing pages stay PRERENDERED. Only the admin, the admin
// API and the two article routes render on demand, because they read the
// database. See docs/CMS.md.
export default defineConfig({
  site: 'https://lahav-ai.pages.dev',
  output: 'static',
  adapter: cloudflare({
    // gives local dev the real D1 binding through miniflare
    platformProxy: { enabled: true },
  }),
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()],
  },
});
