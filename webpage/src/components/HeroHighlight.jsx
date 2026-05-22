import FeatureIcon from './FeatureIcon'

export default function HeroHighlight({ icon, label, variant }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <FeatureIcon icon={icon} variant={variant} size="sm" className="mb-0 shadow-none" />
      <span className="text-left text-[0.6875rem] font-medium leading-snug text-white/90 sm:text-xs">
        {label}
      </span>
    </div>
  )
}
