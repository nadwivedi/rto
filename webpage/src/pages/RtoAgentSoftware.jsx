import SectionHeading from '../components/SectionHeading'
import FeatureIcon from '../components/FeatureIcon'
import Button from '../components/Button'
import TestimonialCard from '../components/TestimonialCard'
import { IconDocument, IconWhatsApp, IconExcel, IconUsers, IconChart, IconWallet, IconUpload, IconBell, IconCar } from '../components/Icons'
import {
  container,
  section,
  pageHero,
  sectionMuted,
  grid3,
  grid2,
  ctaBand,
  glassCard,
  labelOnDark,
  h1Page,
  bodyMuted,
  cn,
} from '../lib/styles'

const reasons = [
  {
    icon: <IconDocument />,
    variant: 'brand',
    title: 'Rich AI Features — Smarter Document Entry',
    description:
      'Upload RC, insurance papers, or permit copies and RTO Sarthi AI auto-fills vehicle and owner details instantly. OCR-powered data extraction means no manual typing, fewer errors, and faster registrations.',
  },
  {
    icon: <IconWhatsApp />,
    variant: 'whatsapp',
    title: 'Fully Automated WhatsApp Alerts',
    description:
      'Tax, Fitness, PUC, Insurance, and Permit expiry reminders sent automatically to clients on WhatsApp. Also send pending balance alerts — all without you lifting a finger. Saves hours of phone call follow-ups every week.',
  },
  {
    icon: <IconExcel />,
    variant: 'success',
    title: 'Bulk Excel Upload — Save Days of Work',
    description:
      'Import hundreds of PUC or Insurance records in one go using standardized templates. What used to take days of manual entry now finishes in minutes. Validation checks ensure clean data every time.',
  },
  {
    icon: <IconWallet />,
    variant: 'accent',
    title: 'Automated Pending Balance Alerts',
    description:
      'Track what each client owes and send automatic WhatsApp payment nudges. No more manually checking ledgers and making reminder calls — the system does it for you. Keep your desk cash flow clear and organised.',
  },
  {
    icon: <IconChart />,
    variant: 'brand',
    title: 'Smart Dashboard & Expiry Tracking',
    description:
      'See what expires this week, track renewal history, and monitor alert delivery at a glance. Colour-coded dashboard designed for busy RTO agents — plan your day in seconds, not hours.',
  },
  {
    icon: <IconUsers />,
    variant: 'violet',
    title: 'Dedicated Employee Panel with Limited Access',
    description:
      'Create separate logins for your staff with role-based permissions. Control what each employee can see and do — limit data access, restrict actions, and track activity. Perfect for delegating work securely.',
  },
]

const whoCanUse = [
  {
    icon: <IconCar />,
    variant: 'brand',
    title: 'RTO Agents',
    description:
      'Manage vehicle registrations, transfers, NOC, permits, tax, and fitness — all paperwork digitized with AI assistance and WhatsApp alerts.',
  },
  {
    icon: <IconUpload />,
    variant: 'success',
    title: 'PUC Centers',
    description:
      'Bulk upload PUC certificates, auto-extract from PDFs, and send automatic WhatsApp reminders to customers before PUC expiry.',
  },
  {
    icon: <IconBell />,
    variant: 'whatsapp',
    title: 'Insurance Agents',
    description:
      'Track insurance policies, upload via Excel, manage renewals, and send expiry alerts — all from the same platform as your RTO work.',
  },
]

const testimonials = [
  {
    quote:
      'RTO Sarthi has completely changed how I run my desk. Document entry is faster, WhatsApp alerts save me hours of calls, and the dashboard tells me exactly what needs attention. Best RTO software I have used.',
    name: 'Rajesh Tiwari',
    role: 'RTO Agent',
    location: 'Raipur',
  },
  {
    quote:
      'I manage both a PUC center and insurance policies. RTO Sarthi handles all three in one place — PUC, RTO, and insurance. The bulk Excel upload alone saves me days every month.',
    name: 'Sandeep Yadav',
    role: 'PUC Center & Insurance Agent',
    location: 'Bhilai',
  },
  {
    quote:
      'The employee panel is perfect for my team. I can give my staff limited access — they only see what they need and cannot modify critical data. Pending balance alerts on WhatsApp have reduced my follow-up calls to zero. RTO Sarthi saves me at least 2 hours every single day.',
    name: 'Anita Patel',
    role: 'RTO & Insurance Agent',
    location: 'Durg',
  },
]

export default function RtoAgentSoftware() {
  return (
    <>
      <section className={pageHero}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(250,86,8,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(17,76,171,0.2),transparent_45%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>RTO Sarthi — RTO Agent Software</span>
          <h1 className={cn(h1Page, 'mb-2')}>India&apos;s Best RTO Agent Software — RTO Sarthi</h1>
          <p className="mx-auto max-w-lg text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            RTO Sarthi is the complete software for RTO agents in India. Rich AI features for document
            entry, fully automated WhatsApp alerts for expiry and pending balance, bulk Excel upload,
            dedicated employee panel with limited access, and smart dashboard — all built for Indian
            RTO workflows. Save hours of manual work every day.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['AI Features', 'WhatsApp Alerts', 'Employee Panel', 'Saves Hours Daily'].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[0.625rem] font-medium sm:text-[0.6875rem]"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={container}>
          <SectionHeading
            label="Why RTO Sarthi"
            title="Why RTO Sarthi is India&apos;s Best RTO Agent Software"
            description="Built specifically for Indian RTO agents — not a generic CRM adapted from abroad. Here is what makes RTO Sarthi the #1 choice."
          />
          <div className={grid2}>
            {reasons.map((item) => (
              <div
                key={item.title}
                className={`${glassCard} flex gap-3 p-4`}
              >
                <FeatureIcon icon={item.icon} variant={item.variant} className="mb-0 shrink-0" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className={bodyMuted}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)}>
        <div className={container}>
          <SectionHeading
            label="Who it is for"
            title="Complete Solution for RTO, PUC &amp; Insurance Agents"
            description="RTO Sarthi is not just for RTO agents. PUC centers and insurance partners get tailored tools while sharing the same vehicle database."
          />
          <div className={grid3}>
            {whoCanUse.map((item) => (
              <div
                key={item.title}
                className={`${glassCard} flex flex-col items-center p-5 text-center`}
              >
                <FeatureIcon icon={item.icon} variant={item.variant} className="mb-3" />
                <h3 className="mb-1 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className={bodyMuted}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={container}>
          <SectionHeading
            label="Testimonials"
            title="What RTO Agents Say About RTO Sarthi"
            description="Real feedback from RTO agents, PUC centers, and insurance partners using RTO Sarthi daily."
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
                Ready to switch to India&apos;s best RTO agent software?
              </h2>
              <p className="mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
                Join hundreds of RTO agents, PUC centers, and insurance partners who trust RTO Sarthi
                to manage their work. Start your free trial or book a demo today.
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
