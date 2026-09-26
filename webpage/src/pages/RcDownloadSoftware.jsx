import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'
import FeatureIcon from '../components/FeatureIcon'
import Button from '../components/Button'
import {
  IconDocument,
  IconCar,
  IconCheck,
  IconClock,
  IconWhatsApp,
  IconChart,
  IconUsers,
  IconShield,
  IconWallet,
} from '../components/Icons'
import { rcDownloadFaqs } from '../data/rcDownload'
import { LOOKUP_PRICE } from '../data/vehicleInfo'
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

const steps = [
  {
    step: '01',
    title: 'Enter vehicle number',
    description: 'Open Vehicle Details (RC Lookup) in RTO Sarthi and type any vehicle number, like MH12AB1234.',
  },
  {
    step: '02',
    title: 'See complete details',
    description: 'Owner, chassis, engine, class, model, tax, fitness, PUC and insurance appear in seconds.',
  },
  {
    step: '03',
    title: 'Download RC PDF',
    description: 'Click Download RC PDF to save the RC. Print it, file it or share it on WhatsApp.',
  },
]

const features = [
  {
    icon: <IconDocument />,
    variant: 'brand',
    title: 'RC in smart card style',
    description:
      'The RC PDF shows the front and back of the RC smart card with state header, registration details and a QR code, just like the card your client knows.',
  },
  {
    icon: <IconCar />,
    variant: 'accent',
    title: 'Any vehicle, any state',
    description:
      'Download RC of any car, bike, truck, bus or tractor registered in any Indian state or union territory.',
  },
  {
    icon: <IconWallet />,
    variant: 'success',
    title: `Just ${LOOKUP_PRICE} per vehicle`,
    description:
      'Pay only for the vehicles you search. No monthly RC download limit and no charge for each field.',
  },
  {
    icon: <IconClock />,
    variant: 'brand',
    title: 'Free re-download from history',
    description:
      'Every search is saved. Download the RC or Particular again later without using another lookup.',
  },
  {
    icon: <IconDocument />,
    variant: 'accent',
    title: 'Particular PDF included',
    description:
      'From the same search, download the Vehicle Particulars PDF in the Vahan layout at no extra cost.',
  },
  {
    icon: <IconWhatsApp />,
    variant: 'whatsapp',
    title: 'Share on WhatsApp',
    description:
      'The RC is a normal PDF. Share it with your client on WhatsApp or email in one tap.',
  },
]

const rcFields = [
  'Registration number',
  'Date of registration',
  'Registration validity',
  'Owner name & serial',
  'Son / daughter / wife of',
  'Owner address',
  'Chassis number',
  'Engine / motor number',
  'Vehicle class',
  'Maker & model',
  'Fuel & emission norms',
  'Colour & body type',
  'Seating capacity',
  'Unladen weight',
  'Cubic capacity',
  'Financier (HP)',
  'Registration authority',
  'QR code',
]

const audiences = [
  'RTO agents and consultants',
  'Insurance agents and POSPs',
  'New vehicle dealers',
  'Used car and bike dealers',
  'Vehicle financers and loan agents',
  'Fleet and transport operators',
]

