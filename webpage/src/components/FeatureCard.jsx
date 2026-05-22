import FeatureIcon from './FeatureIcon'
import { glassCard, h3Card, bodyMuted } from '../lib/styles'

export default function FeatureCard({ icon, title, description, iconVariant = 'brand' }) {
  return (
    <article className={`${glassCard} p-4 lg:p-4`}>
      <FeatureIcon icon={icon} variant={iconVariant} />
      <h3 className={h3Card}>{title}</h3>
      <p className={bodyMuted}>{description}</p>
    </article>
  )
}
