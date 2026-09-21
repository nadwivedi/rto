import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'
import FeatureIcon from '../components/FeatureIcon'
import Button from '../components/Button'
import VideoEmbed from '../components/VideoEmbed'
import {
  IconDocument,
  IconWhatsApp,
  IconWallet,
  IconExcel,
  IconRenewal,
  IconChart,
  IconUsers,
  IconShield,
  IconCheck,
  IconCar,
} from '../components/Icons'
import { rtoManagementFaqs } from '../data/rtoManagement'
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

const features = [
  {
    icon: <IconDocument />,
    variant: 'brand',
    title: 'Vehicle & Document Management',
    description:
      'Store RC, insurance, permit and fitness records for every vehicle. AI document entry reads the paper and fills in vehicle and owner details for you.',
  },
  {
    icon: <IconRenewal />,
    variant: 'brand',
    title: 'Tax, Fitness, Permit & PUC Expiry Tracking',
    description:
      'Colour-coded expiry tracking shows what is due this week and this month, so no renewal is missed and no client pays a penalty.',
  },
  {
    icon: <IconWhatsApp />,
    variant: 'whatsapp',
    title: 'WhatsApp Alerts for Clients',
    description:
      'Automatic WhatsApp reminders before tax, PUC, insurance and permit expiry. Clients get notified, you make fewer phone calls.',
  },
  {
    icon: <IconWallet />,
    variant: 'accent',
    title: 'Client Pending Balance',
    description:
      'See exactly what every client owes and send balance reminders on WhatsApp. Keep your RTO desk cash flow clear.',
  },
  {
    icon: <IconExcel />,
    variant: 'success',
    title: 'Bulk Excel Upload',
    description:
      'Move from registers and spreadsheets in an afternoon. Bulk upload vehicles, PUC and insurance records from Excel.',
  },
  {
    icon: <IconUsers />,
    variant: 'brand',
    title: 'Driving Licence Record Management',
    description:
      'Keep every client’s driving licence record in one place: learner licence, permanent DL, renewal and endorsement work, with expiry dates and status you can search in seconds.',
  },
  {
    icon: <IconCar />,
    variant: 'accent',
    title: 'Vehicle Transfer Record Management',
    description:
      'Track every vehicle ownership transfer from application to completion. Store buyer and seller details, transfer documents, fees and status so no file is lost or delayed.',
  },
  {
    icon: <IconChart />,
    variant: 'brand',
    title: 'Dashboard & Reports',
    description:
      'One dashboard for expiries, registers, alert history and client balances, built for how Indian RTO agents actually work.',
  },
]

const audiences = [
  'RTO agents and consultants',
  'Vehicle dealers and showrooms',
  'PUC centers',
  'Insurance agents',
  'Transport and fleet operators',
  'Multi-agent RTO offices',
]

const problems = [
  { problem: 'Paper registers and Excel sheets', fix: 'One searchable digital database' },
  { problem: 'Missed tax, PUC and insurance renewals', fix: 'Expiry tracking with WhatsApp alerts' },
  { problem: 'Calling every client for reminders', fix: 'Automatic WhatsApp reminders' },
  { problem: 'Unclear client dues', fix: 'Pending balance tracking per client' },
  { problem: 'Driving licence and transfer files scattered in folders', fix: 'Driving licence and vehicle transfer records in one place' },
  { problem: 'Slow manual data entry', fix: 'AI document entry and bulk Excel upload' },
]

