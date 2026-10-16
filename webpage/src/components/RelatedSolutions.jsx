import { Link, useLocation } from 'react-router-dom'
import SectionHeading from './SectionHeading'
import { SOLUTION_GROUPS, groupOfPath } from '../data/solutions'
import { container, section, glassCard, cn } from '../lib/styles'

const linkClass = 'font-semibold text-brand-800 hover:underline'

/**
 * Links every solution page to the rest of its topic group and to the main page of every
 * other group, so search engines can reach and connect all pages. Pages outside the groups
 * (features, about, blog) get the main page of every group.
 */
export default function RelatedSolutions({ className }) {
  const { pathname } = useLocation()
  const group = groupOfPath(pathname)
  const siblings = group ? group.items.filter((i) => i.to !== pathname) : SOLUTION_GROUPS.map((g) => ({ ...g.items[0], desc: g.description }))
  const others = SOLUTION_GROUPS.filter((g) => g !== group)

  return (
    <section className={cn(section, className)} id="related-solutions">
      <div className={container}>
        <SectionHeading
          label="Explore more"
          title={group ? `More ${group.title.toLowerCase()} from RTO Sarthi` : 'RTO Sarthi software for every desk'}
          description={group ? group.description : 'One software for RTO agents, driving schools, PUC centres and businesses that need vehicle data.'}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siblings.map((item) => (
            <Link key={item.to} to={item.to} className={cn(glassCard, 'block p-5 transition-colors hover:border-brand-300')}>
              <span className="font-display text-base font-semibold text-brand-900">{item.label}</span>
              <span className="mt-1 block text-sm text-slate-600">{item.desc}</span>
            </Link>
          ))}
        </div>
        {group && (
          <p className="mt-6 text-center text-sm leading-7 text-slate-600 sm:text-base">
            Also see:{' '}
            {others.map((g, i) => (
              <span key={g.key}>
                {i > 0 && ' · '}
                <Link to={g.items[0].to} className={linkClass}>
                  {g.items[0].label}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  )
}
