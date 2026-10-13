import { Link } from 'react-router-dom'
import SectionHeading from './SectionHeading'
import FeatureIcon from './FeatureIcon'
import Button from './Button'
import PageHero from './PageHero'
import { IconCheck, IconUsers } from './Icons'
import {
  container,
  section,
  glassCard,
  sectionMuted,
  bodyMuted,
  grid3,
  ctaBand,
  cn,
} from '../lib/styles'

const ctaGlow =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(250,86,8,0.2),transparent_45%)]'
const linkClass = 'font-semibold text-brand-800 hover:underline'

function CheckItem({ children }) {
  return (
    <li className="flex gap-1.5 text-sm text-slate-700 sm:text-base">
      <span className="mt-0.5 shrink-0 text-emerald-600 [&_svg]:h-3.5 [&_svg]:w-3.5">
        <IconCheck />
      </span>
      {children}
    </li>
  )
}

/**
 * Shared layout for SEO product landing pages. Sections render in order and
 * are skipped when their prop is not given; alternating backgrounds are automatic.
 */
export default function ProductLanding({
  hero,
  overview,
  steps,
  features,
  checklist,
  audiences,
  related,
  faq,
  cta,
}) {
  const blocks = []

  if (overview) {
    blocks.push(
      <div key="overview" id="overview">
        <SectionHeading label={overview.label || 'Overview'} title={overview.title} description={overview.description} />
        <div className="mx-auto max-w-3xl space-y-5">
          {hero.intro && <p className={cn(bodyMuted, 'font-medium text-slate-700')}>{hero.intro}</p>}
          {overview.paragraphs.map((p, i) => (
            <p key={i} className={bodyMuted}>
              {p}
            </p>
          ))}
        </div>
      </div>,
    )
  }

  if (steps) {
    blocks.push(
      <div key="steps" id="how-it-works">
        <SectionHeading label={steps.label || 'How it works'} title={steps.title} description={steps.description} />
        <div className={grid3}>
          {steps.items.map((item, i) => (
            <div key={item.title} className={cn(glassCard, 'p-6 text-center')}>
              <div className="flex justify-center">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className={bodyMuted}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>,
    )
  }

  if (features) {
    blocks.push(
      <div key="features" id="features">
        <SectionHeading label={features.label || 'Features'} title={features.title} description={features.description} />
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {features.items.map((item) => (
            <div key={item.title} className={cn(glassCard, 'flex gap-4 p-6')}>
              <FeatureIcon icon={item.icon} variant={item.variant} className="mb-0 shrink-0" />
              <div>
                <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className={bodyMuted}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>,
    )
  }

  if (checklist) {
    const list = (
      <div className={cn(glassCard, 'p-6')}>
        <h3 className="font-display mb-3 text-lg font-semibold text-slate-900">{checklist.listTitle}</h3>
        <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {checklist.items.map((item) => (
            <CheckItem key={item}>{item}</CheckItem>
          ))}
        </ul>
        {checklist.note && <p className="mt-3 text-sm text-slate-600 sm:text-sm">{checklist.note}</p>}
      </div>
    )
    blocks.push(
      <div key="checklist" id={checklist.id || 'details'}>
        <SectionHeading label={checklist.label} title={checklist.title} description={checklist.description} />
        {checklist.price ? (
          <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-[1fr_1.4fr] lg:gap-3.5">
            <div className={cn(glassCard, 'flex flex-col items-center justify-center p-6 text-center')}>
              <span className="text-sm font-semibold uppercase tracking-widest text-accent-600">
                {checklist.price.caption}
              </span>
              <span className="my-1 text-4xl font-bold tracking-tight text-brand-950 lg:text-5xl">
                {checklist.price.amount}
              </span>
              <p className={bodyMuted}>{checklist.price.text}</p>
              <Button href="/contact" variant="primary" className="mt-4">
                Get Started
              </Button>
            </div>
            {list}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">{list}</div>
        )}
      </div>,
    )
  }

  if (audiences) {
    blocks.push(
      <div key="audiences" id="who-is-it-for">
        <SectionHeading label="Who it is for" title={audiences.title} description={audiences.description} />
        <div className={grid3}>
          {audiences.items.map((a) => (
            <div key={a} className={cn(glassCard, 'flex items-center gap-2.5 p-4')}>
              <FeatureIcon icon={<IconUsers />} variant="brand" size="sm" className="mb-0" />
              <span className="text-sm font-medium text-slate-700 sm:text-base">{a}</span>
            </div>
          ))}
        </div>
        {related && (
          <p className="mt-5 text-center text-sm text-slate-600 sm:text-base">
            Related:{' '}
            {related.map((r, i) => (
              <span key={r.to}>
                {i > 0 && ' · '}
                <Link to={r.to} className={linkClass}>
                  {r.label}
                </Link>
              </span>
            ))}
            {' · '}
            <Link to="/features" className={linkClass}>
              All features
            </Link>
          </p>
        )}
      </div>,
    )
  }

  if (faq) {
    blocks.push(
      <div key="faq" id="faq">
        <SectionHeading label="FAQ" title={faq.title} description={faq.description} />
        <div className="mx-auto max-w-3xl space-y-5">
          {faq.items.map((f) => (
            <details key={f.q} className={cn(glassCard, 'group p-5')}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-base font-semibold text-slate-900">
                <h3 className="font-display text-lg font-semibold">{f.q}</h3>
                <span className="text-brand-700 transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className={cn(bodyMuted, 'mt-2')}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>,
    )
  }

  return (
    <>
      <PageHero title={hero.title}>
        <Button href="/contact" variant="primary" size="lg">
          Start Free Trial
        </Button>
        <Button href="/contact" variant="ghost" size="lg">
          Book Demo
        </Button>
      </PageHero>

      {blocks.map((block, i) => (
        <section key={block.key} className={cn(section, i % 2 === 0 ? 'bg-white' : sectionMuted)}>
          <div className={container}>{block}</div>
        </section>
      ))}

      <section className={section}>
        <div className={container}>
          <div className={ctaBand}>
            <div className={ctaGlow} aria-hidden />
            <div className="relative z-10">
              <h2 className="mb-3 font-display text-2xl font-bold text-white sm:text-3xl">{cta.title}</h2>
              <p className="mx-auto mb-6 max-w-xl text-base text-white/90 sm:text-lg">{cta.text}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button href="/contact" variant="secondary" size="lg">
                  Start Free Trial
                </Button>
                <Button href="/contact" variant="ghost" size="lg">
                  Book Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
