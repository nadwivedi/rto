import FeatureIcon from './FeatureIcon'
import * as page from '../lib/styles'
import * as home from '../lib/homeStyles'

export default function FeatureCard({ icon, title, description, iconVariant = 'brand', compact = false }) {
  const s = compact ? home : page
  return (
    <article className={`${s.glassCard} ${compact ? 'p-4 lg:p-4' : 'p-6'}`}>
      <FeatureIcon icon={icon} variant={iconVariant} className={compact ? undefined : 'mb-4'} />
      <h3 className={s.h3Card}>{title}</h3>
      <p className={s.bodyMuted}>{description}</p>
    </article>
  )
}
