import SectionHeading from '../components/SectionHeading'
import RelatedSolutions from '../components/RelatedSolutions'
import PageHero from '../components/PageHero'
import FeatureCard from '../components/FeatureCard'
import Button from '../components/Button'
import { coreFeatures, detailedFeatures } from '../data/features'
import { IconCheck } from '../components/Icons'
import FeatureIcon from '../components/FeatureIcon'
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

export default function Features() {
  return (
    <>
      <PageHero title="Powerful tools for modern RTO agents" subtitle="Automate paperwork, alert clients on WhatsApp, bulk-import PUC and insurance data, and manage every vehicle from one secure platform." />

      <section className={section}>
        <div className={container}>
          <SectionHeading
            label="Overview"
            title="Core capabilities"
            description="Six pillars that make RTO Sarthi the complete operating system for your desk."
          />
          <div className={grid3}>
            {coreFeatures.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      <section className={cn(section, sectionMuted)}>
        <div className={container}>
          <SectionHeading
            label="Deep dive"
            title="How each feature works"
            description="Practical details for agents who need software that matches real office work."
          />
          {detailedFeatures.map((feature) => (
            <div
              key={feature.id}
              id={feature.id}
              className="grid items-center gap-5 border-b border-slate-200/80 py-7 last:border-0 lg:grid-cols-2 lg:gap-8 lg:py-9"
            >
              <div className={feature.reverse ? 'lg:order-2' : ''}>
                <h3 className="font-display mb-2 text-lg font-bold text-slate-900 sm:text-lg lg:text-[1.15rem]">
                  {feature.title}
                </h3>
                <p className={cn(bodyMuted, 'mb-3')}>{feature.description}</p>
                <ul className="flex flex-col gap-1.5">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-slate-600 sm:text-base">
                      <span className="shrink-0 text-emerald-500 [&_svg]:h-4 [&_svg]:w-4">
                        <IconCheck />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cn(`${glassCard} flex min-h-[180px] flex-col items-center justify-center gap-4 p-6 lg:min-h-[200px]`, feature.reverse && 'lg:order-1')}>
                <FeatureIcon icon={feature.icon} variant={feature.iconVariant} className="mb-0 h-14 w-14 [&_svg]:h-6 [&_svg]:w-6" />
                <p className="text-center text-sm text-slate-600 sm:text-base">
                  Built for speed and accuracy at your RTO desk
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <RelatedSolutions className="bg-white" />

      <section className={section}>
        <div className={container}>
          <div className={ctaBand}>
            <h2 className="relative z-10 mb-2 text-lg font-bold text-white sm:text-xl">See RTO Sarthi in action</h2>
            <p className="relative z-10 mx-auto mb-4 max-w-md text-sm text-white/90 sm:text-base">
              Book a 20-minute demo with our team in Raipur — we&apos;ll walk through your exact workflow.
            </p>
            <div className="relative z-10 flex flex-wrap justify-center gap-2">
              <Button href="/contact" variant="secondary" size="lg">
                Book Demo
              </Button>
              <Button href="/contact" variant="ghost" size="lg">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
