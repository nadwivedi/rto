import { cn } from '../lib/styles'

const sizeClasses = {
  nav: 'h-12 w-auto sm:h-12 md:h-12',
  footer: 'h-12 w-auto sm:h-14 lg:h-16',
}

export default function Logo({ className, showText = true, size = 'nav', imgClassName, ...props }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/rtosarthi.avif"
        alt="RTO Sarthi"
        className={cn(sizeClasses[size] ?? sizeClasses.nav, imgClassName)}
        width={507}
        height={178}
        decoding="async"
        {...props}
      />
      {showText && (
        <span className="hidden text-sm font-bold text-brand-900 min-[520px]:inline lg:text-base">
          RTO Sarthi
        </span>
      )}
    </span>
  )
}
