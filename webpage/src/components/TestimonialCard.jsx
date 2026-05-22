import { IconStar } from './Icons'
import { glassCard, bodyMuted } from '../lib/styles'

export default function TestimonialCard({ quote, name, role, location }) {
  return (
    <article className={`${glassCard} p-4`}>
      <div className="mb-2 flex gap-0.5 text-amber-400 [&_svg]:h-3.5 [&_svg]:w-3.5" aria-label="5 out of 5 stars">
        {[...Array(5)].map((_, i) => (
          <IconStar key={i} />
        ))}
      </div>
      <blockquote className={`${bodyMuted} mb-3 text-slate-600`}>&ldquo;{quote}&rdquo;</blockquote>
      <footer>
        <strong className="block text-xs font-semibold text-slate-900 sm:text-sm">{name}</strong>
        <span className="text-[0.6875rem] text-slate-500 sm:text-xs">
          {role} · {location}
        </span>
      </footer>
    </article>
  )
}
