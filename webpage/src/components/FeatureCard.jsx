import { Link } from 'react-router-dom'
import FeatureIcon from './FeatureIcon'
import * as page from '../lib/styles'
import * as home from '../lib/homeStyles'

/** `to` links the title and adds a "Learn more" link to the page that explains the feature. */
export default function FeatureCard({ icon, title, description, iconVariant = 'brand', compact = false, to }) {
  const s = compact ? home : page
  return (
    <article className={`${s.glassCard} flex flex-col ${compact ? 'p-4 lg:p-4' : 'p-6'}`}>
      <FeatureIcon icon={icon} variant={iconVariant} className={compact ? undefined : 'mb-4'} />
      <h3 className={s.h3Card}>
        {to ? (
          <Link to={to} className="hover:text-brand-700">
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <p className={`${s.bodyMuted} flex-1`}>{description}</p>
      {to && (
        <Link
          to={to}
          className={`mt-2 inline-block font-semibold text-brand-800 hover:text-accent-600 hover:underline ${compact ? 'text-xs sm:text-[0.8125rem]' : 'text-sm'}`}
          aria-label={`Learn more about ${title}`}
        >
          Learn more →
        </Link>
      )}
    </article>
  )
}
