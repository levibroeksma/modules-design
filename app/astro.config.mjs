// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import alpinejs from '@astrojs/alpinejs';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [alpinejs({ entrypoint: "/src/alpine.init.js" })],
  devToolbar: {
    enabled: false,
  },

  server: {
    port: 666,
    host: true,
  }
});