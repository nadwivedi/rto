import Button from '../components/Button'
import SectionHeading from '../components/SectionHeading'
import FeatureCard from '../components/FeatureCard'
import TestimonialCard from '../components/TestimonialCard'
import DashboardPreview from '../components/DashboardPreview'
import VideoEmbed from '../components/VideoEmbed'
import { coreFeatures } from '../data/features'
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
} from '../lib/styles'

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
            <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[1.75rem]">
              RTO Sarthi
            </h1>
            <p className="mb-4 text-sm font-semibold leading-snug text-accent-300 sm:text-base lg:text-lg">
              India&apos;s Best RTO Agent Software
            </p>
            <p className="mx-auto mb-5 max-w-sm text-xs leading-relaxed text-white/75 sm:max-w-md sm:text-sm lg:mx-0">
              One dashboard for documents, renewals, client balances, and WhatsApp alerts — built for
              Indian RTO agents.
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
          <SectionHeading
            label="Product demo"
            title="See RTO Sarthi in action"
            description="Watch how agents manage vehicles, send WhatsApp expiry alerts, and track renewals from one dashboard."
          />
          <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-5">
            <VideoEmbed />
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
          <SectionHeading
            label="Features"
            title="Everything your RTO desk needs"
            description="From document automation to WhatsApp alerts — one platform for agents, insurance partners, and PUC centers."
          />
          <div className={grid3}>
            {coreFeatures.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
          <p className="mt-6 text-center">
            <Button href="/features" variant="outline-dark">
              View all features
            </Button>
          </p>
        </div>
      </section>

      <section className={section}>
        <div className={container}>
          <SectionHeading
            label="Dashboard"
            title="See your entire operation at a glance"
            description="Expiry tracking, vehicle registers, and alert history — designed for how Indian RTO agents actually work."
          />
          <DashboardPreview />
        </div>
      </section>

      <section className={cn(section, sectionDark)}>
        <div className={container}>
          <SectionHeading
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

      <section className={cn(section, sectionMuted)}>
        <div className={container}>
          <SectionHeading
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
