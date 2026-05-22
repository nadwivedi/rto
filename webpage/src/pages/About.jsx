import SectionHeading from '../components/SectionHeading'
import Button from '../components/Button'
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
  cn,
} from '../lib/styles'

export default function About() {
  return (
    <>
      <section className={pageHero}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(250,86,8,0.15),transparent_50%)]"
          aria-hidden
        />
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>About</span>
          <h1 className={cn(h1Page, 'mb-2')}>Digitizing RTO workflows across India</h1>
          <p className="mx-auto max-w-lg text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            RTO Sarthi helps agents move from paper registers to a reliable digital system — without
            losing the trust their clients depend on.
          </p>
        </div>
      </section>

      <section className={section}>
        <div className={cn(container, 'mx-auto max-w-2xl')}>
          <h2 className={cn(h2Section, 'mb-3')}>Our mission</h2>
          <p className={cn(bodyMuted, 'mb-3')}>
            Regional Transport Offices sit at the heart of vehicle ownership in India — yet many
            agents still rely on handwritten registers, phone reminders, and scattered Excel files.
            Missed tax, PUC, or insurance renewals hurt clients and damage an agent&apos;s reputation.
          </p>
          <p className={cn(bodyMuted, 'mb-3')}>
            RTO Sarthi was created to change that. We bring document automation, WhatsApp-based
            client communication, bulk data imports, and clear expiry dashboards into one platform
            designed specifically for how RTO desks, insurance agents, and PUC centers operate in
            states like Chhattisgarh and beyond.
          </p>
          <p className={cn(bodyMuted, 'mb-6')}>
            Our goal is simple: help every agent deliver faster service, fewer errors, and proactive
            renewal support — so vehicle owners stay compliant and agents grow their business with
            confidence.
          </p>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { n: '5+', l: 'Document types tracked' },
              { n: '3', l: 'Agent roles supported' },
              { n: '24/7', l: 'Cloud access' },
              { n: '100%', l: 'Made in India' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-brand-100 bg-brand-50/80 px-3 py-3 text-center"
              >
                <strong className="block text-lg font-bold text-brand-800 lg:text-xl">{s.n}</strong>
                <span className="text-[0.625rem] font-medium text-slate-600 sm:text-xs">{s.l}</span>
              </div>
            ))}
          </div>

          <h2 className={cn(h2Section, 'mb-3')}>Developed by SoftwareBytes</h2>
          <p className={cn(bodyMuted, 'mb-3')}>
            RTO Sarthi is designed, built, and supported by{' '}
            <a href="https://softwarebytes.in" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-800 hover:text-accent-600 hover:underline">
              SoftwareBytes
            </a>
            , an IT company based in Raipur, Chhattisgarh. We work closely with local RTO agents to
            understand real desk challenges — from Form uploads to permit renewals — and ship
            software that fits those workflows, not the other way around.
          </p>
          <p className={bodyMuted}>
            When you choose RTO Sarthi, you get a product team that speaks your language, understands
            Indian compliance cycles, and provides hands-on onboarding for your staff.
          </p>
        </div>
      </section>

      <section className={cn(section, sectionMuted)}>
        <div className={container}>
          <SectionHeading
            label="Partner"
            title="Built with local expertise"
            description="SoftwareBytes combines modern engineering with on-ground RTO domain knowledge."
          />
          <div className={`${glassCard} mx-auto max-w-md p-6 text-center`}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-800 to-accent-600 text-lg font-extrabold text-white shadow-md">
              SB
            </div>
            <h3 className="mb-1 text-sm font-bold text-slate-900">SoftwareBytes</h3>
            <p className="text-xs text-slate-500">IT Solutions · Raipur, Chhattisgarh, India</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 sm:text-[0.8125rem]">
              Web, mobile, and business software for Indian enterprises — including RTOSarthi.com and
              the full RTO Sarthi product suite.
            </p>
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={container}>
          <div className={ctaBand}>
            <h2 className="relative z-10 mb-2 text-lg font-bold text-white sm:text-xl">
              Partner with us on your digital journey
            </h2>
            <p className="relative z-10 mx-auto mb-4 max-w-md text-xs text-white/90 sm:text-sm">
              Whether you run a single desk or multiple branches, we&apos;re here to help you get started.
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
