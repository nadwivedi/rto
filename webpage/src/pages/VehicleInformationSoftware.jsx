import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'
import FeatureIcon from '../components/FeatureIcon'
import Button from '../components/Button'
import {
  IconDocument,
  IconCar,
  IconWallet,
  IconRenewal,
  IconShield,
  IconCheck,
  IconExcel,
  IconClock,
  IconBell,
  IconUsers,
  IconChart,
} from '../components/Icons'
import { vehicleInfoFaqs, LOOKUP_PRICE } from '../data/vehicleInfo'
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
    icon: <IconCar />,
    variant: 'brand',
    title: 'Complete Vehicle Number Details',
    description:
      'Enter any vehicle number and get the full registration record: owner, registration date, RTO, chassis and engine number, class, maker, model, fuel, colour, seating, weight and HP details.',
  },
  {
    icon: <IconDocument />,
    variant: 'accent',
    title: 'RC Download',
    description:
      'Download an RC-style PDF of the vehicle in one click. Keep it in the client file or share it on WhatsApp.',
  },
  {
    icon: <IconDocument />,
    variant: 'brand',
    title: 'Particular Download',
    description:
      'Download the Vehicle Particulars PDF in the familiar Vahan layout, with the state header and RTO office, ready for client files and internal checks.',
  },
  {
    icon: <IconWallet />,
    variant: 'accent',
    title: 'Road Tax Status',
    description:
      'See tax paid upto date and tax amount, so you know if road tax is due before you take up the work.',
  },
  {
    icon: <IconBell />,
    variant: 'accent',
    title: 'E-Challan Status',
    description:
      'Check pending e-challans on a vehicle before transfer, NOC or renewal work, and inform your client in advance.',
  },
  {
    icon: <IconRenewal />,
    variant: 'success',
    title: 'Fitness Status',
    description:
      'See fitness valid upto for commercial vehicles and spot expired fitness certificates instantly.',
  },
  {
    icon: <IconClock />,
    variant: 'success',
    title: 'PUC Status',
    description:
      'Check PUC validity of any vehicle and offer PUC renewal before the client gets a challan.',
  },
  {
    icon: <IconShield />,
    variant: 'brand',
    title: 'Insurance Status',
    description:
      'See insurance company, policy number and validity. Perfect for insurance renewal quotes.',
  },
  {
    icon: <IconCheck />,
    variant: 'success',
    title: 'RC Verification',
    description:
      'Verify owner, chassis, engine, registration validity, HP and blacklist status before transfer, purchase or finance.',
  },
  {
    icon: <IconExcel />,
    variant: 'success',
    title: 'Bulk RC Verification',
    description:
      'Verify a whole list of vehicle numbers together instead of one by one. Built for dealers, fleets and financers.',
  },
]

const reportFields = [
  'Owner name & father / husband name',
  'Registration number & date',
  'Registering RTO office',
  'Chassis number & engine number',
  'Vehicle class, maker & model',
  'Fuel type, emission norms & colour',
  'Cubic capacity, seating & weight',
  'Registration valid upto',
  'Road tax paid upto',
  'Fitness valid upto',
  'PUC valid upto',
  'Insurance company & validity',
  'Hypothecation / financer (HP)',
  'Blacklist & NOC details',
]

const audiences = [
  'RTO agents and consultants',
  'Insurance agents and POSPs',
  'Vehicle dealers and showrooms',
  'Used car and bike dealers',
  'Vehicle financers and loan agents',
  'Fleet and transport operators',
]

