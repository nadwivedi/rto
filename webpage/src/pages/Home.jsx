import { Link } from 'react-router-dom'
import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import FeatureCard from '../components/FeatureCard'
import TestimonialCard from '../components/TestimonialCard'
import DashboardPreview from '../components/DashboardPreview'
import VideoEmbed from '../components/VideoEmbed'
import { coreFeatures } from '../data/features'
import { SOLUTION_GROUPS } from '../data/solutions'
import { homeFaqs } from '../data/home'
import { LOOKUP_PRICE } from '../data/vehicleInfo'
import HeroHighlight from '../components/HeroHighlight'
import FeatureIcon from '../components/FeatureIcon'
import {
  IconWhatsApp,
  IconWallet,
  IconRenewal,
  IconExcel,
  IconShield,
  IconChart,
} from '../components/Icons'
import {
  container,
  section,
  heroSection,
  sectionMuted,
  sectionDark,
  glassCard,
  grid3,
  grid2,
  ctaBand,
  cn,
} from '../lib/homeStyles'

const heroHighlights = [
  { icon: <IconWallet />, label: 'Client pending balance', variant: 'accent' },
  { icon: <IconWhatsApp />, label: 'WhatsApp balance alerts', variant: 'whatsapp' },
  { icon: <IconRenewal />, label: 'Expiry reminders', variant: 'brand' },
]

const whyChoose = [
  {
    icon: <IconShield />,
    variant: 'brand',
    title: 'Built for Indian RTO Workflows',
    description:
      'Forms, permits, tax cycles, and state-specific processes — not a generic CRM adapted from abroad.',
  },
  {
    icon: <IconWhatsApp />,
    variant: 'whatsapp',
    title: 'WhatsApp-First Alerts',
    description:
      'Tax, PUC, insurance, permit, and pending balance reminders — sent on WhatsApp before clients miss a date.',
  },
  {
    icon: <IconChart />,
    variant: 'brand',
    title: 'Never Miss a Renewal',
    description:
      'Colour-coded expiry tracking and proactive alerts mean fewer penalties and happier vehicle owners.',
  },
  {
    icon: <IconWallet />,
    variant: 'accent',
    title: 'Pending Balance Control',
    description:
      'Track what each client owes, send automatic WhatsApp nudges, and keep your desk cash flow clear.',
  },
]

const testimonials = [
  {
    quote:
      'WhatsApp alerts alone saved our desk from dozens of missed PUC renewals. Clients appreciate the reminder before we even call.',
    name: 'Vikram Sahu',
    role: 'RTO Agent',
    location: 'Raipur',
  },
  {
    quote:
      'Bulk insurance upload through Excel changed our month-end process. What took two days now finishes in an afternoon.',
    name: 'Neha Agrawal',
    role: 'Insurance Agent',
    location: 'Bilaspur',
  },
  {
    quote:
      'The dashboard shows exactly what expires this week. My staff starts the day with a clear list — no more digging through registers.',
    name: 'Ramesh Patel',
    role: 'PUC Center Owner',
    location: 'Durg',
  },
]

