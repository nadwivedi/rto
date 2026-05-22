import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { IconMenu, IconClose } from './Icons'
import Logo from './Logo'
import Button from './Button'
import { cn, container, navHeight } from '../lib/styles'

const links = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const navLinkClass = ({ isActive }) =>
  cn(
    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors lg:px-3 lg:text-sm',
    isActive
      ? 'bg-brand-50 text-brand-800'
      : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800',
  )

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white transition-shadow',
          navHeight,
          scrolled && 'shadow-[0_4px_20px_rgba(15,23,42,0.06)]',
        )}
      >
        <div className={cn(container, 'flex h-full items-center justify-between')}>
          <NavLink to="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
            <Logo showText={false} size="nav" />
          </NavLink>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
            {links.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button href="/contact" variant="secondary" size="sm">
              Book Demo
            </Button>
            <Button href="/contact" variant="primary" size="sm">
              Start Free Trial
            </Button>
          </div>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-800 md:hidden [&_svg]:h-4 [&_svg]:w-4"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </header>

      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 top-14 z-40 flex flex-col gap-1 border-t border-brand-100 bg-white p-4 transition-transform duration-200 sm:top-[3.75rem] lg:top-16 md:hidden',
          menuOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={navLinkClass} onClick={() => setMenuOpen(false)}>
            {label}
          </NavLink>
        ))}
        <Button href="/contact" variant="primary" className="mt-3 w-full" onClick={() => setMenuOpen(false)}>
          Start Free Trial
        </Button>
        <Button href="/contact" variant="secondary" className="w-full" onClick={() => setMenuOpen(false)}>
          Book Demo
        </Button>
      </nav>
    </>
  )
}
