import { cn } from '../lib/styles'

const variants = {
  primary:
    'border-transparent bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-md shadow-accent-600/30 hover:-translate-y-px hover:from-accent-500 hover:to-accent-400 hover:shadow-lg hover:shadow-accent-500/35',
  secondary:
    'border-brand-200 bg-white text-brand-900 hover:border-brand-700 hover:bg-brand-50',
  ghost:
    'border-white/35 bg-transparent text-white hover:border-accent-300/60 hover:bg-white/10',
  'outline-dark':
    'border-slate-200 bg-transparent text-slate-800 hover:border-brand-700 hover:text-brand-800',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-4 py-2 text-sm',
  '': 'px-3.5 py-2 text-xs sm:text-sm',
}

export default function Button({
  children,
  variant = 'primary',
  size = '',
  className = '',
  href,
  type = 'button',
  onClick,
  ...rest
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-1.5 rounded-lg border-2 font-semibold transition-all duration-200 active:scale-[0.98]',
    variants[variant],
    sizes[size] ?? sizes[''],
    className,
  )

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}