export default function Home() {
  return (
    <>
      <section className={heroSection}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(250,86,8,0.18),transparent),radial-gradient(circle_at_90%_60%,rgba(17,76,171,0.25),transparent_40%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10 grid items-center gap-8 lg:grid-cols-2 lg:gap-10')}>
          <div className="animate-in text-center lg:text-left">
            <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[1.75rem]">
              RTO Sarthi
              <span className="mt-2 block text-sm font-semibold leading-snug tracking-normal text-accent-300 sm:text-base lg:text-lg">
                India&apos;s Best RTO Agent Software
              </span>
            </h1>
            <p className="mx-auto mb-5 max-w-sm text-xs leading-relaxed text-white/75 sm:max-w-md sm:text-sm lg:mx-0">
              One dashboard for documents, renewals, client balances, and WhatsApp alerts — built for
              Indian RTO agents. Explore our{' '}
              <Link to="/rto-management-software" className="font-semibold text-accent-300 underline underline-offset-2 hover:text-white">
                RTO management software
              </Link>
              .
            </p>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start">
              <Button href="/contact" variant="primary" size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
              <Button href="/contact" variant="ghost" size="lg" className="w-full sm:w-auto">
                Book Demo
              </Button>
            </div>
            <div className="mx-auto grid max-w-sm gap-2 sm:max-w-none sm:grid-cols-1 lg:mx-0">
              {heroHighlights.map((item) => (
                <HeroHighlight key={item.label} {...item} />
              ))}
            </div>
          </div>
          <div className="relative hidden animate-in animate-delay-2 lg:block">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className={cn(section, 'relative bg-white')} id="demo-video">
        <div className={cn(container, 'relative z-10')}>
          <SectionHeading compact
            label="Product demo"
            title="See RTO Sarthi in action"
            description="Watch how agents manage vehicles, send WhatsApp expiry alerts, and track renewals from one dashboard."
          />
          <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-5">
            <VideoEmbed compact />
            <ul className={cn(glassCard, 'flex flex-col gap-3 p-4')}>
              {[
                { text: 'Dashboard & expiry tracking', icon: <IconChart />, variant: 'brand' },
                { text: 'WhatsApp alerts for Tax, PUC, Insurance & Permit', icon: <IconWhatsApp />, variant: 'whatsapp' },
                { text: 'Bulk Excel upload for PUC & insurance', icon: <IconExcel />, variant: 'success' },
                { text: 'Pending balance on WhatsApp', icon: <IconWallet />, variant: 'accent' },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-2.5 text-xs text-slate-600 sm:text-[0.8125rem]">
                  <FeatureIcon icon={item.icon} variant={item.variant} size="sm" className="mb-0" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="features-preview">
        <div className={container}>
          <SectionHeading compact
            label="Features"
            title="RTO Sarthi features: everything your RTO desk needs"
            description="WhatsApp expiry alerts, vehicle search, lead management, client balances and more. One platform for RTO agents, PUC centres, insurance agents and driving schools."
          />
          <div className={grid3}>
            {coreFeatures.map((f) => (
              <FeatureCard key={f.title} {...f} compact />
            ))}
          </div>
          <p className="mt-6 text-center">
            <Button href="/features" variant="outline-dark">
              See all RTO Sarthi features in detail
            </Button>
          </p>
        </div>
      </section>

      <section className={section} id="solutions">
        <div className={container}>
          <SectionHeading compact
            label="Solutions"
            title="Software for every RTO and vehicle business"
            description="RTO agents, PUC centres, driving schools and businesses that need vehicle data all run on RTO Sarthi."
          />
          <div className={grid3}>
            {SOLUTION_GROUPS.map((g) => (
              <div key={g.key} className={cn(glassCard, 'p-4')}>
                <h3 className="text-sm font-semibold text-brand-950 sm:text-base">
                  <Link to={g.items[0].to} className="hover:text-brand-700">
                    {g.title}
                  </Link>
                </h3>
                <p className="mt-0.5 mb-2.5 text-xs leading-relaxed text-slate-500 sm:text-[0.8125rem]">{g.description}</p>
                <ul className="space-y-1.5">
                  {g.items.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} className="text-xs font-medium text-brand-800 hover:text-accent-600 hover:underline sm:text-[0.8125rem]">
                        {item.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={container}>
          <SectionHeading compact
            label="Dashboard"
            title="See your entire operation at a glance"
            description="Expiry tracking, vehicle registers, and alert history — designed for how Indian RTO agents actually work."
          />
          <DashboardPreview />
        </div>
      </section>

      <section className={cn(section, sectionDark)}>
        <div className={container}>
          <SectionHeading compact
            label="Why RTO Sarthi"
            title="Why agents choose us"
            description="Premium software shouldn't mean complicated. RTO Sarthi is fast to learn and hard to outgrow."
            dark
          />
          <div className={grid2}>
            {whyChoose.map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-brand-700/[0.08] p-3.5 shadow-[0_6px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-accent-500/35 lg:p-4"
              >
                <FeatureIcon icon={item.icon} variant={item.variant} className="mb-0" />
                <div>
                  <h3 className="mb-0.5 text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400 sm:text-[0.8125rem]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(section, 'bg-white')} id="what-is-rto-agent-software">
        <div className={cn(container, 'max-w-3xl')}>
          <SectionHeading compact
            label="About RTO Sarthi"
            title="What is RTO agent software?"
            description="Why RTO agents across India are moving from registers to software."
          />
          <div className="space-y-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
            <p>
              <strong className="text-slate-800">RTO agent software</strong> is software that keeps every
              vehicle, client and document of an RTO desk in one place and tells the agent what is expiring
              before it expires. An RTO agent handles hundreds of vehicles, and every vehicle has dates that
              matter: road tax, fitness, permit, PUC and insurance. In a paper register or Excel sheet these
              dates are easy to miss, and a missed renewal means a penalty for the vehicle owner and lost work
              for the agent.
            </p>
            <p>
              <strong className="text-slate-800">RTO Sarthi</strong> is complete{' '}
              <Link to="/rto-management-software" className="font-semibold text-brand-800 hover:underline">RTO management software</Link>{' '}
              made for Indian RTO desks. It sends{' '}
              <Link to="/vehicle-document-expiry-reminder-software" className="font-semibold text-brand-800 hover:underline">automatic WhatsApp expiry reminders</Link>{' '}
              for tax, fitness, permit, PUC and insurance, tracks each client&apos;s pending balance, and keeps
              your customers in a simple{' '}
              <Link to="/rto-agent-crm-software" className="font-semibold text-brand-800 hover:underline">RTO agent CRM</Link>{' '}
              with{' '}
              <Link to="/rto-agent-lead-management-software" className="font-semibold text-brand-800 hover:underline">lead follow-ups</Link>{' '}
              for new work. For offices with many staff, it is the{' '}
              <Link to="/best-rto-office-software" className="font-semibold text-brand-800 hover:underline">best RTO office software</Link>{' '}
              with a login for every desk.
            </p>
            <p>
              Need vehicle details? The built-in{' '}
              <Link to="/vehicle-information-software" className="font-semibold text-brand-800 hover:underline">vehicle information software</Link>{' '}
              lets you{' '}
              <Link to="/rc-download-software" className="font-semibold text-brand-800 hover:underline">download RC</Link>{' '}
              and{' '}
              <Link to="/rc-verification-software" className="font-semibold text-brand-800 hover:underline">verify RC</Link>{' '}
              of any vehicle at just {LOOKUP_PRICE} per search, and businesses can get the same data in their own
              software through our{' '}
              <Link to="/vehicle-information-api" className="font-semibold text-brand-800 hover:underline">vehicle information API</Link>{' '}
              (a{' '}
              <Link to="/vahan-api" className="font-semibold text-brand-800 hover:underline">Vahan API for vehicle details</Link>), the{' '}
              <Link to="/api-for-vehicle-details" className="font-semibold text-brand-800 hover:underline">API for getting vehicle details</Link>{' '}
              by vehicle number, including a{' '}
              <Link to="/vehicle-make-and-model-api" className="font-semibold text-brand-800 hover:underline">vehicle make and model API</Link>.
            </p>
            <p>
              RTO Sarthi is also used by{' '}
              <Link to="/puc-agent-software" className="font-semibold text-brand-800 hover:underline">PUC centres</Link>{' '}
              for bulk PUC uploads and reminders, and by driving schools as{' '}
              <Link to="/driving-school-software" className="font-semibold text-brand-800 hover:underline">driving school software</Link>{' '}
              for admissions, fees and{' '}
              <Link to="/driving-licence-software" className="font-semibold text-brand-800 hover:underline">driving licence</Link>{' '}
              work, from{' '}
              <Link to="/learning-licence-software" className="font-semibold text-brand-800 hover:underline">learning licence</Link>{' '}
              to permanent DL. As{' '}
              <Link to="/cloud-rto-software" className="font-semibold text-brand-800 hover:underline">cloud RTO software</Link>,
              RTO Sarthi works on Android, iPhone, Windows and any web browser as an{' '}
              <Link to="/rto-agent-app" className="font-semibold text-brand-800 hover:underline">RTO agent app</Link>, and you can{' '}
              <Link to="/rto-agent-software-free-download" className="font-semibold text-brand-800 hover:underline">try RTO Sarthi free</Link>{' '}
              today.
            </p>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)}>
        <div className={container}>
          <SectionHeading compact
            label="Testimonials"
            title="Loved by agents across the region"
            description="Real feedback from RTO agents, insurance partners, and PUC centers using RTO Sarthi daily."
          />
          <div className={grid3}>
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      <section className={cn(section, 'bg-white')} id="faq">
        <div className={cn(container, 'max-w-3xl')}>
          <SectionHeading compact
            label="FAQ"
            title="RTO agent software: frequently asked questions"
            description="Quick answers about RTO Sarthi."
          />
          <div className="space-y-2.5">
            {homeFaqs.map((f) => (
              <details key={f.q} className={cn(glassCard, 'group p-4')}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-brand-950 sm:text-base">{f.q}</h3>
                  <span className="text-brand-700 transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={container}>
          <div className={ctaBand}>
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(250,86,8,0.2),transparent_45%)]"
              aria-hidden
            />
            <div className="relative z-10">
              <h2 className="mb-2 text-lg font-bold text-white sm:text-xl lg:text-[1.35rem]">
                Ready to digitize your RTO workflow?
              </h2>
              <p className="mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
                Join agents who save time, reduce missed renewals, and deliver better service with
                RTO Sarthi. Start your free trial or book a personalised demo today.
              </p>
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
