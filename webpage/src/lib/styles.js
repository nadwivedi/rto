/** Shared layout & typography — brand colors from rtosarthi.avif */
export const container =
  'mx-auto w-full max-w-5xl px-4 sm:px-5 lg:max-w-5xl lg:px-6 xl:max-w-6xl'

export const section = 'py-8 sm:py-9 lg:py-10 xl:py-11'

export const glassCard =
  'rounded-xl border border-white/85 bg-gradient-to-br from-white/95 via-brand-50/80 to-accent-50/40 shadow-[0_6px_24px_rgba(8,60,146,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200/60 hover:shadow-[0_14px_36px_rgba(8,60,146,0.1)]'

export const pageHero =
  'relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 pt-[calc(3.5rem+1.25rem)] pb-7 text-center text-white sm:pt-[calc(3.75rem+1.25rem)] sm:pb-8 lg:pt-[calc(4rem+1.5rem)] lg:pb-9'

export const heroSection =
  'relative overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 pt-[calc(3.5rem+1.5rem)] pb-10 text-white sm:pt-[calc(3.75rem+2rem)] lg:pt-[calc(4rem+2rem)] lg:pb-12'

export const sectionMuted =
  'bg-gradient-to-b from-slate-50 via-brand-50/50 to-accent-50/30'

export const sectionDark = 'bg-brand-950 text-slate-300'

export const label =
  'mb-1 inline-block text-[0.625rem] font-semibold uppercase tracking-widest text-accent-600 sm:text-[0.6875rem]'

export const labelOnDark =
  'mb-1 inline-block text-[0.625rem] font-semibold uppercase tracking-widest text-accent-300 sm:text-[0.6875rem]'

export const h1Page =
  'text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-[1.65rem] xl:text-[1.75rem]'

export const h1Hero =
  'mb-2 text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl lg:text-[1.65rem] xl:text-[1.75rem]'

export const h2Section =
  'text-lg font-bold tracking-tight text-brand-950 sm:text-xl lg:text-[1.35rem] xl:text-[1.4rem]'

export const h2OnDark = 'text-lg font-bold tracking-tight text-white sm:text-xl lg:text-[1.35rem]'

export const h3Card = 'mb-1 text-sm font-semibold text-brand-950'

export const bodyMuted = 'text-xs leading-relaxed text-slate-500 sm:text-[0.8125rem] lg:text-sm'

export const grid3 = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3.5'

export const grid2 = 'grid gap-3 sm:grid-cols-2 lg:gap-3.5'

export const ctaBand =
  'relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-brand-900 via-brand-800 to-accent-600 px-5 py-8 text-center text-white shadow-[0_16px_48px_rgba(8,60,146,0.28)] sm:px-8 sm:py-9 lg:py-10'

export const navHeight = 'h-14 sm:h-[3.75rem] lg:h-16'

export const iconBox =
  'mb-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-200/80 bg-gradient-to-br from-brand-50 to-accent-50 text-brand-800 shadow-sm [&_svg]:h-4 [&_svg]:w-4 lg:h-10 lg:w-10'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
