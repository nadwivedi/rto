import SectionHeading from '../components/SectionHeading'
import FeatureIcon from '../components/FeatureIcon'
import Button from '../components/Button'
import { IconWhatsApp, IconDocument, IconChart, IconShield } from '../components/Icons'
import {
  container,
  section,
  pageHero,
  sectionMuted,
  glassCard,
  labelOnDark,
  h1Page,
  h2Section,
  bodyMuted,
  ctaBand,
  grid3,
  cn,
} from '../lib/styles'

const highlights = [
  {
    icon: <IconDocument />,
    variant: 'brand',
    title: 'AI-powered automation',
    description:
      'Smart document entry and intelligent workflows reduce manual typing and help agents work faster with fewer mistakes.',
  },
  {
    icon: <IconWhatsApp />,
    variant: 'whatsapp',
    title: 'WhatsApp API integration',
    description:
      'Send expiry alerts, pending balance reminders, and client updates directly on WhatsApp — automatically and at scale.',
  },
  {
    icon: <IconChart />,
    variant: 'accent',
    title: 'Built for speed & simplicity',
    description:
      'Dashboards, bulk Excel uploads, and expiry tracking keep daily RTO desk work easy, simple, and fast.',
  },
]

const stats = [
  { n: '3+', l: 'Years serving RTO agents' },
  { n: 'AI', l: 'Smart document & workflow features' },
  { n: 'WA', l: 'WhatsApp API for client alerts' },
  { n: '#1', l: "India's best RTO agent software" },
]

export default function About() {
  return (
    <>
      <section className={pageHero}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(250,86,8,0.15),transparent_50%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>About RTO Sarthi</span>
          <h1 className={cn(h1Page, 'mb-2')}>India&apos;s Best RTO Agent Software</h1>
          <p className="mx-auto max-w-xl text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            Digitizing and simplifying the everyday work of RTO agents across India — trusted for
            over 3 years.
          </p>
        </div>
      </section>

      <section className={section}>
        <div className={container}>
          <div className="mx-auto max-w-3xl text-center">
            <SectionHeading
              label="What we do"
              title="Software made for RTO agents"
              description="RTO Sarthi is purpose-built software that helps RTO agents manage vehicles, clients, renewals, and payments in one place — replacing registers, scattered files, and endless follow-up calls."
            />
          </div>

          <div className="mx-auto mt-2 max-w-3xl space-y-4">
            <p className={cn(bodyMuted, 'text-center sm:text-left')}>
              In India, an RTO agent&apos;s desk handles tax, fitness, PUC, insurance, permits, transfers,
              and client balances every single day. RTO Sarthi digitizes that entire workflow so agents
              can serve more clients with less stress, fewer missed renewals, and a professional image
              in front of every vehicle owner.
            </p>
            <p className={cn(bodyMuted, 'text-center sm:text-left')}>
              For more than <strong className="text-brand-900">3 years</strong>, RTO Sarthi has grown
              with feedback from working agents — earning recognition as{' '}
              <strong className="text-brand-900">India&apos;s best RTO agent software</strong> for desks
              that want reliability, speed, and tools that actually match how RTO work happens on the ground.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-brand-100 bg-brand-50/90 px-3 py-4 text-center"
              >
                <strong className="block text-xl font-bold text-brand-800 sm:text-2xl">{s.n}</strong>
                <span className="mt-1 block text-[0.625rem] font-medium leading-snug text-slate-600 sm:text-xs">
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)}>
        <div className={container}>
          <SectionHeading
            label="Technology"
            title="AI & WhatsApp — work made easy"
            description="RTO Sarthi leverages modern AI features and the WhatsApp API so agents spend less time on repetitive tasks and more time serving clients."
          />
          <div className={grid3}>
            {highlights.map((item) => (
              <article key={item.title} className={`${glassCard} p-4`}>
                <FeatureIcon icon={item.icon} variant={item.variant} />
                <h3 className="mb-1.5 text-sm font-bold text-brand-950">{item.title}</h3>
                <p className={bodyMuted}>{item.description}</p>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
            From automated document capture to scheduled WhatsApp reminders for tax, PUC, insurance,
            permit expiry, and pending balances — RTO Sarthi is designed to make complex desk work{' '}
            <strong className="text-slate-700">easy, simple, and fast</strong>.
          </p>
        </div>
      </section>

      <section className={section}>
        <div className={cn(container, 'grid items-center gap-8 lg:grid-cols-2 lg:gap-10')}>
          <div>
            <h2 className={cn(h2Section, 'mb-3')}>Made by SoftwareBytes, Raipur</h2>
            <p className={cn(bodyMuted, 'mb-3')}>
              RTO Sarthi is designed, developed, and supported by{' '}
              <a
                href="https://softwarebytes.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-800 hover:text-accent-600 hover:underline"
              >
                SoftwareBytes
              </a>
              , a Raipur-based IT company in Chhattisgarh, India. The team builds practical business
              software for Indian enterprises — with deep focus on products that solve real local problems.
            </p>
            <p className={cn(bodyMuted, 'mb-3')}>
              SoftwareBytes works closely with RTO agents to understand forms, renewals, permits, client
              ledgers, and compliance cycles. That on-ground knowledge shapes every feature in RTO Sarthi —
              not generic software adapted from abroad.
            </p>
            <p className={bodyMuted}>
              When you choose RTO Sarthi, you partner with a product team in Raipur that offers hands-on
              support, understands your language, and is committed to helping your desk grow with technology.
            </p>
            <ul className="mt-4 space-y-2">
              {[
                'Raipur, Chhattisgarh, India',
                'RTOSarthi.com — full RTO Sarthi product suite',
                'Ongoing updates driven by agent feedback',
              ].map((line) => (
                <li key={line} className="flex items-center gap-2 text-xs text-slate-600 sm:text-sm">
                  <span className="shrink-0 text-brand-700 [&_svg]:h-4 [&_svg]:w-4">
                    <IconShield />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${glassCard} p-6 text-center lg:p-8`}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-accent-600 text-xl font-extrabold text-white shadow-lg">
              SB
            </div>
            <h3 className="mb-1 text-base font-bold text-brand-950">SoftwareBytes</h3>
            <p className="mb-1 text-sm font-medium text-accent-600">Raipur-based IT company</p>
            <p className="text-xs text-slate-500 sm:text-[0.8125rem]">
              Chhattisgarh, India · Web & business software
            </p>
            <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50/80 px-4 py-3">
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                <strong className="text-brand-900">RTO Sarthi</strong> is SoftwareBytes&apos; flagship
                product for the RTO agent community — built in India, for India.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={container}>
          <div className={ctaBand}>
            <h2 className="relative z-10 mb-2 text-lg font-bold text-white sm:text-xl">
              Ready to simplify your RTO desk?
            </h2>
            <p className="relative z-10 mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
              Join agents across India who trust RTO Sarthi. Start your free trial or talk to our team today.
            </p>
            <div className="relative z-10 flex flex-wrap justify-center gap-2">
              <Button href="/contact" variant="secondary" size="lg">
                Contact Us
              </Button>
              <Button href="/features" variant="ghost" size="lg">
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
