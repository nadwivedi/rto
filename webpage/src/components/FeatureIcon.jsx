import { cn } from '../lib/styles'

/** Colored icon container — matches brand + semantic colors (e.g. WhatsApp green) */
const variants = {
  brand: 'border-brand-200/80 bg-brand-50 text-brand-800',
  accent: 'border-accent-200/80 bg-accent-50 text-accent-600',
  whatsapp: 'border-[#25D366]/30 bg-[#25D366]/12 text-[#128C7E]',
  success: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
  violet: 'border-violet-200/80 bg-violet-50 text-violet-700',
  slate: 'border-slate-200/80 bg-slate-50 text-slate-700',
}

const sizes = {
  sm: 'h-8 w-8 [&_svg]:h-4 [&_svg]:w-4',
  md: 'mb-2.5 h-10 w-10 [&_svg]:h-5 [&_svg]:w-5 lg:h-11 lg:w-11',
}

export default function FeatureIcon({ icon, variant = 'brand', size = 'md', className }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl border shadow-sm',
        variants[variant] ?? variants.brand,
        sizes[size] ?? sizes.md,
        className,
      )}
    >
      {icon}
    </div>
  )
}
