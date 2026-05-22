import { useState } from 'react'
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
} from '../lib/styles'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 transition-colors focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700/15'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    business: '',
    role: 'rto-agent',
    message: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <section className={pageHero}>
        <div className={cn(container, 'relative z-10')}>
          <span className={labelOnDark}>Contact</span>
          <h1 className={cn(h1Page, 'mb-2')}>Let&apos;s talk about your RTO desk</h1>
          <p className="mx-auto max-w-lg text-xs text-white/85 sm:text-[0.8125rem] lg:text-sm">
            Request a free trial, book a demo, or ask about pricing — our team in Raipur responds
            within one business day.
          </p>
        </div>
      </section>

      <section className={section}>
        <div className={cn(container, 'grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-8')}>
          <div>
            <SectionHeading
              label="Get in touch"
              title="We'd love to hear from you"
              description="Fill out the form and we'll reach out with trial access or schedule a live demo at your convenience."
              align="left"
            />

            {[
              {
                icon: <IconMapPin />,
                title: 'Office',
                content: <p className="text-xs text-slate-500 sm:text-[0.8125rem]">SoftwareBytes, Raipur, Chhattisgarh, India — 492001</p>,
              },
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
            ].map((item) => (
              <div key={item.title} className={`${glassCard} mb-3 flex gap-3 p-3.5`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800 [&_svg]:h-4 [&_svg]:w-4">
                  {item.icon}
                </div>
                <div>
                  <strong className="mb-0.5 block text-xs font-semibold text-slate-900 sm:text-sm">{item.title}</strong>
                  {item.content}
                </div>
              </div>
            ))}

            <div className="mt-3 flex h-44 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-brand-200 bg-gradient-to-br from-slate-50 to-brand-50/50 text-slate-500">
              <span className="text-brand-800 [&_svg]:h-7 [&_svg]:w-7">
                <IconMapPin />
              </span>
              <span className="text-xs font-medium">Map — Raipur, Chhattisgarh</span>
              <span className="text-[0.6875rem]">Interactive map embed coming soon</span>
            </div>

            <div className="mt-4 flex gap-2" aria-label="Social links">
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[0.6875rem] font-bold text-slate-600 transition-colors hover:bg-accent-600 hover:text-white"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <form className={`${glassCard} p-4 sm:p-5`} onSubmit={handleSubmit}>
            <h3 className="mb-4 text-sm font-bold text-slate-900">Send us a message</h3>
            {submitted && (
              <div
                className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                role="status"
              >
                Thank you! We&apos;ve received your message and will contact you shortly.
              </div>
            )}
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-semibold text-slate-700">
                  Full name *
                </label>
                <input id="name" name="name" type="text" required placeholder="Rajesh Kumar" className={inputClass} value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-slate-700">
                  Phone *
                </label>
                <input id="phone" name="phone" type="tel" required placeholder="+91 98765 43210" className={inputClass} value={form.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-700">
                Email *
              </label>
              <input id="email" name="email" type="email" required placeholder="you@example.com" className={inputClass} value={form.email} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="business" className="mb-1 block text-xs font-semibold text-slate-700">
                Business / Desk name
              </label>
              <input id="business" name="business" type="text" placeholder="Sahu RTO Services" className={inputClass} value={form.business} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label htmlFor="role" className="mb-1 block text-xs font-semibold text-slate-700">
                I am a *
              </label>
              <select id="role" name="role" value={form.role} onChange={handleChange} required className={inputClass}>
                <option value="rto-agent">RTO Agent</option>
                <option value="insurance">Insurance Agent</option>
                <option value="puc">PUC Center</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="message" className="mb-1 block text-xs font-semibold text-slate-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Tell us about your desk size, current tools, and whether you want a trial or demo..."
                className={cn(inputClass, 'min-h-[96px] resize-y')}
                value={form.message}
                onChange={handleChange}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Send Message
            </Button>
          </form>
        </div>
      </section>
    </>
  )
}