export default function VehicleInformationSoftware() {
  return (
    <>
      <section className={pageHero}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(250,86,8,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(17,76,171,0.2),transparent_45%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>RTO Sarthi — Vehicle Information Software</span>
          <h1 className={cn(h1Page, 'mb-2')}>
            Vehicle Information Software for RTO Agents — Complete Vehicle Details by Number
          </h1>
          <p className="mx-auto max-w-xl text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            Search any vehicle number and get RC download, Particular download, road tax, e-challan,
            fitness, PUC and insurance status in one report. RC verification and bulk RC
            verification included. Just {LOOKUP_PRICE} per vehicle search.
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
            {['RC Download', 'Particular Download', 'Road Tax', 'E-Challan', 'Fitness', 'PUC', 'Insurance', 'Bulk RC Verification'].map((tag) => (
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

      <section className={cn(section, 'bg-white')} id="what-is-vehicle-information-software">
        <div className={container}>
          <SectionHeading
            label="Overview"
            title="Vehicle information software for RTO agents, built into RTO Sarthi"
            description="RTO Sarthi is made specifically for RTO agents. Vehicle information is part of the same software."
          />
          <div className="mx-auto max-w-3xl space-y-3">
            <p className={bodyMuted}>
              Every RTO job starts with the same question: what is the current status of this
              vehicle? Who is the owner, is road tax paid, is fitness valid, is there a pending
              challan, is the vehicle under hypothecation? Checking this on different websites wastes
              time on every file.
            </p>
            <p className={bodyMuted}>
              <strong className="text-slate-700">RTO Sarthi</strong> is software made specifically
              for <strong className="text-slate-700">RTO agents</strong>. The{' '}
              <strong className="text-slate-700">vehicle information software</strong> is part of
              the RTO Sarthi software integration. It gives the RTO agent all the details of a
              vehicle from a single vehicle number search, right inside the dashboard where they
              already manage registration, transfer, tax, fitness, PUC and insurance work.
            </p>
            <p className={bodyMuted}>
              Search once, then download the RC or the Vehicle Particulars PDF, check every expiry
              date, and add the vehicle to your client records with WhatsApp renewal reminders. You
              don&apos;t need separate tools or registers.
            </p>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="features">
        <div className={container}>
          <SectionHeading
            label="Features"
            title="Features of vehicle information software for RTO agents"
            description="Everything about a vehicle in one search, from RC download to bulk RC verification."
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

      <section className={section} id="pricing">
        <div className={container}>
          <SectionHeading
            label="Pricing"
            title={`Just ${LOOKUP_PRICE} per vehicle search`}
            description="Simple pay-per-search pricing. No separate charge for each detail."
          />
          <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-[1fr_1.4fr] lg:gap-3.5">
            <div className={cn(glassCard, 'flex flex-col items-center justify-center p-6 text-center')}>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-accent-600">
                Per vehicle lookup
              </span>
              <span className="my-1 text-4xl font-bold tracking-tight text-brand-950 lg:text-5xl">
                {LOOKUP_PRICE}
              </span>
              <p className={bodyMuted}>
                One search = complete vehicle details, RC &amp; Particular download, tax, fitness,
                PUC and insurance status.
              </p>
              <Button href="/contact" variant="primary" className="mt-4">
                Get Started
              </Button>
            </div>
            <div className={cn(glassCard, 'p-5')}>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                What you get in every vehicle report
              </h3>
              <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                {reportFields.map((f) => (
                  <li key={f} className="flex gap-1.5 text-xs text-slate-700 sm:text-[0.8125rem]">
                    <span className="mt-0.5 shrink-0 text-emerald-600 [&_svg]:h-3.5 [&_svg]:w-3.5">
                      <IconCheck />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.6875rem] text-slate-500 sm:text-xs">
                RC and Particular PDFs for an already-searched vehicle are generated from your saved
                search history, so re-downloading does not use another lookup.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="part-of-rto-sarthi">
        <div className={container}>
          <SectionHeading
            label="One platform"
            title="Part of RTO Sarthi, the complete software for RTO agents"
            description="Vehicle search is connected to everything else you do on your RTO desk."
          />
          <div className={grid3}>
            {[
              {
                icon: <IconCar />,
                title: 'Search, then save',
                text: 'Add a searched vehicle straight to your records with its tax, fitness, PUC and insurance dates.',
              },
              {
                icon: <IconBell />,
                title: 'WhatsApp renewal alerts',
                text: 'RTO Sarthi reminds your client on WhatsApp before tax, fitness, PUC and insurance expire.',
              },
              {
                icon: <IconChart />,
                title: 'Search history',
                text: 'Every vehicle you search is saved, so you can reopen it and download its RC or Particular again.',
              },
            ].map((item) => (
              <div key={item.title} className={`${glassCard} p-4`}>
                <FeatureIcon icon={item.icon} variant="brand" />
                <h3 className="mb-1 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className={bodyMuted}>{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-slate-500 sm:text-sm">
            Only need the RC? See our{' '}
            <Link to="/rc-download-software" className="font-semibold text-brand-800 hover:underline">
              RC download software
            </Link>
            . See how RTO Sarthi manages your whole desk on the{' '}
            <Link to="/rto-management-software" className="font-semibold text-brand-800 hover:underline">
              RTO management software
            </Link>{' '}
            page.
          </p>
        </div>
      </section>

      <section className={section} id="who-is-it-for">
        <div className={container}>
          <SectionHeading
            label="Who it is for"
            title="Who uses vehicle information software for RTO agents?"
            description="Made for RTO agents, and useful for anyone who checks vehicle details every day."
          />
          <div className={grid3}>
            {audiences.map((a) => (
              <div key={a} className={`${glassCard} flex items-center gap-2.5 p-3.5`}>
                <FeatureIcon icon={<IconUsers />} variant="brand" size="sm" className="mb-0" />
                <span className="text-xs font-medium text-slate-700 sm:text-[0.8125rem]">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="faq">
        <div className={container}>
          <SectionHeading
            label="FAQ"
            title="Vehicle information software for RTO agents — FAQ"
            description="Answers about vehicle number search, RC verification and pricing."
          />
          <div className="mx-auto max-w-3xl space-y-2.5">
            {vehicleInfoFaqs.map((f) => (
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
                <IconCar />
              </div>
              <h2 className="mb-2 text-lg font-bold text-white sm:text-xl lg:text-[1.35rem]">
                Get complete vehicle details for {LOOKUP_PRICE} per search
              </h2>
              <p className="mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
                Start your free trial of RTO Sarthi, the software made for RTO agents, and search
                your first vehicle today.
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
