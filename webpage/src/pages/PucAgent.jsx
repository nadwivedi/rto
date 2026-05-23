import SectionHeading from '../components/SectionHeading'
import FeatureIcon from '../components/FeatureIcon'
import Button from '../components/Button'
import TestimonialCard from '../components/TestimonialCard'
import { IconExcel, IconWhatsApp, IconUpload, IconChart, IconCar } from '../components/Icons'
import {
  container,
  section,
  pageHero,
  sectionMuted,
  grid3,
  ctaBand,
  glassCard,
  labelOnDark,
  h1Page,
  bodyMuted,
  cn,
} from '../lib/styles'

const benefits = [
  {
    icon: <IconExcel />,
    variant: 'success',
    title: 'Bulk Excel Upload & PDF Auto-Entry',
    description:
      'Upload hundreds of PUC certificates at once via Excel, or just drop a PDF — RTO Sarthi extracts vehicle number, expiry date, and owner details automatically. No manual typing.',
  },
  {
    icon: <IconWhatsApp />,
    variant: 'whatsapp',
    title: 'Auto WhatsApp PUC Reminders',
    description:
      'Never miss a PUC renewal. RTO Sarthi sends professional WhatsApp alerts to customers before expiry. Builds trust, cuts phone calls, and brings them back to you.',
  },
  {
    icon: <IconChart />,
    variant: 'brand',
    title: 'PUC + RTO + Insurance — One Dashboard',
    description:
      'Many PUC agents also do RTO work and insurance. RTO Sarthi is the complete solution — manage PUC renewals, RTO registrations, insurance policies, and client balances from a single dashboard.',
  },
  {
    icon: <IconCar />,
    variant: 'accent',
    title: 'Built for Indian PUC Centers',
    description:
      'Not a generic CRM. RTO Sarthi is purpose-built for Indian RTO, PUC, and insurance workflows — vehicle numbers, date formats, state-specific processes, and multi-agent support included.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Upload Your Data',
    description:
      'Download the Excel template, fill in your PUC records, and upload. Or simply drop PUC PDFs and let the system extract everything automatically.',
  },
  {
    step: '02',
    title: 'Set Up WhatsApp Reminders',
    description:
      'Configure when reminders should go out before PUC expiry. Customers receive automatic WhatsApp alerts — no manual follow-ups.',
  },
  {
    step: '03',
    title: 'Manage & Grow with RTO Sarthi',
    description:
      'Track all expiries on your dashboard. Since RTO Sarthi is a complete RTO agent solution, you can also manage RTO work, insurance, client balances, and renewals from the same platform.',
  },
]

const testimonials = [
  {
    quote:
      'WhatsApp alerts alone saved our desk from dozens of missed PUC renewals. Clients appreciate the reminder before we even call.',
    name: 'Vikram Sahu',
    role: 'RTO Agent & PUC Center Owner',
    location: 'Raipur',
  },
  {
    quote:
      'Bulk PUC upload through Excel changed our month-end process. What took two days now finishes in an afternoon.',
    name: 'Neha Agrawal',
    role: 'Insurance & PUC Agent',
    location: 'Bilaspur',
  },
  {
    quote:
      'The dashboard shows exactly what PUC expires this week. My staff starts the day with a clear list — no more digging through registers.',
    name: 'Ramesh Patel',
    role: 'PUC Center Owner',
    location: 'Durg',
  },
]

export default function PucAgent() {
  return (
    <>
      <section className={pageHero}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(250,86,8,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(17,76,171,0.2),transparent_45%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>RTO Sarthi — PUC Agent Software</span>
          <h1 className={cn(h1Page, 'mb-2')}>PUC Agent Software by RTO Sarthi — India&apos;s Best Complete Solution for RTO, PUC &amp; Insurance Agents</h1>
          <p className="mx-auto max-w-lg text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            RTO Sarthi is the all-in-one software for RTO agents, PUC centers, and insurance partners.
            Bulk upload PUC data via Excel, auto-extract from PDFs, send WhatsApp reminders, and manage
            everything — RTO, PUC &amp; insurance — from one dashboard.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['Excel Bulk Upload', 'PDF Auto-Entry', 'WhatsApp Reminders', 'PUC + RTO + Insurance'].map(
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
            label="Why PUC agents love RTO Sarthi"
            title="Why PUC Agents Choose RTO Sarthi"
            description="RTO Sarthi is the complete platform for RTO agents, PUC centers, and insurance partners. Here is what makes it the best choice for your PUC center."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:gap-3.5">
            {benefits.map((item) => (
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
            label="How it works"
            title="Three Simple Steps"
            description="Get your PUC center online with RTO Sarthi in minutes."
          />
          <div className={grid3}>
            {steps.map((item) => (
              <div
                key={item.step}
                className={`${glassCard} text-center`}
              >
                <div className="flex justify-center">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                    {item.step}
                  </span>
                </div>
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
            title="What PUC Agents Say"
            description="Real feedback from PUC center owners using RTO Sarthi daily."
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
                Ready to digitize your business with RTO Sarthi?
              </h2>
              <p className="mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
                RTO Sarthi is the complete software for RTO agents, PUC centers, and insurance partners.
                Join agents who save time with bulk uploads, automated WhatsApp reminders, and
                one dashboard for all their work.
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
