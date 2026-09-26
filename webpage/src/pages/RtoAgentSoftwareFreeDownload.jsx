import { Link } from 'react-router-dom'
import SectionHeading from '../components/SectionHeading'
import FeatureIcon from '../components/FeatureIcon'
import Button from '../components/Button'
import { IconCheck, IconPhone, IconUpload, IconShield, IconUsers } from '../components/Icons'
import { coreFeatures } from '../data/features'
import { freeDownloadFaqs, APP_URL } from '../data/freeDownload'
import { whatsappUrl } from '../data/contact'
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
    title: 'Get your free trial',
    description: 'Message us on WhatsApp or call. We create your free RTO Sarthi account the same day.',
  },
  {
    step: '02',
    title: 'Download & install',
    description:
      'Open app.rtosarthi.com and click Install App on computer or Android. On iPhone use Add to Home Screen.',
  },
  {
    step: '03',
    title: 'Start using free of cost',
    description: 'Log in, add your vehicles and clients, and use RTO Sarthi on your real work during the trial.',
  },
]

const devices = [
  { title: 'Windows / Mac PC', text: 'Chrome or Edge → Install App. Opens from desktop and taskbar.' },
  { title: 'Android mobile', text: 'Chrome → Install App. Opens from your home screen like any app.' },
  { title: 'iPhone / iPad', text: 'Safari → Share → Add to Home Screen.' },
]

const trialPoints = [
  'Free trial, use the software free of cost',
  'Works on computer and mobile',
  'No .exe or APK file needed',
  'Automatic updates',
  'Data stored safely online',
  'Setup help from our team',
]

export default function RtoAgentSoftwareFreeDownload() {
  return (
    <>
      <section className={pageHero}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(250,86,8,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(17,76,171,0.2),transparent_45%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>RTO Sarthi — Free Trial</span>
          <h1 className={cn(h1Page, 'mb-2')}>
            RTO Agent Software Free Download — Try RTO Sarthi Free of Cost
          </h1>
          <p className="mx-auto max-w-xl text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            RTO Sarthi provides a free trial with free download. Download and use India&apos;s RTO
            agent software free of cost on your computer or mobile, and see how it simplifies your
            RTO desk before you decide.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="primary" size="lg">
              Get Free Trial
            </Button>
            <Button href={APP_URL} target="_blank" rel="noopener noreferrer" variant="ghost" size="lg">
              Open &amp; Download App
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['Free Trial', 'Free Download', 'PC & Mobile', 'No Installation File', 'Setup Help'].map((tag) => (
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

      <section className={cn(section, 'bg-white')} id="free-trial">
        <div className={container}>
          <SectionHeading
            label="Free trial"
            title="Download RTO agent software and use it free of cost"
            description="RTO Sarthi is made specifically for RTO agents. Try it free on your real work."
          />
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <p className={bodyMuted}>
                Many RTO agents search for <strong className="text-slate-700">RTO agent software free
                download</strong> because they want to try software before paying for it. RTO Sarthi
                makes this simple: we provide a <strong className="text-slate-700">free trial</strong>{' '}
                where you can download the software and use it free of cost.
              </p>
              <p className={bodyMuted}>
                During the trial you add your own vehicles and clients, track tax, fitness, PUC,
                insurance and permit expiry, and see the dashboard in action. You don&apos;t need
                to buy anything or install a risky file from an unknown website. RTO Sarthi installs
                straight from the browser on your PC or mobile.
              </p>
            </div>
            <ul className={cn(glassCard, 'space-y-2 p-5')}>
              {trialPoints.map((p) => (
                <li key={p} className="flex gap-1.5 text-xs text-slate-700 sm:text-[0.8125rem]">
                  <span className="mt-0.5 shrink-0 text-emerald-600 [&_svg]:h-3.5 [&_svg]:w-3.5">
                    <IconCheck />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="how-to-download">
        <div className={container}>
          <SectionHeading
            label="How to download"
            title="How to download RTO Sarthi for free"
            description="Three simple steps to start using RTO agent software free of cost."
          />
          <div className={grid3}>
            {steps.map((item) => (
              <div key={item.step} className={cn(glassCard, 'p-4 text-center')}>
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
          <div className="mx-auto mt-4 grid max-w-4xl gap-3 sm:grid-cols-3">
            {devices.map((d) => (
              <div key={d.title} className={cn(glassCard, 'flex gap-2.5 p-3.5')}>
                <FeatureIcon icon={<IconPhone />} variant="slate" size="sm" className="mb-0" />
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 sm:text-[0.8125rem]">{d.title}</h3>
                  <p className="text-[0.6875rem] leading-relaxed text-slate-500 sm:text-xs">{d.text}</p>
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
            title="What you get in RTO Sarthi"
            description="A quick look at what you can use free during the trial."
          />
          <div className={grid3}>
            {coreFeatures.map((f) => (
              <div key={f.title} className={cn(glassCard, 'p-4')}>
                <FeatureIcon icon={f.icon} variant={f.iconVariant} />
                <h3 className="mb-1 text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className={bodyMuted}>{f.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/features"
              className="inline-flex items-center justify-center rounded-lg border-2 border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition-all hover:border-brand-700 hover:bg-brand-50"
            >
              See all RTO Sarthi features →
            </Link>
            <p className="mt-3 text-xs text-slate-500 sm:text-sm">
              Also see{' '}
              <Link to="/vehicle-information-software" className="font-semibold text-brand-800 hover:underline">
                vehicle information software
              </Link>
              ,{' '}
              <Link to="/rc-download-software" className="font-semibold text-brand-800 hover:underline">
                RC download software
              </Link>{' '}
              and{' '}
              <Link to="/puc-agent-software" className="font-semibold text-brand-800 hover:underline">
                PUC agent software
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)} id="why-rto-sarthi">
        <div className={container}>
          <SectionHeading
            label="Why RTO Sarthi"
            title="Why RTO agents choose RTO Sarthi over free Excel sheets"
            description="Free Excel or paper registers cost you missed renewals. RTO Sarthi reminds you before they happen."
          />
          <div className={grid3}>
            {[
              { icon: <IconUsers />, title: 'Made for RTO agents', text: 'Built around Indian RTO work: vehicle numbers, tax, fitness, permit, PUC, insurance, DL and transfer.' },
              { icon: <IconUpload />, title: 'Move your data in a day', text: 'Upload your existing Excel records in bulk. Our team helps you import everything.' },
              { icon: <IconShield />, title: 'Safe and always updated', text: 'Data stored securely online, automatic updates, and no installation files to worry about.' },
            ].map((item) => (
              <div key={item.title} className={cn(glassCard, 'p-4')}>
                <FeatureIcon icon={item.icon} variant="brand" />
                <h3 className="mb-1 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className={bodyMuted}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={section} id="faq">
        <div className={container}>
          <SectionHeading
            label="FAQ"
            title="RTO agent software free download — FAQ"
            description="Answers about the free trial, downloading and installing RTO Sarthi."
          />
          <div className="mx-auto max-w-3xl space-y-2.5">
            {freeDownloadFaqs.map((f) => (
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
              <h2 className="mb-2 text-lg font-bold text-white sm:text-xl lg:text-[1.35rem]">
                Download RTO Sarthi free today
              </h2>
              <p className="mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
                Get your free trial and use RTO agent software free of cost on your computer and
                mobile.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="lg">
                  Get Free Trial on WhatsApp
                </Button>
                <Button href="/contact" variant="ghost" size="lg">
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
