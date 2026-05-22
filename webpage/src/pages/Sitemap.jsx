import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'
import { container, section, pageHero, glassCard, labelOnDark, h1Page, cn } from '../lib/styles'
import { TAGLINE } from '../config/seo'

const pages = [
  { to: '/', label: 'Home', desc: 'RTO Sarthi overview, demo video, features & testimonials' },
  { to: '/features', label: 'Features', desc: 'AI, WhatsApp alerts, bulk upload, dashboard & more' },
  { to: '/about', label: 'About', desc: 'About RTO Sarthi and SoftwareBytes, Raipur' },
  { to: '/contact', label: 'Contact', desc: 'Phone, WhatsApp, email and office details' },
]

export default function Sitemap() {
  return (
    <>
      <section className={pageHero}>
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>Sitemap</span>
          <h1 className={cn(h1Page, 'mb-2')}>Site map</h1>
          <p className="mx-auto max-w-lg text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            RTO Sarthi — {TAGLINE}. All pages on this website.
          </p>
        </div>
      </section>

      <section className={section}>
        <div className={cn(container, 'mx-auto max-w-xl')}>
          <SectionHeading
            label="Pages"
            title="Browse all pages"
            description="For search engines: XML sitemap is available at /sitemap.xml"
          />
          <ul className="space-y-3">
            {pages.map((p) => (
              <li key={p.to}>
                <Link
                  to={p.to}
                  className={`${glassCard} block p-4 transition-colors hover:border-brand-300`}
                >
                  <span className="text-sm font-bold text-brand-900">{p.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{p.desc}</span>
                  <span className="mt-1 block text-[0.6875rem] text-brand-700">rtosarthi.com{p.to === '/' ? '' : p.to}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs text-slate-500">
            <a href="/sitemap.xml" className="font-medium text-brand-800 hover:underline">
              View XML sitemap for search engines
            </a>
          </p>
        </div>
      </section>
    </>
  )
}
