// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { resizedCopies } from './src/build/resized-copies-integration.ts';
export default defineConfig({
  integrations: [react(), resizedCopies()],
  env: {
    schema: {
      R2_ACCOUNT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      CLOUDFLARE_ACCOUNT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      R2_ACCESS_KEY_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      R2_SECRET_ACCESS_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      R2_BUCKET: envField.string({ context: 'server', access: 'public', optional: true, default: 'portol-assets' }),
      R2_PUBLIC_URL: envField.string({ context: 'server', access: 'public', optional: true, default: 'https://assets.joenoseph.co.uk' }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
