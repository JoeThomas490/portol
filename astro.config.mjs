// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  integrations: [react()],
  image: {
    domains: ['assets.joenoseph.co.uk', 'cdn.simpleicons.org'],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
