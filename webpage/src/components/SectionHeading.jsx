import * as page from '../lib/styles'
import * as home from '../lib/homeStyles'

/** `compact` keeps the smaller homepage look; other pages use the readable defaults. */
export default function SectionHeading({
  label: labelText,
  title,
  description,
  dark = false,
  align = 'center',
  compact = false,
}) {
  const s = compact ? home : page
  return (
    <div
      className={s.cn(
        compact ? 'mb-6 lg:mb-7' : 'mb-8 lg:mb-10',
        align === 'center' ? 'text-center' : 'text-left',
      )}
    >
      {labelText && (
        <span className={s.cn(dark ? s.labelOnDark : s.label, dark && compact && 'text-accent-300')}>{labelText}</span>
      )}
      <h2 className={s.cn(dark ? s.h2OnDark : s.h2Section, compact ? 'mb-1.5' : 'mb-3')}>{title}</h2>
      {description && (
        <p
          className={s.cn(
            s.bodyMuted,
            compact ? 'max-w-lg' : 'max-w-2xl',
            align === 'center' && 'mx-auto',
            dark && (compact ? 'text-slate-400' : 'text-slate-300'),
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
