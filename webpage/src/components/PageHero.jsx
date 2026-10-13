import { container, pageHero, h1Page, cn } from '../lib/styles'

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
      <div className={cn(container, 'relative z-10')}>
        <h1 className={h1Page}>
          {main}
          {tail && (
            <span className="mx-auto mt-3 block max-w-2xl font-sans text-base font-normal leading-7 tracking-normal text-white/85 sm:text-lg">
              {tail}
            </span>
          )}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{subtitle}</p>
        )}
        {children && <div className="mt-6 flex flex-wrap justify-center gap-2.5">{children}</div>}
      </div>
    </section>
  )
}
