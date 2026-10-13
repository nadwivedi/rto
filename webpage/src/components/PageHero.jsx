import { container, pageHero, h1Page, cn } from '../lib/styles'

// Decoration only (absolutely positioned), so the hero keeps its height.
const glow =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_85%_at_50%_0%,rgba(147,197,253,0.32),transparent_70%),radial-gradient(ellipse_35%_60%_at_100%_100%,rgba(56,189,248,0.18),transparent_70%),radial-gradient(ellipse_35%_60%_at_0%_100%,rgba(30,64,175,0.55),transparent_70%)]'
const dots =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_90%_at_50%_50%,black,transparent)]'
const edge =
  'pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-accent-500 to-transparent'

/**
 * Simple hero for inner pages: title, optional one-line subtitle and buttons.
 * A long SEO title "Main — rest" is shown as a short title with the rest as a
 * smaller subtitle line; both stay inside the <h1>.
 */
export default function PageHero({ title, subtitle, children }) {
  const [head, ...rest] = title.split(' — ')
  // a short tail like "— RTO Sarthi" reads fine on the title line
  const split = rest.join(' — ').length >= 20
  const main = split ? head : title
  const tail = split ? rest.join(' — ') : ''

  return (
    <section className={pageHero}>
      <div className={glow} aria-hidden />
      <div className={dots} aria-hidden />
      <div className={edge} aria-hidden />
      <div className={cn(container, 'relative z-10')}>
        <h1 className={cn(h1Page, 'drop-shadow-[0_2px_12px_rgba(8,30,80,0.35)]')}>
          {main}
          {tail && (
            <span className="mx-auto mt-3 block max-w-2xl font-sans text-base font-normal leading-7 tracking-normal text-brand-100 sm:text-lg">
              {tail}
            </span>
          )}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-brand-100 sm:text-lg">{subtitle}</p>
        )}
        {children && (
          <div className="mt-6 flex flex-wrap justify-center gap-2.5 [&>a:not(:first-child)]:bg-white/10 [&>a:not(:first-child)]:backdrop-blur-sm [&>a:not(:first-child)]:hover:bg-white/20">
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
