import SectionHeading from '../components/SectionHeading'
import Button from '../components/Button'
import { IconMapPin, IconMail, IconPhone, IconWhatsApp } from '../components/Icons'
import {
  EMAIL,
  PHONE_PRIMARY,
  PHONE_SECONDARY,
  phonePrimaryDisplay,
  phoneSecondaryDisplay,
  whatsappUrl,
} from '../data/contact'
import {
  container,
  section,
  pageHero,
  glassCard,
  labelOnDark,
  h1Page,
  cn,
  grid2,
} from '../lib/styles'

const contactItems = [
  {
    icon: <IconPhone />,
    title: 'Phone',
    content: (
      <>
        <p>
          <a href={`tel:+91${PHONE_PRIMARY}`} className="text-xs text-slate-500 hover:text-brand-800 sm:text-[0.8125rem]">
            {phonePrimaryDisplay}
          </a>
        </p>
        <p>
          <a href={`tel:+91${PHONE_SECONDARY}`} className="text-xs text-slate-500 hover:text-brand-800 sm:text-[0.8125rem]">
            {phoneSecondaryDisplay}
          </a>
        </p>
      </>
    ),
  },
  {
    icon: <IconWhatsApp />,
    title: 'WhatsApp',
    content: (
      <p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[#128C7E] hover:text-[#25D366] sm:text-[0.8125rem]"
        >
          {phonePrimaryDisplay} — Chat now
        </a>
      </p>
    ),
  },
  {
    icon: <IconMail />,
    title: 'Email',
    content: (
      <p>
        <a href={`mailto:${EMAIL}`} className="text-xs text-slate-500 hover:text-brand-800 sm:text-[0.8125rem]">
          {EMAIL}
        </a>
      </p>
    ),
  },
  {
    icon: <IconMapPin />,
    title: 'Office',
    content: (
      <p className="text-xs text-slate-500 sm:text-[0.8125rem]">
        SoftwareBytes, Raipur, Chhattisgarh, India — 492001
      </p>
    ),
  },
]

export default function Contact() {
  return (
    <>
      <section className={pageHero}>
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>Contact</span>
          <h1 className={cn(h1Page, 'mb-2')}>Connect with us</h1>
          <p className="mx-auto max-w-lg text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            Simplify your RTO workflow — request a free trial, book a demo, or reach out anytime.
          </p>
        </div>
      </section>

      <section className={section}>
        <div className={cn(container, 'mx-auto max-w-2xl')}>
          <SectionHeading
            label="Direct contact"
            title="Reach us instantly"
            description="Call, WhatsApp, or email — our team is ready to help you get started with RTO Sarthi."
          />

          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button href={whatsappUrl} variant="primary" size="lg" className="w-full sm:w-auto">
              Chat on WhatsApp
            </Button>
            <Button href={`tel:+91${PHONE_PRIMARY}`} variant="outline-dark" size="lg" className="w-full sm:w-auto">
              Call {phonePrimaryDisplay}
            </Button>
          </div>

          <div className={grid2}>
            {contactItems.map((item) => (
              <div key={item.title} className={`${glassCard} flex gap-3 p-4`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800 [&_svg]:h-5 [&_svg]:w-5">
                  {item.icon}
                </div>
                <div>
                  <strong className="mb-1 block text-sm font-semibold text-slate-900">{item.title}</strong>
                  {item.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex h-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand-200 bg-gradient-to-br from-slate-50 to-brand-50/50 text-slate-500">
            <span className="text-brand-800 [&_svg]:h-7 [&_svg]:w-7">
              <IconMapPin />
            </span>
            <span className="text-xs font-medium">Raipur, Chhattisgarh, India</span>
            <span className="text-[0.6875rem]">Interactive map embed coming soon</span>
          </div>

          <div className="mt-5 flex justify-center gap-2" aria-label="Social links">
            {[
              { href: 'https://linkedin.com', label: 'in' },
              { href: 'https://facebook.com', label: 'fb' },
              { href: 'https://instagram.com', label: 'ig' },
              { href: whatsappUrl, label: 'wa' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 transition-colors hover:bg-[#25D366] hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
