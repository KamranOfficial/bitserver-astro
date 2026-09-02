// @ts-check
import { defineConfig } from 'astro/config';

// Static output — deploys to Cloudflare Workers/Pages as a static asset bundle.
export default defineConfig({
  site: 'https://bitsserver.com',
  output: 'static',
  build: {
    // /legal/privacy-policy.html — matches the existing bitsserver.com sitemap
    format: 'file',
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
          },
        },
      },
    },
  },
});
