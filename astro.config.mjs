// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output. No server, no database — see docs/ARCHITECTURE_REVIEW.md
export default defineConfig({
  // Placeholder until the temporary hosting URL exists (F-5). Used for sitemap/canonical.
  site: 'https://lahav-ai.pages.dev',
  output: 'static',
  build: { format: 'directory' },
  vite: {
    plugins: [tailwindcss()],
  },
});
