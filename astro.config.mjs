// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import icon from "astro-icon";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  // integrations/extensions
  vite: {
    plugins: [tailwindcss()]
  },

  // markdown config
  markdown: {
    shikiConfig: {
      theme: 'gruvbox-light-hard',
    }
  },

  // 
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Source Serif 4",
      // name: "Domine",
      cssVariable: "--font-alias-serif",
      weights: [300, 400, 500, 600, 700],
      fallbacks: [
        "ui-serif",
        "Noto Serif", 
        "Georgia", 
        "Cambria", 
        "Times New Roman", 
        "Times", 
        "serif",
      ]
    },
    {
      provider: fontProviders.fontsource(),
      // name: "Libre Franklin",
      name: "Source Sans 3",
      cssVariable: "--font-alias-sans",
      weights: [300, 400, 500, 600, 700],
      fallbacks: [
        "-apple-system", 
        "BlinkMacSystemFont", 
        "Noto Sans", 
        "Segoe UI", 
        "Helvetica Neue", 
        "Roboto", 
        "Arial", 
        "sans-serif", 
        "Apple Color Emoji", 
        "Segoe UI Emoji", 
        "Segoe UI Symbol", 
        "Noto Color Emoji",
      ]
    },
    {
      provider: fontProviders.fontsource(),
      name: "IBM Plex Mono",
      // name: "Ubuntu Sans Mono",
      cssVariable: "--font-alias-mono",
      weights: [300, 400, 500, 600, 700],
      fallbacks: [
        "ui-monospace", 
        "SFMono-Regular", 
        "Noto Sans Mono",
        "Menlo", 
        "Monaco", 
        "Consolas", 
        "Liberation Mono", 
        "Courier New", 
        "monospace",
      ]
    },
  ],

  integrations: [icon(), mdx()],
});