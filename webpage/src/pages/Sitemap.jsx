import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'
import PageHero from '../components/PageHero'
import {
  container,
  section,
  glassCard,
  cn,
} from '../lib/styles'
import { TAGLINE } from '../config/seo'
import { SOLUTION_GROUPS } from '../data/solutions'

const mainPages = [
  { to: '/', label: 'Home', desc: 'RTO Sarthi: RTO agent software overview, solutions, demo video & FAQ' },
  { to: '/features', label: 'Features', desc: 'AI, WhatsApp alerts, bulk upload, dashboard & more' },
  { to: '/blog', label: 'Blog', desc: 'Guides for RTO agents, driving schools and vehicle owners' },
  { to: '/about', label: 'About', desc: 'About RTO Sarthi and SoftwareBytes, Raipur' },
  { to: '/contact', label: 'Contact', desc: 'Phone, WhatsApp, email and office details' },
]

const sections = [{ key: 'main', title: 'RTO Sarthi', items: mainPages }, ...SOLUTION_GROUPS]

export default function Sitemap() {
  return (
    <>
      <PageHero title="Site map" subtitle={<>RTO Sarthi — {TAGLINE}. All pages on this website.</>} />

      <section className={section}>
        <div className={cn(container, 'mx-auto max-w-xl')}>
          <SectionHeading
            label="Pages"
            title="Browse all pages"
            description="For search engines: XML sitemap is available at /sitemap.xml"
          />
          {sections.map((group) => (
            <div key={group.key} className="mb-8">
              <h2 className="font-display mb-3 text-lg font-bold text-slate-900">{group.title}</h2>
              <ul className="space-y-3">
                {group.items.map((p) => (
                  <li key={p.to}>
                    <Link
                      to={p.to}
                      className={`${glassCard} block p-6 transition-colors hover:border-brand-300`}
                    >
                      <span className="text-base font-bold text-brand-900">{p.label}</span>
                      <span className="mt-1 block text-sm text-slate-600">{p.desc}</span>
                      <span className="mt-1 block text-sm text-brand-700">rtosarthi.com{p.to === '/' ? '' : p.to}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="mt-6 text-center text-sm text-slate-600">
            <a href="/sitemap.xml" className="font-medium text-brand-800 hover:underline">
              View XML sitemap for search engines
            </a>
          </p>
        </div>
      </section>
    </>
  )
}
