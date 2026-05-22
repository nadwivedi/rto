# RTO Sarthi — Marketing Website

Premium SaaS marketing site for [RTOSarthi.com](https://rtosarthi.com), built with React + Vite.

**Tagline:** RTO Sarthi - India's Best RTO Agent Software

## Pages

- **Home** — Hero, features, demo video, testimonials, CTA
- **Features** — Full product capability breakdown
- **About** — Mission and SoftwareBytes background
- **Contact** — Direct phone, WhatsApp, email
- **Sitemap** — Human-readable page list (`/sitemap`)

## SEO

| File | URL |
|------|-----|
| `public/robots.txt` | https://rtosarthi.com/robots.txt |
| `public/sitemap.xml` | https://rtosarthi.com/sitemap.xml |
| `src/config/seo.js` | Per-page titles & descriptions |
| `src/components/Seo.jsx` | Updates meta tags on route change |

After deploy, submit `sitemap.xml` in [Google Search Console](https://search.google.com/search-console) and Bing Webmaster Tools.

Update `SITE_URL` in `src/config/seo.js` if your production domain differs.

## Development

```bash
cd webpage
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to your host (RTOSarthi.com). Ensure the server serves `robots.txt` and `sitemap.xml` from the site root.

Developed by **SoftwareBytes**, Raipur, Chhattisgarh, India.
