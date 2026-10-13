/** Shared layout & typography for all pages except the homepage (see homeStyles.js).
 * Inter body text, Poppins headings, readable sizes, plain white cards. */
export const container =
  'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:max-w-5xl lg:px-8 xl:max-w-6xl'

export const section = 'py-12 sm:py-14 lg:py-16'

export const glassCard =
  'rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:border-brand-200 hover:shadow-md'

export const pageHero =
  'relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 pt-[calc(3.5rem+1.75rem)] pb-8 text-center text-white sm:pt-[calc(3.75rem+2rem)] sm:pb-9 lg:pt-[calc(4rem+2.25rem)] lg:pb-10'

export const heroSection = pageHero

export const sectionMuted = 'bg-slate-50'

export const sectionDark = 'bg-brand-950 text-slate-200'

export const label =
  'mb-3 inline-block font-display text-xs font-semibold uppercase tracking-wider text-accent-600 sm:text-sm'

export const labelOnDark =
  'mb-2 inline-block font-display text-xs font-semibold uppercase tracking-wider text-accent-400 sm:text-sm'

export const h1Page =
  'mx-auto max-w-4xl font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.25rem] lg:leading-[1.2]'

export const h1Hero = h1Page

export const h2Section =
  'font-display text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl lg:text-[2rem]'

export const h2OnDark =
  'font-display text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl lg:text-[2rem]'

export const h3Card = 'mb-2 font-display text-lg font-semibold leading-snug text-slate-900'

export const bodyMuted = 'text-[0.9375rem] leading-7 text-slate-600 sm:text-base'

export const heroIntro = 'mx-auto max-w-2xl text-[0.9375rem] leading-7 text-white/90 sm:text-base'

export const grid3 = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6'

export const grid2 = 'grid gap-5 sm:grid-cols-2 lg:gap-6'

export const ctaBand =
  'relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-6 py-12 text-center text-white shadow-lg sm:px-10 sm:py-14 lg:py-16'

export const navHeight = 'h-14 sm:h-[3.75rem] lg:h-16'

export const iconBox =
  'mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200/80 bg-brand-50 text-brand-800 [&_svg]:h-5 [&_svg]:w-5'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