export default function RtoManagementSoftware() {
  return (
    <>
      <section className={pageHero}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(250,86,8,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(17,76,171,0.2),transparent_45%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>RTO Sarthi — RTO Management Software</span>
          <h1 className={cn(h1Page, 'mb-2')}>
            RTO Management Software in India — Manage Vehicles, Renewals &amp; Clients in One Place
          </h1>
          <p className="mx-auto max-w-xl text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            RTO Sarthi is RTO management software built for Indian RTO agents, dealers and PUC
            centers. Manage vehicle, driving licence and vehicle transfer records, track tax,
            fitness, permit, PUC and insurance expiry, send WhatsApp alerts and control client
            balances from one dashboard.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button href="/contact" variant="primary" size="lg">
              Start Free Trial
            </Button>
            <Button href="/contact" variant="ghost" size="lg">
              Book Demo
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['Expiry Tracking', 'Driving Licence Records', 'Vehicle Transfer Records', 'WhatsApp Alerts', 'AI Document Entry', 'Client Balance'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[0.625rem] font-medium sm:text-[0.6875rem]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(section, 'bg-white')} id="what-is-rto-management-software">
        <div className={container}>
          <SectionHeading
            label="Overview"
            title="What is RTO management software?"
            description="RTO management software is a digital system for handling vehicle registration, transfer, tax, fitness, permit, PUC and insurance work."
          />
          <div className="mx-auto max-w-3xl space-y-3">
            <p className={bodyMuted}>
              An RTO agent handles hundreds of vehicles, and every vehicle has several dates that
              matter: road tax, fitness, permit, PUC and insurance. Keeping these in paper registers
              or Excel sheets leads to missed renewals, penalties and unhappy clients.
            </p>
            <p className={bodyMuted}>
              Good <strong className="text-slate-700">RTO management software</strong> puts every
              vehicle, document, expiry date and client payment in one searchable system, and warns
              you and your clients before a deadline is missed. RTO Sarthi does this with WhatsApp
              alerts, AI document entry and a simple dashboard, made for Indian RTO workflows.
            </p>
            <p className={bodyMuted}>
              An <strong className="text-slate-700">RTO agent</strong> also handles{' '}
              <strong className="text-slate-700">driving licence</strong> and{' '}
              <strong className="text-slate-700">vehicle transfer</strong> work every day. With RTO
              Sarthi you can manage driving licence records (learner, permanent and renewal) and
              vehicle transfer records (ownership change, documents, fees and status) next to your
              vehicle data, so every client file is complete and easy to find.
            </p>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="demo-video">
        <div className={container}>
          <SectionHeading
            label="Product demo"
            title="RTO management software demo video"
            description="Watch how RTO Sarthi manages vehicles, sends WhatsApp expiry alerts and tracks renewals from one dashboard."
          />
          <div className="mx-auto max-w-3xl">
            <VideoEmbed title="RTO management software demo — RTO Sarthi" />
          </div>
        </div>
      </section>

      <section className={section} id="features">
        <div className={container}>
          <SectionHeading
            label="Features"
            title="Key features of RTO Sarthi RTO management software"
            description="Everything an RTO desk needs, from document entry to WhatsApp alerts."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:gap-3.5">
            {features.map((item) => (
              <div key={item.title} className={`${glassCard} flex gap-3 p-4`}>
                <FeatureIcon icon={item.icon} variant={item.variant} className="mb-0 shrink-0" />
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className={bodyMuted}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-slate-500 sm:text-sm">
            See the full list on our{' '}
            <Link to="/features" className="font-semibold text-brand-800 hover:underline">
              RTO software features
            </Link>{' '}
            page.
          </p>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="why-rto-management-software">
        <div className={container}>
          <SectionHeading
            label="Why switch"
            title="Why RTO agents need RTO management software"
            description="Replace manual work with a system that reminds you before problems happen."
          />
          <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-brand-100 bg-white">
            <div className="grid grid-cols-2 bg-brand-950 px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-white">
              <span>Without software</span>
              <span>With RTO Sarthi</span>
            </div>
            {problems.map((row) => (
              <div
                key={row.problem}
                className="grid grid-cols-2 gap-3 border-t border-slate-100 px-4 py-3 text-xs sm:text-[0.8125rem]"
              >
                <span className="text-slate-500">{row.problem}</span>
                <span className="flex gap-1.5 font-medium text-slate-800">
                  <span className="mt-0.5 shrink-0 text-emerald-600 [&_svg]:h-3.5 [&_svg]:w-3.5">
                    <IconCheck />
                  </span>
                  {row.fix}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={section} id="who-is-it-for">
        <div className={container}>
          <SectionHeading
            label="Who it is for"
            title="Who should use RTO management software?"
            description="RTO Sarthi fits anyone whose business depends on vehicle documents and renewal dates."
          />
          <div className={grid3}>
            {audiences.map((a) => (
              <div key={a} className={`${glassCard} flex items-center gap-2.5 p-3.5`}>
                <FeatureIcon icon={<IconUsers />} variant="brand" size="sm" className="mb-0" />
                <span className="text-xs font-medium text-slate-700 sm:text-[0.8125rem]">{a}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-slate-500 sm:text-sm">
            Running a PUC center? See our{' '}
            <Link to="/puc-agent-software" className="font-semibold text-brand-800 hover:underline">
              PUC agent software
            </Link>
            .
          </p>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="faq">
        <div className={container}>
          <SectionHeading
            label="FAQ"
            title="RTO management software — frequently asked questions"
            description="Quick answers about choosing and using RTO management software in India."
          />
          <div className="mx-auto max-w-3xl space-y-2.5">
            {rtoManagementFaqs.map((f) => (
              <details key={f.q} className={`${glassCard} group p-4`}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-slate-900">
                  <h3 className="text-sm font-semibold">{f.q}</h3>
                  <span className="text-brand-700 transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className={cn(bodyMuted, 'mt-2')}>{f.a}</p>
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
              <div className="mb-2 flex justify-center text-white/90 [&_svg]:h-6 [&_svg]:w-6">
                <IconShield />
              </div>
              <h2 className="mb-2 text-lg font-bold text-white sm:text-xl lg:text-[1.35rem]">
                Ready to try RTO management software built for India?
              </h2>
              <p className="mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
                Start your free trial or book a personalised demo of RTO Sarthi today.
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
