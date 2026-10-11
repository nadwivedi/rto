import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import { PAGE_SEO } from './src/config/seo.js'

// Prerender every page at build time so crawlers get full HTML (see src/prerender.jsx).
// "/<path>.html" makes the plugin write flat files: dist/<path>.html. Blog posts are added by
// the /blog prerender. spa.html is the empty fallback for anything that isn't prerendered.
const prerenderRoutes = [
  ...Object.keys(PAGE_SEO)
    .filter((p) => p !== '/')
    .map((p) => `${p}.html`),
  '/spa.html',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: path.resolve(import.meta.dirname, 'src/prerender.jsx'),
      additionalPrerenderRoutes: prerenderRoutes,
    }),
  ],
})
