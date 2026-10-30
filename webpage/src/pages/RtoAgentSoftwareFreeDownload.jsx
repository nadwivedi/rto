import { Link } from 'react-router-dom'
import RelatedSolutions from '../components/RelatedSolutions'
import SectionHeading from '../components/SectionHeading'
import PageHero from '../components/PageHero'
import FeatureIcon from '../components/FeatureIcon'
import Button from '../components/Button'
import { IconCheck, IconPhone, IconUpload, IconShield, IconUsers } from '../components/Icons'
import { coreFeatures } from '../data/features'
import { freeDownloadFaqs, APP_URL } from '../data/freeDownload'
import { whatsappUrl } from '../data/contact'
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
      'Our team installs the RTO Sarthi Windows software on your computer and the Android app (APK) or iPhone app on your phone.',
  },
  {
    step: '03',
    title: 'Start using free of cost',
    description: 'Log in, add your vehicles and clients, and use RTO Sarthi on your real work during the trial.',
  },
]

const devices = [
  { title: 'Windows PC', text: 'Dedicated Windows software with its own desktop and taskbar icon. Mac works in the browser.' },
  { title: 'Android mobile', text: 'Dedicated Android app (APK), installed by our team. Opens from your home screen.' },
  { title: 'iPhone / iPad', text: 'Dedicated iPhone app, set up by our team. Opens from your home screen.' },
]

const trialPoints = [
  'Free trial, use the software free of cost',
  'Works on computer and mobile',
  'Windows software, Android APK & iPhone app',
  'Automatic updates',
  'Data stored safely online',
  'Setup help from our team',
]

export default function RtoAgentSoftwareFreeDownload() {
  return (
    <>
      <PageHero title="RTO Agent Software Free Download — Try RTO Sarthi Free of Cost">
        <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer" variant="primary" size="lg">
          Get Free Trial
        </Button>
        <Button href={APP_URL} target="_blank" rel="noopener noreferrer" variant="ghost" size="lg">
          Open &amp; Download App
        </Button>
      </PageHero>

      <section className={cn(section, 'bg-white')} id="free-trial">
        <div className={container}>
          <SectionHeading
            label="Free trial"
            title="Download RTO agent software and use it free of cost"
            description="RTO Sarthi is made specifically for RTO agents. Try it free on your real work."
          />
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <p className={cn(bodyMuted, 'font-medium text-slate-700')}>
                RTO Sarthi provides a free trial with free download. Download and use India&apos;s RTO agent software free of cost on your computer or mobile, and see how it simplifies your RTO desk before you decide.
              </p>
              <p className={bodyMuted}>
                Many RTO agents search for <strong className="text-slate-700">RTO agent software free
                download</strong> because they want to try software before paying for it. RTO Sarthi
                makes this simple: we provide a <strong className="text-slate-700">free trial</strong>{' '}
                where you can download the software and use it free of cost.
              </p>
              <p className={bodyMuted}>
                During the trial you add your own vehicles and clients, track tax, fitness, PUC,
                insurance and permit expiry, and see the dashboard in action. You don&apos;t need
                to buy anything or install a risky file from an unknown website. Our team installs the
                RTO Sarthi apps on your PC and mobile for you.
              </p>
            </div>
            <ul className={cn(glassCard, 'space-y-2 p-6')}>
              {trialPoints.map((p) => (
                <li key={p} className="flex gap-1.5 text-sm text-slate-700 sm:text-base">
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
              <div key={item.step} className={cn(glassCard, 'p-6 text-center')}>
                <div className="flex justify-center">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className={bodyMuted}>{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-4 grid max-w-4xl gap-3 sm:grid-cols-3">
            {devices.map((d) => (
              <div key={d.title} className={cn(glassCard, 'flex gap-2.5 p-4')}>
                <FeatureIcon icon={<IconPhone />} variant="slate" size="sm" className="mb-0" />
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 sm:text-base">{d.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-sm">{d.text}</p>
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
              <div key={f.title} className={cn(glassCard, 'p-6')}>
                <FeatureIcon icon={f.icon} variant={f.iconVariant} />
                <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className={bodyMuted}>{f.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/features"
              className="inline-flex items-center justify-center rounded-lg border-2 border-brand-200 bg-white px-4 py-2 text-base font-semibold text-brand-900 transition-all hover:border-brand-700 hover:bg-brand-50"
            >
              See all RTO Sarthi features →
            </Link>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
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
              { icon: <IconShield />, title: 'Safe and always updated', text: 'Data stored securely online, automatic updates, and apps installed by our own team.' },
            ].map((item) => (
              <div key={item.title} className={cn(glassCard, 'p-6')}>
                <FeatureIcon icon={item.icon} variant="brand" />
                <h3 className="font-display mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
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
          <div className="mx-auto max-w-3xl space-y-5">
            {freeDownloadFaqs.map((f) => (
              <details key={f.q} className={`${glassCard} group p-5`}>
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
        </div>
      </section>

      <RelatedSolutions className={sectionMuted} />

      <section className={section}>
        <div className={container}>
          <div className={ctaBand}>
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(250,86,8,0.2),transparent_45%)]"
              aria-hidden
            />
            <div className="relative z-10">
              <h2 className="mb-3 font-display text-2xl font-bold text-white sm:text-3xl">
                Download RTO Sarthi free today
              </h2>
              <p className="mx-auto mb-6 max-w-xl text-base text-white/90 sm:text-lg">
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
