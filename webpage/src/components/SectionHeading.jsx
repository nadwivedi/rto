import { cn, label, h2Section, h2OnDark, bodyMuted } from '../lib/styles'

export default function SectionHeading({
  label: labelText,
  title,
  description,
  dark = false,
  align = 'center',
}) {
  return (
    <div
      className={cn(
        'mb-6 lg:mb-7',
        align === 'center' ? 'text-center' : 'text-left',
      )}
    >
      {labelText && (
        <span className={cn(label, dark && 'text-accent-300')}>{labelText}</span>
      )}
      <h2 className={cn(dark ? h2OnDark : h2Section, 'mb-1.5')}>{title}</h2>
      {description && (
        <p
          className={cn(
            bodyMuted,
            'max-w-lg',
            align === 'center' && 'mx-auto',
            dark && 'text-slate-400',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