export default function RcDownloadSoftware() {
  return (
    <>
      <section className={pageHero}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(250,86,8,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(17,76,171,0.2),transparent_45%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>RTO Sarthi — RC Download Software</span>
          <h1 className={cn(h1Page, 'mb-2')}>
            RC Download Software for RTO Agents — Download RC of Any Vehicle at Just {LOOKUP_PRICE}
          </h1>
          <p className="mx-auto max-w-xl text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            Enter a vehicle number and download its RC as a PDF in seconds. Smart card style RC,
            Vehicle Particulars PDF and complete vehicle details, all from one search at{' '}
            {LOOKUP_PRICE} per vehicle.
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
            {[`${LOOKUP_PRICE} per RC`, 'All States', 'Smart Card Style PDF', 'Particular PDF', 'Free Re-download'].map((tag) => (
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

      <section className={cn(section, 'bg-white')} id="what-is-rc-download-software">
        <div className={container}>
          <SectionHeading
            label="Overview"
            title="RC download software for RTO agents"
            description={`Download RC of any vehicle at just ${LOOKUP_PRICE}, inside the software you already use for RTO work.`}
          />
          <div className="mx-auto max-w-3xl space-y-3">
            <p className={bodyMuted}>
              Transfer, HPA / HPT, NOC, duplicate RC, insurance and fitness work all need the RC
              details of the vehicle. When the client has lost the RC or only has a faded photo,
              the RTO agent loses time before the work can start.
            </p>
            <p className={bodyMuted}>
              <strong className="text-slate-700">RTO Sarthi RC download software</strong> solves
              this. Enter the vehicle number and{' '}
              <strong className="text-slate-700">download the RC of any vehicle at just {LOOKUP_PRICE}</strong>.
              RC download is part of RTO Sarthi, the software made specifically for{' '}
              <strong className="text-slate-700">RTO agents</strong>, so the same search also gives
              you road tax, fitness, PUC and insurance status and lets you save the vehicle to your
              client records.
            </p>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="how-to-download-rc">
        <div className={container}>
          <SectionHeading
            label="How it works"
            title="How to download RC by vehicle number"
            description="Three steps, about ten seconds."
          />
          <div className={grid3}>
            {steps.map((item) => (
              <div key={item.step} className={`${glassCard} text-center`}>
                <div className="flex justify-center pt-4">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                    {item.step}
                  </span>
                </div>
                <div className="px-4 pb-4">
                  <h3 className="mb-1 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className={bodyMuted}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={section} id="features">
        <div className={container}>
          <SectionHeading
            label="Features"
            title="Why RTO agents use RTO Sarthi to download RC"
            description="Built for agents who download RC for client files every day."
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
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="pricing">
        <div className={container}>
          <SectionHeading
            label="Pricing"
            title={`Download RC of any vehicle at just ${LOOKUP_PRICE}`}
            description="Simple pay-per-search pricing for RTO agents."
          />
          <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-[1fr_1.4fr] lg:gap-3.5">
            <div className={cn(glassCard, 'flex flex-col items-center justify-center p-6 text-center')}>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-accent-600">
                Per vehicle search
              </span>
              <span className="my-1 text-4xl font-bold tracking-tight text-brand-950 lg:text-5xl">
                {LOOKUP_PRICE}
              </span>
              <p className={bodyMuted}>
                RC PDF + Particular PDF + complete vehicle details, tax, fitness, PUC and insurance
                status.
              </p>
              <Button href="/contact" variant="primary" className="mt-4">
                Get Started
              </Button>
            </div>
            <div className={cn(glassCard, 'p-5')}>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">What the RC PDF contains</h3>
              <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {rcFields.map((f) => (
                  <li key={f} className="flex gap-1.5 text-xs text-slate-700 sm:text-[0.8125rem]">
                    <span className="mt-0.5 shrink-0 text-emerald-600 [&_svg]:h-3.5 [&_svg]:w-3.5">
                      <IconCheck />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.6875rem] text-slate-500 sm:text-xs">
                The RC PDF is a computer-generated copy for reference and client records. It does
                not replace the original RC or the DigiLocker / mParivahan digital RC.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={section} id="who-is-it-for">
        <div className={container}>
          <SectionHeading
            label="Who it is for"
            title="Who uses RC download software?"
            description="Made for RTO agents, and useful for anyone who needs RC details regularly."
          />
          <div className={grid3}>
            {audiences.map((a) => (
              <div key={a} className={`${glassCard} flex items-center gap-2.5 p-3.5`}>
                <FeatureIcon icon={<IconUsers />} variant="brand" size="sm" className="mb-0" />
                <span className="text-xs font-medium text-slate-700 sm:text-[0.8125rem]">{a}</span>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
            <Link to="/vehicle-information-software" className={cn(glassCard, 'flex gap-3 p-4')}>
              <FeatureIcon icon={<IconChart />} variant="accent" className="mb-0 shrink-0" />
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900">Vehicle information software</h3>
                <p className={bodyMuted}>
                  Road tax, e-challan, fitness, PUC, insurance status and bulk RC verification.
                </p>
              </div>
            </Link>
            <Link to="/rto-management-software" className={cn(glassCard, 'flex gap-3 p-4')}>
              <FeatureIcon icon={<IconShield />} variant="brand" className="mb-0 shrink-0" />
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900">RTO management software</h3>
                <p className={bodyMuted}>
                  Manage vehicles, renewals, WhatsApp alerts and client balances in one place.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="faq">
        <div className={container}>
          <SectionHeading
            label="FAQ"
            title="RC download software for RTO agents — FAQ"
            description="Answers about downloading RC by vehicle number, pricing and usage."
          />
          <div className="mx-auto max-w-3xl space-y-2.5">
            {rcDownloadFaqs.map((f) => (
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
                <IconDocument />
              </div>
              <h2 className="mb-2 text-lg font-bold text-white sm:text-xl lg:text-[1.35rem]">
                Download RC of any vehicle at just {LOOKUP_PRICE}
              </h2>
              <p className="mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
                Start your free trial of RTO Sarthi, the RC download software for RTO agents, and
                download your first RC today.
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
